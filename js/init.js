/**
 * @file init.js
 * @description Initialization logic for the ALY GYM management system.
 */

import { apiRunner } from './api.js';
import { setActiveTab, initStaffName, showToast } from './utils.js';
import { refreshPtSinglePayEligibility } from './checkin.js';
import { updatePackageOptions, updatePTOptions, togglePTFields } from './register.js';
import { updateRenewPackageOptions } from './renew.js';
import { updatePendingPackageOptions } from './pending.js';

/**
 * Tải dữ liệu ban đầu từ server (gói tập, PT, học viên, khuyến mãi).
 */
export function loadInitialData() {
  apiRunner
    .withSuccessHandler(({ allPackages, pt, students, promotion }) => {
      // 1. Lưu trữ dữ liệu vào window để các module khác truy cập
      window.packages = [
        ...(Array.isArray(allPackages?.NonPT) ? allPackages.NonPT : []),
        ...(Array.isArray(allPackages?.PT) ? allPackages.PT : [])
      ];
      window.ptList = pt || [];
      window.__allStudentsCache = students || []; 
      window.currentPromotion = promotion;
      
      // 2. Cập nhật giao diện các tab
      updatePackageOptions();
      updatePTOptions();
      updateRenewPackageOptions();
      updatePendingPackageOptions();
      
      console.log('Hệ thống đã sẵn sàng với dữ liệu mới nhất.');
    })
    .withFailureHandler(err => {
      console.error('Lỗi tải dữ liệu ban đầu:', err);
      showToast('Không thể tải dữ liệu từ server. Vui lòng thử lại!', 'error');
    })
    .getInitialData();
}

/**
 * Làm mới bộ nhớ đệm học viên (để search nhanh).
 */
export function refreshStudentCache() {
  apiRunner
    .withSuccessHandler(({ students }) => {
      window.__allStudentsCache = students || [];
      console.log('Bộ nhớ đệm học viên đã được cập nhật.');
    })
    .withFailureHandler(err => console.error('Lỗi làm mới cache học viên:', err))
    .getInitialData(); 
}

/**
 * Thiết lập logic cho khối thanh toán (chia tiền mặt/chuyển khoản).
 */
export function setupPaymentBlock({ statusId, methodId, splitId, cashId, transferId, hintId, getTotal }) {
  const statusEl = document.getElementById(statusId);
  const methodEl = document.getElementById(methodId);
  const splitEl = document.getElementById(splitId);
  const cashEl = document.getElementById(cashId);
  const transferEl = document.getElementById(transferId);

  const update = () => {
    const status = statusEl?.value;
    const method = methodEl?.value;
    const isSplit = method === 'Tiền mặt + Chuyển khoản';
    
    if (splitEl) splitEl.classList.toggle('hidden', !isSplit);
    
    // Logic gợi ý công nợ (Debt Hint)
    if (hintId && typeof getTotal === 'function') {
      const hintEl = document.getElementById(hintId);
      if (hintEl) {
        if (status === 'Thanh toán một phần' || status === 'Chưa thanh toán') {
          const total = getTotal();
          const paid = isSplit ? (parseMoney(cashEl.value) + parseMoney(transferEl.value)) : 0;
          const debt = Math.max(0, total - paid);
          hintEl.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i> Ghi nợ: <span class="font-black text-red-600">${formatMoney(debt, true)}</span>`;
          hintEl.classList.remove('hidden');
        } else {
          hintEl.classList.add('hidden');
        }
      }
    }
  };

  [statusEl, methodEl].forEach(el => el?.addEventListener('change', update));
  [cashEl, transferEl].forEach(el => el?.addEventListener('input', update));
  
  // Lưu hàm update vào window để gọi thủ công khi cần
  const hintKey = `__update${statusId.charAt(0).toUpperCase() + statusId.slice(1)}Hint`;
  window[hintKey] = update;
}

// =================================================================
// SYSTEM INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Cấu hình mặc định
  initStaffName();
  setActiveTab('checkIn');

  // 2. Thiết lập các khối thanh toán
  setupPaymentBlock({
    statusId: 'paymentStatus',
    methodId: 'paymentMethod',
    splitId: 'registerSplit',
    cashId: 'registerCashPaid',
    transferId: 'registerTransferPaid',
    hintId: 'registerDebtHint',
    getTotal: () => parseMoney(document.getElementById('totalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'renewPaymentStatus',
    methodId: 'renewPaymentMethod',
    splitId: 'renewSplit',
    cashId: 'renewCashPaid',
    transferId: 'renewTransferPaid',
    hintId: 'renewDebtHint',
    getTotal: () => parseMoney(document.getElementById('renewTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'pendingPaymentStatus',
    methodId: 'pendingPaymentMethod',
    splitId: 'pendingSplit',
    cashId: 'pendingCashPaid',
    transferId: 'pendingTransferPaid',
    hintId: 'pendingDebtHint',
    getTotal: () => parseMoney(document.getElementById('pendingTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'revPaymentStatus',
    methodId: 'revPaymentMethod',
    splitId: 'revSplit',
    cashId: 'revCashPaid',
    transferId: 'revTransferPaid',
    hintId: 'revDebtHint',
    getTotal: () => parseMoney(document.getElementById('revAmount')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'revUpdatePaymentStatus',
    methodId: 'revUpdatePaymentMethod',
    splitId: 'revUpdateSplit',
    cashId: 'revUpdateCashPaid',
    transferId: 'revUpdateTransferPaid',
    hintId: 'revUpdateDebtHint',
    getTotal: () => 0 // Update revenue doesn't have a dynamic total on UI
  });

  // 3. Sự kiện cho tab Điểm danh
  const trainingTypeSelect = document.getElementById('checkinTrainingType');
  if (trainingTypeSelect) {
    trainingTypeSelect.addEventListener('change', refreshPtSinglePayEligibility);
  }

  const ptSingleChk = document.getElementById('ptPayPerSession');
  if (ptSingleChk) {
    ptSingleChk.addEventListener('change', (e) => {
      const box = document.getElementById('ptSinglePriceBox');
      if (box) box.classList.toggle('hidden', !e.target.checked);
    });
  }

  // 4. Khởi chạy nạp dữ liệu
  loadInitialData();
});

// Global exposure
window.refreshStudentCache = refreshStudentCache;
