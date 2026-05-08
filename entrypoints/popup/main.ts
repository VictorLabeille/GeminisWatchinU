/**
 * Popup main.ts — Toggle Redacted mode on/off
 */

const toggle = document.getElementById('redacted-toggle') as HTMLInputElement;

// Load current state
chrome.storage.local.get('redactedEnabled').then((result) => {
  toggle.checked = result.redactedEnabled ?? true;
});

// Handle toggle
toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.runtime.sendMessage({ type: 'GWU_SET_REDACTED', enabled });
});

// Listen for external changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.redactedEnabled) {
    toggle.checked = changes.redactedEnabled.newValue;
  }
});

// ── Disable Logic ──────────────────────────────────────────

const btnDisable15m = document.getElementById('btn-disable-15m') as HTMLButtonElement;
const btnDisableAll = document.getElementById('btn-disable-all') as HTMLButtonElement;
const btnEnable = document.getElementById('btn-enable') as HTMLButtonElement;

function updateDisableUI(disabledUntil: number | undefined) {
  const now = Date.now();
  const isDisabled = disabledUntil === -1 || (disabledUntil && disabledUntil > now);

  if (isDisabled) {
    btnDisable15m.style.display = 'none';
    btnDisableAll.style.display = 'none';
    btnEnable.style.display = 'block';
    
    if (disabledUntil !== -1) {
      const minutesLeft = Math.ceil(((disabledUntil as number) - now) / 60000);
      btnEnable.textContent = `Réactiver (désactivé pour ${minutesLeft}m)`;
    } else {
      btnEnable.textContent = `Réactiver GeminisWatchinU`;
    }
  } else {
    btnDisable15m.style.display = 'block';
    btnDisableAll.style.display = 'block';
    btnEnable.style.display = 'none';
  }
}

chrome.storage.local.get('gwuDisabledUntil').then((result) => {
  updateDisableUI(result.gwuDisabledUntil);
});

async function setDisabledState(disabledUntil: number | undefined) {
  await chrome.storage.local.set({ gwuDisabledUntil: disabledUntil });
  updateDisableUI(disabledUntil);
  chrome.runtime.sendMessage({ type: 'GWU_RELOAD_TABS' });
}

btnDisable15m.addEventListener('click', () => {
  setDisabledState(Date.now() + 15 * 60 * 1000);
});

btnDisableAll.addEventListener('click', () => {
  setDisabledState(-1);
});

btnEnable.addEventListener('click', () => {
  setDisabledState(0);
});
