import {
  ATTACHMENT_TOKEN_ESTIMATE,
  CHARS_PER_TOKEN,
} from './constants.js';

/**
 * Очищает текст от лишних отступов и пробелов, которые Angular генерирует в DOM-шаблонах.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Оценивает примерное количество токенов в переданном тексте.
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return 0;
  }

  return Math.ceil(normalized.length / CHARS_PER_TOKEN);
}

/**
 * Оценивает токены для прикреплённых файлов/изображений.
 * @param {number} attachmentCount
 * @returns {number}
 */
export function estimateAttachmentTokens(attachmentCount) {
  if (typeof attachmentCount !== 'number' || attachmentCount <= 0) {
    return 0;
  }

  return Math.floor(attachmentCount) * ATTACHMENT_TOKEN_ESTIMATE;
}