import { getContextLimit, setContextLimit } from '../../src/core/storage.js';

const input = document.getElementById('limit-input');
const form = document.getElementById('limit-form');
const statusMsg = document.getElementById('status-msg');
const presetButtons = Array.from(document.querySelectorAll('.preset-btn'));

/**
 * Подсвечивает активный пресет, если текущий лимит с ним совпадает.
 * @param {number} currentLimit
 */
function syncActivePreset(currentLimit) {
  for (const btn of presetButtons) {
    const btnLimit = Number(btn.dataset.limit);
    btn.classList.toggle('active', btnLimit === currentLimit);
  }
}

/**
 * Показывает короткое уведомление о сохранении.
 * @param {string} text
 */
function showStatus(text) {
  statusMsg.textContent = text;
  setTimeout(() => {
    if (statusMsg.textContent === text) {
      statusMsg.textContent = '';
    }
  }, 2000);
}

async function init() {
  const currentLimit = await getContextLimit();
  input.value = String(currentLimit);
  syncActivePreset(currentLimit);

  for (const btn of presetButtons) {
    btn.addEventListener('click', async () => {
      const selected = Number(btn.dataset.limit);
      const saved = await setContextLimit(selected);
      input.value = String(saved);
      syncActivePreset(saved);
      showStatus(`Лимит обновлён: ${saved.toLocaleString('ru-RU')}`);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const saved = await setContextLimit(input.value);
    input.value = String(saved);
    syncActivePreset(saved);
    showStatus(`Сохранено: ${saved.toLocaleString('ru-RU')}`);
  });
}

init();