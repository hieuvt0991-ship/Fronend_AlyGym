/**
 * @file alert.js
 * @description Logic for the alert tab (inactive students).
 */

import { apiRunner } from './api.js';
import { showError, escapeHtml, formatPhoneNumber } from './utils.js';

export function loadInactiveStudents() {
  const content = document.getElementById('alertContent');
  if (!content) return;

  content.innerHTML = `
    <div class="text-center py-8 text-gray-500">
      <div class="animate-spin inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mb-2"></div>
      <p>Đang kiểm tra học viên vắng mặt...</p>
    </div>
  `;
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        renderAlertList(result.data || []);
      } else {
        content.innerHTML = '<p class="text-gray-500 italic">Hiện tại không có học viên nào vắng mặt quá lâu.</p>';
      }
    })
    .withFailureHandler(err => {
      content.innerHTML = `<p class="text-red-500">Lỗi: ${err.message}</p>`;
    })
    .checkInactiveStudents();
}

function renderAlertList(students) {
  const content = document.getElementById('alertContent');
  if (!students || students.length === 0) {
    content.innerHTML = `
      <div class="text-center py-8 text-green-600">
        <div class="text-4xl mb-2">✅</div>
        <p class="text-lg font-semibold">Tuyệt vời!</p>
        <p>Tất cả học viên đều đang tích cực tập luyện</p>
      </div>
    `;
    return;
  }

  let html = '<div class="space-y-3 text-left">';
  students.forEach(st => {
    html += `
      <div class="bg-orange-50 p-3 rounded border border-orange-200 flex justify-between items-center shadow-sm">
        <div>
          <div class="font-bold text-orange-900">${escapeHtml(st.fullName || '')} (${escapeHtml(st.studentId || '')})</div>
          <div class="text-xs text-orange-700">
            SĐT: ${escapeHtml(formatPhoneNumber(st.phone || ''))} | 
            Gói: ${escapeHtml(st.packageCode || '')} | 
            Vắng: <span class="font-bold">${st.daysInactive || '?'}</span> ngày
          </div>
        </div>
        <div class="flex gap-2">
          <a href="tel:${st.phone}" class="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 shadow">
            <i class="fas fa-phone"></i>
          </a>
        </div>
      </div>
    `;
  });
  html += '</div>';
  content.innerHTML = html;
}

// Global exposure
window.loadInactiveStudents = loadInactiveStudents;
