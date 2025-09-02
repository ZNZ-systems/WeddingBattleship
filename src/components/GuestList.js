import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { Users, User, Search } from 'lucide-react';
import './GuestList.css';

function GuestItem({ guest }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'guest',
    item: { id: guest.id, name: guest.fullName },
    canDrag: !guest.seated,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [guest]);

  return (
    <div 
      ref={drag}
      className={`guest-item ${guest.seated ? 'seated' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <User size={16} />
      <span>{guest.fullName}</span>
      {guest.seated && <span className="seated-badge">Seated</span>}
    </div>
  );
}

function GuestList({ guests }) {
  const [query, setQuery] = useState('');

  const { unseatedGuests, seatedGuests } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q.length
      ? guests.filter(g => (g.fullName || '').toLowerCase().includes(q))
      : guests;
    return {
      unseatedGuests: filtered.filter(g => !g.seated),
      seatedGuests: filtered.filter(g => g.seated),
    };
  }, [guests, query]);

  return (
    <div className="guest-list">
      <div className="guest-list-header">
        <Users size={20} />
        <h3>Guest List</h3>
        <span className="guest-count">
          {unseatedGuests.length} / {guests.length} unseated
        </span>
      </div>

      <div className="guest-list-search">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guests by name..."
            aria-label="Search guests"
          />
        </div>
      </div>
      
      <div className="guest-list-content">
        {unseatedGuests.length > 0 && (
          <div className="guest-section">
            <h4>Unseated Guests</h4>
            <div className="guest-items">
              {unseatedGuests.map(guest => (
                <GuestItem key={guest.id} guest={guest} />
              ))}
            </div>
          </div>
        )}
        
        {seatedGuests.length > 0 && (
          <div className="guest-section">
            <h4>Seated Guests</h4>
            <div className="guest-items seated-section">
              {seatedGuests.map(guest => (
                <GuestItem key={guest.id} guest={guest} />
              ))}
            </div>
          </div>
        )}
        
        {guests.length === 0 && (
          <div className="empty-state">
            <Users size={40} color="#d1d5db" />
            <p>No guests imported yet</p>
            <p className="hint">Click "Import Guests" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestList;