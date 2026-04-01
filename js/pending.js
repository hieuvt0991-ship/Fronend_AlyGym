/**
 * @file pending.js
 * @description Logic for managing pending packages (gói chờ kích hoạt).
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { 
  showLoading, showError, showSuccess, getStaffName, 
  setButtonLoading, formatPhoneNumber, escapeHtml, showToast 
} from './utils.js';

/**
 * Tìm kiếm học viên để đăng ký gói chờ.
 */
export function searchStudentForPending() {
  const input = document.getElementById('pendingSearchStudentId')?.value?.trim();
  if (!input) {
    showToast('Vui lòng nhập mã HV, SĐT hoặc tên', 'warning');
    return;
  }

  showLoading('pendingStudentInfo', 'Đang tìm kiếm học viên...');
  document.getElementById('pendingForm').classList.add('hidden');
  document.getElementById('pendingListSection').classList.add('hidden');

  apiRunner
    .withSuccessHandler(result => {
      document.getElementById('pendingStudentInfo').innerHTML = '';
      if (result && result.status === 'success') {
        const student = result.data;
        renderPendingStudentInfo(student);
        document.getElementById('pendingForm').classList.remove('hidden');
        updatePendingPackageOptions();
        refreshPendingList();
      } else {
        showError('pendingStudentInfo', result?.message || 'Không tìm thấy học viên.');
      }
    })
    .withFailureHandler(err => {
      showError('pendingStudentInfo', err.message || err);
    })
    .getStudentForPending({ studentId: input });
}

/**
 * Hiển thị thông tin học viên trong tab gói chờ.
 */
