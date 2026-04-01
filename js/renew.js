/**
 * @file renew.js
 * @description Logic for renewing student packages and converting student types.
 */

import { apiRunner } from './api.js';
import { formatMoney, parseMoney, setTotalWithMonthCard } from './money.js';
import { 
  showLoading, showError, showSuccess, getStaffName, 
  setButtonLoading, formatPhoneNumber, escapeHtml, showToast, toDateInputValue 
} from './utils.js';

/**
 * Tìm kiếm học viên để gia hạn.
 */
export function searchStudentForRenew() {
  const input = document.getElementById('searchStudentId')?.value?.trim();
  const searchTrainingType = document.getElementById('renewSearchTrainingType')?.value;

  if (!input) {
    showToast('Vui lòng nhập mã HV, SĐT hoặc tên', 'warning');
    return;
  }

  showLoading('studentInfoRenew', 'Đang tìm kiếm học viên...');
  document.getElementById('renewForm').classList.add('hidden');

  apiRunner
    .withSuccessHandler(result => {
      document.getElementById('studentInfoRenew').innerHTML = '';
      if (result && result.status === 'success') {
        const student = result.data;
        renderStudentInfoRenew(student);
        document.getElementById('renewForm').classList.remove('hidden');
        
        // Cập nhật các trường ẩn
        document.getElementById('studentId').value = student.studentId;
        document.getElementById('sheetName').value = student.sheetName;
        document.getElementById('currentPackageCode').value = student.currentPackage;
        
        // Thiết lập ngày bắt đầu mặc định
        const startDateInput = document.getElementById('renewStartDate');
        if (student.endDate) {
          const lastDate = new Date(student.endDate);
          const nextDate = new Date(lastDate);
          nextDate.setDate(lastDate.getDate() + 1);
          startDateInput.value = toDateInputValue(nextDate);
        } else {
          startDateInput.value = toDateInputValue(new Date());
        }

        // Tự động thiết lập hình thức tập dựa trên mã học viên
        const trainingTypeSelect = document.getElementById('renewTrainingType');
        if (student.studentId.startsWith('APT')) {
          trainingTypeSelect.value = 'PT1:1';
        } else {
          trainingTypeSelect.value = 'NonPT';
        }
        
        // Reset toggle đổi gói
        document.getElementById('renewSwitchPackageToggle').checked = false;
        toggleRenewPTFields();
        
        updateRenewPackageOptions();
      } else {
        showError('studentInfoRenew', result?.message || 'Không tìm thấy học viên.');
      }
    })
    .withFailureHandler(err => {
      showError('studentInfoRenew', err.message || err);
    })
    .getStudentForRenew({ studentId: input, trainingType: searchTrainingType });
}

/**
 * Hiển thị thông tin học viên tìm thấy.
 */
