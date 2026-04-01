/**
 * @file utils.js
 * @description Shared utilities - SINGLE SOURCE OF TRUTH
 */

// ==================== UI HELPERS ====================
export function initStaffName() {
  const input = document.getElementById('staffName');
  if (!input) return;
  const saved = localStorage.getItem('alyStaffName');
  if (saved) input.value = saved;
  input.addEventListener('input', e => localStorage.setItem('alyStaffName', e.target.value.trim()));
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
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

export function showLoading(id, msg = 'Đang xử lý...') {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="flex items-center gap-2 text-blue-600 animate-pulse"><i class="fas fa-spinner fa-spin"></i><span>${msg}</span></div>`;
}

export function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="bg-green-100 text-green-800 p-3 rounded border border-green-300">✅ ${msg}</div>`;
}

export function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded border border-red-300">❌ ${msg}</div>`;
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'fadeOut 0.5s forwards'; setTimeout(() => toast.remove(), 500); }, 3500);
}

// ==================== VALIDATION & FORMATTING ====================
export function validatePhone(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]));
}

export function formatPhoneNumber(p) {
  let s = String(p || '').replace(/\D/g, '');
  if (s.length === 10) return s.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  return s;
}

export function generatePTGroupId(tab = 'register') {
  const code = 'PT';
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `GRP${code}_${date}_${rand}`;
}

// ==================== GLOBAL EXPOSURE (QUAN TRỌNG NHẤT) ====================
export {
  showToast, setButtonLoading, showLoading, showSuccess, showError,
  initStaffName, getStaffName, validatePhone, escapeHtml,
  formatPhoneNumber, generatePTGroupId
};

// Expose ra window để HTML onclick hoạt động
window.showToast = showToast;
window.setButtonLoading = setButtonLoading;
window.showLoading = showLoading;
window.showSuccess = showSuccess;
window.showError = showError;
window.initStaffName = initStaffName;
window.getStaffName = getStaffName;
window.validatePhone = validatePhone;
window.escapeHtml = escapeHtml;
window.formatPhoneNumber = formatPhoneNumber;
window.generatePTGroupId = generatePTGroupId;