function renderPendingStudentInfo(student) {
  const box = document.getElementById('pendingStudentInfo');
  box.innerHTML = `
    <div class="bg-purple-50 p-4 rounded-xl border border-purple-100 flex justify-between items-center animate-in fade-in duration-300">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-purple-900 uppercase">${escapeHtml(student.fullName)}</span>
          <span class="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-bold tracking-tighter">${student.studentId}</span>
        </div>
        <div class="text-[10px] text-gray-600 font-bold">
          <i class="fas fa-phone-alt mr-1"></i> ${formatPhoneNumber(student.phone)}
          <span class="mx-2">|</span>
          <i class="fas fa-box mr-1"></i> ${escapeHtml(student.currentPackage)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Làm mới danh sách gói chờ của học viên.
 */
export function refreshPendingList() {
  const studentId = document.getElementById('pendingSearchStudentId')?.value?.trim();
  if (!studentId) return;

  const section = document.getElementById('pendingListSection');
  const content = document.getElementById('pendingListContent');
  
  section.classList.remove('hidden');
  content.innerHTML = '<div class="text-center py-4 text-gray-500 text-[10px] italic animate-pulse">Đang tải danh sách gói chờ...</div>';

  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success' && result.data && result.data.length > 0) {
        renderPendingList(result.data);
      } else {
        content.innerHTML = '<div class="text-center py-6 text-gray-400 text-[10px] italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Học viên hiện chưa có gói chờ nào.</div>';
      }
    })
    .withFailureHandler(err => {
      content.innerHTML = `<div class="text-center py-4 text-red-500 text-[10px] font-bold">Lỗi: ${err.message}</div>`;
    })
    .getPendingPackages({ studentId });
}

/**
 * Hiển thị danh sách gói chờ.
 */
function renderPendingList(packages) {
  const content = document.getElementById('pendingListContent');
  content.innerHTML = packages.map(pkg => `
    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-blue-200 group">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-gray-800">${escapeHtml(pkg.packageCode)}</span>
          <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider">${pkg.trainingType || 'NonPT'}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-bold">
          <i class="far fa-calendar-alt mr-1"></i> Dự kiến: <span class="text-gray-800">${pkg.activationDate || 'N/A'}</span>
          <span class="mx-2">|</span>
          <i class="fas fa-money-bill-wave mr-1"></i> Giá: <span class="text-green-600">${formatMoney(pkg.price, true)}</span>
        </div>
        ${pkg.ptCode ? `<div class="text-[9px] text-purple-600 font-black"><i class="fas fa-user-tie mr-1"></i> PT: ${pkg.ptCode} ${pkg.ptGroupId ? `(Nhóm: ${pkg.ptGroupId})` : ''}</div>` : ''}
      </div>
      <div class="flex gap-2 w-full md:w-auto opacity-90 group-hover:opacity-100 transition-opacity">
        <button onclick="activatePendingPackage('${pkg.id}')" class="flex-grow md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all active:scale-95">Kích hoạt</button>
        <button onclick="cancelPendingPackage('${pkg.id}')" class="flex-grow md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all active:scale-95">Hủy bỏ</button>
      </div>
    </div>
  `).join('');
}

/**
 * Kích hoạt ngay một gói chờ.
 */
export function activatePendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn kích hoạt gói này ngay bây giờ không? Gói cũ (nếu có) sẽ bị đóng lại.')) return;
  
  showLoading('pendingNotification', 'Đang kích hoạt gói chờ...');
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        showSuccess('pendingNotification', 'Đã kích hoạt gói thành công!');
        refreshPendingList();
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
      } else {
        showError('pendingNotification', result?.message || 'Không thể kích hoạt gói.');
      }
    })
    .withFailureHandler(err => {
      showError('pendingNotification', err.message || err);
    })
    .activatePendingPackage({ packageId, staff: getStaffName() });
}

/**
 * Hủy bỏ một gói chờ.
 */
export function cancelPendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn hủy gói chờ này không? Thao tác này không thể hoàn tác.')) return;
  
  showLoading('pendingNotification', 'Đang hủy gói chờ...');
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        showToast('Đã hủy gói chờ thành công.', 'info');
        refreshPendingList();
      } else {
        showError('pendingNotification', result?.message || 'Không thể hủy gói.');
      }
    })
    .withFailureHandler(err => {
      showError('pendingNotification', err.message || err);
    })
    .cancelPendingPackage({ packageId, staff: getStaffName() });
}

/**
 * Cập nhật danh sách gói tập cho tab gói chờ.
 */
export function updatePendingPackageOptions() {
  const input = document.getElementById('pendingSearchStudentId')?.value || '';
  const isApt = input.startsWith('APT');
  const select = document.getElementById('pendingPackageCode');
  if (!select) return;

  select.innerHTML = '<option value="">-- Chọn gói chờ --</option>';
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
  
  updatePendingTotalPrice();
}

/**
 * Cập nhật tổng tiền đăng ký gói chờ.
 */
export function updatePendingTotalPrice() {
  const select = document.getElementById('pendingPackageCode');
  const pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || 0);
  setTotalWithMonthCard(pkgPrice, 'pending');
}

/**
 * Gửi form đăng ký gói chờ.
 */
export function submitPendingForm() {
  const studentId = document.getElementById('pendingSearchStudentId')?.value?.trim();
  const packageCode = document.getElementById('pendingPackageCode')?.value;
  const activationDate = document.getElementById('pendingActivationDate')?.value;

  if (!studentId || !packageCode || !activationDate) {
    showToast('Vui lòng điền đầy đủ thông tin gói chờ!', 'warning');
    return;
  }

  const pkgSelect = document.getElementById('pendingPackageCode');
  const selectedPkg = pkgSelect?.selectedOptions[0];

  const formData = {
    studentId,
    packageCode,
    sessions: selectedPkg?.dataset.sessions || 0,
    price: selectedPkg?.dataset.price || 0,
    activationDate,
    paymentStatus: document.getElementById('pendingPaymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('pendingPaymentMethod')?.value || 'Tiền mặt',
    cashPaid: parseMoney(document.getElementById('pendingCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('pendingTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('pendingNotes')?.value || '',
    issueMonthCard: document.getElementById('pendingIssueMonthCard')?.checked || false,
    monthCardSegment: document.getElementById('pendingMonthCardSegment')?.value || 'chungCu'
  };

  setButtonLoading('pendingButton', true, 'Đang đăng ký...');
  showLoading('pendingNotification', 'Đang xử lý đăng ký gói chờ...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('pendingButton', false);
      if (result && result.status === 'success') {
        showSuccess('pendingNotification', `Đã đăng ký gói chờ thành công cho ${studentId}!`);
        refreshPendingList();
      } else {
        showError('pendingNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('registerButton', false);
      showError('pendingNotification', err.message || err);
    })
    .registerPendingPackage(formData);
}

// Global exposure
window.searchStudentForPending = searchStudentForPending;
window.refreshPendingList = refreshPendingList;
window.activatePendingPackage = activatePendingPackage;
window.cancelPendingPackage = cancelPendingPackage;
window.updatePendingPackageOptions = updatePendingPackageOptions;
window.updatePendingTotalPrice = updatePendingTotalPrice;
window.submitPendingForm = submitPendingForm;
