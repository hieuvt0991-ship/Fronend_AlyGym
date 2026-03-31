/**
 * @file api.js
 * @description Fetch-based API wrapper to communicate with the Google Apps Script backend.
 */

import { API_BASE_URL, callAPI } from './config.js';

/**
 * A mock for google.script.run to facilitate easier migration.
 * This allows using similar syntax: apiRunner.withSuccessHandler(cb).withFailureHandler(cb).action(params)
 */
export const apiRunner = {
  _successHandler: (data) => console.log('Success:', data),
  _failureHandler: (error) => console.error('Error:', error),
  
  withSuccessHandler(handler) {
    this._successHandler = handler;
    return this;
  },
  
  withFailureHandler(handler) {
    this._failureHandler = handler;
    return this;
  },

  // Proxy to handle dynamic function calls
  async __call(action, ...args) {
    try {
      const params = args[0] || {};
      const data = await callAPI(action, params);
      this._successHandler(data);
    } catch (error) {
      this._failureHandler(error);
    }
  }
};

// Define all the backend functions as methods on apiRunner
[
  'getInitialData',
  'registerStudent',
  'renewStudent',
  'getStudentForRenew',
  'getStudentForPending',
  'submitCheckIn',
  'getMonthCardStatus',
  'recordOtherRevenue',
  'getDailyRevenueReport',
  'updateRevenuePayment',
  'getPendingPackages',
  'registerPendingPackage',
  'activatePendingPackage',
  'cancelPendingPackage',
  'setupPendingPackageTriggers',
  'getPackagePromotionDetails',
  'getPTList',
  'getAllPackages',
  'checkInactiveStudents',
  'markStudentAsContacted',
  'convertStudentType'
].forEach(action => {
  apiRunner[action] = function(...args) {
    this.__call(action, ...args);
  };
});
