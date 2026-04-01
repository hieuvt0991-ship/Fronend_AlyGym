/**
 * @file checkin.js
 * @description Logic for student attendance (manual and QR) with full global exposure and API integration.
 */

import { apiRunner } from './api.js';
import { 
  showLoading, showError, escapeHtml, formatPhoneNumber, 
  getStaffName, setButtonLoading, showToast 
} from './utils.js';
import { parseMoney } from './money.js';

// =================================================================
// MANUAL SEARCH & SUGGESTIONS
// =================================================================

let __searchTimeout = null;

/**
 * Xử lý nhập thủ công và gợi ý học viên.
 */
export function handleManualInputSearch(inputEl) {
  const query = inputEl.value.trim().toLowerCase();
  const suggestionBox = document.getElementById('manualInputSuggestions');
  
  if (query.length < 2) {
    if (suggestionBox) suggestionBox.classList.add('hidden');
    refreshPtSinglePayEligibility();
    return;
  }

  clearTimeout(__searchTimeout);
  __searchTimeout = setTimeout(() => {
    const matches = (window.__allStudentsCache || []).filter(s => 
      (s.id && s.id.toLowerCase().includes(query)) || 
      (s.name && s.name.toLowerCase().includes(query)) || 
      (s.phone && s.phone.includes(query))
    ).slice(0, 10);

    if (matches.length > 0) {
      suggestionBox.innerHTML = matches.map(s => `
        <div class="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors" onclick="selectStudentSuggestion('${s.id}', '${escapeHtml(s.name)}')">
          <div class="font-black text-sm text-gray-800">${escapeHtml(s.name)}</div>
          <div class="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">${s.id} ${s.phone ? ' • ' + s.phone : ''}</div>
        </div>
      `).join('');
      suggestionBox.classList.remove('hidden');
    } else {
      suggestionBox.classList.add('hidden');
    }
    refreshPtSinglePayEligibility();
  }, 200);
}

/**
 * Chọn một học viên từ danh sách gợi ý.
 */
