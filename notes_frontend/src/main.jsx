import React, { useState, useEffect, useRef } from "react";
import "./style.css";

// PUBLIC_INTERFACE
function App() {
  // Note object: { id: string, title: string, content: string, created: ms, updated: ms }
  const [notes, setNotes] = useState(() => {
    // Try loading from localStorage initially
    const stored = localStorage.getItem("notes");
    return stored ? JSON.parse(stored) : [];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState({ title: "", content: "" });

  // Save notes to localStorage on change
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Filter and sort for the sidebar list
  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.updated - a.updated);

  const selectedNote = notes.find((n) => n.id === selectedId);

  // Handle create new note
  function handleCreateNote() {
    const now = Date.now();
    const newNote = {
      id: crypto.randomUUID(),
      title: "Untitled Note",
      content: "",
      created: now,
      updated: now,
    };
    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
    setIsEditing(true);
    setEditBuffer({ title: "Untitled Note", content: "" });
  }

  // Handle selecting a note
  function handleSelectNote(id) {
    setSelectedId(id);
    setIsEditing(false);
    const note = notes.find((n) => n.id === id);
    setEditBuffer({ title: note.title, content: note.content });
  }

  // Handle saving note edits
  function handleSaveNote() {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              title: editBuffer.title.trim() ? editBuffer.title : "Untitled Note",
              content: editBuffer.content,
              updated: Date.now(),
            }
          : n
      )
    );
    setIsEditing(false);
  }

  // Handle deleting a note
  function handleDeleteNote(id) {
    const idx = notes.findIndex((n) => n.id === id);
    const newNotes = notes.filter((n) => n.id !== id);
    setNotes(newNotes);
    // Reselect a reasonable note if any remain
    if (idx !== -1 && newNotes.length > 0) {
      setSelectedId(newNotes[Math.max(0, idx - 1)].id);
    } else {
      setSelectedId(null);
    }
    setIsEditing(false);
  }

  // Auto-focus on title in edit mode
  const titleInputRef = useRef(null);
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing, selectedId]);

  // Keyboard shortcut: Ctrl+N for new note, Ctrl+F for search focus
  useEffect(() => {
    function handler(e) {
      // Mac: metaKey, Windows/Linux: ctrlKey
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreateNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [notes]);

  return (
    <div className="app-container">
      <header>
        <h1>
          <span style={{ color: "var(--primary-color)" }}>Notes</span>
        </h1>
        <button className="accent" onClick={handleCreateNote} title="New note (Ctrl+N)">
          + New Note
        </button>
      </header>
      <main className="main-area">
        {/* Sidebar */}
        <aside className="sidebar">
          <input
            id="search-input"
            className="search"
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ul className="note-list" aria-label="notes list">
            {filteredNotes.length === 0 && (
              <li className="empty-list">No notes found.</li>
            )}
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                aria-current={note.id === selectedId}
                className={note.id === selectedId ? "selected" : ""}
                onClick={() => handleSelectNote(note.id)}
              >
                <div className="title">{note.title || <i>(untitled)</i>}</div>
                <div className="date">{new Date(note.updated).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </aside>
        {/* Main Note Content / Detail */}
        <section className="note-detail">
          {!selectedNote && (
            <div className="no-note-selected">
              <p>No note selected.<br />Create or select a note to begin.</p>
            </div>
          )}
          {selectedNote && (
            <div>
              {isEditing ? (
                <form
                  className="note-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveNote();
                  }}
                  autoComplete="off"
                >
                  <input
                    className="note-title-input"
                    ref={titleInputRef}
                    value={editBuffer.title}
                    onChange={(e) =>
                      setEditBuffer((buf) => ({
                        ...buf,
                        title: e.target.value,
                      }))
                    }
                    aria-label="Edit note title"
                    maxLength={120}
                    required
                  />
                  <textarea
                    className="note-content-input"
                    value={editBuffer.content}
                    onChange={(e) =>
                      setEditBuffer((buf) => ({
                        ...buf,
                        content: e.target.value,
                      }))
                    }
                    aria-label="Edit note content"
                    rows={12}
                    required
                  />
                  <div className="form-btn-row">
                    <button type="submit" className="primary">
                      Save
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setEditBuffer({
                          title: selectedNote.title,
                          content: selectedNote.content,
                        });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="note-view">
                  <div className="note-view-header">
                    <h2>{selectedNote.title || <i>(untitled)</i>}</h2>
                    <div>
                      <button
                        className="secondary"
                        onClick={() => setIsEditing(true)}
                        title="Edit Note"
                      >
                        Edit
                      </button>
                      <button
                        className="accent"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Delete this note? This cannot be undone."
                            )
                          )
                            handleDeleteNote(selectedId);
                        }}
                        title="Delete note"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="note-timestamp">
                    Last updated:{" "}
                    {new Date(selectedNote.updated).toLocaleString()}
                  </p>
                  <div className="note-content">
                    {selectedNote.content.split("\n").map((line, i) => (
                      <div key={i}>{line || <br />}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <footer>
        <span>
          Minimal Notes App &mdash; Data stored in your browser •
          <span style={{ marginLeft: 8 }}>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                background: "var(--primary-color)",
                borderRadius: "50%",
                verticalAlign: "middle",
                marginRight: 2,
              }}
            ></span>Primary
          </span>{" "}
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              background: "var(--secondary-color)",
              borderRadius: "50%",
              verticalAlign: "middle",
              marginLeft: 8,
              marginRight: 2,
            }}
          ></span>
          Secondary
          <span
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              background: "var(--accent-color)",
              borderRadius: "50%",
              verticalAlign: "middle",
              marginLeft: 8,
              marginRight: 2,
            }}
          ></span>
          Accent
        </span>
      </footer>
    </div>
  );
}

import { createRoot } from "react-dom/client";
createRoot(document.getElementById("app")).render(<App />);
