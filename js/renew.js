/**
 * @file renew.js
 * @description Logic for the renewal tab.
 */

import { apiRunner } from './api.js';
import { showLoading, showError, showSuccess, formatPhoneNumber, setButtonLoading, getStaffName } from './utils.js';
import { formatMoney } from './money.js';

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
        const student = result.data;
        renderStudentInfo(student);
        document.getElementById('renewForm').classList.remove('hidden');
        
        // Show/hide PT fields based on student type
        const isPT = student.studentId && student.studentId.startsWith('APT');
        const ptRow = document.getElementById('renewPtRow');
        if (ptRow) ptRow.style.display = isPT ? 'block' : 'none';
        
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
    <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm shadow-sm">
      <div class="space-y-1">
        <div class="text-[10px] font-black text-blue-400 uppercase">Học viên</div>
        <div class="font-black text-blue-900 text-lg">${student.fullName}</div>
        <div class="text-blue-600 font-bold">Mã HV: ${student.studentId}</div>
      </div>
      <div class="space-y-1">
        <div class="text-[10px] font-black text-blue-400 uppercase">Trạng thái gói</div>
        <div class="text-blue-800"><strong>Gói:</strong> ${student.packageCode || 'N/A'}</div>
        <div class="text-blue-800"><strong>Hết hạn:</strong> ${student.endDate || 'N/A'}</div>
      </div>
    </div>
  `;
}

export function updateRenewPackageOptions() {
  const select = document.getElementById('renewPackageCode');
  if (!select) return;
  
  const studentId = document.getElementById('searchStudentId').value;
  const isPT = studentId.startsWith('APT');
  
  select.innerHTML = '<option value="">Chọn gói gia hạn</option>';
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  
  const filtered = isPT 
    ? pkgList.filter(p => p.type === 'Gym_PT')
    : pkgList.filter(p => p.type === 'Gym_NonPT');

  filtered.forEach(p => {
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

  setButtonLoading('submitBtn', true, 'Đang xử lý gia hạn...');
  showLoading('renewNotification', 'Đang thực hiện gia hạn...');
  
  const studentId = document.getElementById('searchStudentId').value;
  const isPT = studentId.startsWith('APT');

  const data = {
    studentId: studentId,
    packageCode,
    startDate,
    staff: getStaffName(),
    paymentStatus: document.getElementById('renewPaymentStatus').value,
    paymentMethod: document.getElementById('renewPaymentMethod').value,
    discountAmount: parseMoney(document.getElementById('renewDiscountAmount').value || '0'),
    discountPercent: parseFloat(document.getElementById('renewDiscountPercent').value || '0'),
    issueMonthCard: document.getElementById('renewIssueMonthCard').checked,
    ptCode: isPT ? document.getElementById('renewPtCode')?.value : '',
    ptGroupId: isPT ? document.getElementById('renewPtGroupId')?.value : ''
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('submitBtn', false);
      if (result && result.status === 'success') {
        showSuccess('renewNotification', 'Gia hạn thành công cho học viên!');
        searchStudentForRenew(); // Refresh info
      } else {
        showError('renewNotification', result?.message || 'Có lỗi xảy ra trong quá trình gia hạn.');
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
