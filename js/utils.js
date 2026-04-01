/**
 * @file utils.js
 * @description UI helpers, notifications, and shared formatting logic.
 */

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

export function showLoading(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="flex items-center gap-2 text-blue-600 animate-pulse"><i class="fas fa-spinner fa-spin"></i><span class="text-[10px] font-bold uppercase">${msg}</span></div>`;
}

export function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="flex items-center gap-2 text-green-600 animate-in fade-in"><i class="fas fa-check-circle"></i><span class="text-[10px] font-bold uppercase">${msg}</span></div>`;
}

export function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="flex items-center gap-2 text-red-600 animate-in shake"><i class="fas fa-exclamation-circle"></i><span class="text-[10px] font-bold uppercase">${msg}</span></div>`;
}

export function setActiveTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('bg-blue-700', 'text-white', 'shadow-sm', 'bg-green-600', 'bg-orange-500');
    b.classList.add('bg-gray-200', 'text-gray-800');
  });

  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) tab.classList.add('active');

  const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.getAttribute('onclick').includes(tabName));
  if (btn) {
    btn.classList.remove('bg-gray-200', 'text-gray-800');
    if (tabName === 'revenue') btn.classList.add('bg-green-600', 'text-white');
    else if (tabName === 'alert') btn.classList.add('bg-orange-500', 'text-white');
    else btn.classList.add('bg-blue-700', 'text-white', 'shadow-sm');
  }
}

export function initStaffName() {
  const saved = localStorage.getItem('alyStaffName');
  const input = document.getElementById('staffName');
  if (input) {
    if (saved) input.value = saved;
    input.addEventListener('input', (e) => localStorage.setItem('alyStaffName', e.target.value));
  }
}

export function getStaffName() {
  return document.getElementById('staffName')?.value || 'Lễ tân';
}

export function escapeHtml(unsafe) {
  return unsafe?.toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m])) || '';
}

export function formatPhoneNumber(p) {
  p = p?.toString().replace(/\D/g, '') || '';
  if (p.length === 10) return p.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  return p;
}

export function generatePTGroupId(tab = 'register') {
  const pkgSelect = document.getElementById(tab === 'renew' ? 'renewPackageCode' : (tab === 'pending' ? 'pendingPackageCode' : 'packageCode'));
  const code = pkgSelect?.value || 'PT';
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `GRP${code}_${date}_${rand}`;
}

export function handleSearchSuggestions(input, tab) {
  const query = input.value.trim().toLowerCase();
  const box = document.getElementById(`${tab}SearchSuggestions`);
  if (!box || query.length < 2) { box?.classList.add('hidden'); return; }

  const matches = (window.__allStudentsCache || []).filter(s => 
    s.fullName.toLowerCase().includes(query) || s.studentId.toLowerCase().includes(query) || s.phone.includes(query)
  ).slice(0, 10);

  if (matches.length === 0) { box.classList.add('hidden'); return; }

  box.innerHTML = matches.map(s => `
    <div onclick="selectSearchSuggestion('${s.studentId}', '${tab}')" class="p-3 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
      <div>
        <div class="text-xs font-black text-gray-800 uppercase">${escapeHtml(s.fullName)}</div>
        <div class="text-[9px] font-bold text-blue-600">${s.studentId} - ${formatPhoneNumber(s.phone)}</div>
      </div>
      <i class="fas fa-chevron-right text-gray-300 text-[10px]"></i>
    </div>
  `).join('');
  box.classList.remove('hidden');
}

export function selectSearchSuggestion(id, tab) {
  const input = document.getElementById(tab === 'renew' ? 'searchStudentId' : 'pendingSearchStudentId');
  if (input) input.value = id;
  document.getElementById(`${tab}SearchSuggestions`)?.classList.add('hidden');
  if (tab === 'renew') window.searchStudentForRenew();
  else if (tab === 'pending') window.searchStudentForPending();
}

// Global exposure
window.setActiveTab = setActiveTab;
window.handleSearchSuggestions = handleSearchSuggestions;
window.selectSearchSuggestion = selectSearchSuggestion;
window.generatePTGroupId = generatePTGroupId;
window.showToast = showToast;