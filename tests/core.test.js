// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ATTACHMENT_TOKEN_ESTIMATE } from '../src/core/constants.js';
import { parseChatHistory } from '../src/core/dom-parser.js';
import { calculateChatMetrics } from '../src/core/metrics.js';
import {
  estimateAttachmentTokens,
  estimateTokens,
  normalizeText,
} from '../src/core/tokenizer.js';

/**
 * Хелпер для загрузки HTML-фикстуры и превращения её в реальное DOM-дерево.
 * @param {string} filename
 * @returns {Document}
 */
function loadFixtureDocument(filename) {
  const filePath = resolve(process.cwd(), 'tests', 'fixtures', filename);
  const html = readFileSync(filePath, 'utf-8');
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('Фаза 1: Ядро подсчёта токенов (tokenizer.js)', () => {
  it('нормализует лишние пробелы и переносы строк Angular-шаблонов', () => {
    expect(normalizeText('   Привет,    мир! \n\n  Как   дела?  ')).toBe(
      'Привет, мир! Как дела?'
    );
  });

  it('безопасно обрабатывает пустые и некорректные входные данные', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('   \n\t  ')).toBe(0);
    expect(estimateTokens(null)).toBe(0);
    expect(estimateTokens(undefined)).toBe(0);

    expect(estimateAttachmentTokens(0)).toBe(0);
    expect(estimateAttachmentTokens(-3)).toBe(0);
    expect(estimateAttachmentTokens(null)).toBe(0);
  });

  it('оценивает токены с округлением вверх и учитывает вложения', () => {
    // 4 символа при CHARS_PER_TOKEN = 3 -> Math.ceil(4 / 3) = 2
    expect(estimateTokens('abcd')).toBe(2);
    expect(estimateAttachmentTokens(2)).toBe(2 * ATTACHMENT_TOKEN_ESTIMATE);
  });
});

describe('Фаза 1: Парсер DOM Gemini (dom-parser.js)', () => {
  it('парсит simple-chat.html и не дублирует скрытый текст для скринридеров', () => {
    const doc = loadFixtureDocument('simple-chat.html');
    const turns = parseChatHistory(doc);

    expect(turns).toHaveLength(2);

    // Первый ход
    expect(turns[0].id).toBe('turn-1');
    expect(turns[0].userText).toBe('Привет, помоги разобраться с задачей');
    expect(turns[0].userText).not.toContain('Ваш запрос');
    expect(turns[0].modelText).toContain('Привет! Конечно, расскажи подробнее');
    expect(turns[0].modelText).not.toContain('Ответ Gemini');
    expect(turns[0].attachmentCount).toBe(0);

    // Второй ход (многострочный запрос пользователя)
    expect(turns[1].id).toBe('turn-2');
    expect(turns[1].userText).toBe(
      'Нужно посчитать токены в тексте\nПодскажи простую формулу для старта.'
    );
  });

  it('находит прикреплённые файлы в chat-with-attachments.html', () => {
    const doc = loadFixtureDocument('chat-with-attachments.html');
    const turns = parseChatHistory(doc);

    expect(turns).toHaveLength(1);
    expect(turns[0].attachmentCount).toBe(1);
    expect(turns[0].userText).toBe('Изучи прикреплённый файл спецификации');
  });

  it('извлекает код в chat-with-code.html без служебной шапки блока кода', () => {
    const doc = loadFixtureDocument('chat-with-code.html');
    const turns = parseChatHistory(doc);

    expect(turns).toHaveLength(1);
    expect(turns[0].modelText).toContain('function sum(a, b)');
    expect(turns[0].modelText).toContain('return a + b;');

    // Слово "JavaScript" должно остаться только во вводном абзаце (1 раз),
    // а не дублироваться из .code-block-decoration
    const jsOccurrences = turns[0].modelText.match(/JavaScript/g) || [];
    expect(jsOccurrences).toHaveLength(1);
  });
});

describe('Фаза 1: Калькулятор метрик (metrics.js)', () => {
  it('считает общую статистику и токены вложений для чата с файлом', () => {
    const doc = loadFixtureDocument('chat-with-attachments.html');
    const metrics = calculateChatMetrics(doc);

    expect(metrics.turnCount).toBe(1);
    expect(metrics.attachmentCount).toBe(1);
    expect(metrics.attachmentTokens).toBe(ATTACHMENT_TOKEN_ESTIMATE);
    expect(metrics.userTokens).toBeGreaterThan(0);
    expect(metrics.modelTokens).toBeGreaterThan(0);
    expect(metrics.totalTokens).toBe(
      metrics.userTokens + metrics.modelTokens + metrics.attachmentTokens
    );
    expect(metrics.status).toBe('normal');
  });

  it('корректно переключает статусы normal -> warning -> danger при приближении к лимиту', () => {
    const doc = loadFixtureDocument('simple-chat.html');
    const baseMetrics = calculateChatMetrics(doc);
    const total = baseMetrics.totalTokens;

    // Ставим лимит чуть больше текущего объёма, чтобы попасть в warning (>= 75%)
    const warningMetrics = calculateChatMetrics(doc, Math.ceil(total / 0.8));
    expect(warningMetrics.status).toBe('warning');

    // Ставим лимит почти впритык, чтобы попасть в danger (>= 90%)
    const dangerMetrics = calculateChatMetrics(doc, Math.ceil(total / 0.95));
    expect(dangerMetrics.status).toBe('danger');
  });

  it('не падает при передаче null вместо DOM-элемента', () => {
    const metrics = calculateChatMetrics(null);
    expect(metrics.totalTokens).toBe(0);
    expect(metrics.turnCount).toBe(0);
    expect(metrics.status).toBe('normal');
  });
});