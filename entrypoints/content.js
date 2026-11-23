import { calculateChatMetrics } from '../src/core/metrics.js';
import {
  getContextLimit,
  onContextLimitChanged,
} from '../src/core/storage.js';
import { createContextWidget } from '../src/ui/widget.js';

export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  runAt: 'document_idle',

  async main(ctx) {
    const widget = createContextWidget();
    widget.mount();

    let currentLimit = await getContextLimit();
    let debounceTimer = null;

    function refreshMetrics() {
      const metrics = calculateChatMetrics(document, currentLimit);
      widget.update(metrics);
    }

    function scheduleRefresh() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        refreshMetrics();
      }, 400);
    }

    // Первый расчёт с учётом сохранённого лимита
    refreshMetrics();

    // Мгновенно обновляем виджет, если пользователь изменил лимит в Popup
    const unsubscribeStorage = onContextLimitChanged((newLimit) => {
      currentLimit = newLimit;
      refreshMetrics();
    });

    const observer = new MutationObserver((mutations) => {
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

    ctx.onInvalidated(() => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unsubscribeStorage();
      observer.disconnect();
      widget.destroy();
    });
  },
});