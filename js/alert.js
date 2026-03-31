/**
 * @file alert.js
 * @description Logic for the alert tab (inactive students).
 */

import { apiRunner } from './api.js';
import { showError, escapeHtml, formatPhoneNumber, showToast } from './utils.js';

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
      <div class="col-span-full text-center py-8 text-green-600">
        <div class="text-4xl mb-2">✅</div>
        <p class="text-lg font-semibold">Tuyệt vời!</p>
        <p>Tất cả học viên đều đang tích cực tập luyện</p>
      </div>
    `;
    return;
  }

  let html = '';
  students.forEach(st => {
    const studentId = st.studentId || '';
    html += `
      <div class="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm transition-all hover:shadow-md">
        <div class="flex justify-between items-start mb-3">
          <div class="space-y-1">
            <div class="font-black text-orange-900 text-sm">${escapeHtml(st.fullName || '')}</div>
            <div class="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Mã: ${escapeHtml(studentId)} | SĐT: ${escapeHtml(formatPhoneNumber(st.phone || ''))}</div>
            <div class="text-[10px] text-gray-500 font-medium">Gói: ${escapeHtml(st.packageCode || '')} | Vắng: <span class="text-red-600 font-black">${st.daysInactive || '?'} ngày</span></div>
          </div>
          <div class="flex gap-1">
            <a href="tel:${st.phone}" class="bg-green-600 text-white p-2 rounded-lg text-[10px] shadow-sm hover:bg-green-700"><i class="fas fa-phone"></i></a>
            <button onclick="toggleContactForm('${escapeHtml(studentId)}')" class="bg-blue-600 text-white p-2 rounded-lg text-[10px] shadow-sm hover:bg-blue-700"><i class="fas fa-edit"></i></button>
          </div>
        </div>
        
        <div id="contactForm_${escapeHtml(studentId)}" class="hidden mt-3 pt-3 border-t border-orange-200 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div class="grid grid-cols-2 gap-2">
            <input id="contactPerson_${escapeHtml(studentId)}" type="text" class="form-control-compact !text-[10px] !p-1.5" placeholder="Người liên hệ">
            <select id="contactStatus_${escapeHtml(studentId)}" class="form-control-compact !text-[10px] !p-1.5">
              <option value="Đã liên hệ">Đã liên hệ</option>
              <option value="Không liên hệ được">Ko liên hệ được</option>
              <option value="Đã hẹn lịch">Đã hẹn lịch</option>
            </select>
          </div>
          <input id="contactContent_${escapeHtml(studentId)}" type="text" class="form-control-compact !text-[10px] !p-1.5" placeholder="Nội dung tóm tắt">
          <textarea id="contactNotes_${escapeHtml(studentId)}" rows="2" class="form-control-compact !text-[10px] !p-1.5" placeholder="Ghi chú chi tiết..."></textarea>
          <button onclick="saveContactInfo('${escapeHtml(studentId)}')" class="w-full bg-orange-600 text-white py-1.5 rounded-lg font-black text-[10px] uppercase shadow-sm hover:bg-orange-700">Lưu thông tin</button>
        </div>
      </div>
    `;
  });
  content.innerHTML = html;
}

export function toggleContactForm(studentId) {
  const form = document.getElementById(`contactForm_${studentId}`);
  if (form) {
    const isHidden = form.classList.contains('hidden');
    // Hide other forms first
    document.querySelectorAll('[id^="contactForm_"]').forEach(f => f.classList.add('hidden'));
    if (isHidden) form.classList.remove('hidden');
  }
}

export function saveContactInfo(studentId) {
  const person = document.getElementById(`contactPerson_${studentId}`)?.value.trim();
  const content = document.getElementById(`contactContent_${studentId}`)?.value.trim();
  const status = document.getElementById(`contactStatus_${studentId}`)?.value;
  const notes = document.getElementById(`contactNotes_${studentId}`)?.value.trim();

  if (!person || !content) {
    showToast('Vui lòng nhập tên người liên hệ và nội dung!', 'error');
    return;
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  apiRunner
    .withSuccessHandler(result => {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (result && result.status === 'success') {
        const card = document.getElementById(`contactForm_${studentId}`).parentElement;
        card.style.opacity = '0.5';
        card.classList.add('pointer-events-none');
        document.getElementById(`contactForm_${studentId}`).classList.add('hidden');
        showToast('Đã lưu thông tin liên hệ thành công!', 'success');
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
      contactPerson: person,
      contactContent: content,
      contactStatus: status,
      contactNotes: notes
    });
}

// Global exposure
window.loadInactiveStudents = loadInactiveStudents;
window.toggleContactForm = toggleContactForm;
window.saveContactInfo = saveContactInfo;
