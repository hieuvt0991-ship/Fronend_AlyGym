/**
 * @file api.js
 * @description Mock object to bridge old google.script.run calls to the new fetch-based callAPI.
 */

import { callAPI } from './config.js';

/**
 * apiRunner mimics the behavior of google.script.run.
 * Usage: apiRunner.withSuccessHandler(successCb).withFailureHandler(failCb).functionName(params)
 */
export const apiRunner = {
  _successHandler: (data) => console.log('API Success:', data),
  _failureHandler: (error) => console.error('API Error:', error),
  
  withSuccessHandler(handler) {
    this._successHandler = handler;
    return this;
  },
  
  withFailureHandler(handler) {
    this._failureHandler = handler;
    return this;
  },

  /**
   * Internal proxy to execute the actual API call.
   * @param {string} action - The action name matching the backend's ACTION_MAP.
   * @param {any} params - The parameters for the action.
   */
  async __execute(action, params = {}) {
    try {
      const data = await callAPI(action, params);
      if (typeof this._successHandler === 'function') {
        this._successHandler(data);
      }
    } catch (error) {
      if (typeof this._failureHandler === 'function') {
        this._failureHandler(error);
      }
    }
  }
};

/**
 * List of available backend actions.
 * These are dynamically added as methods to apiRunner.
 */
const ACTIONS = [
  // Initial Data
  'getInitialData',
  
  // Student Management
  'registerStudent',
  'renewStudent',
  'getStudentForRenew',
  'getStudentForPending',
  'convertStudentType',
  
  // Check-in & Attendance
  'submitCheckIn',
  'getMonthCardStatus',
  
  // Revenue & Sales
  'recordOtherRevenue',
  'getDailyRevenueReport',
  'updateRevenuePayment',
  
  // Pending Packages
  'getPendingPackages',
  'registerPendingPackage',
  'activatePendingPackage',
  'cancelPendingPackage',
  'setupPendingPackageTriggers',
  
  // Others
  'getPackagePromotionDetails',
  'getPTList',
  'getAllPackages',
  'checkInactiveStudents',
  'markStudentAsContacted'
];

// Dynamically create methods for each action
ACTIONS.forEach(action => {
  apiRunner[action] = function(params) {
    this.__execute(action, params);
  };
});

// Export as default for easier imports if needed
export default apiRunner;
