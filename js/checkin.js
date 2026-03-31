/**
 * @file checkin.js
 * @description Logic for the check-in tab.
 */

import { apiRunner } from './api.js';
import { showLoading, showError, escapeHtml, formatPhoneNumber, getStaffName, setButtonLoading } from './utils.js';

export function handleManualCheckIn() {
  const input = document.getElementById('manualInput')?.value.trim() || '';
  if (!input) {
    showError('checkInNotification', 'Vui lòng nhập mã HV, SĐT hoặc tên');
    return;
  }
  submitCheckInCaller(input, 'manual');
}

let __searchTimeout = null;
export function handleManualInputSearch(inputEl) {
  const query = inputEl.value.trim().toLowerCase();
  const suggestionBox = document.getElementById('manualInputSuggestions');
  
  if (query.length < 2) {
    if (suggestionBox) suggestionBox.classList.add('hidden');
    return;
  }

  clearTimeout(__searchTimeout);
  __searchTimeout = setTimeout(() => {
    const matches = (window.__allStudentsCache || []).filter(s => 
      s.id.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query) || 
      (s.phone && s.phone.includes(query))
    ).slice(0, 10);

    if (matches.length > 0) {
      suggestionBox.innerHTML = matches.map(s => `
        <div class="p-2 hover:bg-blue-100 cursor-pointer border-b last:border-0" onclick="selectStudentSuggestion('${s.id}', '${s.name.replace(/'/g, "\\'")}')">
          <div class="font-bold text-sm">${s.name}</div>
          <div class="text-xs text-gray-500">${s.id} ${s.phone ? ' - ' + s.phone : ''}</div>
        </div>
      `).join('');
      suggestionBox.classList.remove('hidden');
    } else {
      suggestionBox.classList.add('hidden');
    }
  }, 200);
}

export function selectStudentSuggestion(id, name) {
  const inputEl = document.getElementById('manualInput');
  const suggestionBox = document.getElementById('manualInputSuggestions');
  if (inputEl) inputEl.value = id;
  if (suggestionBox) suggestionBox.classList.add('hidden');
  
  const trainingTypeEl = document.getElementById('checkinTrainingType');
  if (trainingTypeEl) {
    if (id.startsWith('APT')) trainingTypeEl.value = 'PT';
    else if (id.startsWith('AG')) trainingTypeEl.value = 'NonPT';
  }
}

