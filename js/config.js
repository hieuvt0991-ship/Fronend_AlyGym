/**
 * @file config.js
 * @description Centralized configuration for the ALY GYM API.
 */

// Thay đổi URL này sau khi bạn deploy backend GAS mới
export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw_0HbHqYZyb07ohx2dc9zGm0B3ygKB21k3fI74m_yOwzFgSN0CAvEliIVw6MER0qnjQA/exec';

/**
 * Common fetch function for backend communication.
 * @param {string} action - Tên hành động cần thực hiện (khớp với ACTION_MAP trong GAS)
 * @param {Object} params - Các tham số truyền vào
 * @returns {Promise<any>} Kết quả từ server
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
    
    // Xử lý kết quả trả về từ backend
    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Lỗi API không xác định');
    }
  } catch (error) {
    console.error(`API Call Failed [${action}]:`, error);
    // Hiển thị toast lỗi nếu có thể
    if (typeof window.showToast === 'function') {
      window.showToast(error.message, 'error');
    }
    throw error;
  }
}
