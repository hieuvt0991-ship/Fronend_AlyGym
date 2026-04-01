/**
 * @file scanner.js
 * @description QR Scanner logic using html5-qrcode.
 */

import { submitCheckInCaller } from './checkin.js';

export function startQRScan() {
  if (window.qrScanner) return;

  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = 'Đang khởi động camera...';
    resultDiv.className = 'text-[10px] text-blue-600 font-bold animate-pulse';
  }

  const qrBoxSize = Math.min(window.innerWidth * 0.8, 300);
  window.qrScanner = new Html5Qrcode('reader');

  window.qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: qrBoxSize, height: qrBoxSize } },
    (qrCodeMessage) => {
      if (window.qrScanner.__processing) return;
      window.qrScanner.__processing = true;

      window.showToast(`Đã quét: ${qrCodeMessage}`, 'info');
      submitCheckInCaller(qrCodeMessage, 'qr');

      setTimeout(() => stopQRScan(), 1000);
    },
    () => {} // ignore constant scan errors
  ).catch(err => {
    console.error('Camera Error:', err);
    window.showToast('Lỗi camera: ' + (err.message || 'Không xác định'), 'error');
    window.qrScanner = null;
  });
}

export function stopQRScan() {
  if (!window.qrScanner) return;
  window.qrScanner.stop().then(() => {
    window.qrScanner.clear();
    window.qrScanner = null;
  }).catch(() => {});
}

// Global exposure cho HTML onclick
window.startQRScan = startQRScan;
window.stopQRScan = stopQRScan;