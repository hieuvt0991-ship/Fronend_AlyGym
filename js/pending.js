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
      } else {
        showError('pendingStudentInfo', result?.message || 'Không tìm thấy học viên.');
        document.getElementById('pendingForm').classList.add('hidden');
      }
    })
    .withFailureHandler(err => {
      showError('pendingStudentInfo', err.message || err);
    })
    .getStudentForPending({ studentId: input });
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
window.updatePendingPackageOptions = updatePendingPackageOptions;
window.togglePendingPTFields = togglePendingPTFields;
window.submitPendingForm = submitPendingForm;
