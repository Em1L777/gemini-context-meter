# Gemini Context Meter

Chrome-расширение (Manifest V3), которое в реальном времени оценивает заполнение контекстного окна в веб-интерфейсе **Google Gemini** (`gemini.google.com`).

## Возможности
- **Живой подсчёт токенов** по ходу переписки без перезагрузки страницы (`MutationObserver` с debounce 400 мс).
- **Детализация расхода:** отдельно считает запросы пользователя, ответы модели (включая блоки кода) и прикреплённые файлы.
- **Изолированный UI:** плавающий виджет встроен через Shadow DOM, не конфликтует со стилями Angular Material.
- **Гибкие лимиты:** выбор пресетов (`32k`, `64k`, `128k`, `256k`, `1M`) или произвольного порога через Popup-меню с мгновенной синхронизацией через `chrome.storage.local`.

## Архитектура
- `src/core/` — чистое расчётное ядро без привязки к браузерному UI (`constants.js`, `tokenizer.js`, `dom-parser.js`, `metrics.js`, `storage.js`).
- `src/ui/` — изолированный Shadow DOM виджет (`widget.js`).
- `entrypoints/` — точки входа WXT (`content.js` и `popup/`).
- `tests/` — юнит-тесты ядра и DOM-парсера на Vitest + `happy-dom`.

## Разработка и сборка

```bash
# Установка зависимостей
npm install

# Запуск юнит-тестов
npm test

# Запуск в режиме разработки
npm run dev

# Production-сборка и упаковка в ZIP
npm run build
npm run zip