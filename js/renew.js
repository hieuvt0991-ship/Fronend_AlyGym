/**
 * @file renew.js
 * @description Logic for the renewal tab with full feature parity from old system.
 */

import { apiRunner } from './api.js';
import { 
  showLoading, showError, showSuccess, formatPhoneNumber, 
  setButtonLoading, getStaffName, setupPaymentBlock,
  formatDDMMYYYY, escapeHtml, generatePTGroupId
} from './utils.js';
import { formatMoney, parseMoney } from './money.js';

// State management
let __renewSearchCtx = { isActive: false, forcePendingMode: false };
let __renewMonthCardStatus = null;

/**
 * Main search function for student renewal
 */
export function searchStudentForRenew() {
  const input = document.getElementById('searchStudentId')?.value.trim();
  const infoBox = document.getElementById('renewStudentInfo');
  const renewForm = document.getElementById('renewForm');
  const notification = document.getElementById('renewNotification');
  
  if (!input) {
    showError('renewNotification', 'Vui lòng nhập mã HV, tên hoặc SĐT');
    return;
  }

  if (notification) notification.innerHTML = '';
  showLoading('renewStudentInfo', 'Đang tìm kiếm học viên...');
  setButtonLoading('renewSearchButton', true, 'Đang tìm...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('renewSearchButton', false);
      if (result && result.status === 'success') {
        const student = result.data;
        __renewSearchCtx = { 
          isActive: student.isActive, 
          forcePendingMode: student.hasPending 
        };
        __renewMonthCardStatus = student.monthCard || null;
        
        renderStudentInfo(student);
        renewForm.classList.remove('hidden');
        
        // Auto-fill form based on student data
        const isPT = student.studentId && student.studentId.startsWith('APT');
        const trainingTypeEl = document.getElementById('renewTrainingType');
        if (trainingTypeEl) {
          trainingTypeEl.value = isPT ? (student.trainingType || 'PT1:1') : 'NonPT';
        }

        // Initialize form state
        toggleRenewSwitchPackage(); // Ensure fields are locked/unlocked correctly
        updateRenewPackageOptions();
        
        // Set default dates
        const today = new Date();
        const startDateEl = document.getElementById('renewStartDate');
        if (startDateEl) {
          let defaultStart = new Date();
          if (student.endDate) {
            const [d, m, y] = student.endDate.split('/');
            const end = new Date(y, m - 1, d);
            if (end >= today) {
              defaultStart = new Date(end);
              defaultStart.setDate(end.getDate() + 1);
            }
          }
          startDateEl.value = defaultStart.toISOString().split('T')[0];
        }

        // Handle PT visibility
        refreshPTFieldsVisibility();
        
        // Setup payment hint
        recalculateTotal('renew');
        
        // If has pending, show warning
        if (student.hasPending) {
          const warning = `<div class="bg-orange-100 text-orange-800 p-3 rounded-xl border border-orange-200 mb-3 text-xs font-bold">
            ⚠️ Học viên đang có gói chờ kích hoạt (${student.pendingPackageCode}). Vui lòng kiểm tra trước khi gia hạn thêm.
          </div>`;
          infoBox.insertAdjacentHTML('afterbegin', warning);
        }
      } else {
        showError('renewStudentInfo', result?.message || 'Không tìm thấy học viên.');
        renewForm.classList.add('hidden');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('renewSearchButton', false);
      showError('renewStudentInfo', err.message || err);
      renewForm.classList.add('hidden');
    })
    .getStudentForRenew({ studentId: input });
}

