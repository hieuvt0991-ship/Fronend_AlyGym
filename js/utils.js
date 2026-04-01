/**
 * @file utils.js
 * @description Shared utility functions for UI, formatting, and the toast notification system.
 */

// =================================================================
// TOAST NOTIFICATION SYSTEM
// =================================================================

/**
 * Hiển thị thông báo Toast.
 * @param {string} message - Nội dung thông báo.
 * @param {string} type - Loại thông báo: 'success', 'error', 'info', 'warning'.
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon mapping
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas ${icons[type] || icons.info} text-lg"></i>
      <div class="flex-grow font-bold">${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white opacity-50 hover:opacity-100 transition-opacity">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  container.appendChild(toast);

  // Tự động xóa sau 4 giây
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => toast.remove(), 500);
    }
  }, 4000);
}

// Global exposure for callAPI or other non-module scripts
window.showErrorNotification = (msg) => showToast(msg, 'error');
window.showSuccessNotification = (msg) => showToast(msg, 'success');

// =================================================================
// UI HELPERS (Loading, Tabs, Buttons)
// =================================================================

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

export function showLoading(elementId, message = 'Đang tải...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 flex items-center justify-center gap-3 italic text-sm animate-pulse">
        <i class="fas fa-circle-notch fa-spin"></i>
        ${message}
      </div>
    `;
  }
}

export function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-xl border border-green-300 font-bold">✅ ${message}</div>`;
  }
  showToast(message, 'success');
}

export function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="bg-red-100 text-red-800 p-4 rounded-xl border border-red-300 font-bold">❌ ${message}</div>`;
  }
  showToast(message, 'error');
}

export function setActiveTab(tabId) {
  // 1. Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  // 2. Show the selected tab content
  const targetTab = document.getElementById(tabId + 'Tab');
  if (targetTab) {
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
  }

  // 3. Update navigation button styles
  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.classList.remove('bg-blue-700', 'text-white', 'shadow-sm');
    btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
  });
  
  // 4. Highlight the active button
  const buttons = document.querySelectorAll('.tabs button');
  buttons.forEach(btn => {
    const onclickStr = btn.getAttribute('onclick') || '';
    if (onclickStr.includes(`setActiveTab('${tabId}')`)) {
      btn.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
      btn.classList.add('bg-blue-700', 'text-white', 'shadow-sm');
    }
  });

  // 5. Trigger tab-specific initialization
  if (tabId === 'alert' && typeof window.loadInactiveStudents === 'function') {
    window.loadInactiveStudents();
  }
  if (tabId === 'revenue' && typeof window.refreshDailyReport === 'function') {
    window.refreshDailyReport();
  }
}

export function initStaffName() {
  const el = document.getElementById('staffName');
  if (!el) return;
  const stored = localStorage.getItem('aly_staff');
  if (stored) el.value = stored;
  el.addEventListener('change', () => localStorage.setItem('aly_staff', el.value.trim()));
}

export function getStaffName() {
  return document.getElementById('staffName')?.value.trim() || 'Lễ tân';
}

// =================================================================
// FORMATTING & VALIDATION
// =================================================================

export function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(String(phone || '').replace(/\D/g, ''));
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

export function escapeHtml(str) {
  return String(str || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// =================================================================
// SEARCH & SUGGESTIONS
// =================================================================

export function handleSearchSuggestions(inputEl, tab) {
  const query = inputEl.value.trim().toLowerCase();
  const suggestionBox = document.getElementById(`${tab}SearchSuggestions`);
  if (!suggestionBox) return;

  if (query.length < 1) {
    suggestionBox.classList.add('hidden');
    return;
  }

  const matches = (window.__allStudentsCache || []).filter(s => 
    (s.id && s.id.toLowerCase().includes(query)) || 
    (s.name && s.name.toLowerCase().includes(query)) || 
    (s.phone && s.phone.includes(query))
  ).slice(0, 15);

  if (matches.length > 0) {
    suggestionBox.innerHTML = matches.map(s => `
      <div class="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors" onclick="selectSearchSuggestion('${s.id}', '${tab}')">
        <div class="flex justify-between items-center">
          <div class="font-black text-xs text-blue-900">${escapeHtml(s.name)}</div>
          <div class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">${s.id}</div>
        </div>
        <div class="text-[10px] text-gray-500 mt-0.5 flex gap-2">
          <span><i class="fas fa-phone-alt mr-1"></i>${s.phone || 'N/A'}</span>
          ${s.package ? `<span class="text-orange-600 font-bold"><i class="fas fa-box mr-1"></i>${s.package}</span>` : ''}
        </div>
      </div>
    `).join('');
    suggestionBox.classList.remove('hidden');
  } else {
    suggestionBox.classList.add('hidden');
  }
}

export function selectSearchSuggestion(id, tab) {
  const inputEl = document.getElementById(tab === 'renew' ? 'searchStudentId' : 'pendingSearchStudentId');
  const suggestionBox = document.getElementById(`${tab}SearchSuggestions`);
  if (inputEl) inputEl.value = id;
  if (suggestionBox) suggestionBox.classList.add('hidden');
  
  if (tab === 'renew' && typeof window.searchStudentForRenew === 'function') window.searchStudentForRenew();
  if (tab === 'pending' && typeof window.searchStudentForPending === 'function') window.searchStudentForPending();
}

// =================================================================
// PT GROUP & OTHERS
// =================================================================

export function generatePTGroupId(tab = 'register') {
  const packageSelect = document.getElementById(tab === 'renew' ? 'renewPackageCode' : (tab === 'pending' ? 'pendingPackageCode' : 'packageCode'));
  const packageCode = packageSelect?.value || 'PKG';
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}${mm}${yyyy}`;
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-4);
  return `${packageCode}_${dateStr}_${rand}`;
}

export function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (el && el.value && navigator.clipboard) {
    navigator.clipboard.writeText(el.value).then(() => {
      showToast('Đã sao chép!', 'success');
      el.classList.add('ring-2','ring-green-500');
      setTimeout(() => el.classList.remove('ring-2','ring-green-500'), 1200);
    }).catch(()=>{});
  }
}

export function pasteText(elementId) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(t => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = (t || '').trim();
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        showToast('Đã dán!', 'info');
      }
    }).catch(()=>{});
  }
}

// Global exposure
window.setActiveTab = setActiveTab;
window.initStaffName = initStaffName;
window.getStaffName = getStaffName;
window.setButtonLoading = setButtonLoading;
window.showToast = showToast;
window.generatePTGroupId = generatePTGroupId;
window.handleSearchSuggestions = handleSearchSuggestions;
window.selectSearchSuggestion = selectSearchSuggestion;
window.copyText = copyText;
window.pasteText = pasteText;
