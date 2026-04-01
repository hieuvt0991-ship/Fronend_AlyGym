/**
 * @file revenue.js
 * @description Logic for recording other revenue and daily reporting.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney } from './money.js';
import { 
  showLoading, showError, showSuccess, getStaffName, 
  setButtonLoading, showToast 
} from './utils.js';

/**
 * Gửi form ghi nhận doanh thu khác (nước, phụ kiện...).
 */
export function submitRevenue() {
  const content = document.getElementById('revContent')?.value?.trim();
  const amount = parseMoney(document.getElementById('revAmount')?.value || '0');
  
  if (!content || amount <= 0) {
    showToast('Vui lòng nhập nội dung và số tiền hợp lệ!', 'warning');
    return;
  }

  setButtonLoading('revenueButton', true, 'Đang ghi nhận...');
  showLoading('revenueNotification', 'Đang gửi dữ liệu doanh thu...');

  const data = {
    content,
    amount,
    paymentStatus: document.getElementById('revPaymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('revPaymentMethod')?.value || 'Tiền mặt',
    cashPaid: parseMoney(document.getElementById('revCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('revTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('revNotes')?.value || ''
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('revenueButton', false);
      if (result && result.status === 'success') {
        showSuccess('revenueNotification', 'Đã ghi nhận doanh thu thành công!');
        document.getElementById('revContent').value = '';
        document.getElementById('revAmount').value = '';
        document.getElementById('revNotes').value = '';
        refreshDailyReport();
      } else {
        showError('revenueNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('revenueButton', false);
      showError('revenueNotification', err.message || err);
    })
    .recordOtherRevenue(data);
}

/**
 * Làm mới báo cáo doanh thu trong ngày.
 */
export function refreshDailyReport() {
  const box = document.getElementById('dailyReportContent');
  if (!box) return;

  box.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 text-blue-600 animate-pulse">
      <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
      <div class="text-[10px] font-black uppercase tracking-widest">Đang tải báo cáo...</div>
    </div>
  `;

  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        renderDailyReport(result.data);
      } else {
        box.innerHTML = `<div class="text-center py-4 text-red-500 text-[10px] font-bold">${result?.message || 'Lỗi tải báo cáo'}</div>`;
      }
    })
    .withFailureHandler(err => {
      box.innerHTML = `<div class="text-center py-4 text-red-500 text-[10px] font-bold">Lỗi kết nối: ${err.message}</div>`;
    })
    .getDailyRevenueReport();
}

/**
 * Hiển thị báo cáo doanh thu.
 */
function renderDailyReport(data) {
  const box = document.getElementById('dailyReportContent');
  
  const total = formatMoney(data.total || 0, true);
  const cash = formatMoney(data.cash || 0, true);
  const transfer = formatMoney(data.transfer || 0, true);
  const debt = formatMoney(data.debt || 0, true);

  box.innerHTML = `
    <div class="grid grid-cols-2 gap-3 w-full animate-in zoom-in duration-300">
      <div class="bg-white p-3 rounded-xl border border-blue-100 shadow-sm col-span-2 text-center">
        <div class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Tổng cộng</div>
        <div class="text-xl font-black text-blue-700">${total}</div>
      </div>
      <div class="bg-white p-3 rounded-xl border border-green-100 shadow-sm">
        <div class="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Tiền mặt</div>
        <div class="text-sm font-black text-green-600">${cash}</div>
      </div>
      <div class="bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
        <div class="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Chuyển khoản</div>
        <div class="text-sm font-black text-purple-600">${transfer}</div>
      </div>
      <div class="bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm col-span-2 text-center">
        <div class="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Công nợ (Chưa thu)</div>
        <div class="text-sm font-black text-red-600">${debt}</div>
      </div>
    </div>
    <div class="mt-4 text-[9px] text-gray-400 italic text-center w-full">Cập nhật lúc: ${new Date().toLocaleTimeString()}</div>
  `;
}

/**
 * Gửi form cập nhật trạng thái thanh toán cho giao dịch nợ.
 */
export function submitRevenueUpdate() {
  const stt = document.getElementById('revUpdateStt')?.value;
  if (!stt) {
    showToast('Vui lòng nhập STT giao dịch!', 'warning');
    return;
  }

  setButtonLoading('revenueUpdateButton', true, 'Đang cập nhật...');
  showLoading('revenueUpdateNotification', 'Đang cập nhật thanh toán...');
  
  const data = {
    stt: stt,
    paymentStatus: document.getElementById('revUpdatePaymentStatus').value,
    paymentMethod: document.getElementById('revUpdatePaymentMethod').value,
    cashPaid: parseMoney(document.getElementById('revUpdateCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('revUpdateTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('revUpdateNotes')?.value || ''
  };

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('revenueUpdateButton', false);
      if (result && result.status === 'success') {
        showSuccess('revenueUpdateNotification', 'Đã cập nhật thanh toán thành công!');
        document.getElementById('revUpdateStt').value = '';
        document.getElementById('revUpdateNotes').value = '';
        refreshDailyReport();
      } else {
        showError('revenueUpdateNotification', result?.message || 'Không tìm thấy giao dịch hoặc lỗi cập nhật.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('revenueUpdateButton', false);
      showError('revenueUpdateNotification', err.message || err);
    })
    .updateRevenuePayment(data);
}

// Global exposure
window.submitRevenue = submitRevenue;
window.submitRevenueUpdate = submitRevenueUpdate;
window.refreshDailyReport = refreshDailyReport;
