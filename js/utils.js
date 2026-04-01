/**
 * @file utils.js
 * @description Shared utility functions for UI, formatting, and the toast notification system.
 */

// =================================================================
// TOAST NOTIFICATION SYSTEM
// =================================================================

/**
 * Hiển thị thông báo Toast.
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
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

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => toast.remove(), 500);
    }
  }, 4000);
}

// Global exposure
window.showErrorNotification = (msg) => showToast(msg, 'error');
window.showSuccessNotification = (msg) => showToast(msg, 'success');
window.generatePTGroupId = generatePTGroupId;
window.setActiveTab = setActiveTab;
window.selectSearchSuggestion = selectSearchSuggestion;
window.handleSearchSuggestions = handleSearchSuggestions;
window.copyText = copyText;

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
    element.innerHTML = `<div class="bg-green-100 text-green-800 p-4 rounded-xl border border-green-300 font-bold">✅ Thành công ${message}</div>`;
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
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
    tab.classList.remove('active');
  });
  
  const targetTab = document.getElementById(tabId + 'Tab');
  if (targetTab) {
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
  }

  document.querySelectorAll('.tabs button').forEach(btn => {
    btn.classList.remove('bg-blue-700', 'text-white', 'shadow-sm');
    btn.classList.add('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
  });
  
  const buttons = document.querySelectorAll('.tabs button');
  buttons.forEach(btn => {
    const onclickStr = btn.getAttribute('onclick') || '';
    if (onclickStr.includes(`setActiveTab('${tabId}')`)) {
      btn.classList.remove('bg-gray-200', 'text-gray-800', 'hover:bg-gray-300');
      btn.classList.add('bg-blue-700', 'text-white', 'shadow-sm');
    }
  });

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
  
  const save = () => {
    const v = el.value.trim();
    localStorage.setItem('aly_staff', v);
    syncStaffToForms(v);
  };
  el.addEventListener('change', save);
  el.addEventListener('blur', save);
  syncStaffToForms(el.value.trim());
}

function syncStaffToForms(name) {
  const v = name || 'Lễ tân';
  ['revStaff', 'revUpdateStaff'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const cur = el.value.trim();
      if (!cur || cur === 'Lễ tân') el.value = v;
    }
  });
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

export function toDateInputValue(date) {
  if (!date || isNaN(new Date(date).getTime())) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const packageCode = packageSelect?.value || '';
  if (!packageCode) return '';

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  
  // Logic khớp với GAS: GRP + packageCode + _ + yyyyMMdd + _ + RAND
  return `GRP${packageCode}_${dateStr}_${rand}`;
}

export function copyText(elementId) {
  const el = document.getElementById(elementId);
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : null;
  if (el && el.value && navigator.clipboard) {
    navigator.clipboard.writeText(el.value).then(() => {
      showToast('Đã sao chép!', 'success');
      if (btn) {
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 1200);
      }
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

/**
 * Tính ngày kết thúc dựa trên gói tập và ngày bắt đầu
 */
export function calculateEndDate(startDateStr, packageCode) {
  if (!startDateStr || !packageCode) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  const pkg = (window.packages || []).find(p => p.code === packageCode);
  if (!pkg) return null;

  const months = pkg.months || 1;
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  end.setDate(end.getDate() - 1);
  return end;
}

/**
 * Kiểm tra và áp dụng khuyến mãi tại client
 */
export function getClientPromotionDetails(packageCode, originalPrice, trainingType) {
  if (!window.currentPromotion || !window.currentPromotion.isActive || !window.currentPromotion.promotions) {
    return { isEligible: false, originalPrice: originalPrice };
  }

  const promo = window.currentPromotion.promotions.find(p => {
    if (p.packageCode !== packageCode) return false;
    
    const pType = String(p.type || '').toLowerCase();
    const aType = String(trainingType || '').toLowerCase();
    if (pType === aType) return true;
    if (pType.includes('nonpt') && (aType.includes('nonpt') || aType === 'nonpt')) return true;
    if (pType.includes('pt') && (aType.includes('pt') || aType.startsWith('pt'))) return true;
    return false;
  });

  if (!promo) {
    return { isEligible: false, originalPrice: originalPrice };
  }

  return {
    isEligible: true,
    message: promo.description,
    originalPrice: originalPrice,
    finalPrice: promo.discountedPrice || originalPrice,
    description: promo.description,
    startDate: promo.startDate,
    endDate: promo.endDate
  };
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
window.toDateInputValue = toDateInputValue;
window.calculateEndDate = calculateEndDate;
window.getClientPromotionDetails = getClientPromotionDetails;
window.formatDDMMYYYY = formatDDMMYYYY;
window.escapeHtml = escapeHtml;
window.validatePhone = validatePhone;
window.formatPhoneNumber = formatPhoneNumber;
