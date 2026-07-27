import { DB_NAME, DB_VERSION, MAX_SAVE_SLOTS } from '../utils/constants.js';
import { migrate } from './migrations.js';

const STORE_NAME = 'saves';
const ACTIVE_SLOT_KEY = 'lemonade-empire:active-slot';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  if (!('indexedDB' in window)) {
    dbPromise = Promise.reject(new Error('IndexedDB is not available in this browser.'));
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open save database.'));
  });
  return dbPromise;
}

function withStore(mode, callback) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const result = callback(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('Save transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('Save transaction aborted.'));
      })
  );
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToSlot(slot, state) {
  if (slot < 1 || slot > MAX_SAVE_SLOTS) throw new Error(`Invalid save slot: ${slot}`);
  const record = {
    slot,
    updatedAt: Date.now(),
    state: JSON.parse(JSON.stringify({ ...state, liveDay: null })),
  };
  await withStore('readwrite', (store) => store.put(record));
  return record.updatedAt;
}

export async function loadFromSlot(slot) {
  const record = await withStore('readonly', (store) => requestToPromise(store.get(slot)));
  if (!record) return null;
  return migrate(record.state);
}

export async function listSaveSlots() {
  const records = await withStore('readonly', (store) => requestToPromise(store.getAll()));
  const bySlot = new Map(records.map((r) => [r.slot, r]));
  const slots = [];
  for (let slot = 1; slot <= MAX_SAVE_SLOTS; slot += 1) {
    const record = bySlot.get(slot);
    slots.push(
      record
        ? {
            slot,
            updatedAt: record.updatedAt,
            businessName: record.state?.meta?.businessName || 'Unnamed Business',
            day: record.state?.calendar?.day || 1,
            cash: record.state?.finances?.cash ?? 0,
          }
        : { slot, empty: true }
    );
  }
  return slots;
}

export async function deleteSlot(slot) {
  await withStore('readwrite', (store) => store.delete(slot));
}

export function getActiveSlot() {
  const raw = localStorage.getItem(ACTIVE_SLOT_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_SAVE_SLOTS ? parsed : 1;
}

export function setActiveSlot(slot) {
  localStorage.setItem(ACTIVE_SLOT_KEY, String(slot));
}

export function exportSaveAsJson(state) {
  return JSON.stringify({ ...state, liveDay: null }, null, 2);
}

export function importSaveFromJson(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('That file is not valid save data (invalid JSON).');
  }
  return migrate(parsed);
}

let autosaveTimer = null;
export function scheduleAutosave(getState, slot, delayMs = 1500) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    saveToSlot(slot, getState()).catch((err) => console.error('Autosave failed', err));
  }, delayMs);
}
