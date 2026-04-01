/**
 * @file api.js
 * @description Mock object to bridge old google.script.run calls to the new fetch-based callAPI.
 */

import { callAPI } from './config.js';

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

  async __execute(action, params = {}) {
    try {
      const data = await callAPI(action, params);
      if (typeof this._successHandler === 'function') this._successHandler(data);
    } catch (error) {
      if (typeof this._failureHandler === 'function') this._failureHandler(error);
    }
  }
}

export const apiRunner = new ApiRunner();

const ACTIONS = [
  'getInitialData', 'registerStudent', 'renewStudent', 'getStudentForRenew',
  'getStudentForPending', 'convertStudentType', 'submitCheckIn', 'getMonthCardStatus',
  'recordOtherRevenue', 'getDailyRevenueReport', 'updateRevenuePayment',
  'getPendingPackages', 'registerPendingPackage', 'activatePendingPackage',
  'cancelPendingPackage', 'setupPendingPackageTriggers', 'checkInactiveStudents',
  'markStudentAsContacted'
];

ACTIONS.forEach(action => {
  ApiRunner.prototype[action] = function(params) { return this.__execute(action, params); };
});

export default apiRunner;