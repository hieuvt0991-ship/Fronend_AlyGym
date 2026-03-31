/**
 * @file init.js
 * @description Main entry point for the ALY GYM frontend.
 */

import { apiRunner } from './api.js';
import { setActiveTab, initStaffName } from './utils.js';
import './register.js';
import './checkin.js';
import './scanner.js';
import './renew.js';
import './revenue.js';
import './alert.js';

export function loadInitialData() {
  apiRunner
    .withSuccessHandler(({ allPackages, pt, students, promotion }) => {
      window.packages = [
        ...(Array.isArray(allPackages?.NonPT) ? allPackages.NonPT : []),
        ...(Array.isArray(allPackages?.PT) ? allPackages.PT : [])
      ];
      window.ptList = pt;
      window.__allStudentsCache = students || []; 
      window.currentPromotion = promotion;
      
      // Call UI updates
      if (typeof window.updatePackageOptions === 'function') window.updatePackageOptions();
      if (typeof window.updatePTOptions === 'function') window.updatePTOptions();
      if (typeof window.updateRenewPackageOptions === 'function') window.updateRenewPackageOptions();
      if (typeof window.updatePendingPackageOptions === 'function') window.updatePendingPackageOptions();
    })
    .withFailureHandler(err => console.error('Lỗi tải dữ liệu ban đầu:', err))
    .getInitialData();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initStaffName();
  loadInitialData();
  setActiveTab('checkIn');

  // Setup Payment Blocks
  setupPaymentBlock({
    statusId: 'paymentStatus',
    methodId: 'paymentMethod',
    splitId: 'registerPaymentSplit',
    cashId: 'registerCashPaid',
    transferId: 'registerTransferPaid',
    hintId: 'registerDebtHint',
    getTotal: () => window.parseMoney(document.getElementById('totalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'renewPaymentStatus',
    methodId: 'renewPaymentMethod',
    splitId: 'renewPaymentSplit',
    cashId: 'renewCashPaid',
    transferId: 'renewTransferPaid',
    hintId: 'renewDebtHint',
    getTotal: () => window.parseMoney(document.getElementById('renewTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'pendingPaymentStatus',
    methodId: 'pendingPaymentMethod',
    splitId: 'pendingPaymentSplit',
    cashId: 'pendingCashPaid',
    transferId: 'pendingTransferPaid',
    hintId: 'pendingDebtHint',
    getTotal: () => window.parseMoney(document.getElementById('pendingTotalPrice')?.value || '0')
  });

  setupPaymentBlock({
    statusId: 'revPaymentStatus',
    methodId: 'revPaymentMethod',
    splitId: 'revPaymentSplit',
    cashId: 'revCashPaid',
    transferId: 'revTransferPaid',
    hintId: 'revDebtHint',
    getTotal: () => {
      const q = Number(document.getElementById('revQuantity')?.value || 0);
      const p = window.parseMoney(document.getElementById('revPrice')?.value || '0');
      return q * p;
    }
  });
});
