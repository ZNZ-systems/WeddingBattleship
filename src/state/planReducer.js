const DEFAULT_TABLE_POSITION = { x: 100, y: 100 };
const DEFAULT_TABLE_DIMENSIONS = { width: 160, height: 100 };
const DEFAULT_TABLE_RADIUS = (seats) => 50 + (seats * 2);
const DEFAULT_SPECIAL_AREA_POSITION = { x: 200, y: 200 };
const DEFAULT_SPECIAL_AREA = { width: 150, height: 100 };

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseChairId = (chairId) => {
  if (typeof chairId !== 'string') return null;
  const lastDash = chairId.lastIndexOf('-');
  if (lastDash === -1) return null;
  const tableId = chairId.slice(0, lastDash);
  const seatIndex = Number.parseInt(chairId.slice(lastDash + 1), 10);
  if (!Number.isFinite(seatIndex)) return null;
  return { tableId, seatIndex };
};

const normaliseGuest = (guest, index) => {
  if (!guest || typeof guest !== 'object') {
    return {
      id: generateId('guest'),
      fullName: '',
      seated: false,
    };
  }

  const firstName = guest.firstName || '';
  const lastName = guest.lastName || '';
  const fullName = guest.fullName || `${firstName} ${lastName}`.trim();

  return {
    ...guest,
    id: typeof guest.id === 'string' ? guest.id : generateId(`guest-${index}`),
    fullName,
    seated: Boolean(guest.seated) && !!guest.id,
  };
};

const normaliseTable = (table, index) => {
  if (!table || typeof table !== 'object') {
    return {
      id: generateId(`table-${index}`),
      name: `Table ${index + 1}`,
      shape: 'square',
      seats: 0,
      guests: [],
      ...DEFAULT_TABLE_POSITION,
      ...DEFAULT_TABLE_DIMENSIONS,
      radius: DEFAULT_TABLE_RADIUS(0),
      rotation: 0,
    };
  }

  const rawSeats = Number.parseInt(table.seats, 10);
  const seats = Number.isFinite(rawSeats) && rawSeats > 0 ? rawSeats : (Array.isArray(table.guests) ? table.guests.length : 0);
  const guests = Array.from({ length: seats }, (_, i) => {
    if (Array.isArray(table.guests)) {
      return table.guests[i] || null;
    }
    return null;
  });

  return {
    id: typeof table.id === 'string' ? table.id : generateId(`table-${index}`),
    name: table.name || `Table ${index + 1}`,
    shape: table.shape || 'square',
    seats,
    guests,
    x: typeof table.x === 'number' ? table.x : DEFAULT_TABLE_POSITION.x,
    y: typeof table.y === 'number' ? table.y : DEFAULT_TABLE_POSITION.y,
    radius: typeof table.radius === 'number' ? table.radius : DEFAULT_TABLE_RADIUS(seats),
    width: typeof table.width === 'number' ? table.width : DEFAULT_TABLE_DIMENSIONS.width,
    height: typeof table.height === 'number' ? table.height : DEFAULT_TABLE_DIMENSIONS.height,
    rotation: typeof table.rotation === 'number' ? table.rotation : 0,
  };
};

const normaliseSpecialArea = (area, index) => {
  if (!area || typeof area !== 'object') {
    return {
      id: generateId(`area-${index}`),
      type: 'custom',
      ...DEFAULT_SPECIAL_AREA_POSITION,
      ...DEFAULT_SPECIAL_AREA,
    };
  }

  return {
    id: typeof area.id === 'string' ? area.id : generateId(`area-${index}`),
    type: area.type || 'custom',
    x: typeof area.x === 'number' ? area.x : DEFAULT_SPECIAL_AREA_POSITION.x,
    y: typeof area.y === 'number' ? area.y : DEFAULT_SPECIAL_AREA_POSITION.y,
    width: typeof area.width === 'number' ? area.width : DEFAULT_SPECIAL_AREA.width,
    height: typeof area.height === 'number' ? area.height : DEFAULT_SPECIAL_AREA.height,
  };
};

const applySeatedFlags = (tables, guests) => {
  const seatedIds = new Set();
  tables.forEach((table) => {
    if (!Array.isArray(table.guests)) return;
    table.guests.forEach((guestId) => {
      if (guestId) {
        seatedIds.add(guestId);
      }
    });
  });

  let changed = false;
  const nextGuests = guests.map((guest) => {
    const shouldBeSeated = seatedIds.has(guest.id);
    if (!!guest.seated === shouldBeSeated) {
      return guest;
    }
    changed = true;
    return { ...guest, seated: shouldBeSeated };
  });

  return changed ? nextGuests : guests;
};

