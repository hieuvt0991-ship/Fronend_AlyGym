/**
 * @file init.js
 * @description Main entry point for the ALY GYM frontend.
 */

import { apiRunner } from './api.js';
import { setActiveTab } from './utils.js';
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
    })
    .withFailureHandler(err => console.error('Lỗi tải dữ liệu ban đầu:', err))
    .getInitialData();
}

export function initStaffName() {
  const el = document.getElementById('staffName');
  if (!el) return;
  
  const stored = localStorage.getItem('aly_staff');
  if (stored) el.value = stored;

  el.addEventListener('change', () => {
    localStorage.setItem('aly_staff', el.value.trim());
  });
}

export function getStaffName() {
  return document.getElementById('staffName')?.value.trim() || 'Lễ tân';
}

export function setButtonLoading(buttonId, isLoading, loadingText = 'Đang xử lý...') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${loadingText}`;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove('opacity-75', 'cursor-not-allowed');
  }
}

// Global exposure
window.getStaffName = getStaffName;
window.setButtonLoading = setButtonLoading;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initStaffName();
  loadInitialData();
  setActiveTab('checkIn');
});
