/**
 * @file register.js
 * @description Logic for the registration tab.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { validatePhone, showSuccess, showError, showLoading, getStaffName, setButtonLoading } from './utils.js';

export function updatePackageOptions() {
  const type = document.getElementById('trainingType')?.value || 'NonPT';
  const select = document.getElementById('packageCode');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';
  select.add(new Option('Chọn gói', ''));
  
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  let filteredPackages;
  if (type === 'NonPT') {
    filteredPackages = pkgList.filter(p => p.type === 'Gym_NonPT');
  } else {
    filteredPackages = pkgList.filter(p => p.type === 'Gym_PT' && String(p.code || '').startsWith(type + ':'));
  }
  
  filteredPackages.forEach(p => {
    if (p && p.code) {
      const opt = new Option(`${p.code} - ${p.sessions} buổi - ${formatMoney(p.price, true)}`, p.code);
      opt.dataset.sessions = p.sessions;
      opt.dataset.price = p.price;
      select.add(opt);
    }
  });
  
  if (currentValue && [...select.options].some(o => o.value === currentValue)) {
    select.value = currentValue;
  } else {
    select.value = '';
  }
  updateTotalPrice();
}

export function updateTotalPrice() {
  const select = document.getElementById('packageCode');
  if (!select) return;
  const originalPrice = Number(select.selectedOptions[0]?.dataset.price || 0);
  const packageCode = select.value;
  const el = document.getElementById('totalPrice');
  
  if (!packageCode) {
    if (el) el.value = '0 VNĐ';
    return;
  }

  // Optional: Add promotion logic here if needed
  setTotalWithMonthCard(originalPrice, 'register');
}

export function togglePTFields() {
  const trainingType = document.getElementById('trainingType')?.value;
  const showPT = trainingType && trainingType.startsWith('PT');
  
  const ptRow = document.getElementById('ptRow');
  if (ptRow) ptRow.style.display = showPT ? 'block' : 'none';
  
  updatePackageOptions();
}

export function submitRegistrationForm() {
  const fullName = document.getElementById('fullName')?.value?.trim();
  const phone = document.getElementById('phone')?.value?.trim();
  const dob = document.getElementById('dob')?.value;
  const packageCode = document.getElementById('packageCode')?.value;
  const startDate = document.getElementById('startDate')?.value;
  
  if (!fullName || !phone || !dob || !packageCode || !startDate) {
    showError('registerNotification', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)');
    return;
  }
  
  if (!validatePhone(phone)) {
    showError('registerNotification', 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)');
    return;
  }
  
  setButtonLoading('registerButton', true, 'Đang đăng ký...');
  showLoading('registerNotification', 'Đang xử lý đăng ký học viên mới...');
  
  const formData = {
    fullName,
    dob,
    phone,
    address: document.getElementById('address')?.value || '',
    trainingType: document.getElementById('trainingType')?.value || 'NonPT',
    packageCode,
    startDate,
    sessions: document.getElementById('packageCode').selectedOptions[0]?.dataset.sessions || 0,
    price: document.getElementById('packageCode').selectedOptions[0]?.dataset.price || 0,
    paymentStatus: document.getElementById('paymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('paymentMethod')?.value || 'Tiền mặt',
    staff: getStaffName(),
    notes: document.getElementById('notes')?.value || '',
    referrer: document.getElementById('referrer')?.value || ''
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('registerButton', false);
      if (result && result.status === 'success') {
        showSuccess('registerNotification', `Đăng ký thành công! Mã HV: ${result.studentId}`);
        document.getElementById('registerForm').reset();
        updatePackageOptions();
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

export function updatePTOptions() {
  const select = document.getElementById('ptCode');
  if (!select) return;
  select.innerHTML = '<option value="">Chọn PT</option>';
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
