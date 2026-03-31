/**
 * @file utils.js
 * @description Shared utility functions for the ALY GYM frontend.
 */

// UI Helper Functions
export function initStaffName() {
  const el = document.getElementById('staffName');
  if (!el) return;
  
  const stored = localStorage.getItem('aly_staff');
  if (stored) el.value = stored;

  el.addEventListener('change', () => {
    localStorage.setItem('aly_staff', el.value.trim());
  });
}

export function getStaffName() {
  return document.getElementById('staffName')?.value.trim() || 'Lễ tân';
}

export function setButtonLoading(buttonId, isLoading, loadingText = 'Đang xử lý...') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

export function showLoading(elementId, message = 'Đang xử lý...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-yellow-100 text-yellow-800 p-3 rounded flex items-center gap-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
      ${message}
    </div>`;
  }
}

export function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-green-100 text-green-800 p-3 rounded border border-green-300">✅ ${message}</div>`;
  }
}

export function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-red-100 text-red-800 p-3 rounded border border-red-300">❌ ${message}</div>`;
  }
}

// Validation & Formatting
export function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(String(phone || '').replace(/\D/g, ''));
}

export function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleanPhone = String(phone).trim().replace(/\D/g, '');
  if (cleanPhone.length === 9) cleanPhone = '0' + cleanPhone;
  if (cleanPhone.startsWith('84') && cleanPhone.length === 11) cleanPhone = '0' + cleanPhone.substring(2);
  return cleanPhone;
}

export function formatDDMMYYYY(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v)) {
    const d = String(v.getDate()).padStart(2,'0');
    const m = String(v.getMonth()+1).padStart(2,'0');
    const y = v.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(v);
  if (s.includes('/')) return s;
  const dObj = new Date(s);
  if (!isNaN(dObj.getTime())) {
    const d = String(dObj.getDate()).padStart(2,'0');
    const m = String(dObj.getMonth()+1).padStart(2,'0');
    const y = dObj.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return s;
}

// Tab Management
export function setActiveTab(tabId) {
  // Hide all sections
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  // Show target section
  const targetTab = document.getElementById(tabId + 'Tab');
  if (targetTab) {
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
  }

  // Update button styles
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.classList.remove('bg-blue-700', 'text-white');
    btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
  });
  
  // Find button by onclick attribute (handle both simple and complex matches)
  const buttons = document.querySelectorAll('.tabs button');
  buttons.forEach(btn => {
    const onclickStr = btn.getAttribute('onclick') || '';
    if (onclickStr.includes(`setActiveTab('${tabId}')`)) {
      btn.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
      btn.classList.add('bg-blue-700', 'text-white');
    }
  });

  // Trigger tab-specific loads
  if (tabId === 'alert' && typeof window.loadInactiveStudents === 'function') {
    window.loadInactiveStudents();
  }
  if (tabId === 'revenue' && typeof window.refreshDailyReport === 'function') {
    window.refreshDailyReport();
  }
}

// Global exposure for HTML onclick
window.setActiveTab = setActiveTab;
window.getStaffName = getStaffName;
window.setButtonLoading = setButtonLoading;
window.initStaffName = initStaffName;
