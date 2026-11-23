import { calculateChatMetrics } from '../src/core/metrics.js';
import { createContextWidget } from '../src/ui/widget.js';

export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  runAt: 'document_idle',

  main(ctx) {
    const widget = createContextWidget();
    widget.mount();

    let debounceTimer = null;

    /**
     * Пересчитывает метрики по текущему DOM страницы и обновляет виджет.
     */
    function refreshMetrics() {
      const metrics = calculateChatMetrics(document);
      widget.update(metrics);
    }

    /**
     * Отложенный вызов пересчёта (debounce), чтобы не грузить CPU
     * во время быстрой потоковой генерации ответа Gemini.
     */
    function scheduleRefresh() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        refreshMetrics();
      }, 400);
    }

    // Первый расчёт сразу после инициализации
    refreshMetrics();

    // Наблюдаем за изменениями DOM (новые сообщения, стриминг текста, переключение чата)
    const observer = new MutationObserver((mutations) => {
      // Игнорируем мутации внутри нашего собственного виджета, чтобы не зациклиться
      const isExternalMutation = mutations.some(
        (m) => m.target?.id !== 'gemini-context-meter-root'
      );

      if (isExternalMutation) {
        scheduleRefresh();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Корректная очистка ресурсов при перезагрузке или отключении расширения
    ctx.onInvalidated(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer.disconnect();
      widget.destroy();
    });
  },
});