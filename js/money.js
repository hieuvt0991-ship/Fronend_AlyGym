export function formatMoney(amount, includeCurrency = false) {
  if (!amount && amount !== 0) return '';
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  if (isNaN(numAmount)) return '';
  const formatted = numAmount.toLocaleString('vi-VN');
  return includeCurrency ? `${formatted} VNĐ` : formatted;
}

export function parseMoney(formattedAmount) {
  if (!formattedAmount) return 0;
  const cleanAmount = formattedAmount.toString().replace(/[^\d.,-]/g, '');
  const normalizedAmount = cleanAmount.replace(/\./g, '').replace(/,/g, '.');
  const result = parseFloat(normalizedAmount);
  return isNaN(result) ? 0 : result;
}

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

export function setTotalWithMonthCard(pkgPrice, mode = 'register') {
  let seg = 'chungCu';
  let el = null;
  let issueCard = false;
  let updateHint = null;
  
  if (mode === 'renew') {
    seg = document.getElementById('renewMonthCardSegment')?.value || 'chungCu';
    el = document.getElementById('renewTotalPrice');
    issueCard = document.getElementById('renewIssueMonthCard')?.checked;
    updateHint = window.__updateRenewPaymentHint;
  } else if (mode === 'pending') {
    seg = document.getElementById('pendingMonthCardSegment')?.value || 'chungCu';
    el = document.getElementById('pendingTotalPrice');
    issueCard = document.getElementById('pendingIssueMonthCard')?.checked;
    updateHint = window.__updatePendingPaymentHint;
  } else {
    seg = 'chungCu'; // Default for new registration (or add select to UI)
    el = document.getElementById('totalPrice');
    issueCard = document.getElementById('registerIssueMonthCard')?.checked;
    updateHint = window.__updateRegisterPaymentHint;
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
    // Trigger debt hint update if payment block is initialized
    if (typeof updateHint === 'function') updateHint();
  }
}

export function recalculateTotal(mode) {
  let pkgPrice = 0;
  if (mode === 'register') {
    const select = document.getElementById('packageCode');
    pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || '0');
  } else if (mode === 'renew') {
    const select = document.getElementById('renewPackageCode');
    pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || '0');
  }
  setTotalWithMonthCard(pkgPrice, mode);
}

// Global exposure
window.handleMoneyInput = handleMoneyInput;
window.recalculateTotal = recalculateTotal;
window.formatMoney = formatMoney;
window.parseMoney = parseMoney;