function renderStudentInfoRenew(student) {
  const box = document.getElementById('studentInfoRenew');
  const isApt = (student.studentId || '').startsWith('APT');
  const statusClass = student.status === 'Hết hạn' ? 'text-red-600' : 'text-green-600';
  
  let pendingWarning = '';
  if (student.hasPending) {
    pendingWarning = `
      <div class="bg-orange-100 border border-orange-200 text-orange-800 p-2 rounded-lg text-[10px] mb-3 flex items-center gap-2 animate-pulse">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Học viên đang có gói chờ kích hoạt vào ngày <strong>${student.pendingActivationDate || 'chưa rõ'}</strong>. Hệ thống sẽ tự động chuyển sang chế độ "Đăng ký chờ".</span>
      </div>
    `;
  }

  let cardStatus = '';
  if (student.monthCard && student.monthCard.exists) {
    const mc = student.monthCard;
    const cardClass = mc.isActive ? 'text-green-600' : 'text-red-600';
    cardStatus = `
      <div class="text-[9px] font-bold ${cardClass} mt-1">
        <i class="fas fa-id-card mr-1"></i>Thẻ tháng: ${mc.state} (Hạn: ${mc.endDate || 'N/A'})
      </div>
    `;
  }
  
  box.innerHTML = `
    ${pendingWarning}
    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between gap-4 animate-in fade-in duration-300">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-blue-900 uppercase">${escapeHtml(student.fullName)}</span>
          <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold tracking-tighter">${student.studentId}</span>
        </div>
        <div class="text-[10px] text-gray-600 font-bold">
          <i class="fas fa-phone-alt mr-1"></i> ${formatPhoneNumber(student.phone)}
          <span class="mx-2">|</span>
          <i class="fas fa-box mr-1"></i> ${escapeHtml(student.currentPackage)}
        </div>
        <div class="text-[10px] text-gray-500 italic">Hết hạn: ${student.endDate || 'Chưa rõ'}</div>
        ${cardStatus}
      </div>
      <div class="flex flex-col md:items-end justify-center">
        <div class="text-[10px] font-black uppercase tracking-widest ${statusClass}">${student.status}</div>
        <div class="text-[10px] font-bold text-gray-500 italic">Còn lại: ${student.remainSessions} buổi ${isApt ? '(PT)' : ''}</div>
      </div>
    </div>
  `;
  
  // Logic xử lý khi có gói chờ hoặc còn hạn
  const renewModeRenew = document.querySelector('input[name="renewMode"][value="renewNow"]');
  const renewModePending = document.querySelector('input[name="renewMode"][value="pendingLater"]');
  
  if (student.hasPending) {
    if (renewModeRenew) { renewModeRenew.disabled = true; renewModeRenew.checked = false; }
    if (renewModePending) { renewModePending.disabled = false; renewModePending.checked = true; }
  } else {
    if (renewModeRenew) { renewModeRenew.disabled = false; }
    if (renewModePending) { renewModePending.disabled = false; }
  }
  
  // Nút chuyển đổi loại thẻ
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'mt-4 flex flex-wrap gap-2';
  actionsDiv.innerHTML = `
    <button onclick="toggleConvertStudentType()" class="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
      <i class="fas fa-exchange-alt mr-1"></i> Chuyển sang ${isApt ? 'Gym' : 'PT'}
    </button>
  `;
  box.appendChild(actionsDiv);


  const convertDiv = document.createElement('div');
  convertDiv.id = 'convertSection';
  convertDiv.className = 'hidden mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 animate-in slide-in-from-top-2';
  convertDiv.innerHTML = `
    <div class="text-[10px] font-black text-orange-800 uppercase mb-2">Xác nhận chuyển đổi loại thẻ</div>
    <div class="text-[10px] text-orange-700 italic mb-2">Hệ thống sẽ tạo mã mới và bảo lưu các buổi tập chưa sử dụng.</div>
    <button onclick="submitConvertStudentType('${student.studentId}')" id="convertButton" class="w-full bg-orange-600 text-white py-2 rounded-lg font-black text-[10px] uppercase shadow-sm">Thực hiện chuyển đổi</button>
  `;
  box.appendChild(convertDiv);
}

/**
 * Điều khiển việc hiển thị các trường PT trong tab gia hạn.
 */
export function toggleRenewPTFields() {
  const switchPkg = document.getElementById('renewSwitchPackageToggle')?.checked;
  const trainingTypeSelect = document.getElementById('renewTrainingType');
  const ptFields = document.getElementById('renewPtFields');
  const ptGroupField = document.getElementById('renewPtGroupField');
  const monthCardFields = document.getElementById('renewMonthCardFields');
  
  // Cho phép chọn hình thức tập nếu đổi gói
  trainingTypeSelect.disabled = !switchPkg;
  
  const trainingType = trainingTypeSelect?.value || 'NonPT';
  const isPT = trainingType.startsWith('PT');
  
  if (ptFields) ptFields.classList.toggle('hidden', !isPT);
  if (ptGroupField) ptGroupField.classList.toggle('hidden', !isPT || trainingType === 'PT1:1');
  if (monthCardFields) monthCardFields.classList.toggle('hidden', isPT);
  
  updateRenewPackageOptions();
}

