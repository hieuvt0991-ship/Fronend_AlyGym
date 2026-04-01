/**
 * @file init.js
 * @description Initialization logic for the ALY GYM management system with full setup.
 */

import { apiRunner } from './api.js';
import { setActiveTab, initStaffName, showToast } from './utils.js';
import { parseMoney, formatMoney } from './money.js';
import { refreshPtSinglePayEligibility } from './checkin.js';
import { updatePackageOptions, updatePTOptions, togglePTFields } from './register.js';
import { updateRenewPackageOptions, toggleRenewPTFields } from './renew.js';
import { updatePendingPackageOptions } from './pending.js';

/**
 * Tải dữ liệu ban đầu từ server (gói tập, PT, học viên, khuyến mãi).
 */
export function loadInitialData() {
  apiRunner
    .withSuccessHandler(({ allPackages, pt, students, promotion }) => {
      window.packages = [
        ...(Array.isArray(allPackages?.NonPT) ? allPackages.NonPT : []),
        ...(Array.isArray(allPackages?.PT) ? allPackages.PT : [])
      ];
      window.ptList = pt || [];
      window.__allStudentsCache = students || []; 
      window.currentPromotion = promotion;
      
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
 * Làm mới bộ nhớ đệm học viên.
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
 * Thiết lập logic cho khối thanh toán.
 */
export function setupPaymentBlock(cfg) {
  const statusEl = document.getElementById(cfg.statusId);
  const methodEl = document.getElementById(cfg.methodId);
  if (!statusEl || !methodEl) return;

  const splitEl = cfg.splitId ? document.getElementById(cfg.splitId) : null;
  const cashEl = cfg.cashId ? document.getElementById(cfg.cashId) : null;
  const transferEl = cfg.transferId ? document.getElementById(cfg.transferId) : null;
  const hintEl = cfg.hintId ? document.getElementById(cfg.hintId) : null;

  const getTotal = () => (typeof cfg.getTotal === 'function' ? cfg.getTotal() : 0);
  const clearSplit = () => { if (cashEl) cashEl.value = ''; if (transferEl) transferEl.value = ''; };

  const updateHint = () => {
    const total = getTotal();
    const paid = parseMoney(cashEl?.value || 0) + parseMoney(transferEl?.value || 0);
    if (!hintEl) return;
    
    const debt = total - paid;
    if (statusEl.value === 'Chưa thanh toán') {
      hintEl.innerHTML = total > 0 ? `Còn nợ: <span class="text-red-600 font-bold">${formatMoney(total, true)}</span>` : '';
      return;
    }
    if (paid <= 0) { hintEl.textContent = ''; return; }
    
    if (debt > 0) hintEl.innerHTML = `Còn nợ: <span class="text-red-600 font-bold">${formatMoney(debt, true)}</span>`;
    else if (debt < 0) hintEl.innerHTML = `Dư: <span class="text-green-600 font-bold">${formatMoney(-debt, true)}</span>`;
    else hintEl.innerHTML = '<span class="text-green-600 font-bold">Đã đủ</span>';
  };

  const applyState = () => {
    if (statusEl.value === 'Chưa thanh toán') {
      methodEl.value = '';
      methodEl.disabled = true;
      if (splitEl) splitEl.classList.add('hidden');
      clearSplit();
      updateHint();
      return;
    }
    methodEl.disabled = false;
    if (!methodEl.value) methodEl.value = 'Tiền mặt';
    if (splitEl) {
      splitEl.classList.toggle('hidden', methodEl.value !== 'Tiền mặt + Chuyển khoản');
      if (methodEl.value !== 'Tiền mặt + Chuyển khoản') clearSplit();
    }
    updateHint();
  };

  statusEl.addEventListener('change', applyState);
  methodEl.addEventListener('change', applyState);
  if (cashEl) cashEl.addEventListener('input', updateHint);
  if (transferEl) transferEl.addEventListener('input', updateHint);

  const hintKey = `__update${cfg.statusId.charAt(0).toUpperCase() + cfg.statusId.slice(1)}Hint`;
  window[hintKey] = updateHint;
  applyState();
}

/**
 * Thiết lập xử lý radio button giảm giá.
 */
function setupDiscountRadioButtons() {
  const configs = [
    { typeAmount: 'discountTypeAmount', typePercent: 'discountTypePercent', amount: 'discountAmount', percent: 'discountPercent', mode: 'register' },
    { typeAmount: 'renewDiscountTypeAmount', typePercent: 'renewDiscountTypePercent', amount: 'renewDiscountAmount', percent: 'renewDiscountPercent', mode: 'renew' },
    { typeAmount: 'pendingDiscountTypeAmount', typePercent: 'pendingDiscountTypePercent', amount: 'pendingDiscountAmount', percent: 'pendingDiscountPercent', mode: 'pending' }
  ];

  configs.forEach(cfg => {
    const tAmount = document.getElementById(cfg.typeAmount);
    const tPercent = document.getElementById(cfg.typePercent);
    const vAmount = document.getElementById(cfg.amount);
    const vPercent = document.getElementById(cfg.percent);

    if (tAmount && tPercent) {
      tAmount.addEventListener('change', () => {
        if (tAmount.checked) {
          if (vAmount) vAmount.disabled = false;
          if (vPercent) { vPercent.disabled = true; vPercent.value = ''; }
          if (typeof window.recalculateTotal === 'function') window.recalculateTotal(cfg.mode);
        }
      });
      tPercent.addEventListener('change', () => {
        if (tPercent.checked) {
          if (vPercent) vPercent.disabled = false;
          if (vAmount) { vAmount.disabled = true; vAmount.value = ''; }
          if (typeof window.recalculateTotal === 'function') window.recalculateTotal(cfg.mode);
        }
      });
    }
    if (vAmount) vAmount.addEventListener('input', () => window.recalculateTotal(cfg.mode));
    if (vPercent) vPercent.addEventListener('input', () => window.recalculateTotal(cfg.mode));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStaffName();
  setActiveTab('checkIn');
  setupDiscountRadioButtons();

  setupPaymentBlock({
    statusId: 'paymentStatus', methodId: 'paymentMethod', splitId: 'registerSplit',
    cashId: 'registerCashPaid', transferId: 'registerTransferPaid', hintId: 'registerDebtHint',
    getTotal: () => parseMoney(document.getElementById('totalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'renewPaymentStatus', methodId: 'renewPaymentMethod', splitId: 'renewSplit',
    cashId: 'renewCashPaid', transferId: 'renewTransferPaid', hintId: 'renewDebtHint',
    getTotal: () => parseMoney(document.getElementById('renewTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'pendingPaymentStatus', methodId: 'pendingPaymentMethod', splitId: 'pendingSplit',
    cashId: 'pendingCashPaid', transferId: 'pendingTransferPaid', hintId: 'pendingDebtHint',
    getTotal: () => parseMoney(document.getElementById('pendingTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'revPaymentStatus', methodId: 'revPaymentMethod', splitId: 'revSplit',
    cashId: 'revCashPaid', transferId: 'revTransferPaid', hintId: 'revDebtHint',
    getTotal: () => parseMoney(document.getElementById('revAmount')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'revUpdatePaymentStatus', methodId: 'revUpdatePaymentMethod', splitId: 'revUpdateSplit',
    cashId: 'revUpdateCashPaid', transferId: 'revUpdateTransferPaid', hintId: 'revUpdateDebtHint',
    getTotal: () => 0 
  });

  setupPaymentBlock({
    statusId: 'ptSinglePaymentStatus', methodId: 'ptSinglePaymentMethod', splitId: 'ptSinglePaymentSplit',
    cashId: 'ptSingleCashPaid', transferId: 'ptSingleTransferPaid', hintId: 'ptSingleDebtHint',
    getTotal: () => parseMoney(document.getElementById('ptSinglePrice')?.value || '0')
  });

  const trainingTypeSelect = document.getElementById('checkinTrainingType');
  if (trainingTypeSelect) {
    trainingTypeSelect.addEventListener('change', () => {
       const box = document.getElementById('ptSingleSessionBox');
       if (box) box.classList.toggle('hidden', trainingTypeSelect.value !== 'PT');
       refreshPtSinglePayEligibility();
    });
  }

  const ptSingleChk = document.getElementById('ptPayPerSession');
  if (ptSingleChk) {
    ptSingleChk.addEventListener('change', (e) => {
      const box = document.getElementById('ptSinglePriceBox');
      if (box) box.classList.toggle('hidden', !e.target.checked);
    });
  }

  loadInitialData();
});

// Global exposure
window.refreshStudentCache = refreshStudentCache;
window.setupPaymentBlock = setupPaymentBlock;
window.loadInitialData = loadInitialData;