const pruneLockedChairs = (lockedChairs, tables) => {
  if (!(lockedChairs instanceof Set) || lockedChairs.size === 0) {
    return lockedChairs instanceof Set ? lockedChairs : new Set();
  }

  const seatMap = new Map();
  tables.forEach((table) => {
    seatMap.set(table.id, table.seats);
  });

  let changed = false;
  const next = new Set();
  lockedChairs.forEach((chairId) => {
    const parsed = parseChairId(chairId);
    if (!parsed) {
      changed = true;
      return;
    }
    const seatCount = seatMap.get(parsed.tableId);
    if (typeof seatCount !== 'number') {
      changed = true;
      return;
    }
    if (parsed.seatIndex >= 0 && parsed.seatIndex < seatCount) {
      next.add(chairId);
    } else {
      changed = true;
    }
  });

  return changed ? next : lockedChairs;
};

export const createEmptyPlan = () => ({
  guests: [],
  tables: [],
  specialAreas: [],
  lockedChairs: new Set(),
});

export const normalizePlan = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return createEmptyPlan();
  }

  const guests = Array.isArray(raw.guests)
    ? raw.guests.map(normaliseGuest)
    : [];

  const tables = Array.isArray(raw.tables)
    ? raw.tables.map(normaliseTable)
    : [];

  const specialAreas = Array.isArray(raw.specialAreas)
    ? raw.specialAreas.map(normaliseSpecialArea)
    : [];

  const lockedChairs = pruneLockedChairs(
    new Set(Array.isArray(raw.lockedChairs) ? raw.lockedChairs.filter((id) => typeof id === 'string') : []),
    tables,
  );

  return {
    guests: applySeatedFlags(tables, guests),
    tables,
    specialAreas,
    lockedChairs,
  };
};

