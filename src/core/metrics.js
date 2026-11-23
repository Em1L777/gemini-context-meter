import {
  DANGER_THRESHOLD,
  DEFAULT_CONTEXT_LIMIT,
  WARNING_THRESHOLD,
} from './constants.js';
import { parseChatHistory } from './dom-parser.js';
import { estimateAttachmentTokens, estimateTokens } from './tokenizer.js';

/**
 * Вычисляет агрегированные метрики контекста для всей ленты чата.
 * @param {ParentNode} rootElement - document или контейнер чата
 * @param {number} [contextLimit=DEFAULT_CONTEXT_LIMIT] - лимит контекстного окна в токенах
 * @returns {{
 *   turnCount: number,
 *   userTokens: number,
 *   modelTokens: number,
 *   attachmentCount: number,
 *   attachmentTokens: number,
 *   totalTokens: number,
 *   limit: number,
 *   usageRatio: number,
 *   usagePercent: number,
 *   status: 'normal' | 'warning' | 'danger'
 * }}
 */
export function calculateChatMetrics(
  rootElement,
  contextLimit = DEFAULT_CONTEXT_LIMIT
) {
  const limit =
    typeof contextLimit === 'number' && contextLimit > 0
      ? contextLimit
      : DEFAULT_CONTEXT_LIMIT;

  const turns = parseChatHistory(rootElement);

  let userTokens = 0;
  let modelTokens = 0;
  let attachmentCount = 0;

  for (const turn of turns) {
    userTokens += estimateTokens(turn.userText);
    modelTokens += estimateTokens(turn.modelText);
    attachmentCount += turn.attachmentCount;
  }

  const attachmentTokens = estimateAttachmentTokens(attachmentCount);
  const totalTokens = userTokens + modelTokens + attachmentTokens;
  const usageRatio = totalTokens / limit;
  const usagePercent = Math.min(100, Math.round(usageRatio * 100));

  let status = 'normal';
  if (usageRatio >= DANGER_THRESHOLD) {
    status = 'danger';
  } else if (usageRatio >= WARNING_THRESHOLD) {
    status = 'warning';
  }

  return {
    turnCount: turns.length,
    userTokens,
    modelTokens,
    attachmentCount,
    attachmentTokens,
    totalTokens,
    limit,
    usageRatio,
    usagePercent,
    status,
  };
}