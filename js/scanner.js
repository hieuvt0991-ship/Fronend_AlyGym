/**
 * @file scanner.js
 * @description QR Scanner logic using html5-qrcode.
 */

import { submitCheckInCaller } from './checkin.js';

// KHÔNG import showToast nữa vì đã có global từ utils.js

export function startQRScan() {
  if (window.qrScanner) return;

  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = 'Đang khởi động camera...';
    resultDiv.className = 'text-[10px] text-blue-600 font-bold animate-pulse';
  }

  const qrBoxSize = Math.min(window.innerWidth * 0.8, 300);
  
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
      if (!qrCodeMessage || qrCodeMessage.length < 3) return;
      
      if (window.qrScanner.__processing) return;
      window.qrScanner.__processing = true;
      
      if (resultDiv) {
        resultDiv.innerText = `Đã nhận mã: ${qrCodeMessage}`;
        resultDiv.className = 'text-[10px] text-green-600 font-black uppercase';
      }
      
      window.showToast(`Đã quét: ${qrCodeMessage}`, 'info');   // ← Dùng window.showToast

      submitCheckInCaller(qrCodeMessage, 'qr');
      
      setTimeout(() => {
        stopQRScan();
      }, 1000);
    },
    (error) => {
      // Bỏ qua lỗi không tìm thấy mã (thường xuyên xảy ra)
    }
  ).catch(err => {
    console.error('Camera Error:', err);
    if (resultDiv) {
      resultDiv.innerText = 'Không thể mở camera. Hãy kiểm tra quyền truy cập.';
      resultDiv.className = 'text-[10px] text-red-600 font-bold';
    }
    window.showToast('Lỗi camera: ' + (err.message || 'Không xác định'), 'error');
    window.qrScanner = null;
  });
}

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

// Global exposure cho HTML onclick
window.startQRScan = startQRScan;
window.stopQRScan = stopQRScan;
