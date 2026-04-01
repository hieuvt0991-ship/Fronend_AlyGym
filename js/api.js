/**
 * @file api.js
 * @description Mock object to bridge old google.script.run calls to the new fetch-based callAPI.
 */

import { callAPI } from './config.js';

/**
 * apiRunner mimics the behavior of google.script.run.
 * Cải tiến để hỗ trợ gọi nhiều API đồng thời mà không bị ghi đè handler.
 */
class ApiRunner {
  constructor() {
    this._successHandler = (data) => console.log('API Success:', data);
    this._failureHandler = (error) => console.error('API Error:', error);
  }

  withSuccessHandler(handler) {
    const newRunner = new ApiRunner();
    newRunner._successHandler = handler;
    newRunner._failureHandler = this._failureHandler;
    return newRunner;
  }

  withFailureHandler(handler) {
    const newRunner = new ApiRunner();
    newRunner._successHandler = this._successHandler;
    newRunner._failureHandler = handler;
    return newRunner;
  }

  /**
   * Internal proxy to execute the actual API call.
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
}

export const apiRunner = new ApiRunner();

/**
 * List of available backend actions.
 * These are dynamically added as methods to ApiRunner prototype.
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

// Dynamically create methods for each action on the prototype
ACTIONS.forEach(action => {
  ApiRunner.prototype[action] = function(params) {
    return this.__execute(action, params);
  };
});

// Export as default for easier imports if needed
export default apiRunner;
