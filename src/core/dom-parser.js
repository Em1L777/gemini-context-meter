/**
 * Селекторы для извлечения данных из DOM-дерева Gemini.
 * Опираемся на семантические кастомные теги, data-test-id и стабильные классы.
 */
export const SELECTORS = {
  turn: '.conversation-container',
  userQuery: 'user-query',
  userTextLine: '.query-text .query-text-line',
  userTextFallback: '.query-text',
  attachmentItem: 'user-query-file-preview',
  modelResponse: 'model-response',
  modelMarkdown: 'message-content .markdown',
  ignoredNodes: '.cdk-visually-hidden, .code-block-decoration',
};

/**
 * Безопасно извлекает видимый полезный текст из элемента,
 * вырезая скрытые элементы для скринридеров и служебные шапки блоков кода.
 * @param {Element | null} element
 * @returns {string}
 */
function extractCleanText(element) {
  if (!element) {
    return '';
  }

  // Клонируем узел, чтобы не мутировать живой DOM страницы Gemini
  const clone = element.cloneNode(true);
  clone
    .querySelectorAll(SELECTORS.ignoredNodes)
    .forEach((node) => node.remove());

  return clone.textContent || '';
}

/**
 * Извлекает текст запроса пользователя и точное количество прикреплённых файлов.
 * @param {Element} userQueryElement
 * @returns {{ text: string, attachmentCount: number }}
 */
function parseUserQuery(userQueryElement) {
  if (!userQueryElement) {
    return { text: '', attachmentCount: 0 };
  }

  // 1. Собираем строки запроса по классу .query-text-line
  const lines = Array.from(
    userQueryElement.querySelectorAll(SELECTORS.userTextLine)
  );

  let text = '';
  if (lines.length > 0) {
    text = lines.map((line) => line.textContent || '').join('\n');
  } else {
    const fallbackContainer = userQueryElement.querySelector(
      SELECTORS.userTextFallback
    );
    text = extractCleanText(fallbackContainer);
  }

  // 2. Считаем карточки файлов напрямую по тегу user-query-file-preview
  const attachmentCount = userQueryElement.querySelectorAll(
    SELECTORS.attachmentItem
  ).length;

  return { text, attachmentCount };
}

/**
 * Извлекает текст ответа модели (включая код, но исключая UI-декорации).
 * @param {Element} modelResponseElement
 * @returns {string}
 */
function parseModelResponse(modelResponseElement) {
  if (!modelResponseElement) {
    return '';
  }

  const markdownBlocks = Array.from(
    modelResponseElement.querySelectorAll(SELECTORS.modelMarkdown)
  );

  if (markdownBlocks.length > 0) {
    return markdownBlocks
      .map((block) => extractCleanText(block))
      .join('\n');
  }

  return '';
}

/**
 * Парсит контейнер истории чата и возвращает структурированный список ходов диалога.
 * @param {ParentNode} rootElement - document или корневой контейнер с историей чата
 * @returns {Array<{
 *   id: string,
 *   userText: string,
 *   modelText: string,
 *   attachmentCount: number
 * }>}
 */
export function parseChatHistory(rootElement) {
  if (!rootElement || typeof rootElement.querySelectorAll !== 'function') {
    return [];
  }

  const turnElements = Array.from(
    rootElement.querySelectorAll(SELECTORS.turn)
  );

  return turnElements.map((turnEl, index) => {
    const userQueryEl = turnEl.querySelector(SELECTORS.userQuery);
    const modelResponseEl = turnEl.querySelector(SELECTORS.modelResponse);

    const { text: userText, attachmentCount } = parseUserQuery(userQueryEl);
    const modelText = parseModelResponse(modelResponseEl);

    return {
      id: turnEl.id || `turn-${index + 1}`,
      userText,
      modelText,
      attachmentCount,
    };
  });
}