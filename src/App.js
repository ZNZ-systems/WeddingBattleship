import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';
import GuestList from './components/GuestList';
import SeatingChart from './components/SeatingChart';
import Controls from './components/Controls';
import ImportModal from './components/ImportModal';

function App() {
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [specialAreas, setSpecialAreas] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [lockedChairs, setLockedChairs] = useState(new Set());

  const handleImportGuests = useCallback((importedGuests) => {
    setGuests(importedGuests);
    setShowImportModal(false);
  }, []);

  const handleAddTable = useCallback(({ seats, name, shape }) => {
    const parsedSeats = parseInt(seats);
    const newTable = {
      id: `table-${Date.now()}`,
      name: name && name.length > 0 ? name : `Table ${tables.length + 1}`,
      shape: shape || 'circle',
      seats: parsedSeats,
      x: 100,
      y: 100,
      radius: 50 + (parsedSeats * 2),
      width: 160,
      height: 100,
      guests: new Array(parsedSeats).fill(null)
    };
    setTables([...tables, newTable]);
  }, [tables]);

  const handleAddSpecialArea = useCallback((type) => {
    const newArea = {
      id: `area-${Date.now()}`,
      type,
      x: 200,
      y: 200,
      width: 150,
      height: 100
    };
    setSpecialAreas([...specialAreas, newArea]);
  }, [specialAreas]);

  const handleMoveItem = useCallback((id, x, y, type) => {
    if (type === 'table') {
      setTables(tables => tables.map(table => 
        table.id === id ? { ...table, x, y } : table
      ));
    } else if (type === 'area') {
      setSpecialAreas(areas => areas.map(area => 
        area.id === id ? { ...area, x, y } : area
      ));
    }
  }, []);

  const handleSeatGuest = useCallback((tableId, seatIndex, guestId) => {
    const chairId = `${tableId}-${seatIndex}`;
    if (lockedChairs.has(chairId)) return;

    setTables(tables => tables.map(table => {
      if (table.id === tableId) {
        const newGuests = [...table.guests];
        const currentGuest = newGuests[seatIndex];
        
        if (currentGuest && guestId) {
          setGuests(guests => guests.map(g => 
            g.id === currentGuest ? { ...g, seated: false } : g
          ));
        }
        
        newGuests[seatIndex] = guestId;
        
        if (guestId) {
          setGuests(guests => guests.map(g => 
            g.id === guestId ? { ...g, seated: true } : g
          ));
        } else if (currentGuest) {
          setGuests(guests => guests.map(g => 
            g.id === currentGuest ? { ...g, seated: false } : g
          ));
        }
        
        return { ...table, guests: newGuests };
      }
      return table;
    }));
  }, [lockedChairs]);

  const handleToggleLockChair = useCallback((tableId, seatIndex) => {
    const chairId = `${tableId}-${seatIndex}`;
    setLockedChairs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chairId)) {
        newSet.delete(chairId);
      } else {
        newSet.add(chairId);
      }
      return newSet;
    });
  }, []);

  const handleDeleteTable = useCallback((tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      table.guests.forEach(guestId => {
        if (guestId) {
          setGuests(guests => guests.map(g => 
            g.id === guestId ? { ...g, seated: false } : g
          ));
        }
      });
    }
    setTables(tables => tables.filter(t => t.id !== tableId));
  }, [tables]);

  const handleDeleteArea = useCallback((areaId) => {
    setSpecialAreas(areas => areas.filter(a => a.id !== areaId));
  }, []);

  const handleResizeTable = useCallback((tableId, updates) => {
    setTables(tables => tables.map(table =>
      table.id === tableId ? { ...table, ...updates } : table
    ));
  }, []);

  const handleResizeArea = useCallback((areaId, width, height) => {
    setSpecialAreas(areas => areas.map(area =>
      area.id === areaId ? { ...area, width, height } : area
    ));
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <header className="app-header">
          <h1>Wedding Seating Chart Planner</h1>
        </header>
        
        <div className="app-container">
          <div className="sidebar">
            <Controls 
              onAddTable={handleAddTable}
              onAddSpecialArea={handleAddSpecialArea}
              onImportGuests={() => setShowImportModal(true)}
            />
            <GuestList 
              guests={guests}
              onSeatGuest={handleSeatGuest}
            />
          </div>
          
          <div className="main-content">
            <SeatingChart 
              tables={tables}
              specialAreas={specialAreas}
              guests={guests}
              onMoveItem={handleMoveItem}
              onSeatGuest={handleSeatGuest}
              onToggleLockChair={handleToggleLockChair}
              lockedChairs={lockedChairs}
              onDeleteTable={handleDeleteTable}
              onDeleteArea={handleDeleteArea}
              onResizeTable={handleResizeTable}
              onResizeArea={handleResizeArea}
            />
          </div>
        </div>
        
        {showImportModal && (
          <ImportModal 
            onImport={handleImportGuests}
            onClose={() => setShowImportModal(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default App;