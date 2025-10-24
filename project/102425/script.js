(() => {
  const STORAGE_KEYS = {
    plain: 'fortify:vault:data',
    encrypted: 'fortify:vault:data:encrypted',
    mode: 'fortify:vault:mode',
    settings: 'fortify:vault:settings'
  };

  const defaultState = {
    plans: [],
    transactions: []
  };

  const defaultSettings = {
    currency: 'EUR',
    theme: 'light',
    language: 'en'
  };

  const planForm = document.getElementById('plan-form');
  const planModal = document.getElementById('plan-modal');
  const transactionModal = document.getElementById('transaction-modal');
  const transactionForm = document.getElementById('transaction-form');
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');

  const planList = document.getElementById('plan-list');
  const planEmptyState = document.getElementById('plan-empty-state');
  const focusPlans = document.getElementById('focus-plans');
  const recentTransactions = document.getElementById('recent-transactions');
  const transactionTable = document.getElementById('transaction-table');
  const transactionEmptyState = document.getElementById('transaction-empty-state');
  const toastContainer = document.getElementById('toast-container');
  const cookieNotice = document.getElementById('cookie-notice');
  const cookieAccept = document.getElementById('cookie-accept');
  const navButtons = document.querySelectorAll('.nav-link');
  const views = document.querySelectorAll('.view');
  const viewTitle = document.getElementById('view-title');

  const totalSavedEl = document.getElementById('total-saved');
  const monthlyProgressEl = document.getElementById('monthly-progress');
  const monthlyProgressSubtext = document.getElementById('monthly-progress-subtext');
  const planCountEl = document.getElementById('plan-count');
  const planStatusEl = document.getElementById('plan-status');
  const averageCompletionEl = document.getElementById('average-completion');
  const chartLegend = document.getElementById('chart-legend');

  const currencySelect = document.getElementById('currency-select');
  const themeSelect = document.getElementById('theme-select');

  const statBreakdown = document.getElementById('stat-breakdown');
  const languageSelect = document.getElementById('lang-select');
  const securityStatus = document.getElementById('security-status');
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const passwordConfirmInput = document.getElementById('password-confirm-input');
  const confirmPasswordWrapper = document.getElementById('confirm-password-wrapper');
  const setPasswordBtn = document.getElementById('set-password-btn');
  const disablePasswordBtn = document.getElementById('disable-password-btn');

  const transactionPlanSelect = document.getElementById('transaction-plan');
  const transactionTypeSelect = document.getElementById('transaction-type');
  const transactionDateInput = document.getElementById('transaction-date');
  const transactionPlanFilter = document.getElementById('transaction-plan-filter');
  const transactionTypeFilter = document.getElementById('transaction-type-filter');

  const importFileInput = document.getElementById('import-file-input');

  const clone = value => (typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)));

  let appState = clone(defaultState);
  let appSettings = clone(defaultSettings);
  let encryptionMode = localStorage.getItem(STORAGE_KEYS.mode) || 'plain';
  let encryptionPassword = null;
  let trendChart = null;

  const zeroLinePlugin = {
    id: 'zeroLine',
    afterDatasetsDraw(chart, args, opts) {
      const { ctx, scales } = chart;
      const y = scales.y;
      if (!y) return;
      const yZero = y.getPixelForValue(0);
      ctx.save();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(scales.x.left, yZero);
      ctx.lineTo(scales.x.right, yZero);
      ctx.stroke();
      ctx.restore();
    }
  };

  const lastMonthHighlightPlugin = {
    id: 'lastMonthHighlight',
    beforeDatasetsDraw(chart, args, opts) {
      const { ctx, chartArea, data, scales } = chart;
      const x = scales.x; const y = scales.y;
      if (!x || !y || !data?.labels?.length) return;
      const lastIndex = data.labels.length - 1;
      const center = x.getPixelForValue(lastIndex);
      const prevCenter = x.getPixelForValue(lastIndex - 1);
      const halfWidth = Math.max(8, (center - prevCenter) / 2);
      ctx.save();

      ctx.fillStyle = 'rgba(84, 104, 255, 0.06)';
      ctx.fillRect(center - halfWidth, chartArea.top, halfWidth * 2, chartArea.bottom - chartArea.top);
      ctx.restore();
    },
    afterDatasetsDraw(chart) {

      try {
        const { ctx, data, scales } = chart;
        const x = scales.x; const y = scales.y;
        if (!x || !y || !data?.labels?.length) return;
        const last = data.labels.length - 1;
        const arr = data.datasets?.[0]?.data || [];
        const prev = Number(arr[last - 1] ?? 0);
        const curr = Number(arr[last] ?? 0);
        const diff = Math.round(((curr - prev) + Number.EPSILON) * 100) / 100;
        if (!Number.isFinite(diff) || diff === 0) return;
        const xPos = x.getPixelForValue(last) + 8;
        const yPos = y.getPixelForValue((curr + prev) / 2);
        const isNeg = diff < 0;
        ctx.save();
        ctx.font = '12px Poppins, system-ui, -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = isNeg ? '#f25f5c' : '#1fbfb8';
        const label = `${isNeg ? '-' : '+'}${formatCurrency(Math.abs(diff))}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(label, xPos, yPos);
        ctx.restore();
      } catch (_) {}
    }
  };
  let editingPlanId = null;

  document.getElementById('new-plan-btn').addEventListener('click', () => openPlanModal());
  document.getElementById('create-plan-btn').addEventListener('click', () => openPlanModal());
  document.getElementById('empty-plan-btn').addEventListener('click', () => openPlanModal());
  document.getElementById('quick-transaction-btn').addEventListener('click', () => openTransactionModal());
  document.getElementById('empty-transaction-btn').addEventListener('click', () => openTransactionModal());

  document.getElementById('export-data-btn').addEventListener('click', exportData);
  document.getElementById('import-data-btn').addEventListener('click', () => importFileInput.click());

  document.getElementById('reset-data-btn').addEventListener('click', resetVault);

  importFileInput.addEventListener('change', handleImportFile);

  
  if (cookieAccept) cookieAccept.addEventListener('click', () => {
    localStorage.setItem('fortify:vault:notice:seen', '1');
    if (cookieNotice) cookieNotice.hidden = true;
  });

  navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.target)));
  document.querySelectorAll('[data-target="plans"]').forEach(btn => btn.addEventListener('click', () => switchView('plans')));
  document.querySelectorAll('[data-target="transactions"]').forEach(btn => btn.addEventListener('click', () => switchView('transactions')));

  planForm.addEventListener('submit', handlePlanSubmit);
  transactionForm.addEventListener('submit', handleTransactionSubmit);
  authForm.addEventListener('submit', handleAuthSubmit);
  passwordForm.addEventListener('submit', handlePasswordSubmit);
  disablePasswordBtn.addEventListener('click', handleDisablePassword);

  transactionPlanFilter.addEventListener('change', renderTransactionsSection);
  transactionTypeFilter.addEventListener('change', renderTransactionsSection);

  currencySelect.addEventListener('change', handleSettingsChange);
  if (themeSelect) themeSelect.addEventListener('change', handleSettingsChange);
  if (languageSelect) languageSelect.addEventListener('change', handleSettingsChange);

  Array.from(document.querySelectorAll('.modal')).forEach(modal => {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
    modal.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
  });

  planList.addEventListener('click', event => {
    const planCard = event.target.closest('[data-plan-id]');
    if (!planCard) return;
    const planId = planCard.dataset.planId;

    const button = event.target.closest('[data-action]');
    if (!button) return;

    switch (button.dataset.action) {
      case 'deposit':
        openTransactionModal(planId, 'deposit');
        break;
      case 'withdrawal':
        openTransactionModal(planId, 'withdrawal');
        break;
      case 'edit':
        openPlanModal(planId);
        break;
      case 'delete':
        deletePlan(planId);
        break;
      default:
        break;
    }
  });

  transactionTable.addEventListener('click', event => {
    const button = event.target.closest('[data-transaction-delete]');
    if (!button) return;
    deleteTransaction(button.dataset.transactionDelete);
  });

  init();

  async function init() {
    loadSettings();
    updateSettingsUI();
    applyTheme();
    if (window.i18n) {
      window.i18n.setLanguage(appSettings.language || 'en');
      window.i18n.apply();
    }

    if (encryptionMode === 'encrypted') {
      showAuthModal('unlock');
    } else {
      loadPlainState();
      refreshUI();
    }

    try {
      const seen = localStorage.getItem('fortify:vault:notice:seen');
      if (!seen && cookieNotice) cookieNotice.hidden = false;
    } catch (_) {}
  }

  function loadPlainState() {
    const raw = localStorage.getItem(STORAGE_KEYS.plain);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        validateAndSetState(data);
      } catch (error) {
        console.error('Failed to parse stored data', error);
        appState = clone(defaultState);
      }
    }
  }

  function validateAndSetState(data) {
    if (!data || typeof data !== 'object') return;
    if (!Array.isArray(data.plans) || !Array.isArray(data.transactions)) return;
    appState = {
      plans: data.plans.map(plan => ({
        ...plan,
        currentAmount: Number(plan.currentAmount) || 0,
        targetAmount: Number(plan.targetAmount) || 0
      })),
      transactions: data.transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount) || 0
      }))
    };
  }

  function loadSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        appSettings = { ...defaultSettings, ...parsed };
      } catch (error) {
        console.error('Failed to parse settings', error);
        appSettings = clone(defaultSettings);
      }
    } else {
      appSettings = clone(defaultSettings);
    }
  }

  function switchView(target) {
    const view = Array.from(views).find(section => section.dataset.view === target);
    if (!view) return;

    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.target === target));
    views.forEach(section => section.classList.toggle('active', section.dataset.view === target));

    const tr = (k, f) => (window.i18n ? (window.i18n.t(k) || f) : f);
    switch (target) {
      case 'dashboard':
        viewTitle.textContent = tr('top.dashboardTitle', 'Dashboard Overview');
        break;
      case 'plans':
        viewTitle.textContent = tr('plans.title', 'Saving Plans');
        break;
      case 'transactions':
        viewTitle.textContent = tr('transactions.title', 'Transactions');
        break;
      case 'settings':
        viewTitle.textContent = tr('settings.title', 'Settings & Insights');
        break;
      default:
        viewTitle.textContent = tr('top.dashboardTitle', 'Dashboard Overview');
    }
  }

  function openPlanModal(planId = null) {
    editingPlanId = planId;
    const modalTitle = document.getElementById('plan-modal-title');
    planForm.reset();
    if (planId) {
      const plan = appState.plans.find(p => p.id === planId);
      if (!plan) return;
      modalTitle.textContent = (window.i18n ? window.i18n.t('modal.editPlan') : 'Edit plan');
      document.getElementById('plan-name').value = plan.name || '';
      document.getElementById('plan-target').value = plan.targetAmount ?? '';
      document.getElementById('plan-start').value = plan.startDate || '';
      document.getElementById('plan-due').value = plan.dueDate || '';
      document.getElementById('plan-color').value = plan.color || '#5468ff';
      document.getElementById('plan-notes').value = plan.notes || '';
    } else {
      modalTitle.textContent = (window.i18n ? window.i18n.t('modal.createPlan') : 'Create plan');
      document.getElementById('plan-color').value = '#5468ff';
    }
    openModal(planModal);
  }

  function openTransactionModal(planId = null, type = 'deposit') {
    if (!appState.plans.length) {
      showToast('No plans yet', 'Create a plan before logging transactions.', 'error');
      openPlanModal();
      return;
    }

    transactionForm.reset();
    populateTransactionPlanOptions();
    transactionTypeSelect.value = type;
    const today = new Date();
    const iso = today.toISOString().split('T')[0];
    transactionDateInput.value = iso;

    if (planId) {
      transactionPlanSelect.value = planId;
    }

    openModal(transactionModal);
  }

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function handlePlanSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('plan-name').value.trim();
    const targetAmount = Number(document.getElementById('plan-target').value) || 0;
    const startDate = document.getElementById('plan-start').value || null;
    const dueDate = document.getElementById('plan-due').value || null;
    const color = document.getElementById('plan-color').value || '#5468ff';
    const notes = document.getElementById('plan-notes').value.trim();

    if (!name) {
      showToast('Missing name', 'Give your plan a descriptive name.', 'error');
      return;
    }

    if (targetAmount <= 0) {
      showToast('Invalid target', 'Target amount must be greater than zero.', 'error');
      return;
    }

    if (editingPlanId) {
      const plan = appState.plans.find(p => p.id === editingPlanId);
      if (!plan) return;
      plan.name = name;
      plan.targetAmount = targetAmount;
      plan.startDate = startDate;
      plan.dueDate = dueDate;
      plan.color = color;
      plan.notes = notes;
      showToast('Plan updated', 'Your plan details were refreshed.', 'success');
    } else {
      const id = crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}`;
      appState.plans.push({
        id,
        name,
        targetAmount,
        currentAmount: 0,
        startDate,
        dueDate,
        color,
        notes,
        createdAt: new Date().toISOString()
      });
      showToast('Plan created', 'Ready to start saving towards your goal.', 'success');
    }

    editingPlanId = null;
    closeModal(planModal);
    await persistState();
    refreshUI();
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();
    if (!appState.plans.length) {
      showToast('No plans found', 'Create a plan first.', 'error');
      return;
    }

    const planId = transactionPlanSelect.value;
    const type = transactionTypeSelect.value;
    const amount = Number(document.getElementById('transaction-amount').value);
    const date = document.getElementById('transaction-date').value;
    const note = document.getElementById('transaction-note').value.trim();

    if (!planId) {
      showToast('Plan required', 'Select a plan to apply this transaction.', 'error');
      return;
    }

    if (!date) {
      showToast('Date required', 'Pick when the transaction happened.', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      showToast('Invalid amount', 'Amount must be greater than zero.', 'error');
      return;
    }

    const plan = appState.plans.find(p => p.id === planId);
    if (!plan) {
      showToast('Unknown plan', 'The selected plan no longer exists.', 'error');
      return;
    }

    if (type === 'withdrawal' && plan.currentAmount < amount) {
      showToast('Insufficient funds', 'You cannot withdraw more than the current amount.', 'error');
      return;
    }

    const transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      planId,
      type,
      amount,
      date,
      note,
      createdAt: new Date().toISOString()
    };

    if (type === 'deposit') {
      plan.currentAmount = roundToTwo(plan.currentAmount + amount);
    } else {
      plan.currentAmount = roundToTwo(plan.currentAmount - amount);
    }

    appState.transactions.push(transaction);
    appState.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    showToast('Transaction recorded', `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} saved successfully.`, 'success');
    closeModal(transactionModal);
    await persistState();
    refreshUI();
  }

  function roundToTwo(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  async function deletePlan(planId) {
    const plan = appState.plans.find(p => p.id === planId);
    if (!plan) return;
    if (!confirm(`Delete plan "${plan.name}"? This will remove its transactions.`)) return;

    appState.plans = appState.plans.filter(p => p.id !== planId);
    appState.transactions = appState.transactions.filter(tx => tx.planId !== planId);

    await persistState();
    refreshUI();
    showToast('Plan removed', 'Plan and related transactions removed.', 'success');
  }

  async function deleteTransaction(id) {
    const tx = appState.transactions.find(t => t.id === id);
    if (!tx) return;
    const plan = appState.plans.find(p => p.id === tx.planId);
    if (plan) {
      if (tx.type === 'deposit') {
        plan.currentAmount = roundToTwo(Math.max(0, plan.currentAmount - tx.amount));
      } else {
        plan.currentAmount = roundToTwo(plan.currentAmount + tx.amount);
      }
    }
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    await persistState();
    refreshUI();
    showToast('Transaction deleted', 'Transaction removed from history.', 'success');
  }

  function refreshUI() {
    renderDashboard();
    renderPlansSection();
    renderTransactionsSection();
    updatePlanFilters();
    updateSecurityUI();
  }

  function renderDashboard() {
    const totals = calculateTotals();
    totalSavedEl.textContent = formatCurrency(totals.totalSaved);
    monthlyProgressEl.textContent = formatCurrency(totals.monthlyNet);
    const tr = (k, f) => (window.i18n ? (window.i18n.t(k) || f) : f);
    monthlyProgressSubtext.textContent = tr('stats.netThisMonth', 'Net this month');

    planCountEl.textContent = appState.plans.length;
    if (!appState.plans.length) {
      planStatusEl.textContent = (window.i18n ? (window.i18n.t('stats.noPlansYet') || 'No plans yet') : 'No plans yet');
      averageCompletionEl.textContent = '0%';
    } else {
      const completions = appState.plans.map(plan => plan.targetAmount > 0 ? (plan.currentAmount / plan.targetAmount) : 0);
      const average = completions.reduce((sum, progress) => sum + progress, 0) / completions.length;
      averageCompletionEl.textContent = `${Math.round(average * 100)}%`;
      const complete = completions.filter(progress => progress >= 1).length;
      const wtr = (k, f) => (window.i18n ? (window.i18n.t(k) || f) : f);
      planStatusEl.textContent = `${complete} ${wtr('stats.completeWord', 'complete')} / ${appState.plans.length} ${wtr('stats.totalWord', 'total')}`;
    }

    renderFocusPlans();
    renderRecentTransactions();
    renderTrendChart();
    renderStatsBreakdown();
  }

  function renderStatsBreakdown() {
    if (!statBreakdown) return;
    statBreakdown.innerHTML = '';
    if (!appState.plans.length) return;
    appState.plans.forEach(plan => {
      const line = document.createElement('div');
      line.className = 'line';
      line.innerHTML = `<span>${escapeHtml(plan.name)}</span><span><strong>${formatCurrency(plan.currentAmount)}</strong></span>`;
      statBreakdown.appendChild(line);
    });
  }

  function calculateTotals() {
    const currency = appSettings.currency || 'USD';
    const totalSaved = appState.plans.reduce((sum, plan) => sum + (plan.currentAmount || 0), 0);
    const { start, end } = getCurrentMonthRange();
    const monthlyNet = appState.transactions.reduce((acc, tx) => {
      const txDate = new Date(tx.date);
      if (txDate >= start && txDate <= end) {
        return acc + (tx.type === 'deposit' ? tx.amount : -tx.amount);
      }
      return acc;
    }, 0);

    return { currency, totalSaved, monthlyNet };
  }

  function getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  function renderFocusPlans() {
    focusPlans.innerHTML = '';
    if (!appState.plans.length) {
      const hint = window.i18n ? window.i18n.t('empty.focusPlansHint') : 'Create plans to see your progress highlights.';
      focusPlans.innerHTML = `<div class="transaction-empty">${hint}</div>`;
      return;
    }
    const sorted = [...appState.plans]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);

    sorted.forEach(plan => {
      const progress = plan.targetAmount > 0 ? Math.min(100, (plan.currentAmount / plan.targetAmount) * 100) : 0;
      const highlight = document.createElement('div');
      highlight.className = 'focus-plan';
      highlight.innerHTML = `
        <div class="info">
          <h4>${escapeHtml(plan.name)}</h4>
          <div class="plan-highlight">
            <i style="background:${plan.color || '#5468ff'}"></i>
            ${Math.round(progress)}% ${(window.i18n ? (window.i18n.t('stats.completeWord') || 'complete') : 'complete')} • ${formatCurrency(plan.currentAmount)} / ${formatCurrency(plan.targetAmount)}
          </div>
        </div>
        <div class="focus-progress" style="min-width:120px;">
          <div class="progress-bar"><span style="width:${progress}%;background:${plan.color || '#5468ff'}"></span></div>
        </div>`;
      focusPlans.appendChild(highlight);
    });
  }

  function renderRecentTransactions() {
    recentTransactions.innerHTML = '';
    if (!appState.transactions.length) {
      const txt = (window.i18n ? window.i18n.t('empty.noTransactions') : 'No transactions recorded');
      recentTransactions.innerHTML = `<div class="transaction-empty">${txt}</div>`;
      return;
    }

    const latest = [...appState.transactions]
      .sort((a, b) => {
        const d = new Date(b.date) - new Date(a.date);
        if (d !== 0) return d;

        if (a.type !== b.type) return a.type === 'withdrawal' ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 5);

    latest.forEach(tx => {
      const plan = appState.plans.find(p => p.id === tx.planId);
      const item = document.createElement('div');
      item.className = `transaction-item ${tx.type}`;
      const amountPrefix = tx.type === 'deposit' ? '+' : '-';
      const formattedDate = formatDate(tx.date);
      item.innerHTML = `
        <div class="avatar">${plan ? escapeHtml(plan.name.charAt(0).toUpperCase()) : '?'}</div>
        <div>
          <div class="label">${tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} ${plan ? `• ${escapeHtml(plan.name)}` : ''}</div>
          <small class="text-muted">${formattedDate}${tx.note ? ` · ${escapeHtml(tx.note)}` : ''}</small>
        </div>
        <div class="amount">${amountPrefix}${formatCurrency(tx.amount)}</div>`;

        try {
        const labelEl = item.querySelector('.label');
        if (labelEl) {
          const typeText = tx.type === 'deposit'
            ? (window.i18n ? window.i18n.t('type.deposit') : 'Deposit')
            : (window.i18n ? window.i18n.t('type.withdrawal') : 'Withdrawal');
          const name = plan ? plan.name : '';
          labelEl.textContent = name ? `${typeText} • ${name}` : typeText;
        }
      } catch (e) {}
      recentTransactions.appendChild(item);
    });
  }

  function renderTrendChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    const { labels, balance } = buildBalanceSeries();
    const colors = getThemeColors();


    const maxPos = Math.max(0, ...balance);
    const minNeg = 0; 
    const span = Math.max(1, maxPos - minNeg);
    const pad = Math.max(10, Math.round(span * 0.12));
    const suggestedMax = maxPos + pad;
    const suggestedMin = minNeg - pad;

    const balLabel = window.i18n ? (window.i18n.t('legend.balance') || 'Balance') : 'Balance';
    if (!trendChart) {
      trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: balLabel,
              data: balance,
              tension: 0,
              borderColor: '#ffd54a',
              backgroundColor: hexToRgba('#ffd54a', 0.18),
              fill: false,
              pointRadius: 3,
              pointBackgroundColor: '#ffd54a',
              pointBorderWidth: 0,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax,
              suggestedMin,
              ticks: {
                callback: value => formatCurrency(value)
              },
              grid: { color: 'rgba(15, 23, 42, 0.08)' }
            },
            x: {
              grid: { display: false }
            }
          }
        },
        plugins: [zeroLinePlugin, lastMonthHighlightPlugin]
      });
    } else {
      trendChart.data.labels = labels;
      trendChart.data.datasets = [{
        label: balLabel,
        data: balance,
        tension: 0,
        borderColor: '#ffd54a',
        backgroundColor: hexToRgba('#ffd54a', 0.18),
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: '#ffd54a',
        pointBorderWidth: 0,
        borderWidth: 2
      }];
      trendChart.options.scales.y.suggestedMax = suggestedMax;
      trendChart.options.scales.y.suggestedMin = suggestedMin;
      trendChart.update();
    }

    chartLegend.innerHTML = `
      <span><i style="background:#ffd54a"></i>${balLabel}</span>`;
  }

  function buildTrendSeries() {
    const now = new Date();
    const labels = [];
    const deposits = [];
    const withdrawals = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(date.toLocaleString(undefined, { month: 'short' }));
      const sums = appState.transactions.reduce((acc, tx) => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === date.getFullYear() && txDate.getMonth() === date.getMonth()) {
          if (tx.type === 'deposit') acc.deposit += tx.amount;
          else acc.withdrawal += tx.amount;
        }
        return acc;
      }, { deposit: 0, withdrawal: 0 });
      deposits.push(roundToTwo(sums.deposit));
      withdrawals.push(roundToTwo(-sums.withdrawal));
    }

    return { labels, deposits, withdrawals };
  }

  function buildBalanceSeries() {
    const now = new Date();
    const labels = [];
    const balance = [];
    let running = 0;
    for (let i = 11; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = mStart.toLocaleString(undefined, { month: 'short' });
      const monthTx = appState.transactions
        .filter(tx => {
          const d = new Date(tx.date);
          return d.getFullYear() === mStart.getFullYear() && d.getMonth() === mStart.getMonth();
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date) || new Date(a.createdAt) - new Date(b.createdAt));

      if (monthTx.length === 0) {
        labels.push(label);
        balance.push(running);
        continue;
      }

      monthTx.forEach(tx => {
        running = roundToTwo(Math.max(0, running + (tx.type === 'deposit' ? tx.amount : -tx.amount)));
        labels.push(label);
        balance.push(running);
      });
    }
    return { labels, balance };
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      positive: styles.getPropertyValue('--positive').trim() || '#1fbfb8',
      negative: styles.getPropertyValue('--negative').trim() || '#f25f5c'
    };
  }

  function renderPlansSection() {
    planList.innerHTML = '';
    if (!appState.plans.length) {
      planEmptyState.classList.add('active');
      return;
    }
    planEmptyState.classList.remove('active');

    appState.plans.forEach(plan => {
      const progress = plan.targetAmount > 0 ? Math.min(100, (plan.currentAmount / plan.targetAmount) * 100) : 0;
      const amountLeft = Math.max(0, plan.targetAmount - plan.currentAmount);
      const behind = false;
      const relatedTransactions = appState.transactions.filter(tx => tx.planId === plan.id);
      const lastActivity = relatedTransactions.length
        ? formatDate(relatedTransactions.reduce((latest, tx) => (new Date(tx.date) > new Date(latest.date) ? tx : latest)).date)
        : (window.i18n ? (window.i18n.t('label.noActivityYet') || 'No activity yet') : 'No activity yet');
      const card = document.createElement('article');
      card.className = 'plan-card';
      card.dataset.planId = plan.id;
      card.innerHTML = `
        <header>
          <h3><span class="color-dot" style="background:${plan.color || '#5468ff'}"></span>${plan.name ? escapeHtml(plan.name) : 'Unnamed plan'}</h3>
          <div class="plan-meta">
            ${plan.startDate ? `<span>Started ${formatDate(plan.startDate)}</span>` : ''}
            ${plan.dueDate ? `<span>Due ${formatDate(plan.dueDate)}</span>` : ''}
            <span>${window.i18n ? (window.i18n.t('label.target') || 'Target') : 'Target'} ${formatCurrency(plan.targetAmount)}</span>
          </div>
          ${plan.notes ? `<p class="plan-details">${escapeHtml(plan.notes)}</p>` : ''}
        </header>
        <div class="plan-progress">
          <div class="progress-bar"><span style="width:${progress}%;background:${plan.color || '#5468ff'}"></span></div>
          <div class="plan-status-row">
            <strong>${formatCurrency(plan.currentAmount)}</strong>
            <span>${Math.round(progress)}% complete${behind ? ' · <span class="status-badge danger">Behind schedule</span>' : ''}</span>
          </div>
          <div class="plan-meta">
            <span>${formatCurrency(amountLeft)} remaining</span>
            <span>${relatedTransactions.length} transactions • Last activity ${lastActivity}</span>
          </div>
          <div class="plan-actions">
            <button class="secondary" data-action="deposit">Deposit</button>
            <button class="ghost" data-action="withdrawal">Withdraw</button>
            <button class="ghost" data-action="edit">Edit</button>
            <button class="ghost danger" data-action="delete">Delete saving</button>
          </div>
        </div>`;
      planList.appendChild(card);
      try {
        const meta = card.querySelector('.plan-progress .plan-meta');
        if (meta) {
          const remainingLbl = window.i18n ? (window.i18n.t('label.remaining') || 'remaining') : 'remaining';
          const lastActLbl = window.i18n ? (window.i18n.t('label.lastActivity') || 'Last activity') : 'Last activity';
          meta.innerHTML = `<span>${formatCurrency(amountLeft)} ${remainingLbl}</span><span>${lastActLbl} ${lastActivity}</span>`;
        }
        const depositBtn = card.querySelector('[data-action="deposit"]');
        if (depositBtn) depositBtn.textContent = (window.i18n ? (window.i18n.t('btn.deposit') || 'Deposit') : 'Deposit');
        const withdrawBtn = card.querySelector('[data-action="withdrawal"]');
        if (withdrawBtn) withdrawBtn.textContent = (window.i18n ? (window.i18n.t('btn.withdraw') || 'Withdraw') : 'Withdraw');
        const editBtn = card.querySelector('[data-action="edit"]');
        if (editBtn) editBtn.textContent = (window.i18n ? (window.i18n.t('btn.edit') || 'Edit') : 'Edit');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        if (deleteBtn) deleteBtn.textContent = (window.i18n ? (window.i18n.t('btn.deleteSaving') || 'Delete saving') : 'Delete saving');
        const statusEl = card.querySelector('.plan-status-row span');
        if (statusEl) {
          const completeWord = window.i18n ? (window.i18n.t('stats.completeWord') || 'complete') : 'complete';
          statusEl.innerHTML = `${Math.round(progress)}% ${completeWord}`;
        }
      } catch (_) {}
    });
  }


  function renderTransactionsSection() {
    transactionTable.innerHTML = '';
    const filtered = getFilteredTransactions();
    if (!appState.transactions.length) {
      transactionEmptyState.classList.add('active');
      return;
    }
    transactionEmptyState.classList.remove('active');
    if (!filtered.length) {
      const emptyMsg = window.i18n ? (window.i18n.t('empty.noTransactionsFiltered') || 'No transactions match the current filters.') : 'No transactions match the current filters.';
      transactionTable.innerHTML = `<div class="transaction-empty">${emptyMsg}</div>`;
      return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>${window.i18n ? (window.i18n.t('field.date') || 'Date') : 'Date'}</th>
        <th>${window.i18n ? (window.i18n.t('field.plan') || 'Plan') : 'Plan'}</th>
        <th>${window.i18n ? (window.i18n.t('field.type') || 'Type') : 'Type'}</th>
        <th>${window.i18n ? (window.i18n.t('field.amount') || 'Amount') : 'Amount'}</th>
        <th>${window.i18n ? (window.i18n.t('field.note') || 'Note') : 'Note'}</th>
        
      </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    filtered.forEach(tx => {
      const plan = appState.plans.find(p => p.id === tx.planId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>${plan ? escapeHtml(plan.name) : '—'}</td>
        <td class="type-${tx.type}">${tx.type === 'deposit' ? (window.i18n ? (window.i18n.t('type.deposit') || 'Deposit') : 'Deposit') : (window.i18n ? (window.i18n.t('type.withdrawal') || 'Withdrawal') : 'Withdrawal')}</td>
        <td>${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
        <td>${tx.note ? escapeHtml(tx.note) : '—'}</td>
        `;
      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>${plan ? escapeHtml(plan.name) : '—'}</td>
        <td class="type-${tx.type}">${tx.type === 'deposit' ? (window.i18n ? (window.i18n.t('type.deposit') || 'Deposit') : 'Deposit') : (window.i18n ? (window.i18n.t('type.withdrawal') || 'Withdrawal') : 'Withdrawal')}</td>
        <td>${tx.type === 'deposit' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
        <td>${tx.note ? escapeHtml(tx.note) : '—'}</td>
        `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    transactionTable.appendChild(table);
  }

  function getFilteredTransactions() {
    const planId = transactionPlanFilter.value;
    const type = transactionTypeFilter.value;
    return appState.transactions
      .filter(tx => (planId === 'all' || tx.planId === planId) && (type === 'all' || tx.type === type))
      .sort((a, b) => {
        const d = new Date(b.date) - new Date(a.date);
        if (d !== 0) return d;
        if (a.type !== b.type) return a.type === 'withdrawal' ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }

  function updatePlanFilters() {
    populateTransactionPlanOptions();
    const currentValue = transactionPlanFilter.value;
    const allPlans = window.i18n ? window.i18n.t('filters.allPlans') : 'All plans';
    transactionPlanFilter.innerHTML = `<option value="all">${allPlans}</option>`;
    appState.plans.forEach(plan => {
      const option = document.createElement('option');
      option.value = plan.id;
      option.textContent = plan.name;
      transactionPlanFilter.appendChild(option);
    });
    if (Array.from(transactionPlanFilter.options).some(opt => opt.value === currentValue)) {
      transactionPlanFilter.value = currentValue;
    }
  }

  function populateTransactionPlanOptions() {
    const current = transactionPlanSelect.value;
    transactionPlanSelect.innerHTML = '';
    appState.plans.forEach(plan => {
      const option = document.createElement('option');
      option.value = plan.id;
      option.textContent = plan.name;
      transactionPlanSelect.appendChild(option);
    });
    if (current && Array.from(transactionPlanSelect.options).some(opt => opt.value === current)) {
      transactionPlanSelect.value = current;
    }
  }

  function handleSettingsChange() {
    appSettings.currency = currencySelect.value;
    if (themeSelect) appSettings.theme = themeSelect.value;
    if (languageSelect) appSettings.language = languageSelect.value || 'en';
    saveSettings();
    updateSettingsUI();
    applyTheme();
    if (window.i18n) {
      window.i18n.setLanguage(appSettings.language || 'en');
      window.i18n.apply();
    }
    refreshUI();
  }

  function updateSettingsUI() {
    currencySelect.value = appSettings.currency;
    if (themeSelect) themeSelect.value = appSettings.theme || 'light';
    if (languageSelect) languageSelect.value = appSettings.language || 'en';
  }

  function updateSecurityUI() {
    if (encryptionMode === 'encrypted') {
      securityStatus.textContent = (window.i18n && window.i18n.t('security.protected')) || 'Protected';
      setPasswordBtn.textContent = (window.i18n && window.i18n.t('btn.updatePassword')) || 'Update password';
      confirmPasswordWrapper.style.display = '';
      disablePasswordBtn.style.display = 'inline-flex';
    } else {
      securityStatus.textContent = (window.i18n && window.i18n.t('security.unlocked')) || 'Unlocked';
      setPasswordBtn.textContent = (window.i18n && window.i18n.t('btn.enableProtection')) || 'Enable protection';
      confirmPasswordWrapper.style.display = '';
      disablePasswordBtn.style.display = 'none';
    }
    passwordForm.reset();
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    const password = passwordInput.value.trim();
    const confirm = passwordConfirmInput.value.trim();

    if (!password) {
      showToast('Password required', 'Enter a password to secure your data.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Weak password', 'Use at least 6 characters for your password.', 'error');
      return;
    }

    if (password !== confirm) {
      showToast('Mismatch', 'Passwords must match.', 'error');
      return;
    }

    await enablePasswordProtection(password);
    passwordForm.reset();
    updateSecurityUI();
    showToast('Vault encrypted', 'Your data is now encrypted with your password.', 'success');
  }

  async function handleDisablePassword() {
    if (encryptionMode !== 'encrypted') return;
    const password = prompt('Enter your current password to disable protection.');
    if (!password) return;

    const encryptedRaw = localStorage.getItem(STORAGE_KEYS.encrypted);
    if (!encryptedRaw) {
      showToast('No encrypted data', 'Could not locate encrypted data.', 'error');
      return;
    }

    try {
      const encrypted = JSON.parse(encryptedRaw);
      const decrypted = await decryptData(password, encrypted);
      validateAndSetState(decrypted);
      encryptionMode = 'plain';
      encryptionPassword = null;
      localStorage.setItem(STORAGE_KEYS.mode, 'plain');
      localStorage.removeItem(STORAGE_KEYS.encrypted);
      await persistState();
      showToast('Protection disabled', 'Vault is now stored in plain text locally.', 'success');
      refreshUI();
    } catch (error) {
      console.error(error);
      showToast('Incorrect password', 'Unable to decrypt data with provided password.', 'error');
    }
  }

  async function enablePasswordProtection(password) {
    encryptionMode = 'encrypted';
    encryptionPassword = password;
    localStorage.setItem(STORAGE_KEYS.mode, 'encrypted');
    const encrypted = await encryptData(password, appState);
    localStorage.setItem(STORAGE_KEYS.encrypted, JSON.stringify(encrypted));
    localStorage.removeItem(STORAGE_KEYS.plain);
    saveSettings();
  }

  async function persistState() {
    if (encryptionMode === 'encrypted') {
      if (!encryptionPassword) {
        const encryptedRaw = localStorage.getItem(STORAGE_KEYS.encrypted);
        if (!encryptedRaw) return;
        return; 
      }
      const encrypted = await encryptData(encryptionPassword, appState);
      localStorage.setItem(STORAGE_KEYS.encrypted, JSON.stringify(encrypted));
    } else {
      localStorage.setItem(STORAGE_KEYS.plain, JSON.stringify(appState));
    }
    saveSettings();
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(appSettings));
  }

  function applyTheme() {
    const theme = appSettings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function formatCurrency(value) {
    const currency = appSettings.currency || 'EUR';
    const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
    return formatter.format(value || 0);
  }

  function formatDate(date) {
    if (!date) return '—';
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return '—';
    return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char] || char));
  }

  function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<h4>${escapeHtml(title)}</h4><p>${escapeHtml(message)}</p>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function showAuthModal(mode) {
    openModal(authModal);
    const title = document.getElementById('auth-modal-title');
    const hint = document.getElementById('auth-hint');
    const submit = document.getElementById('auth-submit');
    if (mode === 'unlock') {
      title.textContent = (window.i18n ? window.i18n.t('modal.unlockVault') : 'Unlock your vault');
      hint.textContent = (window.i18n ? window.i18n.t('auth.hint') : 'Enter your password to decrypt locally stored data.');
      submit.textContent = (window.i18n ? window.i18n.t('btn.unlock') : 'Unlock');
    }
    authForm.dataset.mode = mode;
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('auth-password').value;
    if (!password) return;

    const encryptedRaw = localStorage.getItem(STORAGE_KEYS.encrypted);
    if (!encryptedRaw) {
      showToast('No encrypted data', 'Could not find encrypted data to unlock.', 'error');
      return;
    }

    try {
      const encrypted = JSON.parse(encryptedRaw);
      const decrypted = await decryptData(password, encrypted);
      validateAndSetState(decrypted);
      encryptionPassword = password;
      authForm.reset();
      closeModal(authModal);
      refreshUI();
      showToast('Vault unlocked', 'Your encrypted vault has been decrypted locally.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Unlock failed', 'Password is incorrect.', 'error');
    }
  }

  async function exportData() {
    const payload = {
      mode: encryptionMode,
      settings: appSettings,
      state: appState
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fortify-savings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup created', 'Your data has been exported.', 'success');
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = JSON.parse(reader.result);
        if (!json || typeof json !== 'object') throw new Error('Invalid file');
        if (!json.state || !json.settings) throw new Error('File missing state or settings');
        validateAndSetState(json.state);
        appSettings = { ...defaultSettings, ...json.settings };
        encryptionMode = 'plain';
        encryptionPassword = null;
        localStorage.setItem(STORAGE_KEYS.mode, 'plain');
        await persistState();
        refreshUI();
        showToast('Import successful', 'Data was imported into your vault.', 'success');
      } catch (error) {
        console.error(error);
        showToast('Import failed', 'Unable to import this file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  async function resetVault() {
    if (!confirm('Reset vault? All plans and transactions will be deleted.')) return;
    appState = clone(defaultState);
    appSettings = clone(defaultSettings);
    encryptionMode = 'plain';
    encryptionPassword = null;
    localStorage.setItem(STORAGE_KEYS.mode, 'plain');
    localStorage.removeItem(STORAGE_KEYS.encrypted);
    await persistState();
    refreshUI();
    showToast('Vault reset', 'Your vault has been reset to defaults.', 'success');
  }

  function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(84, 104, 255, ${alpha})`;
    let parsed = hex.replace('#', '');
    if (parsed.length === 3) {
      parsed = parsed.split('').map(char => char + char).join('');
    }
    const bigint = parseInt(parsed, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  async function encryptData(password, data) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    return {
      cipher: bufferToBase64(cipherBuffer),
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt)
    };
  }

  async function decryptData(password, payload) {
    const salt = base64ToBuffer(payload.salt);
    const iv = base64ToBuffer(payload.iv);
    const key = await deriveKey(password, new Uint8Array(salt));
    const cipher = base64ToBuffer(payload.cipher);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, cipher);
    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  }

  async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256'
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
})();