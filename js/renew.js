/**
 * @file renew.js
 * @description Logic for the renewal tab.
 */

import { apiRunner } from './api.js';
import { showLoading, showError, showSuccess, formatMoney, formatPhoneNumber } from './utils.js';
import { setButtonLoading, getStaffName } from './init.js';

export function searchStudentForRenew() {
  const input = document.getElementById('searchStudentId')?.value.trim();
  if (!input) {
    showError('renewNotification', 'Vui lòng nhập mã HV, tên hoặc SĐT');
    return;
  }

  showLoading('renewStudentInfo', 'Đang tìm kiếm học viên...');
  
  apiRunner
    .withSuccessHandler(result => {
      document.getElementById('renewStudentInfo').innerHTML = '';
      if (result && result.status === 'success') {
        renderStudentInfo(result);
        document.getElementById('renewForm').classList.remove('hidden');
        window.updateRenewPackageOptions();
      } else {
        showError('renewStudentInfo', result?.message || 'Không tìm thấy học viên.');
        document.getElementById('renewForm').classList.add('hidden');
      }
    })
    .withFailureHandler(err => {
      showError('renewStudentInfo', err.message || err);
    })
    .getStudentForRenew({ studentId: input });
}

function renderStudentInfo(student) {
  const box = document.getElementById('renewStudentInfo');
  box.innerHTML = `
    <div class="bg-blue-50 p-4 rounded border border-blue-200 grid grid-cols-2 gap-4 text-sm">
      <div><strong>Học viên:</strong> ${student.fullName}</div>
      <div><strong>Mã HV:</strong> ${student.studentId}</div>
      <div><strong>Gói hiện tại:</strong> ${student.packageCode || 'Không có'}</div>
      <div><strong>Ngày hết hạn:</strong> ${student.endDate || 'N/A'}</div>
    </div>
  `;
}

export function updateRenewPackageOptions() {
  const select = document.getElementById('renewPackageCode');
  if (!select) return;
  
  select.innerHTML = '<option value="">Chọn gói gia hạn</option>';
  (window.packages || []).forEach(p => {
    const opt = new Option(`${p.code} - ${formatMoney(p.price, true)}`, p.code);
    opt.dataset.price = p.price;
    select.add(opt);
  });
}

export function confirmAndRenew() {
  const packageCode = document.getElementById('renewPackageCode')?.value;
  const startDate = document.getElementById('renewStartDate')?.value;
  
  if (!packageCode || !startDate) {
    showError('renewNotification', 'Vui lòng chọn gói và ngày bắt đầu');
    return;
  }

  setButtonLoading('submitBtn', true, 'Đang xử lý...');
  
  const data = {
    studentId: document.getElementById('searchStudentId').value,
    packageCode,
    startDate,
    staff: getStaffName()
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('submitBtn', false);
      if (result && result.status === 'success') {
        showSuccess('renewNotification', 'Gia hạn thành công!');
        searchStudentForRenew(); // Refresh info
      } else {
        showError('renewNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('submitBtn', false);
      showError('renewNotification', err.message || err);
    })
    .renewStudent(data);
}

// Global exposure
window.searchStudentForRenew = searchStudentForRenew;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.confirmAndRenew = confirmAndRenew;
