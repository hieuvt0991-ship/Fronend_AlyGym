/**
 * @file scanner.js
 * @description QR Code scanning logic using html5-qrcode.
 */

import { submitCheckInCaller } from './checkin.js';
import { showToast } from './utils.js';

/**
 * Bắt đầu quét mã QR từ camera.
 */
export function startQRScan() {
  if (window.qrScanner) return;

  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = 'Đang khởi động camera...';
    resultDiv.className = 'text-[10px] text-blue-600 font-bold animate-pulse';
  }

  const qrBoxSize = Math.min(window.innerWidth * 0.8, 300);
  
  // Khởi tạo scanner (Html5Qrcode được nạp từ CDN trong index.html)
  window.qrScanner = new Html5Qrcode('reader');
  
  const config = { 
    fps: 10, 
    qrbox: { width: qrBoxSize, height: qrBoxSize },
    aspectRatio: 1.0
  };

  window.qrScanner.start(
    { facingMode: 'environment' },
    config,
    (qrCodeMessage) => {
      // 1. Validation cơ bản
      if (!qrCodeMessage || qrCodeMessage.length < 3) return;
      
      // 2. Tránh xử lý trùng lặp khi đang chạy
      if (window.qrScanner.__processing) return;
      window.qrScanner.__processing = true;
      
      if (resultDiv) {
        resultDiv.innerText = `Đã nhận mã: ${qrCodeMessage}`;
        resultDiv.className = 'text-[10px] text-green-600 font-black uppercase';
      }
      
      showToast(`Đã quét: ${qrCodeMessage}`, 'info');

      // 3. Gọi hàm điểm danh
      submitCheckInCaller(qrCodeMessage, 'qr');
      
      // 4. Tự động dừng sau khi quét thành công để tiết kiệm pin/CPU
      // (Người dùng có thể bấm MỞ CAMERA lại nếu cần quét tiếp)
      setTimeout(() => {
        stopQRScan();
      }, 1000);
    },
    (error) => {
      // Lỗi này xảy ra liên tục khi không tìm thấy mã trong khung hình, nên để trống
    }
  ).catch(err => {
    console.error('Camera Error:', err);
    if (resultDiv) {
      resultDiv.innerText = 'Không thể mở camera. Hãy kiểm tra quyền truy cập.';
      resultDiv.className = 'text-[10px] text-red-600 font-bold';
    }
    showToast('Lỗi camera: ' + (err.message || 'Không xác định'), 'error');
    window.qrScanner = null;
  });
}

/**
 * Dừng quét và giải phóng camera.
 */
export function stopQRScan() {
  if (!window.qrScanner) return;

  window.qrScanner.stop().then(() => {
    window.qrScanner.clear();
    window.qrScanner = null;
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
      resultDiv.innerText = 'Đã dừng quét.';
      resultDiv.className = 'text-[10px] text-gray-500 italic';
    }
  }).catch(err => {
    console.error('Stop QR Scan Error:', err);
    window.qrScanner = null;
  });
}

// Global exposure cho các sự kiện onclick trong HTML
window.startQRScan = startQRScan;
window.stopQRScan = stopQRScan;
