import { submitCheckInCaller } from './checkin.js';

export function startQRScan() {
  if (window.qrScanner) return;
  const resultDiv = document.getElementById('result');
  if (resultDiv) {
    resultDiv.innerText = 'Đang khởi động camera... Đưa mã QR vào khung quét.';
    resultDiv.className = 'bg-yellow-200 text-yellow-800 p-2 rounded mt-2';
  }
  const qrBoxSize = Math.min(window.innerWidth * 0.8, 400);
  
  // Html5Qrcode is loaded from the CDN in index.html
  window.qrScanner = new Html5Qrcode('reader');
  window.qrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: qrBoxSize, height: qrBoxSize } },
    (qrCodeMessage) => {
      // Basic validation
      if (!/^[a-zA-Z0-9]+$/.test(qrCodeMessage)) {
        if (resultDiv) {
          resultDiv.innerText = 'Mã QR không hợp lệ. Hãy thử lại.';
          resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
        }
        return;
      }
      
      if (window.qrScanner.__processing) return;
      window.qrScanner.__processing = true;
      
      if (resultDiv) {
        resultDiv.innerText = 'Đang xử lý mã QR...';
        resultDiv.className = 'bg-yellow-200 text-yellow-800 p-2 rounded mt-2';
      }
      
      submitCheckInCaller(qrCodeMessage, 'qr');
      stopQRScan();
    },
    (error) => {
      // Quiet warning for non-matches
      // console.warn('QR Scan warning:', error);
    }
  ).catch(err => {
    if (resultDiv) {
      resultDiv.innerText = `Không thể khởi động camera: ${err && err.message ? err.message : err}`;
      resultDiv.className = 'bg-red-200 text-red-800 p-2 rounded mt-2';
    }
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
      resultDiv.className = '';
    }
  }).catch(err => {
    console.error('Stop QR Scan Error:', err);
    window.qrScanner = null;
  });
}

// Global exposure
window.startQRScan = startQRScan;
window.stopQRScan = stopQRScan;
