/**
 * @file config.js
 * @description Centralized configuration for the ALY GYM API.
 */

// Thay đổi URL này sau khi bạn deploy backend GAS mới
export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz9LO0s5-OcokR0kn6XyHfj4RJ0So3wPh7MJ8hFS3DsZLwQazZ5NW8he1BXxGQMrOm67w/exec';

/**
 * Common fetch function for backend communication.
 */
export async function callAPI(action, params = {}) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    return result;
  } catch (error) {
    console.error(`API Call Failed [${action}]:`, error);
    throw error;
  }
}/**
 * @file config.js
 * @description Configuration and base API function for ALY GYM.
 */

// URL của Google Apps Script Web App (sau khi đã deploy)
export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw0Pdqnht0GoDYDlSO2e0NMclzdGDXpx9S-Yi8xOBqoubaH2qjG9aCTpcwGxgegnISdIA/exec';

/**
 * Hàm gọi API chung cho toàn hệ thống
 * @param {string} action - Tên hành độ/**
 * @file config.js
 * @description Centralized configuration for the ALY GYM API.
 */

// Thay đổi URL này sau khi bạn deploy backend GAS mới
export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzf4Y-05h-qfNf38L9L9_1527-X_X_X/exec';

/**
 * Common fetch function for backend communication.
 */
export async function callAPI(action, params = {}) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, params })
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    return result;
  } catch (error) {
    console.error(`API Call Failed [${action}]:`, error);
    throw error;
  }
}ng cần thực hiện (khớp với ACTION_MAP trong GAS)
 * @param {Object} params - Các tham số truyền vào
 * @returns {Promise<any>} Kết quả từ server
 */
export async function callAPI(action, params = {}) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, params }),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối server: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Lỗi API không xác định');
    }
  } catch (error) {
    console.error(`API Call failed (${action}):`, error);
    // Hiển thị toast lỗi thông qua window.showErrorNotification (được định nghĩa trong utils.js)
    if (typeof window.showErrorNotification === 'function') {
      window.showErrorNotification(error.message || 'Lỗi kết nối server');
    }
    throw error;
  }
}