export function selectStudentSuggestion(id, name) {
  const inputEl = document.getElementById('manualInput');
  const suggestionBox = document.getElementById('manualInputSuggestions');
  if (inputEl) inputEl.value = id;
  if (suggestionBox) suggestionBox.classList.add('hidden');
  
  const trainingTypeEl = document.getElementById('checkinTrainingType');
  if (trainingTypeEl) {
    if (id.startsWith('APT')) trainingTypeEl.value = 'PT';
    else if (id.startsWith('AG')) trainingTypeEl.value = 'NonPT';
    trainingTypeEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  refreshPtSinglePayEligibility();
}

/**
 * Kiểm tra xem học viên PT có đủ điều kiện thanh toán buổi lẻ không.
 */
export function refreshPtSinglePayEligibility() {
  const trainingType = document.getElementById('checkinTrainingType')?.value || '';
  const input = (document.getElementById('manualInput')?.value || '').toUpperCase().trim();
  const box = document.getElementById('ptSingleSessionBox');
  const chk = document.getElementById('ptPayPerSession');
  const hint = document.getElementById('ptPayPerSessionHint');
  
  if (!box || !chk) return;
  
  if (trainingType !== 'PT' || !input.startsWith('APT')) {
    box.classList.add('hidden');
    chk.checked = false;
    return;
  }

  box.classList.remove('hidden');
  hint.textContent = 'Đang kiểm tra thẻ tháng...';
  
  apiRunner
    .withSuccessHandler(card => {
      if (card && card.exists && card.isActive) {
        const remain = card.remain != null ? card.remain : '';
        const end = card.endDate || '';
        hint.textContent = `Thẻ tháng còn hạn${remain !== '' ? ` (${remain} b)` : ''}${end ? `, đến ${end}` : ''}.`;
        chk.disabled = true;
        chk.checked = false;
      } else {
        hint.textContent = (card && card.exists) ? 'Thẻ tháng hết hạn. Có thể trả buổi lẻ.' : 'Chưa có thẻ tháng. Có thể trả buổi lẻ.';
        chk.disabled = false;
      }
    })
    .withFailureHandler(() => {
      hint.textContent = 'Lỗi kiểm tra thẻ tháng.';
      chk.disabled = false;
    })
    .getMonthCardStatus({ studentId: input });
}

// =================================================================
// SUBMISSION LOGIC
// =================================================================

/**
 * Điểm danh thủ công.
 */
export function handleManualCheckIn() {
  const input = document.getElementById('manualInput')?.value.trim() || '';
  if (!input) {
    showToast('Vui lòng nhập mã HV, SĐT hoặc tên', 'warning');
    return;
  }
  submitCheckInCaller(input, 'manual');
}

/**
 * Hàm gọi API điểm danh chung cho cả QR và thủ công.
 */
export function submitCheckInCaller(input, source = 'manual') {
  const notificationEl = document.getElementById('checkInNotification');
  if (!notificationEl) return;
  
  const doneEarly = () => {
    try { setButtonLoading('checkInButton', false); } catch (e) {}
  };

  const setTrainingTypeSelectValue = (value) => {
    const el = document.getElementById('checkinTrainingType');
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const showAptTrainingTypePrompt = (code) => {
    window.__pendingAptQrCode = String(code || '').toUpperCase().trim();
    notificationEl.innerHTML = `
      <div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl space-y-3 shadow-sm animate-in zoom-in duration-200">
        <div class="font-black text-[10px] uppercase tracking-widest text-yellow-600">Lựa chọn hình thức tập</div>
        <div class="text-sm font-bold">Mã HV: <span class="text-blue-600">${escapeHtml(window.__pendingAptQrCode)}</span></div>
        <div class="grid grid-cols-1 gap-2">
          <button type="button" id="aptChoosePT" class="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-black text-[10px] uppercase transition-all shadow-sm">Tập có HLV (PT)</button>
          <button type="button" id="aptChooseOut" class="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-black text-[10px] uppercase transition-all shadow-sm">Tự tập ngoài giờ</button>
          <button type="button" id="aptChooseCancel" class="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-black text-[10px] uppercase transition-all">Hủy</button>
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
      showToast('Vui lòng chọn hình thức tập!', 'warning');
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

  const payload = {
    studentId: upperInput,
    trainingType,
    staff: getStaffName(),
    ptPayPerSession: document.getElementById('ptPayPerSession')?.checked || false,
    ptSinglePrice: parseMoney(document.getElementById('ptSinglePrice')?.value || '0'),
    ptSinglePaymentMethod: document.getElementById('ptSinglePaymentMethod')?.value || 'Tiền mặt'
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('checkInButton', false);
      renderCheckInResult(result);
    })
    .withFailureHandler(err => {
      setButtonLoading('checkInButton', false);
      showError('checkInNotification', err.message || err);
    })
    .submitCheckIn(payload);
}

/**
 * Hiển thị kết quả điểm danh.
 */
function renderCheckInResult(result) {
  const box = document.getElementById('checkInNotification');
  if (!box) return;
  
  if (result.error) {
    showError('checkInNotification', result.error);
    return;
  }

  const maHV = result.maHV || result.studentId || '';
  const hoTen = result.hoTen || result.fullName || '';
  const goi = result.goi || result.packageCode || '';
  const lastCheck = result.lastCheck || 'Chưa có';
  const remain = (result.remain != null) ? result.remain : '0';
  const warnings = Array.isArray(result.warnings) ? result.warnings : (result.warnings ? String(result.warnings).split('||') : []);
  const status = result.status || '';

  const warnHtml = warnings.filter(Boolean).map(w => `<li class="mb-1">⚠️ ${escapeHtml(String(w))}</li>`).join('');
  
  let statusBanner = '';
  if (status === 'checkedToday') statusBanner = '<div class="bg-yellow-100 text-yellow-800 p-2 rounded-lg mb-2 font-bold text-[10px] text-center uppercase border border-yellow-200">✅ Đã điểm danh hôm nay</div>';
  if (status === 'expired') statusBanner = '<div class="bg-red-100 text-red-800 p-2 rounded-lg mb-2 font-bold text-[10px] text-center uppercase border border-red-200">⛔ Gói đã hết hạn / không hợp lệ</div>';
  
  let renewActions = '';
  if ((status === 'expired' || Number(remain) <= 2) && maHV) {
    renewActions = `
      <div class="mt-3">
        <button type="button" onclick="goToRenewFromCheckIn('${encodeURIComponent(maHV)}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-black text-[10px] uppercase shadow-md transition-all active:scale-95">Gia hạn ngay</button>
      </div>
    `;
  }

  box.innerHTML = `
    <div class="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      ${statusBanner}
      <div class="flex items-center gap-3 mb-3 border-b border-gray-50 pb-3">
        <div class="bg-green-500 text-white p-2 rounded-full shadow-sm w-8 h-8 flex items-center justify-center"><i class="fas fa-check text-xs"></i></div>
        <div class="text-green-800 font-black text-xs uppercase tracking-tight">${result.message || 'Điểm danh thành công!'}</div>
      </div>
      <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-left">
        <div class="space-y-1">
          <span class="text-[9px] font-bold text-gray-400 uppercase block">Học viên</span>
          <div class="font-black text-gray-800 truncate leading-tight">${escapeHtml(hoTen)}</div>
          <div class="text-blue-600 font-bold text-[10px]">${escapeHtml(maHV)}</div>
        </div>
        <div class="space-y-1 text-right">
          <span class="text-[9px] font-bold text-gray-400 uppercase block">Gói tập</span>
          <div class="font-black text-gray-700 truncate leading-tight">${escapeHtml(goi)}</div>
          <div class="text-orange-600 font-bold text-[10px]">Còn: ${remain} buổi</div>
        </div>
        <div class="col-span-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <span class="text-[9px] font-bold text-gray-400 uppercase block mb-1">Thông tin bổ sung</span>
          <div class="text-[10px] text-gray-600">Lần cuối: <span class="font-bold text-gray-800">${escapeHtml(lastCheck)}</span></div>
          ${warnHtml ? `<ul class="mt-1 list-none p-0 text-[10px] font-bold text-red-600">${warnHtml}</ul>` : ''}
        </div>
      </div>
      ${renewActions}
    </div>
  `;
}

/**
 * Chuyển sang tab gia hạn với mã học viên đã chọn.
 */
export function goToRenewFromCheckIn(studentId) {
  studentId = decodeURIComponent(studentId);
  window.setActiveTab('renew');
  const input = document.getElementById('searchStudentId');
  if (input) {
    input.value = studentId;
    setTimeout(() => {
      if (typeof window.searchStudentForRenew === 'function') window.searchStudentForRenew();
    }, 150);
  }
}

// Global exposure
window.handleManualCheckIn = handleManualCheckIn;
window.handleManualInputSearch = handleManualInputSearch;
window.selectStudentSuggestion = selectStudentSuggestion;
window.refreshPtSinglePayEligibility = refreshPtSinglePayEligibility;
window.goToRenewFromCheckIn = goToRenewFromCheckIn;
window.submitCheckInCaller = submitCheckInCaller;
