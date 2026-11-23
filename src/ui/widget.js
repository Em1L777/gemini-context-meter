/**
 * Создаёт и управляет изолированным UI-виджетом счётчика контекста поверх страницы Gemini.
 */
export function createContextWidget() {
  const HOST_ID = 'gemini-context-meter-root';

  // Защита от повторного монтирования при горячей перезагрузке (HMR)
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = HOST_ID;

  // Фиксируем контейнер в правом верхнем углу под шапкой, чтобы не перекрывать поле ввода и боковое меню
  Object.assign(host.style, {
    position: 'fixed',
    top: '68px',
    right: '20px',
    zIndex: '9999',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  const shadow = host.attachShadow({ mode: 'open' });

  shadow.innerHTML = `
    <style>
      .meter-wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        user-select: none;
      }

      .pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(24, 25, 28, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #e8eaed;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        transition: border-color 0.2s ease, transform 0.15s ease;
      }

      .pill:hover {
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #34a853;
        flex-shrink: 0;
        transition: background-color 0.2s ease;
      }

      .pill[data-status="warning"] .dot {
        background: #fbbc04;
      }

      .pill[data-status="danger"] .dot {
        background: #ea4335;
      }

      .progress-track {
        width: 44px;
        height: 5px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        width: 0%;
        background: #34a853;
        border-radius: 999px;
        transition: width 0.25s ease, background-color 0.2s ease;
      }

      .pill[data-status="warning"] .progress-fill {
        background: #fbbc04;
      }

      .pill[data-status="danger"] .progress-fill {
        background: #ea4335;
      }

      .details-card {
        display: none;
        margin-top: 8px;
        width: 230px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(24, 25, 28, 0.96);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #e8eaed;
        font-size: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      }

      .details-card.open {
        display: block;
      }

      .card-title {
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 8px;
        color: #fff;
        display: flex;
        justify-content: space-between;
      }

      .row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        color: #bdc1c6;
      }

      .row span:last-child {
        color: #e8eaed;
        font-variant-numeric: tabular-nums;
      }

      .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 6px 0;
      }
    </style>

    <div class="meter-wrapper">
      <button class="pill" type="button" data-status="normal" title="Нажмите для детализации контекста">
        <span class="dot"></span>
        <span class="label">0 / 128k (0%)</span>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
      </button>

      <div class="details-card">
        <div class="card-title">
          <span>Контекст чата</span>
          <span class="turns-badge">0 ходов</span>
        </div>
        <div class="row">
          <span>Ваши запросы:</span>
          <span class="val-user">0</span>
        </div>
        <div class="row">
          <span>Ответы Gemini:</span>
          <span class="val-model">0</span>
        </div>
        <div class="row">
          <span>Файлы (<span class="val-files-count">0</span>):</span>
          <span class="val-files">0</span>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>Всего токенов:</span>
          <span class="val-total">0 / 128 000</span>
        </div>
      </div>
    </div>
  `;

  const pill = shadow.querySelector('.pill');
  const label = shadow.querySelector('.label');
  const progressFill = shadow.querySelector('.progress-fill');
  const detailsCard = shadow.querySelector('.details-card');
  const turnsBadge = shadow.querySelector('.turns-badge');
  const valUser = shadow.querySelector('.val-user');
  const valModel = shadow.querySelector('.val-model');
  const valFilesCount = shadow.querySelector('.val-files-count');
  const valFiles = shadow.querySelector('.val-files');
  const valTotal = shadow.querySelector('.val-total');

  // Переключение карточки с подробностями по клику на плашку
  pill.addEventListener('click', () => {
    detailsCard.classList.toggle('open');
  });

  /**
   * Форматирует число в компактный вид (например, 12500 -> "12.5k", 128000 -> "128k").
   * @param {number} num
   * @returns {string}
   */
  function formatCompact(num) {
    if (num < 1000) return String(num);
    const k = num / 1000;
    return k >= 100 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, '')}k`;
  }

  return {
    mount() {
      if (!document.body.contains(host)) {
        document.body.appendChild(host);
      }
    },

    update(metrics) {
      pill.dataset.status = metrics.status;
      label.textContent = `${formatCompact(metrics.totalTokens)} / ${formatCompact(metrics.limit)} (${metrics.usagePercent}%)`;
      progressFill.style.width = `${metrics.usagePercent}%`;

      turnsBadge.textContent = `${metrics.turnCount} ход.`;
      valUser.textContent = metrics.userTokens.toLocaleString('ru-RU');
      valModel.textContent = metrics.modelTokens.toLocaleString('ru-RU');
      valFilesCount.textContent = String(metrics.attachmentCount);
      valFiles.textContent = metrics.attachmentTokens.toLocaleString('ru-RU');
      valTotal.textContent = `${metrics.totalTokens.toLocaleString('ru-RU')} / ${metrics.limit.toLocaleString('ru-RU')}`;
    },

    destroy() {
      host.remove();
    },
  };
}