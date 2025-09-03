import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Music, Coffee, Users, Mic2, Trash2 } from 'lucide-react';
import './SpecialArea.css';

function SpecialArea({ area, onDelete, onResize }) {
  const [isResizing, setIsResizing] = useState(false);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'area',
    item: { id: area.id },
    canDrag: () => !isResizing,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [area.id, isResizing]);

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

  const startResize = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
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
      setIsResizing(false);
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
      ref={drag}
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