/**
 * @file revenue.js
 * @description Logic for the revenue tab.
 */

import { apiRunner } from './api.js';
import { showLoading, showError, showSuccess, getStaffName } from './utils.js';
import { formatMoney, parseMoney } from './money.js';

export function submitRevenue() {
  const description = document.getElementById('revDescription')?.value.trim();
  const price = document.getElementById('revPrice')?.value;
  
  if (!description || !price) {
    showError('revenueNotification', 'Vui lòng nhập mô tả và đơn giá');
    return;
  }

  showLoading('revenueNotification', 'Đang lưu...');
  
  const data = {
    type: document.getElementById('revType').value,
    description: description,
    quantity: document.getElementById('revQuantity').value,
    price: parseMoney(price),
    paymentStatus: document.getElementById('revPaymentStatus').value,
    paymentMethod: document.getElementById('revPaymentMethod').value,
    staff: getStaffName()
  };

  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        showSuccess('revenueNotification', 'Đã lưu doanh thu thành công!');
        document.getElementById('revenueForm').reset();
        refreshDailyReport();
      } else {
        showError('revenueNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      showError('revenueNotification', err.message || err);
    })
    .recordOtherRevenue(data);
}

export function refreshDailyReport() {
  const content = document.getElementById('dailyReportContent');
  content.innerHTML = '<div class="text-sm text-gray-500">Đang tải báo cáo...</div>';
  
  apiRunner
    .withSuccessHandler(result => {
      if (result && result.status === 'success') {
        content.innerHTML = `
          <div class="text-2xl font-bold text-blue-700">${formatMoney(result.totalAmount, true)}</div>
          <div class="text-xs text-gray-500 mt-1">Tổng cộng ${result.count || 0} giao dịch hôm nay</div>
        `;
      } else {
        content.innerHTML = '<div class="text-red-500">Không thể tải báo cáo</div>';
      }
    })
    .withFailureHandler(() => {
      content.innerHTML = '<div class="text-red-500">Lỗi kết nối</div>';
    })
    .getDailyRevenueReport();
}

export function submitRevenueUpdate() {
  const stt = document.getElementById('revUpdateStt')?.value;
  if (!stt) {
    showError('revenueUpdateNotification', 'Vui lòng nhập STT giao dịch');
    return;
  }

  showLoading('revenueUpdateNotification', 'Đang cập nhật...');
  
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
      showError('revenueUpdateNotification', err.message || err);
    })
    .updateRevenuePayment(data);
}

// Global exposure
window.submitRevenue = submitRevenue;
window.submitRevenueUpdate = submitRevenueUpdate;
window.refreshDailyReport = refreshDailyReport;
