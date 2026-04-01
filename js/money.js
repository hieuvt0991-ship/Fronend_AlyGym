/**
 * @file money.js
 * @description Currency formatting, parsing, and complex payment calculation logic for ALY GYM.
 */

/**
 * Định dạng số thành chuỗi tiền tệ VNĐ.
 */
export function formatMoney(amount, includeCurrency = false) {
  if (!amount && amount !== 0) return '';
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(numAmount)) return '';
  const formatted = Math.round(numAmount).toLocaleString('vi-VN');
  return includeCurrency ? `${formatted} VNĐ` : formatted;
}

/**
 * Chuyển chuỗi tiền tệ VNĐ thành số.
 */
export function parseMoney(formattedAmount) {
  if (!formattedAmount) return 0;
  const cleanAmount = formattedAmount.toString().replace(/[^\d.,-]/g, '');
  const normalizedAmount = cleanAmount.replace(/\./g, '').replace(/,/g, '.');
  const result = parseFloat(normalizedAmount);
  return isNaN(result) ? 0 : result;
}

/**
 * Xử lý sự kiện input cho các ô nhập tiền (tự động thêm dấu phân cách).
 */
export function handleMoneyInput(input) {
  if (!input) return;
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const numValue = parseMoney(input.value);
  const newValue = formatMoney(numValue);
  input.value = newValue;
  const lengthDiff = newValue.length - oldValue.length;
  const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
  setTimeout(() => {
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }, 0);
}

/**
 * Tính toán tổng tiền sau khi giảm giá.
 */
export function calculateFinalPrice(pkgPrice, cardPrice, discountAmount, discountPercent) {
  let total = (Number(pkgPrice) || 0) + (Number(cardPrice) || 0);
  if (discountAmount > 0) {
    total = Math.max(0, total - discountAmount);
  }
  if (discountPercent > 0) {
    total = Math.max(0, total - Math.round(total * discountPercent / 100));
  }
  return total;
}

/**
 * Cập nhật tổng tiền dựa trên gói tập và thẻ tháng.
 */
export function setTotalWithMonthCard(pkgPrice, mode = 'register') {
  let seg = 'chungCu';
  let el = null;
  let issueCard = false;
  let trainingType = 'NonPT';
  
  if (mode === 'renew') {
    seg = document.getElementById('renewMonthCardSegment')?.value || 'chungCu';
    trainingType = document.getElementById('renewTrainingType')?.value || 'NonPT';
    el = document.getElementById('renewTotalPrice');
    const issueCardCheck = document.getElementById('renewIssueMonthCard')?.checked;
    const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
    if (onlyCard) {
      issueCard = true;
    } else if (trainingType.startsWith('PT') && issueCardCheck) {
      issueCard = true;
    } else if (trainingType === 'NonPT') {
      // Gym students usually get month card by default or via checkbox
      issueCard = !document.getElementById('renewMonthCardFields').classList.contains('hidden');
    }
  } else if (mode === 'pending') {
    seg = document.getElementById('pendingMonthCardSegment')?.value || 'chungCu';
    el = document.getElementById('pendingTotalPrice');
    issueCard = document.getElementById('pendingIssueMonthCard')?.checked;
  } else {
    seg = document.getElementById('registerMonthCardSegment')?.value || 'chungCu';
    trainingType = document.getElementById('trainingType')?.value || 'NonPT';
    el = document.getElementById('totalPrice');
    const issueCardCheck = document.getElementById('registerIssueMonthCard')?.checked;
    if (trainingType.startsWith('PT')) {
       // Original logic: if PT, issueCard is usually true or depends on UI
       issueCard = true; 
    } else {
       issueCard = issueCardCheck;
    }
  }

  const discountAmount = mode === 'renew'
    ? parseMoney(document.getElementById('renewDiscountAmount')?.value || '0')
    : (mode === 'pending' ? parseMoney(document.getElementById('pendingDiscountAmount')?.value || '0') : parseMoney(document.getElementById('discountAmount')?.value || '0'));
        
  const discountPercent = mode === 'renew'
    ? parseFloat(document.getElementById('renewDiscountPercent')?.value || '0')
    : (mode === 'pending' ? parseFloat(document.getElementById('pendingDiscountPercent')?.value || '0') : parseFloat(document.getElementById('discountPercent')?.value || '0'));

  let cardPrice = 0;
  if (issueCard) {
    cardPrice = (seg === 'chungCu') ? 200000 : 250000;
  }

  const total = calculateFinalPrice(pkgPrice, cardPrice, discountAmount, discountPercent);
  if (el) {
    el.value = formatMoney(total, true);
    el.dataset.basePrice = pkgPrice;
    
    // Trigger hint update if setupPaymentBlock hint exists
    const hintKey = `__update${el.id.charAt(0).toUpperCase() + el.id.slice(1)}Hint`;
    if (typeof window[hintKey] === 'function') window[hintKey]();
  }
}

/**
 * Tính toán lại tổng tiền cho tab tương ứng.
 */
export function recalculateTotal(mode) {
  let pkgPrice = 0;
  if (mode === 'register') {
    const select = document.getElementById('packageCode');
    pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || '0');
  } else if (mode === 'renew') {
    const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
    if (!onlyCard) {
      const select = document.getElementById('renewPackageCode');
      pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || '0');
    }
  } else if (mode === 'pending') {
    const select = document.getElementById('pendingPackageCode');
    pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || '0');
  }
  setTotalWithMonthCard(pkgPrice, mode);
}

// Global exposure
window.handleMoneyInput = handleMoneyInput;
window.recalculateTotal = recalculateTotal;
window.formatMoney = formatMoney;
window.parseMoney = parseMoney;
window.calculateFinalPrice = calculateFinalPrice;
window.setTotalWithMonthCard = setTotalWithMonthCard;
