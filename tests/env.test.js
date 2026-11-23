import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import config from '../wxt.config.ts';

describe('Фаза 0: проверка окружения и манифеста', () => {
  it('окружение Vitest работает корректно', () => {
    expect(1 + 1).toBe(2);
  });

  it('манифест содержит только разрешённые права и хосты', () => {
    expect(config.manifest.permissions).toEqual(['storage']);
    expect(config.manifest.host_permissions).toEqual(['https://gemini.google.com/*']);
  });
  it('все три HTML-фикстуры существуют и не пустые', () => {
  const files = ['simple-chat.html', 'chat-with-code.html', 'chat-with-attachments.html'];
  for (const file of files) {
    const fullPath = path.resolve('tests/fixtures', file);
    expect(fs.existsSync(fullPath)).toBe(true);
    expect(fs.readFileSync(fullPath, 'utf-8').trim().length).toBeGreaterThan(0);
  }
});
});