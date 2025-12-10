// App.jsx
import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaTrash, FaStar, FaUpload, FaFolder, FaTimes } from "react-icons/fa";
import "./index.css";
const fileTypes = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
  pdf: ["pdf"],
  doc: ["doc", "docx", "txt", "rtf", "md", "rtf"],
};
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
const formatDate = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
const App = () => {
  const [files, setFiles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("uploadOrder");
  const [sortOrder, setSortOrder] = useState("asc");
  const [notes, setNotes] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const processFiles = (fileList) => {
    const newFiles = Array.from(fileList)
      .map((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const typeCategory =
          Object.keys(fileTypes).find((key) => fileTypes[key].includes(ext)) || "other";
        const duplicate = files.find((f) => f.name === file.name && f.size === file.size);
        if (duplicate) return null;
        return {
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: typeCategory,
          date: new Date(),
          fileObject: file,
          uploadOrder: files.length + 1,
        };
      })
      .filter(Boolean);
    setFiles((prev) => [...prev, ...newFiles]);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileChange = (e) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };
  const toggleFavorite = (file) => {
    setFavorites((prev) =>
      prev.find((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };
  const handleDelete = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };
  const startRename = (file) => {
    setRenamingId(file.id);
    setNewName(file.name.split(".").slice(0, -1).join("."));
  };
  const saveRename = () => {
    if (!renamingId || !newName.trim()) return;
    const file = files.find((f) => f.id === renamingId);
    if (!file) return;
    const ext = file.name.split(".").pop();
    const newFileName = newName.trim() + (ext ? `.${ext}` : "");
    setFiles((prev) =>
      prev.map((f) => (f.id === renamingId ? { ...f, name: newFileName } : f))
    );
    setRenamingId(null);
    setNewName("");
  };
  const clearAll = () => {
    setFiles([]);
    setFavorites([]);
  };
  // Filtering & Sorting
  const filteredFiles = files
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .filter((f) => (filterType === "all" ? true : f.type === filterType))
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === "name") { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
      else if (sortBy === "size") { valA = a.size; valB = b.size; }
      else if (sortBy === "date") { valA = a.date; valB = b.date; }
      else { valA = a.uploadOrder; valB = b.uploadOrder; }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  const groupedFiles = ["pdf", "doc", "image", "other"].reduce((acc, type) => {
    acc[type] = filteredFiles.filter((f) => f.type === type);
    return acc;
  }, {});
  return (
    <>
      <div className="controls">
        <h1>React File Manager</h1>
        {/* Drag & Drop Zone */}
        <div
          className="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? "3px dashed #667eea" : "2px dashed #cbd5e0",
            background: isDragging ? "rgba(102,126,234,0.05)" : "transparent",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FaUpload size={48} color="#667eea" />
          <p>Drop files here or click to upload</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}>
            <FaFolder /> Upload Folder
          </button>
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory=""
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
        {/* Controls */}
        <div className="controls-bar">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="pdf">PDFs</option>
            <option value="doc">Documents</option>
            <option value="other">Other</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="uploadOrder">Upload Order</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="date">Date</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </button>
          <button onClick={clearAll} style={{ background: "#e53e3e" }}>
            Clear All
          </button>
        </div>
        <textarea
          placeholder="Write notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="favorites">
            <h2>Favorites ({favorites.length})</h2>
            <div className="favorite-items">
              {favorites.map((f) => (
                <div key={f.id} className="favorite-item">
                  {f.name}
                </div>
              ))}
            </div>
          </div>
        )}
        <hr />
        {/* File Columns with Serial Numbers */}
        <div className="file-grid">
          {Object.entries(groupedFiles).map(([type, fileList]) => (
            <div key={type} className="file-column">
              <h3>
                {type.toUpperCase()} ({fileList.length})
              </h3>
              {fileList.length === 0 ? (
                <p style={{ textAlign: "center", color: "#a0aec0", padding: 20 }}>
                  No {type} files yet
                </p>
              ) : (
                fileList.map((file, index) => (
                  <div key={file.id} className="file-item">
                    <div className="file-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <strong style={{ minWidth: 30, color: "#667eea" }}>
                          {index + 1}.
                        </strong>
                        {renamingId === file.id ? (
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={saveRename}
                            onKeyDown={(e) => e.key === "Enter" && saveRename()}
                            autoFocus
                            style={{ padding: 4, width: "100%" }}
                          />
                        ) : (
                          <span
                            className="file-name"
                            onDoubleClick={() => startRename(file)}
                            style={{ cursor: "pointer" }}
                          >
                            {file.name}
                          </span>
                        )}
                      </div>
                      <div className="file-size">
                        {formatFileSize(file.size)} • {formatDate(file.date)}
                      </div>
                    </div>
                    <div className="file-actions">
                      <button
                        className={`favorite-btn ${favorites.find((f) => f.id === file.id) ? "active" : ""}`}
                        onClick={() => toggleFavorite(file)}
                      >
                        <FaStar />
                      </button>
                      {(file.type === "image" || file.type === "pdf") && (
                        <button onClick={() => setPreviewFile(file)} style={{ color: "#667eea" }}>
                          Preview
                        </button>
                      )}
                      <button onClick={() => handleDelete(file.id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Preview Modal */}
      {previewFile && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewFile(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setPreviewFile(null)}>
              <FaTimes />
            </button>
            {previewFile.type === "image" ? (
              <img
                src={URL.createObjectURL(previewFile.fileObject)}
                alt={previewFile.name}
                style={{ maxWidth: "100%", maxHeight: "90vh" }}
              />
            ) : (
              <iframe
                src={URL.createObjectURL(previewFile.fileObject)}
                title={previewFile.name}
                style={{ width: "100%", height: "90vh", border: "none" }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default App;