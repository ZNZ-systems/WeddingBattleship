import React, { useState } from 'react';
import { Plus, Upload, Square, Music, Coffee, Users } from 'lucide-react';
import './Controls.css';

function Controls({ onAddTable, onAddSpecialArea, onImportGuests }) {
  const [tableSeats, setTableSeats] = useState(8);
  const [tableName, setTableName] = useState('');
  const [tableShape, setTableShape] = useState('circle');

  const specialAreas = [
    { type: 'danceFloor', icon: Music, label: 'Dance Floor' },
    { type: 'bar', icon: Coffee, label: 'Bar' },
    { type: 'lounge', icon: Users, label: 'Lounge' },
    { type: 'dj', icon: Music, label: 'DJ Booth' }
  ];

  return (
    <div className="controls">
      <div className="control-section">
        <h3>Import Guests</h3>
        <button className="control-btn primary" onClick={onImportGuests}>
          <Upload size={18} />
          Import Guest List
        </button>
      </div>

      <div className="control-section">
        <h3>Add Table</h3>
        <div className="add-table-controls">
          <label>
            Name:
            <input 
              type="text"
              placeholder="e.g. Family A"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </label>
          <label>
            Shape:
            <select value={tableShape} onChange={(e) => setTableShape(e.target.value)}>
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </label>
          <label>
            Seats:
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={tableSeats}
              onChange={(e) => setTableSeats(e.target.value)}
            />
          </label>
          <button 
            className="control-btn"
            onClick={() => onAddTable({
              seats: parseInt(tableSeats, 10),
              name: tableName.trim(),
              shape: tableShape,
            })}
          >
            <Plus size={18} />
            Add Table
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Add Special Areas</h3>
        <div className="special-areas">
          {specialAreas.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              className="area-btn"
              onClick={() => onAddSpecialArea(type)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Controls;