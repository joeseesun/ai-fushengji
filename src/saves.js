import { parseSave, SAVE_KEY } from './engine.js';

export const SLOTS_KEY = 'ai-fushengji-slots-v1';
export const MAX_SLOTS = 6;

// One atomic write keeps the selected slot and its progress together. The old
// single-save key remains an untouched recovery copy after migration.
export function readSlots(storage) {
  const raw = storage.getItem(SLOTS_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.slots) || data.slots.length > MAX_SLOTS) throw new Error('存档列表损坏，原始数据尚未覆盖。');
    const slots = data.slots.map(slot => {
      const state = parseSave(JSON.stringify(slot.state));
      if (typeof slot.id !== 'string' || !slot.id || !state) throw new Error('有存档无法读取，原始数据尚未覆盖。');
      return { id: slot.id, state };
    });
    if (new Set(slots.map(s => s.id)).size !== slots.length || (slots.length ? !slots.some(s => s.id === data.active) : data.active !== null)) throw new Error('存档列表损坏，原始数据尚未覆盖。');
    return { version: 1, active: data.active, slots };
  }
  const legacy = storage.getItem(SAVE_KEY);
  const state = legacy ? parseSave(legacy) : null;
  if (legacy && !state) throw new Error('旧存档无法读取，原始数据尚未覆盖。');
  return { version: 1, active: state ? 'legacy' : null, slots: state ? [{ id: 'legacy', state }] : [] };
}

export function writeSlots(storage, data) {
  storage.setItem(SLOTS_KEY, JSON.stringify(data));
}
