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
  
  const trainingType = document.getElementById('checkinTrainingType')?.value;
  if (!trainingType) {
    showError('checkInNotification', 'Vui lòng chọn hình thức tập trước khi điểm danh');
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

  box.innerHTML = `
    <div class="bg-green-50 p-4 rounded shadow border border-green-200 space-y-2">
      <div class="text-green-800 font-bold text-lg mb-2">✅ ${result.message || 'Điểm danh thành công!'}</div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div><strong>Mã HV:</strong> ${escapeHtml(result.maHV || result.studentId || '')}</div>
        <div><strong>Họ tên:</strong> ${escapeHtml(result.hoTen || result.fullName || '')}</div>
        <div><strong>SĐT:</strong> ${formatPhoneNumber(result.sdt || result.phone || '')}</div>
        <div><strong>Gói:</strong> ${escapeHtml(result.goi || result.packageCode || '')}</div>
        <div><strong>Buổi còn lại:</strong> <span class="text-blue-600 font-bold">${result.remain ?? ''}</span></div>
      </div>
    </div>
  `;
}

// Global exposure
window.handleManualCheckIn = handleManualCheckIn;
window.handleManualInputSearch = handleManualInputSearch;
window.selectStudentSuggestion = selectStudentSuggestion;
window.submitCheckInCaller = submitCheckInCaller;
