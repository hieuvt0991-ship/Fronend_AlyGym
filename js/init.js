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
});
