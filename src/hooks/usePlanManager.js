import { useReducer, useCallback } from 'react';
import { planReducer, createEmptyPlan, normalizePlan } from '../state/planReducer';

const HISTORY_LIMIT = 50;

const createInitialHistory = () => ({
  past: [],
  present: createEmptyPlan(),
  future: [],
});

const historyReducer = (state, action) => {
  switch (action.type) {
    case 'APPLY': {
      const nextPlan = planReducer(state.present, action.planAction);
      if (nextPlan === state.present) {
        return state;
      }
      const past = [...state.past, state.present];
      if (past.length > HISTORY_LIMIT) {
        past.shift();
      }
      return {
        past,
        present: nextPlan,
        future: [],
      };
    }
    case 'LOAD': {
      const plan = normalizePlan(action.plan);
      return {
        past: [],
        present: plan,
        future: [],
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      const past = state.past.slice(0, -1);
      const future = [state.present, ...state.future];
      return {
        past,
        present: previous,
        future,
      };
    }
    case 'REDO': {
      if (state.future.length === 0) {
        return state;
      }
      const [next, ...rest] = state.future;
      const past = [...state.past, state.present];
      return {
        past,
        present: next,
        future: rest,
      };
    }
    default:
      return state;
  }
};

export const usePlanManager = () => {
  const [state, dispatch] = useReducer(historyReducer, undefined, createInitialHistory);
  const { past, present, future } = state;

  const apply = useCallback((planAction) => {
    dispatch({ type: 'APPLY', planAction });
  }, []);

  const importGuests = useCallback((guests) => {
    apply({ type: 'IMPORT_GUESTS', guests });
  }, [apply]);

  const addTable = useCallback((tableConfig) => {
    const { seats, name, shape, x, y, width, height, rotation, id } = tableConfig || {};
    apply({ type: 'ADD_TABLE', seats, name, shape, x, y, width, height, rotation, id });
  }, [apply]);

  const addSpecialArea = useCallback((areaType) => {
    apply({ type: 'ADD_SPECIAL_AREA', areaType });
  }, [apply]);

  const moveItem = useCallback((id, x, y, itemType) => {
    apply({ type: 'MOVE_ITEM', id, x, y, itemType });
  }, [apply]);

  const seatGuest = useCallback((tableId, seatIndex, guestId) => {
    apply({ type: 'SEAT_GUEST', tableId, seatIndex, guestId });
  }, [apply]);

  const toggleLockChair = useCallback((tableId, seatIndex) => {
    apply({ type: 'TOGGLE_LOCK_CHAIR', tableId, seatIndex });
  }, [apply]);

  const deleteTable = useCallback((tableId) => {
    apply({ type: 'DELETE_TABLE', tableId });
  }, [apply]);

  const deleteArea = useCallback((areaId) => {
    apply({ type: 'DELETE_AREA', areaId });
  }, [apply]);

  const resizeTable = useCallback((tableId, updates) => {
    apply({ type: 'RESIZE_TABLE', tableId, updates });
  }, [apply]);

  const rotateTable = useCallback((tableId, rotation) => {
    apply({ type: 'ROTATE_TABLE', tableId, rotation });
  }, [apply]);

  const resizeArea = useCallback((areaId, width, height) => {
    apply({ type: 'RESIZE_AREA', areaId, width, height });
  }, [apply]);

  const loadPlan = useCallback((plan) => {
    dispatch({ type: 'LOAD', plan });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  return {
    plan: present,
    importGuests,
    addTable,
    addSpecialArea,
    moveItem,
    seatGuest,
    toggleLockChair,
    deleteTable,
    deleteArea,
    resizeTable,
    rotateTable,
    resizeArea,
    loadPlan,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};

export default usePlanManager;
