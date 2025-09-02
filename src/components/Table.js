import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2 } from 'lucide-react';
import Chair from './Chair';
import './Table.css';

function Table({ table, onMove, onSeatGuest, onToggleLockChair, lockedChairs, getGuestName, onDelete, onResize }) {
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'table',
    item: { id: table.id, type: 'table' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [table.id]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.chair') || e.target.closest('.table-controls')) return;
    setIsDraggingTable(true);
    const startX = e.clientX - table.x;
    const startY = e.clientY - table.y;

    const handleMouseMove = (e) => {
      onMove(e.clientX - startX, e.clientY - startY);
    };

    const handleMouseUp = () => {
      setIsDraggingTable(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getChairPositions = () => {
    const positions = [];
    const seats = table.seats;
    if (!seats || seats <= 0) return positions;

    const shape = table.shape || 'circle';
    const chairOffset = 28; // distance from table edge

    if (shape === 'circle') {
      const angleStep = (2 * Math.PI) / seats;
      const radius = (table.radius ?? (60 + (seats * 3)));
      for (let i = 0; i < seats; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = Math.cos(angle) * (radius);
        const y = Math.sin(angle) * (radius);
        positions.push({ x, y, angle: angle + Math.PI / 2 });
      }
      return positions;
    }

    const effectiveRadius = table.radius ?? (50 + (seats * 2));
    const width = table.width ?? (effectiveRadius * 2);
    const height = table.height ?? (effectiveRadius * 2);
    const halfW = width / 2;
    const halfH = height / 2;

    const placeAlongTop = (count) => {
      if (count <= 0) return;
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1);
        const x = -halfW + t * width;
        const y = -halfH - chairOffset;
        positions.push({ x, y, angle: -Math.PI / 2 });
      }
    };
    const placeAlongBottom = (count) => {
      if (count <= 0) return;
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1);
        const x = -halfW + t * width;
        const y = halfH + chairOffset;
        positions.push({ x, y, angle: Math.PI / 2 });
      }
    };
    const placeAlongLeft = (count) => {
      if (count <= 0) return;
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1);
        const x = -halfW - chairOffset;
        const y = -halfH + t * height;
        positions.push({ x, y, angle: Math.PI });
      }
    };
    const placeAlongRight = (count) => {
      if (count <= 0) return;
      for (let i = 1; i <= count; i++) {
        const t = i / (count + 1);
        const x = halfW + chairOffset;
        const y = -halfH + t * height;
        positions.push({ x, y, angle: 0 });
      }
    };

    if (shape === 'square') {
      // Distribute seats as evenly as possible across 4 sides
      const base = Math.floor(seats / 4);
      let remainder = seats % 4;
      const counts = [base, base, base, base]; // top, right, bottom, left
      let idx = 0;
      while (remainder > 0) {
        counts[idx % 4] += 1;
        remainder -= 1;
        idx += 1;
      }
      placeAlongTop(counts[0]);
      placeAlongRight(counts[1]);
      placeAlongBottom(counts[2]);
      placeAlongLeft(counts[3]);
      return positions;
    }

    if (shape === 'rectangle') {
      const longIsHorizontal = width >= height;
      if (seats === 1) {
        // Single chair at right/top depending on orientation
        if (longIsHorizontal) {
          positions.push({ x: halfW + chairOffset, y: 0, angle: 0 });
        } else {
          positions.push({ x: 0, y: -halfH - chairOffset, angle: -Math.PI / 2 });
        }
        return positions;
      }

      // Reserve one chair at each short end
      if (longIsHorizontal) {
        // Ends are left and right
        positions.push({ x: -halfW - chairOffset, y: 0, angle: Math.PI });
        positions.push({ x: halfW + chairOffset, y: 0, angle: 0 });
        const remaining = Math.max(0, seats - 2);
        const topCount = Math.ceil(remaining / 2);
        const bottomCount = Math.floor(remaining / 2);
        placeAlongTop(topCount);
        placeAlongBottom(bottomCount);
      } else {
        // Ends are top and bottom
        positions.push({ x: 0, y: -halfH - chairOffset, angle: -Math.PI / 2 });
        positions.push({ x: 0, y: halfH + chairOffset, angle: Math.PI / 2 });
        const remaining = Math.max(0, seats - 2);
        const rightCount = Math.ceil(remaining / 2);
        const leftCount = Math.floor(remaining / 2);
        placeAlongRight(rightCount);
        placeAlongLeft(leftCount);
      }
      return positions;
    }

    // Fallback to circle
    const angleStep = (2 * Math.PI) / seats;
    const radius = (table.radius ?? (60 + (seats * 3)));
    for (let i = 0; i < seats; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = Math.cos(angle) * (radius);
      const y = Math.sin(angle) * (radius);
      positions.push({ x, y, angle: angle + Math.PI / 2 });
    }
    return positions;
  };

  const chairPositions = getChairPositions();
  const effectiveRadius = table.radius ?? (50 + (table.seats * 2));

  const startResize = (e, edge) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = table.width ?? (effectiveRadius * 2);
    const startHeight = table.height ?? (effectiveRadius * 2);
    const startRadius = effectiveRadius;

    const onMoveResize = (evt) => {
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      if (table.shape === 'circle' || !table.shape) {
        const nextRadius = Math.max(40, startRadius + Math.max(dx, dy));
        onResize({ radius: nextRadius });
      } else if (table.shape === 'square') {
        const size = Math.max(80, startWidth + dx);
        onResize({ width: size, height: size });
      } else {
        // rectangle
        const nextW = Math.max(100, startWidth + dx);
        const nextH = Math.max(80, startHeight + dy);
        onResize({ width: nextW, height: nextH });
      }
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
      className={`table-container ${isDraggingTable ? 'dragging' : ''}`}
      style={{
        left: table.x,
        top: table.y,
        opacity: isDragging ? 0.5 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="table-controls">
        <button
          className="table-control-btn delete"
          onClick={() => onDelete()}
          title="Delete table"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div 
        className={`table ${table.shape || 'circle'}`}
        style={{
          width: (table.shape === 'circle' || !table.shape) ? effectiveRadius * 2 : (table.width ?? effectiveRadius * 2),
          height: (table.shape === 'circle' || !table.shape) ? effectiveRadius * 2 : (table.height ?? effectiveRadius * 2),
          borderRadius: (table.shape === 'circle' || !table.shape) ? '50%' : (table.shape === 'square' ? '12px' : '12px'),
        }}
      >
        <div className="table-number">
          {table.name || 'Table'}
        </div>
        <div className="resize-handle br" onMouseDown={(e) => startResize(e, 'br')} />
      </div>
      
      {chairPositions.map((pos, index) => (
        <Chair
          key={index}
          position={pos}
          seatIndex={index}
          guestId={table.guests[index]}
          guestName={getGuestName(table.guests[index])}
          onSeatGuest={(guestId) => onSeatGuest(index, guestId)}
          onToggleLock={() => onToggleLockChair(index)}
          isLocked={lockedChairs.has(`${table.id}-${index}`)}
        />
      ))}
    </div>
  );
}

export default Table;