/**
 * Cập nhật danh sách gói tập cho gia hạn.
 */
export function updateRenewPackageOptions() {
  const switchPkg = document.getElementById('renewSwitchPackageToggle')?.checked;
  const trainingType = document.getElementById('renewTrainingType')?.value || 'NonPT';
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const currentPkgBadge = document.getElementById('renewCurrentPkgBadge');
  const select = document.getElementById('renewPackageCode');
  
  if (!select) return;

  if (onlyCard) {
    select.innerHTML = '<option value="MONTH_CARD_ONLY">Chỉ gia hạn thẻ tháng</option>';
    select.disabled = true;
    updateRenewTotalPrice();
    return;
  }

  select.disabled = false;
  const pkgList = Array.isArray(window.packages) ? window.packages : [];
  
  if (!switchPkg) {
    // Nếu không đổi gói, chỉ hiển thị gói hiện tại
    const currentPkgCode = document.getElementById('currentPackageCode')?.value;
    const pkg = pkgList.find(p => p.code === currentPkgCode);
    
    select.innerHTML = '';
    if (pkg) {
      const opt = new Option(`${pkg.code} - ${pkg.sessions} b - ${formatMoney(pkg.price, true)}`, pkg.code);
      opt.dataset.price = pkg.price;
      opt.dataset.sessions = pkg.sessions;
      select.add(opt);
    }
    if (currentPkgBadge) currentPkgBadge.classList.remove('hidden');
  } else {
    // Nếu đổi gói, hiển thị danh sách gói theo hình thức tập mới
    if (currentPkgBadge) currentPkgBadge.classList.add('hidden');
    select.innerHTML = '<option value="">-- Chọn gói mới --</option>';
    
    let filtered = [];
    if (trainingType === 'NonPT') {
      filtered = pkgList.filter(p => p.type === 'Gym_NonPT');
    } else {
      // PT subtype (1:1, 2:1, 3:1) - Logic khớp bản cũ
      filtered = pkgList.filter(p => p.type === 'Gym_PT' && String(p.code || '').startsWith(trainingType));
    }

    filtered.forEach(p => {
      const opt = new Option(`${p.code} - ${p.sessions} b - ${formatMoney(p.price, true)}`, p.code);
      opt.dataset.price = p.price;
      opt.dataset.sessions = p.sessions;
      select.add(opt);
    });
  }
  
  updateRenewTotalPrice();
}

/**
 * Cập nhật tổng tiền gia hạn.
 */
export function updateRenewTotalPrice() {
  const select = document.getElementById('renewPackageCode');
  const pkgPrice = Number(select?.selectedOptions[0]?.dataset.price || 0);
  setTotalWithMonthCard(pkgPrice, 'renew');
}

/**
 * Gửi form gia hạn.
 */
