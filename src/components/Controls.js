import React, { useState } from 'react';
import { Plus, Upload, Music, Coffee, Users, ChevronDown, ChevronRight, RotateCcw, RotateCw } from 'lucide-react';
import './Controls.css';

function Controls({ onAddTable, onAddSpecialArea, onImportGuests, height = 300, onUndo, onRedo, canUndo, canRedo }) {
  const [tableSeats, setTableSeats] = useState(8);
  const [tableName, setTableName] = useState('');
  const [tableShape, setTableShape] = useState('square');

  // Collapsible state
  const [collapsedSections, setCollapsedSections] = useState({
    import: false,
    addTable: false,
    specialAreas: false
  });

  const undoDisabled = !canUndo || typeof onUndo !== 'function';
  const redoDisabled = !canRedo || typeof onRedo !== 'function';

  const specialAreas = [
    { type: 'danceFloor', icon: Music, label: 'Dance Floor' },
    { type: 'bar', icon: Coffee, label: 'Bar' },
    { type: 'lounge', icon: Users, label: 'Lounge' },
    { type: 'dj', icon: Music, label: 'DJ Booth' }
  ];

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="controls" style={{ height: `${height}px` }}>
      <div className="control-section history-section">
        <div className="section-header static">
          <h3>Plan History</h3>
        </div>
        <div className="section-content history-content">
          <div className="history-actions">
            <button
              className="control-btn history-btn"
              onClick={() => { if (!undoDisabled) onUndo(); }}
              disabled={undoDisabled}
              type="button"
            >
              <RotateCcw size={16} />
              Undo
            </button>
            <button
              className="control-btn history-btn"
              onClick={() => { if (!redoDisabled) onRedo(); }}
              disabled={redoDisabled}
              type="button"
            >
              <RotateCw size={16} />
              Redo
            </button>
          </div>
          <p className="history-hint">
            Explore alternate seating ideas with undo and redo controls.
          </p>
        </div>
      </div>

      <div className="control-section">
        <div
          className="section-header collapsible"
          onClick={() => toggleSection('import')}
        >
          <h3>Import Guests</h3>
          {collapsedSections.import ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
        {!collapsedSections.import && (
          <div className="section-content">
            <button className="control-btn primary" onClick={onImportGuests}>
              <Upload size={18} />
              Import Guest List
            </button>
          </div>
        )}
      </div>

      <div className="control-section">
        <div 
          className="section-header collapsible"
          onClick={() => toggleSection('addTable')}
        >
          <h3>Add Table</h3>
          {collapsedSections.addTable ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
        {!collapsedSections.addTable && (
          <div className="section-content">
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
                  <option value="imperial">Imperial</option>
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
                onClick={() => {
                  const tableData = {
                    seats: parseInt(tableSeats, 10),
                    name: tableName.trim(),
                    shape: tableShape,
                  };
                  console.log('Sending table data:', tableData);
                  onAddTable(tableData);
                  // Reset form after adding table
                  setTableName('');
                  setTableSeats(8);
                  setTableShape('square');
                }}
              >
                <Plus size={18} />
                Add Table
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="control-section">
        <div 
          className="section-header collapsible"
          onClick={() => toggleSection('specialAreas')}
        >
          <h3>Add Special Areas</h3>
          {collapsedSections.specialAreas ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </div>
        {!collapsedSections.specialAreas && (
          <div className="section-content">
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
        )}
      </div>
    </div>
  );
}

export default Controls;