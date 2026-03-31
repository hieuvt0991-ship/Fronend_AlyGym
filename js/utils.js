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

export function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (el && el.value && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(el.value).then(() => {
      el.classList.add('ring-2','ring-green-500');
      setTimeout(() => { el.classList.remove('ring-2','ring-green-500'); }, 1200);
    }).catch(()=>{});
  }
}

export function pasteText(elementId) {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(t => {
      const el = document.getElementById(elementId);
      if (el) {
        el.value = (t || '').trim();
        el.classList.add('ring-2','ring-blue-500');
        setTimeout(() => { el.classList.remove('ring-2','ring-blue-500'); }, 1200);
        // Trigger change event for any listeners
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }).catch(()=>{});
  }
}

export function generatePTGroupId(tab = 'register') {
  const packageCode = document.getElementById(tab === 'renew' ? 'renewPackageCode' : 'packageCode')?.value || 'PKG';
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}${mm}${yyyy}`;
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-4);
  
  return `${packageCode}_${dateStr}_${rand}`;
}

export function handleSearchSuggestions(inputEl, tab) {
  const query = inputEl.value.trim().toLowerCase();
  const suggestionBox = document.getElementById(`${tab}SearchSuggestions`);
  
  if (query.length < 1) {
    if (suggestionBox) suggestionBox.classList.add('hidden');
    return;
  }

  const matches = (window.__allStudentsCache || []).filter(s => 
    s.id.toLowerCase().includes(query) || 
    s.name.toLowerCase().includes(query) || 
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
  
  // Auto trigger search
  if (tab === 'renew' && typeof window.searchStudentForRenew === 'function') window.searchStudentForRenew();
  if (tab === 'pending' && typeof window.searchStudentForPending === 'function') window.searchStudentForPending();
}

export function setupPaymentBlock(cfg) {
  const statusEl = document.getElementById(cfg.statusId);
  const methodEl = document.getElementById(cfg.methodId);
  if (!statusEl || !methodEl) return;

  const splitEl = cfg.splitId ? document.getElementById(cfg.splitId) : null;
  const cashEl = cfg.cashId ? document.getElementById(cfg.cashId) : null;
  const transferEl = cfg.transferId ? document.getElementById(cfg.transferId) : null;
  const hintEl = cfg.hintId ? document.getElementById(cfg.hintId) : null;

  const getTotal = () => {
    if (typeof cfg.getTotal === 'function') return cfg.getTotal();
    return 0;
  };

  const parseVnd = (text) => Number(String(text || '').replace(/[^0-9]/g, '')) || 0;

  const updateHint = () => {
    const total = getTotal();
    const paid = parseVnd(cashEl?.value) + parseVnd(transferEl?.value);
    if (!hintEl) return;
    
    const debt = total - paid;
    if (statusEl.value === 'Chưa thanh toán') {
      hintEl.textContent = total > 0 ? `Còn nợ: ${window.formatMoney(total, true)}` : '';
      hintEl.className = "text-[10px] font-bold text-red-500 mt-1";
      return;
    }
    if (paid <= 0) {
      hintEl.textContent = '';
      return;
    }
    if (debt > 0) {
      hintEl.textContent = `Còn nợ: ${window.formatMoney(debt, true)}`;
      hintEl.className = "text-[10px] font-bold text-orange-500 mt-1";
    } else if (debt < 0) {
      hintEl.textContent = `Dư: ${window.formatMoney(-debt, true)}`;
      hintEl.className = "text-[10px] font-bold text-blue-500 mt-1";
    } else {
      hintEl.textContent = 'Đã đủ';
      hintEl.className = "text-[10px] font-bold text-green-500 mt-1";
    }
  };

  const applyState = () => {
    const status = statusEl.value;
    if (status === 'Chưa thanh toán') {
      methodEl.value = '';
      methodEl.disabled = true;
      if (splitEl) splitEl.classList.add('hidden');
      updateHint();
      return;
    }
    methodEl.disabled = false;
    if (!methodEl.value) methodEl.value = 'Tiền mặt';
    if (splitEl) {
      const isSplit = methodEl.value === 'Tiền mặt + Chuyển khoản';
      splitEl.classList.toggle('hidden', !isSplit);
    }
    updateHint();
  };

  statusEl.addEventListener('change', applyState);
  methodEl.addEventListener('change', applyState);
  if (cashEl) cashEl.addEventListener('input', updateHint);
  if (transferEl) transferEl.addEventListener('input', updateHint);

  // Expose updateHint to be called externally if total changes
  cfg.onInit?.(updateHint);
  applyState();
}

// Global exposure for HTML onclick
window.setActiveTab = setActiveTab;
window.getStaffName = getStaffName;
window.setButtonLoading = setButtonLoading;
window.initStaffName = initStaffName;
window.copyText = copyText;
window.pasteText = pasteText;
window.generatePTGroupId = generatePTGroupId;
window.handleSearchSuggestions = handleSearchSuggestions;
window.selectSearchSuggestion = selectSearchSuggestion;
window.setupPaymentBlock = setupPaymentBlock;
