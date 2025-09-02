import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import './ImportModal.css';

function ImportModal({ onImport, onClose }) {
  const [guestText, setGuestText] = useState('');

  const handleImport = () => {
    const lines = guestText.trim().split('\n');
    const importedGuests = lines
      .filter(line => line.trim())
      .map((line, index) => {
        const parts = line.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        return {
          id: `guest-${Date.now()}-${index}`,
          firstName,
          lastName,
          fullName: lastName ? `${firstName} ${lastName}` : firstName,
          seated: false
        };
      });
    
    onImport(importedGuests);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGuestText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Import Guest List</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="instructions">
            Enter one guest per line. Format: FirstName [LastName]
          </p>
          
          <div className="upload-section">
            <label htmlFor="file-upload" className="file-upload-btn">
              <Upload size={18} />
              Upload Text File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          
          <textarea
            className="guest-input"
            value={guestText}
            onChange={(e) => setGuestText(e.target.value)}
            placeholder="John Doe&#10;Jane Smith&#10;Robert Johnson&#10;..."
            rows={15}
          />
          
          <div className="example">
            <strong>Example:</strong>
            <pre>
John Doe
Jane Smith
Robert Johnson
Mary Williams
            </pre>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={!guestText.trim()}
          >
            Import Guests
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;