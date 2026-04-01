/**
 * @file alert.js
 * @description Logic for loading and handling inactive student alerts.
 */

import { apiRunner } from './api.js';
import { showError, escapeHtml, formatPhoneNumber, showToast } from './utils.js';

/**
 * Tải danh sách học viên vắng mặt lâu ngày.
 */
export function loadInactiveStudents() {
  const container = document.getElementById('inactiveStudentsList');
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full py-12 flex flex-col items-center justify-center text-blue-600 animate-pulse">
      <i class="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
      <div class="text-xs font-black uppercase tracking-widest">Đang quét danh sách vắng mặt...</div>
    </div>
  `;

  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        renderInactiveStudents(result.data);
      } else {
        container.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 italic text-xs">${result?.message || 'Không có dữ liệu.'}</div>`;
      }
    })
    .withFailureHandler(err => {
      container.innerHTML = `<div class="col-span-full py-12 text-center text-red-500 font-bold text-xs">Lỗi: ${err.message}</div>`;
    })
    .checkInactiveStudents();
}

/**
 * Hiển thị danh sách học viên vắng mặt.
 */
function renderInactiveStudents(students) {
  const container = document.getElementById('inactiveStudentsList');
  if (!students || students.length === 0) {
    container.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 italic text-xs">Hiện tại không có học viên nào vắng mặt quá hạn.</div>`;
    return;
  }

  container.innerHTML = students.map(s => `
    <div class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all animate-in zoom-in duration-300">
      <div class="flex justify-between items-start mb-3">
        <div>
          <div class="font-black text-gray-900 text-sm leading-tight">${escapeHtml(s.name)}</div>
          <div class="text-[10px] font-bold text-blue-600 uppercase mt-0.5">${s.id}</div>
        </div>
        <div class="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
          Vắng ${s.daysInactive} ngày
        </div>
      </div>
      
      <div class="space-y-2 mb-4">
        <div class="flex items-center text-[10px] text-gray-600">
          <i class="fas fa-phone-alt w-4"></i>
          <span class="font-bold">${formatPhoneNumber(s.phone)}</span>
          <button onclick="window.open('tel:${s.phone}')" class="ml-2 text-blue-600 hover:text-blue-800"><i class="fas fa-external-link-alt"></i></button>
        </div>
        <div class="flex items-center text-[10px] text-gray-600">
          <i class="fas fa-calendar-check w-4"></i>
          <span>Cuối: <span class="font-bold text-gray-800">${s.lastCheckIn || 'N/A'}</span></span>
        </div>
        <div class="flex items-center text-[10px] text-gray-600">
          <i class="fas fa-box w-4"></i>
          <span class="truncate">${escapeHtml(s.package)} (Còn ${s.remain} b)</span>
        </div>
      </div>

      <div class="border-t border-dashed border-gray-100 pt-3">
        <button onclick="toggleContactForm('${s.id}')" class="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase transition-all">
          <i class="fas fa-comment-medical mr-1"></i> Ghi chú liên hệ
        </button>
        
        <div id="contactForm_${s.id}" class="hidden mt-3 space-y-2 animate-in slide-in-from-top-2">
          <textarea id="note_${s.id}" class="w-full p-2 text-[10px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" rows="2" placeholder="Nội dung trao đổi..."></textarea>
          <button onclick="submitContactLog('${s.id}')" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase shadow-sm">Lưu thông tin</button>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Hiện/ẩn form ghi chú liên hệ.
 */
export function toggleContactForm(studentId) {
  const form = document.getElementById(`contactForm_${studentId}`);
  if (form) form.classList.toggle('hidden');
}

/**
 * Lưu nhật ký liên hệ học viên.
 */
export function submitContactLog(studentId) {
  const note = document.getElementById(`note_${studentId}`)?.value?.trim();
  if (!note) {
    showToast('Vui lòng nhập nội dung liên hệ!', 'warning');
    return;
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Đang lưu...';

  apiRunner
    .withSuccessHandler(result => {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (result && result.status === 'success') {
        showToast('Đã lưu nhật ký liên hệ thành công!', 'success');
        const card = document.getElementById(`contactForm_${studentId}`).closest('.bg-white');
        if (card) {
          card.style.opacity = '0.5';
          card.classList.add('pointer-events-none');
        }
      } else {
        showToast('Lỗi: ' + (result?.message || 'Không thể lưu'), 'error');
      }
    })
    .withFailureHandler(err => {
      btn.disabled = false;
      btn.innerHTML = originalText;
      showToast('Lỗi kết nối: ' + err.message, 'error');
    })
    .markStudentAsContacted({
      studentId,
      note,
      staff: window.getStaffName ? window.getStaffName() : 'Lễ tân'
    });
}

// Global exposure
window.loadInactiveStudents = loadInactiveStudents;
window.toggleContactForm = toggleContactForm;
window.submitContactLog = submitContactLog;
