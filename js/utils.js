/**
 * @file utils.js
 * @description Shared utility functions for the ALY GYM frontend.
 */

// ==================== UI HELPERS ====================

export function initStaffName() {
  const input = document.getElementById('staffName');
  if (!input) return;

  const saved = localStorage.getItem('alyStaffName');
  if (saved) input.value = saved;

  input.addEventListener('input', (e) => {
    localStorage.setItem('alyStaffName', e.target.value.trim());
  });
}

export function getStaffName() {
  return document.getElementById('staffName')?.value.trim() || 'Lễ tân';
}

export function setButtonLoading(btnId, isLoading, text = 'Đang xử lý...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i>${text}`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

export function showLoading(id, msg = 'Đang xử lý...') {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = `
      <div class="flex items-center gap-2 text-blue-600">
        <i class="fas fa-spinner fa-spin"></i>
        <span class="text-[10px] font-bold uppercase">${msg}</span>
      </div>`;
  }
}

export function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="bg-green-100 text-green-800 p-3 rounded border border-green-300">✅ ${msg}</div>`;
}

export function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded border border-red-300">❌ ${msg}</div>`;
}

// ==================== TOAST ====================

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

// ==================== TAB & PAYMENT ====================

export function setActiveTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => {
    t.style.display = 'none';
    t.classList.remove('active');
  });

  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) {
    tab.style.display = 'block';
    tab.classList.add('active');
  }

  // Update nav buttons
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('bg-blue-700', 'text-white', 'bg-green-600', 'bg-orange-500');
    b.classList.add('bg-gray-200', 'text-gray-800');
  });

  const btn = Array.from(document.querySelectorAll('nav button'))
    .find(b => b.getAttribute('onclick')?.includes(tabName));
  if (btn) {
    if (tabName === 'revenue') btn.classList.add('bg-green-600', 'text-white');
    else if (tabName === 'alert') btn.classList.add('bg-orange-500', 'text-white');
    else btn.classList.add('bg-blue-700', 'text-white', 'shadow-sm');
  }

  // Trigger tab-specific actions
  if (tabName === 'alert' && typeof window.loadInactiveStudents === 'function') {
    window.loadInactiveStudents();
  }
  if (tabName === 'revenue' && typeof window.refreshDailyReport === 'function') {
    window.refreshDailyReport();
  }
}

export function setupPaymentBlock(cfg) {
  const statusEl = document.getElementById(cfg.statusId);
  const methodEl = document.getElementById(cfg.methodId);
  if (!statusEl || !methodEl) return;

  const splitEl = cfg.splitId ? document.getElementById(cfg.splitId) : null;
  const cashEl = cfg.cashId ? document.getElementById(cfg.cashId) : null;
  const transferEl = cfg.transferId ? document.getElementById(cfg.transferId) : null;
  const hintEl = cfg.hintId ? document.getElementById(cfg.hintId) : null;

  const getTotal = () => (typeof cfg.getTotal === 'function' ? cfg.getTotal() : 0);

  const updateHint = () => {
    const total = getTotal();
    const paid = (parseFloat(cashEl?.value) || 0) + (parseFloat(transferEl?.value) || 0);
    if (!hintEl) return;

    const debt = total - paid;
    if (statusEl.value === 'Chưa thanh toán') {
      hintEl.innerHTML = `Còn nợ: <span class="text-red-600 font-bold">${window.formatMoney(total, true)}</span>`;
      return;
    }
    if (debt > 0) hintEl.innerHTML = `Còn nợ: <span class="text-red-600 font-bold">${window.formatMoney(debt, true)}</span>`;
    else if (debt < 0) hintEl.innerHTML = `Dư: <span class="text-green-600 font-bold">${window.formatMoney(-debt, true)}</span>`;
    else hintEl.innerHTML = '<span class="text-green-600 font-bold">Đã đủ</span>';
  };

  const applyState = () => {
    if (statusEl.value === 'Chưa thanh toán') {
      methodEl.disabled = true;
      methodEl.value = '';
      if (splitEl) splitEl.classList.add('hidden');
      updateHint();
      return;
    }
    methodEl.disabled = false;
    if (!methodEl.value) methodEl.value = 'Tiền mặt';
    if (splitEl) splitEl.classList.toggle('hidden', methodEl.value !== 'Tiền mặt + Chuyển khoản');
    updateHint();
  };

  statusEl.addEventListener('change', applyState);
  methodEl.addEventListener('change', applyState);
  if (cashEl) cashEl.addEventListener('input', updateHint);
  if (transferEl) transferEl.addEventListener('input', updateHint);

  applyState();
}

// ==================== VALIDATION & FORMATTING ====================

export function validatePhone(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function escapeHtml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatPhoneNumber(p) {
  let s = String(p || '').replace(/\D/g, '');
  if (s.length === 10) return s.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  return s;
}

export function generatePTGroupId(tab = 'register') {
  const pkgSelect = document.getElementById(tab === 'renew' ? 'renewPackageCode' : 'packageCode');
  const code = pkgSelect?.value || 'PT';
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `GRP${code}_${date}_${rand}`;
}

// ==================== GLOBAL EXPOSURE (QUAN TRỌNG) ====================

// Export cho module import
export {
  showToast,
  setButtonLoading,
  showLoading,
  showSuccess,
  showError,
  setActiveTab,
  initStaffName,
  getStaffName,
  setupPaymentBlock,
  validatePhone,
  escapeHtml,
  formatPhoneNumber,
  generatePTGroupId
};

// Expose ra window để HTML onclick hoạt động
window.showToast = showToast;
window.setButtonLoading = setButtonLoading;
window.showLoading = showLoading;
window.showSuccess = showSuccess;
window.showError = showError;
window.setActiveTab = setActiveTab;
window.initStaffName = initStaffName;
window.getStaffName = getStaffName;
window.setupPaymentBlock = setupPaymentBlock;
window.validatePhone = validatePhone;
window.escapeHtml = escapeHtml;
window.formatPhoneNumber = formatPhoneNumber;
window.generatePTGroupId = generatePTGroupId;