export function submitRenewForm() {
  const studentId = document.getElementById('studentId')?.value;
  const onlyCard = document.getElementById('renewMonthCardOnly')?.checked;
  const packageCode = document.getElementById('renewPackageCode')?.value;
  const startDate = document.getElementById('renewStartDate')?.value;

  if (!studentId || (!onlyCard && !packageCode) || !startDate) {
    showToast('Vui lòng điền đầy đủ thông tin gia hạn!', 'warning');
    return;
  }

  const pkgSelect = document.getElementById('renewPackageCode');
  const selectedPkg = pkgSelect?.selectedOptions[0];

  const formData = {
    studentId,
    sheetName: document.getElementById('sheetName').value,
    onlyMonthCard: onlyCard,
    packageCode: onlyCard ? 'MONTH_CARD_ONLY' : packageCode,
    sessions: onlyCard ? 0 : (selectedPkg?.dataset.sessions || 0),
    price: onlyCard ? 0 : (selectedPkg?.dataset.price || 0),
    startDate,
    paymentStatus: document.getElementById('renewPaymentStatus')?.value || 'Đã thanh toán',
    paymentMethod: document.getElementById('renewPaymentMethod')?.value || 'Tiền mặt',
    cashPaid: parseMoney(document.getElementById('renewCashPaid')?.value || '0'),
    transferPaid: parseMoney(document.getElementById('renewTransferPaid')?.value || '0'),
    staff: getStaffName(),
    notes: document.getElementById('renewNotes')?.value || '',
    issueMonthCard: document.getElementById('renewIssueMonthCard')?.checked || false,
    monthCardSegment: document.getElementById('renewMonthCardSegment')?.value || 'chungCu',
    ptCode: document.getElementById('renewPtCode')?.value || '',
    ptGroupId: document.getElementById('renewPtGroupId')?.value || ''
  };

  // Logic đăng ký gói chờ nếu chọn mode pending
  const mode = document.querySelector('input[name="renewMode"]:checked')?.value;
  const action = mode === 'pendingLater' ? 'registerPendingPackage' : 'renewStudent';

  setButtonLoading('submitBtn', true, 'Đang xử lý...');
  showLoading('renewNotification', 'Đang gửi yêu cầu lên hệ thống...');

  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('submitBtn', false);
      if (result && result.status === 'success') {
        showSuccess('renewNotification', `${mode === 'pendingLater' ? 'Đăng ký gói chờ' : 'Gia hạn'} thành công cho học viên ${studentId}!`);
        document.getElementById('renewForm').classList.add('hidden');
        searchStudentForRenew();
        if (typeof window.refreshStudentCache === 'function') window.refreshStudentCache();
      } else {
        showError('renewNotification', result?.message || 'Có lỗi xảy ra.');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('submitBtn', false);
      showError('renewNotification', err.message || err);
    })[action](formData);
}

/**
 * Hiện/ẩn phần chuyển đổi loại thẻ.
 */
export function toggleConvertStudentType() {
  const sec = document.getElementById('convertSection');
  if (sec) sec.classList.toggle('hidden');
}

/**
 * Gửi yêu cầu chuyển đổi loại thẻ.
 */
export function submitConvertStudentType(studentId) {
  if (!confirm('Bạn có chắc chắn muốn chuyển đổi loại thẻ cho học viên này không?')) return;
  
  setButtonLoading('convertButton', true, 'Đang xử lý...');
  
  apiRunner
    .withSuccessHandler(result => {
      setButtonLoading('convertButton', false);
      if (result && result.status === 'success') {
        showToast(`Chuyển đổi thành công! Mã mới: ${result.data.newStudentId}`, 'success');
        document.getElementById('searchStudentId').value = result.data.newStudentId;
        searchStudentForRenew();
      } else {
        showToast(result?.message || 'Lỗi chuyển đổi', 'error');
      }
    })
    .withFailureHandler(err => {
      setButtonLoading('convertButton', false);
      showToast(err.message || err, 'error');
    })
    .convertStudentType({ studentId, staff: getStaffName() });
}

// Global exposure
window.searchStudentForRenew = searchStudentForRenew;
window.toggleRenewPTFields = toggleRenewPTFields;
window.updateRenewPackageOptions = updateRenewPackageOptions;
window.updateRenewTotalPrice = updateRenewTotalPrice;
window.confirmAndRenew = submitRenewForm; // Map to the button onclick
window.toggleConvertStudentType = toggleConvertStudentType;
window.submitConvertStudentType = submitConvertStudentType;
window.generatePTGroupIdRenew = () => {
  const id = window.generatePTGroupId('renew');
  const input = document.getElementById('renewPtGroupId');
  if (input) input.value = id;
};