export function submitCheckInCaller(input, source = 'manual') {
  const notificationEl = document.getElementById('checkInNotification');
  if (!notificationEl) return;
  
  const doneEarly = () => {
    try { setButtonLoading('checkInButton', false); } catch (e) {}
    try { if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false; } catch (e) {}
  };

  const setTrainingTypeSelectValue = (value) => {
    const el = document.getElementById('checkinTrainingType');
    if (!el) return;
    el.value = value;
    try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
  };

  const showAptTrainingTypePrompt = (code) => {
    window.__pendingAptQrCode = String(code || '').toUpperCase().trim();
    notificationEl.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl space-y-3 shadow-sm">
        <div class="font-black text-xs uppercase tracking-widest text-yellow-600">Lựa chọn hình thức tập</div>
        <div class="text-sm font-bold">Mã HV: <span class="text-blue-600">${escapeHtml(window.__pendingAptQrCode)}</span></div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" id="aptChoosePT" class="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-xs uppercase transition-all">Tập có HLV (PT)</button>
          <button type="button" id="aptChooseOut" class="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-bold text-xs uppercase transition-all">Tự tập ngoài giờ</button>
          <button type="button" id="aptChooseCancel" class="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-bold text-xs uppercase transition-all">Hủy</button>
        </div>
      </div>
    `;
    
    document.getElementById('aptChoosePT').onclick = () => applyChoice('PT');
    document.getElementById('aptChooseOut').onclick = () => applyChoice('OutOfHours');
    document.getElementById('aptChooseCancel').onclick = () => { window.__pendingAptQrCode = null; notificationEl.innerHTML = ''; };

    const applyChoice = (type) => {
      const pending = window.__pendingAptQrCode;
      window.__pendingAptQrCode = null;
      setTrainingTypeSelectValue(type);
      submitCheckInCaller(pending, 'qr');
    };
  };

  const upperInput = (input || '').toUpperCase().trim();
  let trainingType = document.getElementById('checkinTrainingType')?.value || '';

  if (!trainingType) {
    if (source === 'qr' && /^AG\d{3,}$/i.test(upperInput)) {
      setTrainingTypeSelectValue('NonPT');
      trainingType = 'NonPT';
    } else if (source === 'qr' && /^APT\d{3,}$/i.test(upperInput)) {
      doneEarly();
      showAptTrainingTypePrompt(upperInput);
      return;
    } else {
      showError('checkInNotification', 'Vui lòng chọn hình thức tập trước khi điểm danh');
      doneEarly();
      return;
    }
  }

  if (source === 'qr' && /^AG\d{3,}$/i.test(upperInput) && trainingType !== 'NonPT') {
    setTrainingTypeSelectValue('NonPT');
    trainingType = 'NonPT';
  }
  
  if (source === 'qr' && /^APT\d{3,}$/i.test(upperInput) && (!trainingType || trainingType === 'NonPT')) {
    doneEarly();
    showAptTrainingTypePrompt(upperInput);
    return;
  }

  setButtonLoading('checkInButton', true, 'Đang xử lý...');
  showLoading('checkInNotification', 'Đang thực hiện điểm danh...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('checkInButton', false);
      renderCheckInResult(result);
      if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false;
    })
    .withFailureHandler(err => {
      setButtonLoading('checkInButton', false);
      showError('checkInNotification', err.message || err);
      if (window.qrScanner && window.qrScanner.__processing) window.qrScanner.__processing = false;
    })
    .submitCheckIn({
      studentId: input,
      trainingType,
      staff: getStaffName()
    });
}

function renderCheckInResult(result) {
  const box = document.getElementById('checkInNotification');
  if (!box) return;
  
  if (result.error) {
    showError('checkInNotification', result.error);
    return;
  }

  const maHV = result.maHV || result.studentId || '';
  const hoTen = result.hoTen || result.fullName || '';
  const sdt = formatPhoneNumber(result.sdt || result.phone || '');
  const goi = result.goi || result.packageCode || '';
  const lastCheck = result.lastCheck || 'Chưa có';
  const remain = (result.remain != null) ? result.remain : '0';
  const warnings = Array.isArray(result.warnings) ? result.warnings : (result.warnings ? String(result.warnings).split('||') : []);
  const status = result.status || '';

  const warnHtml = warnings.filter(Boolean).map(w => `<li class="mb-1">⚠️ ${escapeHtml(String(w))}</li>`).join('');
  let statusBanner = '';
  if (status === 'checkedToday') statusBanner = '<div class="bg-yellow-100 text-yellow-800 p-2 rounded-lg mb-2 font-bold text-[10px] text-center uppercase">✅ Đã điểm danh hôm nay</div>';
  if (status === 'expired') statusBanner = '<div class="bg-red-100 text-red-800 p-2 rounded-lg mb-2 font-bold text-[10px] text-center uppercase">⛔ Gói đã hết hạn / không hợp lệ</div>';
  
  let renewActions = '';
  if ((status === 'expired' || Number(remain) <= 2) && maHV) {
    renewActions = `
      <div class="mt-3">
        <button type="button" onclick="goToRenewFromCheckIn('${encodeURIComponent(maHV)}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-black text-[10px] uppercase shadow-md transition-all active:scale-95">Gia hạn ngay</button>
      </div>
    `;
  }

  box.innerHTML = `
    <div class="w-full bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm animate-in fade-in zoom-in duration-300">
      ${statusBanner}
      <div class="flex items-center gap-3 mb-3 border-b border-green-100 pb-2">
        <div class="bg-green-500 text-white p-2 rounded-full shadow-sm"><i class="fas fa-check"></i></div>
        <div class="text-green-800 font-black text-sm uppercase tracking-tight">${result.message || 'Thành công!'}</div>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-left">
        <div class="space-y-1">
          <span class="text-[10px] font-bold text-gray-400 uppercase block">Học viên</span>
          <div class="font-black text-gray-800 truncate">${escapeHtml(hoTen)}</div>
          <div class="text-blue-600 font-bold">${escapeHtml(maHV)}</div>
        </div>
        <div class="space-y-1 text-right">
          <span class="text-[10px] font-bold text-gray-400 uppercase block text-right">Gói tập</span>
          <div class="font-bold text-gray-700 truncate">${escapeHtml(goi)}</div>
          <div class="text-orange-600 font-black">CÒN: ${remain} BUỔI</div>
        </div>
        <div class="col-span-2 pt-2 border-t border-green-100 mt-1">
          <div class="flex justify-between items-center text-[10px] mb-1">
            <span class="font-bold text-gray-400 uppercase">Hình thức:</span>
            <span class="font-black text-blue-700">${escapeHtml(result.hinhThucTap || result.trainingType || 'Tự tập')}</span>
          </div>
          <div class="flex justify-between items-center text-[10px] mb-1">
            <span class="font-bold text-gray-400 uppercase">Hạn dùng:</span>
            <span class="font-black text-gray-700">${escapeHtml(result.endDate || 'N/A')}</span>
          </div>
          <div class="flex justify-between items-center text-[10px] mb-1">
            <span class="font-bold text-gray-400 uppercase">Lần cuối:</span>
            <span class="font-black text-gray-700">${escapeHtml(lastCheck)}</span>
          </div>
          <div class="flex justify-between items-center text-[10px]">
            <span class="font-bold text-gray-400 uppercase">Liên hệ:</span>
            <span class="font-black text-gray-700">${escapeHtml(sdt)}</span>
          </div>
        </div>
        ${warnHtml ? `<div class="col-span-2 text-[9px] text-red-600 font-bold mt-2"><ul class="list-none">${warnHtml}</ul></div>` : ''}
      </div>
      ${renewActions}
    </div>
  `;
}

export function goToRenewFromCheckIn(studentId) {
  const id = decodeURIComponent(studentId);
  window.setActiveTab('renew');
  const searchInput = document.getElementById('searchStudentId');
  if (searchInput) {
    searchInput.value = id;
    if (typeof window.searchStudentForRenew === 'function') {
      setTimeout(() => window.searchStudentForRenew(), 100);
    }
  }
}

window.goToRenewFromCheckIn = goToRenewFromCheckIn;

// Global exposure
window.handleManualCheckIn = handleManualCheckIn;
window.handleManualInputSearch = handleManualInputSearch;
window.selectStudentSuggestion = selectStudentSuggestion;
window.submitCheckInCaller = submitCheckInCaller;
