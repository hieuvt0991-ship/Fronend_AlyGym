/**
 * @file renew.js
 * @description Logic for renewing student packages and converting student types.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { 
  showLoading, showError, showSuccess, getStaffName, 
  setButtonLoading, formatPhoneNumber, escapeHtml, showToast 
} from './utils.js';

/**
 * Tìm kiếm học viên để gia hạn.
 */
export function searchStudentForRenew() {
  const input = document.getElementById('searchStudentId')?.value?.trim();
  if (!input) {
    showToast('Vui lòng nhập mã HV, SĐT hoặc tên', 'warning');
    return;
  }

  showLoading('studentInfoRenew', 'Đang tìm kiếm học viên...');
  document.getElementById('renewForm').classList.add('hidden');

  apiRunner
    .withSuccessHandler(result => {
      document.getElementById('studentInfoRenew').innerHTML = '';
      if (result && result.status === 'success') {
        renderStudentInfoRenew(result.data);
        document.getElementById('renewForm').classList.remove('hidden');
        updateRenewPackageOptions();
      } else {
        showError('studentInfoRenew', result?.message || 'Không tìm thấy học viên.');
      }
    })
    .withFailureHandler(err => {
      showError('studentInfoRenew', err.message || err);
    })
    .getStudentForRenew({ studentId: input });
}

/**
 * Hiển thị thông tin học viên tìm thấy.
 */
function renderStudentInfoRenew(student) {
  const box = document.getElementById('studentInfoRenew');
  const isApt = (student.studentId || '').startsWith('APT');
  const statusClass = student.status === 'Hết hạn' ? 'text-red-600' : 'text-green-600';
  
  box.innerHTML = `
    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between gap-4 animate-in fade-in duration-300">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-blue-900 uppercase">${escapeHtml(student.fullName)}</span>
          <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold tracking-tighter">${student.studentId}</span>
        </div>
        <div class="text-[10px] text-gray-600 font-bold">
          <i class="fas fa-phone-alt mr-1"></i> ${formatPhoneNumber(student.phone)}
          <span class="mx-2">|</span>
          <i class="fas fa-box mr-1"></i> ${escapeHtml(student.currentPackage)}
        </div>
      </div>
      <div class="flex flex-col md:items-end justify-center">
        <div class="text-[10px] font-black uppercase tracking-widest ${statusClass}">${student.status}</div>
        <div class="text-[10px] font-bold text-gray-500 italic">Còn lại: ${student.remainSessions} buổi</div>
      </div>
    </div>
    
    <div class="mt-4 flex flex-wrap gap-2">
      <button onclick="toggleConvertStudentType()" class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
        <i class="fas fa-exchange-alt mr-1"></i> Chuyển đổi loại thẻ (${isApt ? 'Sang Gym' : 'Sang PT'})
      </button>
    </div>
    <div id="convertSection" class="hidden mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 animate-in slide-in-from-top-2">
      <div class="text-[10px] font-black text-orange-800 uppercase mb-2">Chuyển đổi loại thẻ</div>
      <div class="grid grid-cols-1 gap-2">
        <div class="text-[10px] text-orange-700 italic">Hệ thống sẽ tạo mã mới và bảo lưu buổi tập cũ sang gói mới.</div>
        <button onclick="submitConvertStudentType('${student.studentId}')" id="convertButton" class="w-full bg-orange-600 text-white py-2 rounded-lg font-black text-[10px] uppercase shadow-sm">Xác nhận chuyển đổi</button>
      </div>
    </div>
  `;
}

/**
 * Hiển thị/ẩn phần chuyển đổi loại thẻ.
 */
export function toggleConvertStudentType() {
  const sec = document.getElementById('convertSection');
  if (sec) sec.classList.toggle('hidden');
}

/**
 * Gửi yêu cầu chuyển đổi loại thẻ.
 */
