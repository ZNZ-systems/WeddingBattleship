import React, { useRef, useEffect } from 'react';
import Table from './Table';
import SpecialArea from './SpecialArea';
import './SeatingChart.css';

function SeatingChart({ 
  tables, 
  specialAreas, 
  guests, 
  onMoveItem, 
  onSeatGuest, 
  onToggleLockChair,
  lockedChairs,
  onDeleteTable,
  onDeleteArea,
  onResizeTable,
  onResizeArea
}) {
  const chartRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        chartRef.current.style.setProperty('--mouse-x', e.clientX - rect.left);
        chartRef.current.style.setProperty('--mouse-y', e.clientY - rect.top);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getGuestName = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    return guest ? guest.fullName : null;
  };

  return (
    <div className="seating-chart" ref={chartRef}>
      <div className="chart-canvas">
        {specialAreas.map(area => (
          <SpecialArea
            key={area.id}
            area={area}
            onMove={(x, y) => onMoveItem(area.id, x, y, 'area')}
            onDelete={() => onDeleteArea(area.id)}
            onResize={(w, h) => onResizeArea(area.id, w, h)}
          />
        ))}
        
        {tables.map(table => (
          <Table
            key={table.id}
            table={table}
            onMove={(x, y) => onMoveItem(table.id, x, y, 'table')}
            onSeatGuest={(seatIndex, guestId) => onSeatGuest(table.id, seatIndex, guestId)}
            onToggleLockChair={(seatIndex) => onToggleLockChair(table.id, seatIndex)}
            lockedChairs={lockedChairs}
            getGuestName={getGuestName}
            onDelete={() => onDeleteTable(table.id)}
            onResize={(updates) => onResizeTable(table.id, updates)}
          />
        ))}
      </div>
      
      <div className="chart-info">
        <div className="info-item">
          <span className="label">Tables:</span>
          <span className="value">{tables.length}</span>
        </div>
        <div className="info-item">
          <span className="label">Total Seats:</span>
          <span className="value">{tables.reduce((sum, t) => sum + t.seats, 0)}</span>
        </div>
        <div className="info-item">
          <span className="label">Seated Guests:</span>
          <span className="value">
            {tables.reduce((sum, t) => sum + t.guests.filter(g => g !== null).length, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default SeatingChart;