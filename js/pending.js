/**
 * @file pending.js
 * @description Logic for the pending packages tab.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { showLoading, showError, showSuccess, getStaffName, setButtonLoading } from './utils.js';

export function searchStudentForPending() {
  const input = document.getElementById('pendingSearchStudentId')?.value.trim();
  if (!input) {
    showError('pendingNotification', 'Vui lòng nhập mã HV, tên hoặc SĐT');
    return;
  }

  showLoading('pendingStudentInfo', 'Đang tìm kiếm học viên...');
  
  apiRunner
    .withSuccessHandler(result => {
      document.getElementById('pendingStudentInfo').innerHTML = '';
      if (result && result.status === 'success') {
        const student = result.data;
        renderPendingStudentInfo(student);
        document.getElementById('pendingForm').classList.remove('hidden');
        updatePendingPackageOptions();
        
        // Also load existing pending packages for this student
        refreshPendingList();
      } else {
        showError('pendingStudentInfo', result?.message || 'Không tìm thấy học viên.');
        document.getElementById('pendingForm').classList.add('hidden');
        document.getElementById('pendingListSection').classList.add('hidden');
      }
    })
    .withFailureHandler(err => {
      showError('pendingStudentInfo', err.message || err);
    })
    .getStudentForPending({ studentId: input });
}

export function refreshPendingList() {
  const studentId = document.getElementById('pendingSearchStudentId')?.value.trim();
  if (!studentId) return;

  const section = document.getElementById('pendingListSection');
  const content = document.getElementById('pendingListContent');
  
  section.classList.remove('hidden');
  content.innerHTML = '<div class="text-center py-4 text-gray-500 text-xs italic">Đang tải danh sách gói chờ...</div>';

  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success' && result.data && result.data.length > 0) {
        renderPendingList(result.data);
      } else {
        content.innerHTML = '<div class="text-center py-4 text-gray-400 text-xs italic">Học viên chưa có gói chờ nào.</div>';
      }
    })
    .withFailureHandler(err => {
      content.innerHTML = `<div class="text-center py-4 text-red-500 text-xs italic">Lỗi: ${err.message}</div>`;
    })
    .getPendingPackages({ studentId });
}

function renderPendingList(packages) {
  const content = document.getElementById('pendingListContent');
  
  content.innerHTML = packages.map(pkg => `
    <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-blue-200">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-gray-800">${pkg.packageCode}</span>
          <span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">${pkg.trainingType}</span>
        </div>
        <div class="text-[11px] text-gray-500 font-medium">
          <i class="far fa-calendar-alt mr-1"></i> Dự kiến: <span class="text-gray-800 font-bold">${pkg.activationDate}</span>
          <span class="mx-2">|</span>
          <i class="fas fa-money-bill-wave mr-1"></i> Giá: <span class="text-green-600 font-bold">${formatMoney(pkg.price, true)}</span>
        </div>
        ${pkg.ptCode ? `<div class="text-[10px] text-purple-600 font-bold"><i class="fas fa-user-tie mr-1"></i> PT: ${pkg.ptCode} ${pkg.ptGroupId ? `(Nhóm: ${pkg.ptGroupId})` : ''}</div>` : ''}
      </div>
      <div class="flex gap-2 w-full md:w-auto">
        <button onclick="activatePendingPackage('${pkg.id}')" class="flex-grow md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm transition-all active:scale-95">Kích hoạt</button>
        <button onclick="cancelPendingPackage('${pkg.id}')" class="flex-grow md:flex-none bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all active:scale-95">Hủy bỏ</button>
      </div>
    </div>
  `).join('');
}

export function activatePendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn kích hoạt gói này ngay bây giờ không?')) return;
  
  showLoading('pendingNotification', 'Đang kích hoạt gói chờ...');
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        showSuccess('pendingNotification', 'Đã kích hoạt gói thành công!');
        refreshPendingList();
        // Refresh student cache if exists
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
      } else {
        showError('pendingNotification', result?.message || 'Không thể kích hoạt gói.');
      }
    })
    .withFailureHandler(err => {
      showError('pendingNotification', err.message || err);
    })
    .activatePendingPackage({ packageId });
}

export function cancelPendingPackage(packageId) {
  if (!confirm('Bạn có chắc chắn muốn hủy gói chờ này không? Thao tác này không thể hoàn tác.')) return;
  
  showLoading('pendingNotification', 'Đang hủy gói chờ...');
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        showSuccess('pendingNotification', 'Đã hủy gói chờ thành công.');
        refreshPendingList();
      } else {
        showError('pendingNotification', result?.message || 'Không thể hủy gói.');
      }
    })
    .withFailureHandler(err => {
      showError('pendingNotification', err.message || err);
    })
    .cancelPendingPackage({ packageId });
}

function renderPendingStudentInfo(student) {
  const box = document.getElementById('pendingStudentInfo');
  box.innerHTML = `
    <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs shadow-sm">
      <div class="space-y-1">
        <div class="text-[10px] font-black text-purple-400 uppercase tracking-widest">Học viên</div>
        <div class="font-black text-purple-900 text-sm">${student.fullName}</div>
        <div class="text-purple-600 font-bold">Mã HV: ${student.studentId}</div>
      </div>
      <div class="space-y-1">
        <div class="text-[10px] font-black text-purple-400 uppercase tracking-widest">Gói hiện tại</div>
        <div class="text-purple-800"><strong>Gói:</strong> ${student.packageCode || 'N/A'}</div>
        <div class="text-purple-800"><strong>Hết hạn:</strong> ${student.endDate || 'N/A'}</div>
      </div>
    </div>
  `;
}

export function updatePendingPackageOptions() {
  const type = document.getElementById('pendingTrainingType')?.value || 'NonPT';
  const select = document.getElementById('pendingPackageCode');
  if (!select) return;
  
  select.innerHTML = '<option value="">Chọn gói chờ</option>';
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  
  const filtered = pkgList.filter(p => {
    if (type === 'NonPT') return p.type === 'Gym_NonPT';
    return p.type === 'Gym_PT' && p.code.startsWith(type + ':');
  });

  filtered.forEach(p => {
    const opt = new Option(`${p.code} - ${formatMoney(p.price, true)}`, p.code);
    opt.dataset.price = p.price;
    select.add(opt);
  });
}

export function togglePendingPTFields() {
  const type = document.getElementById('pendingTrainingType').value;
  const isPT = type.startsWith('PT');
  const ptFields = document.getElementById('pendingPtFields');
  if (ptFields) ptFields.classList.toggle('hidden', !isPT);
}

export function submitPendingForm() {
  const packageCode = document.getElementById('pendingPackageCode')?.value;
  const activationDate = document.getElementById('pendingActivationDate')?.value;
  
  if (!packageCode || !activationDate) {
    showError('pendingNotification', 'Vui lòng chọn gói và ngày kích hoạt dự kiến');
    return;
  }

  setButtonLoading('pendingSubmitButton', true, 'Đang đăng ký...');
  showLoading('pendingNotification', 'Đang lưu gói chờ kích hoạt...');
  
  const studentId = document.getElementById('pendingSearchStudentId').value;

  const data = {
    studentId: studentId,
    packageCode,
    activationDate,
    trainingType: document.getElementById('pendingTrainingType').value,
    staff: getStaffName(),
    paymentStatus: document.getElementById('pendingPaymentStatus').value,
    paymentMethod: document.getElementById('pendingPaymentMethod').value,
    ptCode: document.getElementById('pendingPtCode')?.value || '',
    ptGroupId: document.getElementById('pendingPtGroupId')?.value || ''
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('pendingSubmitButton', false);
      if (result && result.status === 'success') {
        showSuccess('pendingNotification', 'Đăng ký gói chờ thành công!');
        document.getElementById('pendingForm').reset();
        document.getElementById('pendingForm').classList.add('hidden');
        document.getElementById('pendingStudentInfo').innerHTML = '';
      } else {
        showError('pendingNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('pendingSubmitButton', false);
      showError('pendingNotification', err.message || err);
    })
    .registerPendingPackage(data);
}

// Global exposure
window.searchStudentForPending = searchStudentForPending;
window.refreshPendingList = refreshPendingList;
window.activatePendingPackage = activatePendingPackage;
window.cancelPendingPackage = cancelPendingPackage;
window.updatePendingPackageOptions = updatePendingPackageOptions;
window.togglePendingPTFields = togglePendingPTFields;
window.submitPendingForm = submitPendingForm;