export const planReducer = (state, action) => {
  switch (action.type) {
    case 'IMPORT_GUESTS': {
      const guests = Array.isArray(action.guests)
        ? action.guests.map(normaliseGuest)
        : [];

      let tablesChanged = false;
      const tables = state.tables.map((table) => {
        const emptyGuests = Array.from({ length: table.seats }, () => null);
        const shouldReplace = table.guests.some((guestId) => guestId !== null);
        if (!shouldReplace && table.guests.length === emptyGuests.length) {
          return table;
        }
        tablesChanged = true;
        return { ...table, guests: emptyGuests };
      });

      const lockedChairs = state.lockedChairs.size > 0 ? new Set() : state.lockedChairs;

      return {
        guests,
        tables: tablesChanged ? tables : state.tables,
        specialAreas: state.specialAreas,
        lockedChairs,
      };
    }
    case 'ADD_TABLE': {
      const rawSeats = Number.parseInt(action.seats, 10);
      const seats = Number.isFinite(rawSeats) ? Math.max(1, rawSeats) : 8;
      const shape = action.shape || 'square';
      const name = action.name && action.name.trim().length > 0
        ? action.name
        : `Table ${state.tables.length + 1}`;

      const newTable = {
        id: action.id || generateId('table'),
        name,
        shape,
        seats,
        x: typeof action.x === 'number' ? action.x : DEFAULT_TABLE_POSITION.x,
        y: typeof action.y === 'number' ? action.y : DEFAULT_TABLE_POSITION.y,
        radius: DEFAULT_TABLE_RADIUS(seats),
        width: typeof action.width === 'number' ? action.width : DEFAULT_TABLE_DIMENSIONS.width,
        height: typeof action.height === 'number' ? action.height : DEFAULT_TABLE_DIMENSIONS.height,
        rotation: typeof action.rotation === 'number' ? action.rotation : 0,
        guests: Array.from({ length: seats }, () => null),
      };

      return {
        ...state,
        tables: [...state.tables, newTable],
      };
    }
    case 'ADD_SPECIAL_AREA': {
      const newArea = {
        id: action.id || generateId('area'),
        type: action.areaType || 'custom',
        x: typeof action.x === 'number' ? action.x : DEFAULT_SPECIAL_AREA_POSITION.x,
        y: typeof action.y === 'number' ? action.y : DEFAULT_SPECIAL_AREA_POSITION.y,
        width: typeof action.width === 'number' ? action.width : DEFAULT_SPECIAL_AREA.width,
        height: typeof action.height === 'number' ? action.height : DEFAULT_SPECIAL_AREA.height,
      };

      return {
        ...state,
        specialAreas: [...state.specialAreas, newArea],
      };
    }
    case 'MOVE_ITEM': {
      const { id, x, y, itemType } = action;
      if (itemType === 'table') {
        let changed = false;
        const tables = state.tables.map((table) => {
          if (table.id !== id) return table;
          if (table.x === x && table.y === y) return table;
          changed = true;
          return { ...table, x, y };
        });
        if (!changed) return state;
        return { ...state, tables };
      }
      if (itemType === 'area') {
        let changed = false;
        const specialAreas = state.specialAreas.map((area) => {
          if (area.id !== id) return area;
          if (area.x === x && area.y === y) return area;
          changed = true;
          return { ...area, x, y };
        });
        if (!changed) return state;
        return { ...state, specialAreas };
      }
      return state;
    }
    case 'SEAT_GUEST': {
      const { tableId, seatIndex, guestId } = action;
      const chairId = `${tableId}-${seatIndex}`;
      if (state.lockedChairs.has(chairId)) {
        return state;
      }

      let tablesChanged = false;
      const tables = state.tables.map((table) => {
        if (!Array.isArray(table.guests)) return table;
        const guests = table.guests.slice();
        let changed = false;

        if (guestId) {
          for (let i = 0; i < guests.length; i += 1) {
            if (guests[i] === guestId) {
              guests[i] = null;
              changed = true;
            }
          }
        }

        if (table.id === tableId) {
          if (seatIndex < 0 || seatIndex >= guests.length) {
            return table;
          }
          if (guests[seatIndex] !== guestId) {
            guests[seatIndex] = guestId || null;
            changed = true;
          }
        }

        if (!changed) {
          return table;
        }
        tablesChanged = true;
        return { ...table, guests };
      });

      if (!tablesChanged) {
        return state;
      }

      const guests = applySeatedFlags(tables, state.guests);

      return {
        ...state,
        tables,
        guests,
      };
    }
    case 'TOGGLE_LOCK_CHAIR': {
      const { tableId, seatIndex } = action;
      const targetTable = state.tables.find((table) => table.id === tableId);
      if (!targetTable || seatIndex < 0 || seatIndex >= targetTable.seats) {
        return state;
      }

      const chairId = `${tableId}-${seatIndex}`;
      const lockedChairs = new Set(state.lockedChairs);
      if (lockedChairs.has(chairId)) {
        lockedChairs.delete(chairId);
      } else {
        lockedChairs.add(chairId);
      }

      return {
        ...state,
        lockedChairs,
      };
    }
    case 'DELETE_TABLE': {
      const { tableId } = action;
      if (!state.tables.some((table) => table.id === tableId)) {
        return state;
      }

      const tables = state.tables.filter((table) => table.id !== tableId);
      const guests = applySeatedFlags(tables, state.guests);
      const lockedChairs = pruneLockedChairs(state.lockedChairs, tables);

      return {
        ...state,
        tables,
        guests,
        lockedChairs,
      };
    }
    case 'DELETE_AREA': {
      const { areaId } = action;
      if (!state.specialAreas.some((area) => area.id === areaId)) {
        return state;
      }

      return {
        ...state,
        specialAreas: state.specialAreas.filter((area) => area.id !== areaId),
      };
    }
    case 'RESIZE_TABLE': {
      const { tableId, updates } = action;
      let tablesChanged = false;
      let seatCountChanged = false;
      const tables = state.tables.map((table) => {
        if (table.id !== tableId) return table;
        const next = { ...table, ...updates };
        if (typeof updates.seats === 'number') {
          const seats = Math.max(0, Math.floor(updates.seats));
          next.seats = seats;
          const guests = Array.from({ length: seats }, (_, i) => (table.guests[i] || null));
          next.guests = guests;
          seatCountChanged = seatCountChanged || seats !== table.seats;
        }
        tablesChanged = true;
        return next;
      });

      if (!tablesChanged) {
        return state;
      }

      const lockedChairs = seatCountChanged ? pruneLockedChairs(state.lockedChairs, tables) : state.lockedChairs;
      const guests = seatCountChanged ? applySeatedFlags(tables, state.guests) : state.guests;

      return {
        ...state,
        tables,
        guests,
        lockedChairs,
      };
    }
    case 'ROTATE_TABLE': {
      const { tableId, rotation } = action;
      let tablesChanged = false;
      const tables = state.tables.map((table) => {
        if (table.id !== tableId) return table;
        const nextRotation = ((rotation % 360) + 360) % 360;
        if (table.rotation === nextRotation) return table;
        tablesChanged = true;
        return { ...table, rotation: nextRotation };
      });
      if (!tablesChanged) return state;
      return { ...state, tables };
    }
    case 'RESIZE_AREA': {
      const { areaId, width, height } = action;
      let changed = false;
      const specialAreas = state.specialAreas.map((area) => {
        if (area.id !== areaId) return area;
        if (area.width === width && area.height === height) return area;
        changed = true;
        return { ...area, width, height };
      });
      if (!changed) return state;
      return { ...state, specialAreas };
    }
    default:
      return state;
  }
};