function renderStudentInfo(student) {
  const box = document.getElementById('renewStudentInfo');
  const isActive = student.isActive;
  const statusColor = isActive ? 'green' : 'red';
  const statusText = isActive ? 'ĐANG HOẠT ĐỘNG' : 'HẾT HẠN / NGỪNG';
  
  box.innerHTML = `
    <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-black">${student.fullName.charAt(0)}</div>
          <div>
            <div class="font-black text-gray-800 text-lg leading-tight">${escapeHtml(student.fullName)}</div>
            <div class="text-[10px] font-bold text-blue-500 uppercase tracking-widest">${student.studentId} • ${formatPhoneNumber(student.phone)}</div>
          </div>
        </div>
        <div class="px-3 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-700 text-[10px] font-black uppercase">${statusText}</div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-dashed">
        <div class="space-y-0.5">
          <div class="text-[9px] font-bold text-gray-400 uppercase">Gói hiện tại</div>
          <div class="text-xs font-black text-gray-700 truncate">${student.packageCode || 'N/A'}</div>
        </div>
        <div class="space-y-0.5">
          <div class="text-[9px] font-bold text-gray-400 uppercase">Hạn dùng</div>
          <div class="text-xs font-black text-gray-700">${student.endDate || 'N/A'}</div>
        </div>
        <div class="space-y-0.5">
          <div class="text-[9px] font-bold text-gray-400 uppercase">Còn lại</div>
          <div class="text-xs font-black text-orange-600">${student.remainingSessions || 0} buổi</div>
        </div>
        <div class="space-y-0.5">
          <div class="text-[9px] font-bold text-gray-400 uppercase">Thẻ tháng</div>
          <div class="text-xs font-black ${student.monthCard?.isActive ? 'text-green-600' : 'text-gray-400'}">
            ${student.monthCard?.isActive ? 'CÒN HẠN' : (student.monthCard?.exists ? 'HẾT HẠN' : 'KHÔNG CÓ')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function updateRenewPackageOptions() {
  const select = document.getElementById('renewPackageCode');
  if (!select) return;
  
  const type = document.getElementById('renewTrainingType')?.value || 'NonPT';
  const switchPkg = document.getElementById('renewSwitchPackageToggle')?.checked;
  
  select.innerHTML = '';
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  
  let filtered = [];
  if (type === 'NonPT') {
    filtered = pkgList.filter(p => p.type === 'Gym_NonPT');
  } else {
    // Filter PT packages by subtype (1:1, 2:1, 3:1)
    filtered = pkgList.filter(p => p.type === 'Gym_PT' && p.code.startsWith(type + ':'));
    // Fallback if startsWith fails
    if (filtered.length === 0) {
      filtered = pkgList.filter(p => p.type === 'Gym_PT');
    }
  }

  filtered.forEach(p => {
    const opt = new Option(`${p.code} - ${p.sessions} buổi - ${formatMoney(p.price, true)}`, p.code);
    opt.dataset.price = p.price;
    opt.dataset.sessions = p.sessions;
    select.add(opt);
  });
  
  refreshPTFieldsVisibility();
  recalculateTotal('renew');
}

export function toggleRenewSwitchPackage() {
  const switchPkg = document.getElementById('renewSwitchPackageToggle')?.checked;
  const typeContainer = document.getElementById('renewTrainingTypeContainer');
  const typeSelect = document.getElementById('renewTrainingType');
  
  if (typeContainer) typeContainer.classList.toggle('hidden', !switchPkg);
  if (typeSelect) typeSelect.disabled = !switchPkg;
  
  updateRenewPackageOptions();
  updateConvertButtons();
}

export function toggleRenewMonthCardOnly() {
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const pkgCode = document.getElementById('renewPackageCode');
  const ptRow = document.getElementById('renewPtRow');
  const issueCard = document.getElementById('renewIssueMonthCard');
  const monthExtra = document.getElementById('renewMonthCardExtra');
  
  if (pkgCode) pkgCode.disabled = onlyCard;
  if (ptRow && onlyCard) ptRow.classList.add('hidden');
  if (issueCard) {
    issueCard.checked = onlyCard;
    issueCard.disabled = onlyCard;
  }
  if (monthExtra) monthExtra.classList.toggle('hidden', !onlyCard);
  
  recalculateTotal('renew');
}

export function toggleRenewMode() {
  const mode = document.querySelector('input[name="renewMode"]:checked')?.value;
  const label = document.getElementById('renewDateLabel');
  const btn = document.getElementById('submitBtn');
  
  if (label) label.textContent = mode === 'pendingLater' ? 'Ngày kích hoạt dự kiến' : 'Ngày bắt đầu';
  if (btn) btn.textContent = mode === 'pendingLater' ? '✅ ĐĂNG KÝ GÓI CHỜ' : '✅ XÁC NHẬN GIA HẠN';
}

function refreshPTFieldsVisibility() {
  const type = document.getElementById('renewTrainingType')?.value || '';
  const ptRow = document.getElementById('renewPtRow');
  const isPT = type.startsWith('PT');
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  
  if (ptRow) ptRow.classList.toggle('hidden', !isPT || onlyCard);
}

function updateConvertButtons() {
  const studentId = document.getElementById('searchStudentId')?.value || '';
  const type = document.getElementById('renewTrainingType')?.value || '';
  const switchPkg = document.getElementById('renewSwitchPackageToggle')?.checked;
  const btnNonPT = document.getElementById('convertToNonPTBtn');
  const btnPT = document.getElementById('convertToPTBtn');
  
  const isAPT = studentId.startsWith('APT');
  const isAG = studentId.startsWith('AG');
  
  if (btnNonPT) btnNonPT.classList.toggle('hidden', !(switchPkg && isAPT && type === 'NonPT'));
  if (btnPT) btnPT.classList.toggle('hidden', !(switchPkg && isAG && type.startsWith('PT')));
}

export function confirmAndRenew() {
  const packageCode = document.getElementById('renewPackageCode')?.value;
  const startDate = document.getElementById('renewStartDate')?.value;
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const mode = document.querySelector('input[name="renewMode"]:checked')?.value;
  
  if (!onlyCard && !packageCode) {
    showError('renewNotification', 'Vui lòng chọn gói tập');
    return;
  }
  if (!startDate) {
    showError('renewNotification', 'Vui lòng chọn ngày bắt đầu');
    return;
  }

  const msg = mode === 'pendingLater' ? 'Bạn chắc chắn muốn đăng ký gói chờ?' : 'Bạn chắc chắn muốn gia hạn?';
  if (!confirm(msg)) return;

  setButtonLoading('submitBtn', true, 'Đang xử lý...');
  showLoading('renewNotification', 'Đang gửi yêu cầu...');
  
  const studentId = document.getElementById('searchStudentId').value;
  const type = document.getElementById('renewTrainingType').value;

  const data = {
    studentId: studentId,
    packageCode: onlyCard ? 'MONTH_CARD_ONLY' : packageCode,
    startDate,
    mode, // 'renewNow' or 'pendingLater'
    staff: getStaffName(),
    paymentStatus: document.getElementById('renewPaymentStatus').value,
    paymentMethod: document.getElementById('renewPaymentMethod').value,
    cashPaid: parseMoney(document.getElementById('renewCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('renewTransferPaid')?.value || '0'),
    discountAmount: parseMoney(document.getElementById('renewDiscountAmount').value || '0'),
    discountPercent: parseFloat(document.getElementById('renewDiscountPercent').value || '0'),
    issueMonthCard: document.getElementById('renewIssueMonthCard').checked,
    monthCardSegment: document.getElementById('renewMonthCardSegment')?.value || 'chungCu',
    ptCode: type.startsWith('PT') ? document.getElementById('renewPtCode')?.value : '',
    ptGroupId: type.startsWith('PT') ? document.getElementById('renewPtGroupId')?.value : '',
    notes: document.getElementById('renewNotes')?.value || ''
  };

  const action = mode === 'pendingLater' ? 'registerPendingPackage' : 'renewStudent';

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('submitBtn', false);
      if (result && result.status === 'success') {
        showSuccess('renewNotification', `${mode === 'pendingLater' ? 'Đăng ký gói chờ' : 'Gia hạn'} thành công cho học viên ${result.fullName}!`);
        // Refresh cache and search again to show updated info
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
        setTimeout(() => searchStudentForRenew(), 1500);
      } else {
        showError('renewNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('submitBtn', false);
      showError('renewNotification', err.message || err);
    })[action](data);
}

// Convert Functions
export function convertToNonPT() {
  const studentId = document.getElementById('searchStudentId')?.value;
  if (!confirm(`Bạn chắc chắn muốn chuyển học viên ${studentId} sang Tự tập (AG)?`)) return;
  
  setButtonLoading('convertToNonPTBtn', true, 'Đang chuyển...');
  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('convertToNonPTBtn', false);
      if (result.status === 'success') {
        showSuccess('renewNotification', `Chuyển đổi thành công! Mã mới: ${result.newStudentId}`);
        document.getElementById('searchStudentId').value = result.newStudentId;
        searchStudentForRenew();
      } else showError('renewNotification', result.message);
    })
    .withFailureHandler(err => {
      setButtonLoading('convertToNonPTBtn', false);
      showError('renewNotification', err.message);
    })
    .convertStudentType({ studentId, targetType: 'NonPT' });
}

export function convertToPT() {
  const studentId = document.getElementById('searchStudentId')?.value;
  if (!confirm(`Bạn chắc chắn muốn chuyển học viên ${studentId} sang PT (APT)?`)) return;
  
  setButtonLoading('convertToPTBtn', true, 'Đang chuyển...');
  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('convertToPTBtn', false);
      if (result.status === 'success') {
        showSuccess('renewNotification', `Chuyển đổi thành công! Mã mới: ${result.newStudentId}`);
        document.getElementById('searchStudentId').value = result.newStudentId;
        searchStudentForRenew();
      } else showError('renewNotification', result.message);
    })
    .withFailureHandler(err => {
      setButtonLoading('convertToPTBtn', false);
      showError('renewNotification', err.message);
    })
    .convertStudentType({ studentId, targetType: 'PT' });
}

// Initialize Payment Logic
setupPaymentBlock({
  statusId: 'renewPaymentStatus',
  methodId: 'renewPaymentMethod',
  splitId: 'renewPaymentSplit',
  cashId: 'renewCashPaid',
  transferId: 'renewTransferPaid',
  hintId: 'renewDebtHint',
  getTotal: () => parseMoney(document.getElementById('renewTotalPrice')?.value || '0'),
  onInit: (update) => {
    window.__updateRenewPaymentHint = update;
  }
});

// Global exposure
window.searchStudentForRenew = searchStudentForRenew;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.confirmAndRenew = confirmAndRenew;
window.toggleRenewSwitchPackage = toggleRenewSwitchPackage;
window.toggleRenewMonthCardOnly = toggleRenewMonthCardOnly;
window.toggleRenewMode = toggleRenewMode;
window.convertToNonPT = convertToNonPT;
window.convertToPT = convertToPT;
