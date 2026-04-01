/**
 * @file register.js
 * @description Logic for registering new students.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { 
  validatePhone, showSuccess, showError, showLoading, 
  getStaffName, setButtonLoading, generatePTGroupId, showToast 
} from './utils.js';

/**
 * Cập nhật danh sách gói tập trong dropdown dựa trên hình thức tập.
 */
export function updatePackageOptions() {
  const type = document.getElementById('trainingType')?.value || 'NonPT';
  const select = document.getElementById('packageCode');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Chọn gói tập --</option>';
  
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  let filteredPackages = [];
  
  if (type === 'NonPT') {
    filteredPackages = pkgList.filter(p => p.type === 'Gym_NonPT');
  } else {
    // Filter PT packages by subtype (1:1, 2:1, 3:1)
    filteredPackages = pkgList.filter(p => p.type === 'Gym_PT' && String(p.code || '').startsWith(type + ':'));
  }
  
  filteredPackages.forEach(p => {
    const opt = new Option(`${p.code} - ${p.sessions} buổi - ${formatMoney(p.price, true)}`, p.code);
    opt.dataset.sessions = p.sessions;
    opt.dataset.price = p.price;
    select.add(opt);
  });
  
  if (currentValue && [...select.options].some(o => o.value === currentValue)) {
    select.value = currentValue;
  }
  
  updateTotalPrice();
}

/**
 * Cập nhật tổng tiền hiển thị.
 */
export function updateTotalPrice() {
  const select = document.getElementById('packageCode');
  if (!select) return;
  const originalPrice = Number(select.selectedOptions[0]?.dataset.price || 0);
  setTotalWithMonthCard(originalPrice, 'register');
}

/**
 * Hiển thị/ẩn các trường thông tin PT.
 */
export function togglePTFields() {
  const trainingType = document.getElementById('trainingType')?.value;
  const isPT = trainingType && trainingType.startsWith('PT');
  
  const ptRow = document.getElementById('ptRow');
  if (ptRow) ptRow.classList.toggle('hidden', !isPT);
  
  updatePackageOptions();
}

/**
 * Gửi form đăng ký học viên mới.
 */
export function submitRegistrationForm() {
  const fullName = document.getElementById('fullName')?.value?.trim();
  const phone = document.getElementById('phone')?.value?.trim();
  const dob = document.getElementById('dob')?.value;
  const packageCode = document.getElementById('packageCode')?.value;
  const startDate = document.getElementById('startDate')?.value;
  
  if (!fullName || !phone || !dob || !packageCode || !startDate) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc (*)', 'warning');
    return;
  }
  
  if (!validatePhone(phone)) {
    showToast('Số điện thoại không hợp lệ (10-11 chữ số)', 'error');
    return;
  }
  
  const pkgSelect = document.getElementById('packageCode');
  const selectedPkg = pkgSelect.selectedOptions[0];

  const formData = {
    fullName,
    dob,
    phone,
    address: document.getElementById('address')?.value || '',
    trainingType: document.getElementById('trainingType')?.value || 'NonPT',
    packageCode,
    startDate,
    sessions: selectedPkg?.dataset.sessions || 0,
    price: selectedPkg?.dataset.price || 0,
    paymentStatus: document.getElementById('paymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('paymentMethod')?.value || 'Tiền mặt',
    cashPaid: parseMoney(document.getElementById('registerCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('registerTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('notes')?.value || '',
    referrer: document.getElementById('referrer')?.value || '',
    issueMonthCard: document.getElementById('registerIssueMonthCard')?.checked || false,
    monthCardSegment: document.getElementById('registerMonthCardSegment')?.value || 'chungCu',
    ptCode: document.getElementById('ptCode')?.value || '',
    ptGroupId: document.getElementById('ptGroupId')?.value || ''
  };

  if (formData.trainingType.startsWith('PT') && !formData.ptCode) {
    showToast('Vui lòng chọn Huấn luyện viên (PT)!', 'warning');
    return;
  }

  setButtonLoading('registerButton', true, 'Đang đăng ký...');
  showLoading('registerNotification', 'Đang xử lý đăng ký...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('registerButton', false);
      if (result && result.status === 'success') {
        const student = result.data;
        showSuccess('registerNotification', `Đăng ký thành công! Mã HV: ${student.studentId}`);
        document.getElementById('registerForm').reset();
        
        // Reset về mặc định
        if (typeof window.recalculateTotal === 'function') window.recalculateTotal('register');
        togglePTFields();
        
        // Làm mới cache học viên để gợi ý search
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
      } else {
        showError('registerNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('registerButton', false);
      showError('registerNotification', err.message || err);
    })
    .registerStudent(formData);
}

/**
 * Cập nhật danh sách PT vào dropdown.
 */
export function updatePTOptions() {
  const select = document.getElementById('ptCode');
  if (!select) return;
  select.innerHTML = '<option value="">-- Chọn PT --</option>';
  (window.ptList || []).forEach(pt => {
    select.add(new Option(pt.name, pt.code));
  });
}

// Global exposure
window.updatePackageOptions = updatePackageOptions;
window.updateTotalPrice = updateTotalPrice;
window.togglePTFields = togglePTFields;
window.submitRegistrationForm = submitRegistrationForm;
window.updatePTOptions = updatePTOptions;
