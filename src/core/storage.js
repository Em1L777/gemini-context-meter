import { DEFAULT_CONTEXT_LIMIT } from './constants.js';

const STORAGE_KEY = 'gemini_context_limit';

/**
 * Читает сохранённый пользователем лимит контекста.
 * @returns {Promise<number>}
 */
export async function getContextLimit() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return DEFAULT_CONTEXT_LIMIT;
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  const value = Number(result[STORAGE_KEY]);

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CONTEXT_LIMIT;
}

/**
 * Сохраняет новый лимит контекста.
 * @param {number} limit
 * @returns {Promise<number>}
 */
export async function setContextLimit(limit) {
  const parsed = Math.floor(Number(limit));
  const validLimit =
    Number.isFinite(parsed) && parsed >= 1_000 ? parsed : DEFAULT_CONTEXT_LIMIT;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: validLimit });
  }

  return validLimit;
}

/**
 * Подписывается на изменение лимита в реальном времени (для синхронизации Popup -> Content Script).
 * @param {(newLimit: number) => void} callback
 * @returns {() => void} функция отписки
 */
export function onContextLimitChanged(callback) {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      const next = Number(changes[STORAGE_KEY].newValue);
      if (Number.isFinite(next) && next > 0) {
        callback(next);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}