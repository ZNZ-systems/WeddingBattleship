import React, { useState } from 'react';
import { Music, Coffee, Users, Mic2, Trash2 } from 'lucide-react';
import './SpecialArea.css';

function SpecialArea({ area, onMove, onDelete, onResize }) {
  const [isDragging, setIsDragging] = useState(false);

  const icons = {
    danceFloor: Music,
    bar: Coffee,
    lounge: Users,
    dj: Mic2
  };

  const labels = {
    danceFloor: 'Dance Floor',
    bar: 'Bar',
    lounge: 'Lounge',
    dj: 'DJ Booth'
  };

  const Icon = icons[area.type] || Music;
  const label = labels[area.type] || 'Area';

  const handleMouseDown = (e) => {
    if (e.target.closest('.area-controls')) return;
    setIsDragging(true);
    const startX = e.clientX - area.x;
    const startY = e.clientY - area.y;

    const handleMouseMove = (e) => {
      onMove(e.clientX - startX, e.clientY - startY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = area.width;
    const startH = area.height;
    const onMoveResize = (evt) => {
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      onResize(startW + dx, startH + dy);
    };
    const onStop = () => {
      document.removeEventListener('mousemove', onMoveResize);
      document.removeEventListener('mouseup', onStop);
    };
    document.addEventListener('mousemove', onMoveResize);
    document.addEventListener('mouseup', onStop);
  };

  return (
    <div
      className={`special-area ${area.type} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="area-controls">
        <button
          className="area-control-btn delete"
          onClick={() => onDelete()}
          title="Delete area"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="area-content">
        <Icon size={24} />
        <span className="area-label">{label}</span>
      </div>
      <div className="area-resize-handle br" onMouseDown={startResize} />
    </div>
  );
}

export default SpecialArea;