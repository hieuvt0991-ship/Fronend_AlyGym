/**
 * @file api.js
 * @description Fetch-based API wrapper to communicate with the Google Apps Script backend.
 */

// Placeholder URL - Thay URL này bằng link Web App GAS của bạn (kết thúc bằng /exec)
const API_URL = 'https://script.google.com/macros/s/AKfycbz9LO0s5-OcokR0kn6XyHfj4RJ0So3wPh7MJ8hFS3DsZLwQazZ5NW8he1BXxGQMrOm67w/exec';

/**
 * Calls a backend function via the API.
 * @param {string} action The name of the function/action to call.
 * @param {Object} params Parameters to pass to the function.
 * @returns {Promise<any>} A promise that resolves with the data or rejects with an error.
 */
export async function callApi(action, params = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      // We use text/plain to avoid preflight (CORS simple request)
      // GAS will still be able to parse the body if we use JSON.stringify
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, params }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Unknown API error');
    }
  } catch (error) {
    console.error(`API Call failed (${action}):`, error);
    throw error;
  }
}

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
      const data = await callApi(action, params);
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
  'getAllPackages'
].forEach(action => {
  apiRunner[action] = function(...args) {
    this.__call(action, ...args);
  };
});