export function submitConvertStudentType(studentId) {
  if (!confirm('Bạn có chắc chắn muốn chuyển đổi loại thẻ cho học viên này không?')) return;
  
  setButtonLoading('convertButton', true, 'Đang xử lý...');
  
  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('convertButton', false);
      if (result && result.status === 'success') {
        showToast(`Chuyển đổi thành công! Mã mới: ${result.data.newStudentId}`, 'success');
        document.getElementById('searchStudentId').value = result.data.newStudentId;
        searchStudentForRenew();
      } else {
        showToast(result?.message || 'Lỗi chuyển đổi', 'error');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('convertButton', false);
      showToast(err.message || err, 'error');
    })
    .convertStudentType({ studentId, staff: getStaffName() });
}

/**
 * Cập nhật danh sách gói tập cho gia hạn.
 */
export function updateRenewPackageOptions() {
  const input = document.getElementById('searchStudentId')?.value || '';
  const isApt = input.startsWith('APT');
  const select = document.getElementById('renewPackageCode');
  if (!select) return;

  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const pkgRow = document.getElementById('renewPackageRow');
  if (pkgRow) pkgRow.classList.toggle('hidden', onlyCard);

  select.innerHTML = '<option value="">-- Chọn gói gia hạn --</option>';
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  
  const filtered = isApt 
    ? pkgList.filter(p => p.type === 'Gym_PT')
    : pkgList.filter(p => p.type === 'Gym_NonPT');

  filtered.forEach(p => {
    const opt = new Option(`${p.code} - ${p.sessions} b - ${formatMoney(p.price, true)}`, p.code);
    opt.dataset.price = p.price;
    opt.dataset.sessions = p.sessions;
    select.add(opt);
  });
  
  updateRenewTotalPrice();
}

/**
 * Cập nhật tổng tiền gia hạn.
 */
export function updateRenewTotalPrice() {
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  let pkgPrice = 0;
  if (!onlyCard) {
    const select = document.getElementById('renewPackageCode');
    pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || 0);
  }
  setTotalWithMonthCard(pkgPrice, 'renew');
}

/**
 * Gửi form gia hạn.
 */
export function submitRenewForm() {
  const studentId = document.getElementById('searchStudentId')?.value?.trim();
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const packageCode = document.getElementById('renewPackageCode')?.value;
  const startDate = document.getElementById('renewStartDate')?.value;

  if (!studentId || (!onlyCard && !packageCode) || !startDate) {
    showToast('Vui lòng điền đầy đủ thông tin gia hạn!', 'warning');
    return;
  }

  const pkgSelect = document.getElementById('renewPackageCode');
  const selectedPkg = pkgSelect?.selectedOptions[0];

  const formData = {
    studentId,
    onlyMonthCard: onlyCard,
    packageCode: onlyCard ? 'MONTH_CARD_ONLY' : packageCode,
    sessions: onlyCard ? 0 : (selectedPkg?.dataset.sessions || 0),
    price: onlyCard ? 0 : (selectedPkg?.dataset.price || 0),
    startDate,
    paymentStatus: document.getElementById('renewPaymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('renewPaymentMethod')?.value || 'Tiền mặt',
    cashPaid: parseMoney(document.getElementById('renewCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('renewTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('renewNotes')?.value || '',
    issueMonthCard: document.getElementById('renewIssueMonthCard')?.checked || false,
    monthCardSegment: document.getElementById('renewMonthCardSegment')?.value || 'chungCu'
  };

  setButtonLoading('renewButton', true, 'Đang gia hạn...');
  showLoading('renewNotification', 'Đang xử lý gia hạn...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('renewButton', false);
      if (result && result.status === 'success') {
        showSuccess('renewNotification', `Gia hạn thành công cho học viên ${studentId}!`);
        // Reset form và load lại thông tin học viên
        document.getElementById('renewForm').classList.add('hidden');
        searchStudentForRenew();
        // Làm mới cache học viên
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
      } else {
        showError('renewNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('renewButton', false);
      showError('renewNotification', err.message || err);
    })
    .renewStudent(formData);
}

// Global exposure
window.searchStudentForRenew = searchStudentForRenew;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.updateRenewTotalPrice = updateRenewTotalPrice;
window.submitRenewForm = submitRenewForm;
window.toggleConvertStudentType = toggleConvertStudentType;
window.submitConvertStudentType = submitConvertStudentType;
