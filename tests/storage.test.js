import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONTEXT_LIMIT } from '../src/core/constants.js';
import {
  getContextLimit,
  onContextLimitChanged,
  setContextLimit,
} from '../src/core/storage.js';

describe('Фаза 3–4: Хранилище настроек (storage.js)', () => {
  let memoryStore = {};
  let changeListeners = [];

  beforeEach(() => {
    memoryStore = {};
    changeListeners = [];

    globalThis.chrome = {
      storage: {
        local: {
          get: vi.fn(async (key) => ({ [key]: memoryStore[key] })),
          set: vi.fn(async (items) => {
            const changes = {};
            for (const [k, v] of Object.entries(items)) {
              changes[k] = { oldValue: memoryStore[k], newValue: v };
              memoryStore[k] = v;
            }
            for (const listener of changeListeners) {
              listener(changes, 'local');
            }
          }),
        },
        onChanged: {
          addListener: vi.fn((fn) => changeListeners.push(fn)),
          removeListener: vi.fn((fn) => {
            changeListeners = changeListeners.filter((item) => item !== fn);
          }),
        },
      },
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
  });

  it('возвращает DEFAULT_CONTEXT_LIMIT, если в хранилище пусто', async () => {
    const limit = await getContextLimit();
    expect(limit).toBe(DEFAULT_CONTEXT_LIMIT);
  });

  it('сохраняет и читает корректный лимит', async () => {
    const saved = await setContextLimit(256_000);
    expect(saved).toBe(256_000);

    const loaded = await getContextLimit();
    expect(loaded).toBe(256_000);
  });

  it('отбрасывает некорректные значения (< 1000 или NaN) и ставит дефолт', async () => {
    expect(await setContextLimit(500)).toBe(DEFAULT_CONTEXT_LIMIT);
    expect(await setContextLimit('abc')).toBe(DEFAULT_CONTEXT_LIMIT);
    expect(await setContextLimit(-100)).toBe(DEFAULT_CONTEXT_LIMIT);
  });

  it('уведомляет подписчиков при изменении лимита и корректно отписывается', async () => {
    const spy = vi.fn();
    const unsubscribe = onContextLimitChanged(spy);

    await setContextLimit(64_000);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(64_000);

    unsubscribe();
    await setContextLimit(32_000);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});