import { 
  showSuccess, showError, showLoading, getStaffName, setButtonLoading 
} from './utils.js';
// KHÔNG import validatePhone nữa vì đã có window.validatePhone

/**
 * @file register.js
 * @description Logic for registering new students with full global exposure and API integration.
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
    // Lọc các gói PT theo subtype (1:1, 2:1, 3:1) - Khớp với logic cũ
    filteredPackages = pkgList.filter(p => p.type === 'Gym_PT' && String(p.code || '').startsWith(type));
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
  
  const ptGroupField = document.getElementById('ptGroupField');
  if (ptGroupField) {
    ptGroupField.classList.toggle('hidden', trainingType !== 'PT2:1' && trainingType !== 'PT3:1');
  }

  const regMonthFields = document.getElementById('registerMonthCardFields');
  if (regMonthFields) {
    regMonthFields.classList.toggle('hidden', isPT);
  }

  updatePackageOptions();
}

/**
 * Tạo mã nhóm PT cho đăng ký mới.
 */
export function generatePTGroupIdRegister() {
  const id = window.generatePTGroupId('register');
  const input = document.getElementById('ptGroupId');
  if (input) {
    input.value = id;
    input.readOnly = false;
  }
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
  
  if (!window.validatePhone(phone)) {
  showError('registerNotification', 'Số điện thoại không hợp lệ (10-11 chữ số)');
  return;
}
  }
  
  const pkgSelect = document.getElementById('packageCode');
  const selectedPkg = pkgSelect ? pkgSelect.selectedOptions[0] : null;

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
        showSuccess('registerNotification', `Đăng ký thành công! Mã HV: ${result.data.studentId}`);
        document.getElementById('registerForm').reset();
        togglePTFields();
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
 * Cập nhật danh sách PT vào tất cả các dropdown PT.
 */
export function updatePTOptions() {
  const selects = ['ptCode', 'renewPtCode', 'pendingPtCode'];
  const ptList = window.ptList || [];

  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Chọn PT --</option>';
    ptList.forEach(pt => select.add(new Option(pt.name, pt.code)));
    
    if (currentValue && [...select.options].some(o => o.value === currentValue)) {
      select.value = currentValue;
    }
  });
}

// Global exposure
window.updatePackageOptions = updatePackageOptions;
window.updateTotalPrice = updateTotalPrice;
window.togglePTFields = togglePTFields;
window.submitRegistrationForm = submitRegistrationForm;
window.updatePTOptions = updatePTOptions;
window.generatePTGroupIdRegister = generatePTGroupIdRegister;
