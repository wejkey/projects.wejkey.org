// Lightweight i18n helper with attribute-driven translation
// Usage: add data-i18n="key.path" for textContent
//        add data-i18n-placeholder="key.path" for placeholder attributes

(function () {
  const dictionary = {
    en: {
      brand: { title: 'Savings' },
      nav: { dashboard: 'Dashboard', plans: 'Plans', transactions: 'Transactions', settings: 'Settings' },
      top: {
        dashboardTitle: 'Dashboard Overview',
        dashboardSub: 'Track your saving journey, plan smarter and celebrate every milestone.'
      },
      btn: {
        quickTransaction: 'Quick Transaction',
        newPlan: 'New Saving Plan',
        viewAll: 'View all',
        createPlan: 'Create plan',
        cancel: 'Cancel',
        savePlan: 'Save plan',
        save: 'Save',
        addTransaction: 'Add transaction',
        unlock: 'Unlock',
        exportData: 'Export Data',
        importData: 'Import Data',
        downloadBackup: 'Download backup',
        restoreBackup: 'Restore backup',
        reset: 'Reset',
        enableProtection: 'Enable protection',
        updatePassword: 'Update password',
        disableProtection: 'Disable protection',
        deposit: 'Deposit',
        withdraw: 'Withdraw',
        edit: 'Edit',
        deleteSaving: 'Delete saving'
      },
      stats: {
        totalSaved: 'Total Saved',
        acrossAllPlans: 'Across all plans',
        monthlyProgress: 'Monthly Progress',
        ofTarget: '0% of target',
        activePlans: 'Active Plans',
        noPlansYet: 'No plans yet',
        averageCompletion: 'Average Completion',
        weightedAcross: 'Weighted across all plans',
        netThisMonth: 'Net this month',
        completeWord: 'complete',
        totalWord: 'total'
      },
      panel: {
        cashFlowTrends: 'Cash Flow Trends',
        monthlyDepositsVsWithdrawals: 'Monthly deposits versus withdrawals',
        focusPlans: 'Focus Plans',
        recentPlansAndProgress: 'Most recent plans and their progress',
        recentTransactions: 'Recent Transactions',
        latestDepositsWithdrawals: 'Latest deposits and withdrawals'
      },
      plans: { title: 'Saving Plans', subtitle: 'Create detailed plans and monitor their progress.' },
      transactions: { title: 'Transactions', subtitle: 'All deposits and withdrawals from your plans.' },
      filters: { allPlans: 'All plans', allTypes: 'All types' },
      type: { deposit: 'Deposit', withdrawal: 'Withdrawal', deposits: 'Deposits', withdrawals: 'Withdrawals' },
      empty: {
        noPlans: 'No plans yet',
        createPlanSubtitle: 'Start by creating a plan to visualise your saving goals.',
        createFirstPlan: 'Create your first plan',
        noTransactions: 'No transactions recorded',
        noTransactionsSubtitle: 'Record your first deposit or withdrawal to start tracking cash flow.',
        focusPlansHint: 'Create plans to see your progress highlights.',
        noTransactionsFiltered: 'No transactions match the current filters.'
      },
      hint: { monthlyTarget: 'monthly target', setMonthlyTarget: 'Set a monthly target to monitor pace' },
      settings: { title: 'Settings & Insights', subtitle: 'Fine tune your experience and control how your data is stored.', personalisation: 'Personalisation' },
      field: {
        currency: 'Currency',
        theme: 'Theme',
        language: 'Language',
        monthlySavingGoal: 'Monthly saving goal',
        password: 'Password',
        confirmPassword: 'Confirm password',
        planName: 'Plan name',
        targetAmount: 'Target amount',
        accentColor: 'Accent colour',
        startDate: 'Start date',
        dueDate: 'Due date',
        description: 'Description',
        plan: 'Plan',
        type: 'Type',
        amount: 'Amount',
        date: 'Date',
        note: 'Note',
        vaultPassword: 'Vault password'
      },
      theme: { light: 'White', dark: 'Dark', darkBlue: 'Dark Blue' },
      lang: { en: 'English', sk: 'Slovak' },
      toggle: { milestoneReminders: 'Milestone reminders', milestoneDescription: 'Highlight plans that are behind schedule.' },
      security: {
        title: 'Security',
        statusLabel: 'Status:',
        description: 'Protect your savings data with AES-GCM encryption bound to a password. Enter the same password on another device to unlock your vault.',
        protected: 'Protected',
        unlocked: 'Unlocked'
      },
      dataControl: { title: 'Data control', desc: 'Back up or reset your data whenever you need to.' },
      modal: {
        createPlan: 'Create plan',
        editPlan: 'Edit plan',
        addTransaction: 'Add transaction',
        unlockVault: 'Unlock your vault'
      },
      ph: { planNotes: 'What are you saving for?', optional: 'Optional' },
      legend: { deposits: 'Deposits', withdrawals: 'Withdrawals', balance: 'Balance' },
      label: { target: 'Target', remaining: 'remaining', lastActivity: 'Last activity', noActivityYet: 'No activity yet' }
    },
    sk: {
      brand: { title: 'Sporenie' },
      nav: { dashboard: 'Prehľad', plans: 'Plány', transactions: 'Transakcie', settings: 'Nastavenia' },
      top: {
        dashboardTitle: 'Prehľad nástenky',
        dashboardSub: 'Sledujte svoje sporenie, plánujte múdrejšie a oslávte každý míľnik.'
      },
      btn: {
        quickTransaction: 'Rýchla transakcia',
        newPlan: 'Nový plán sporenia',
        viewAll: 'Zobraziť všetko',
        createPlan: 'Vytvoriť plán',
        cancel: 'Zrušiť',
        savePlan: 'Uložiť plán',
        save: 'Uložiť',
        addTransaction: 'Pridať transakciu',
        unlock: 'Odomknúť',
        exportData: 'Exportovať dáta',
        importData: 'Importovať dáta',
        downloadBackup: 'Stiahnuť zálohu',
        restoreBackup: 'Obnoviť zo zálohy',
        reset: 'Resetovať',
        enableProtection: 'Zapnúť ochranu',
        updatePassword: 'Zmeniť heslo',
        disableProtection: 'Vypnúť ochranu'
      },
      stats: {
        totalSaved: 'Celkom nasporené',
        acrossAllPlans: 'Naprieč všetkými plánmi',
        monthlyProgress: 'Mesačný postup',
        ofTarget: '0% z cieľa',
        activePlans: 'Aktívne plány',
        noPlansYet: 'Zatiaľ žiadne plány',
        averageCompletion: 'Priemerné dokončenie',
        weightedAcross: 'Vážené naprieč všetkými plánmi'
      },
      panel: {
        cashFlowTrends: 'Trendy cash flow',
        monthlyDepositsVsWithdrawals: 'Mesačné vklady verzus výbery',
        focusPlans: 'Zamerané plány',
        recentPlansAndProgress: 'Najnovšie plány a ich postup',
        recentTransactions: 'Posledné transakcie',
        latestDepositsWithdrawals: 'Najnovšie vklady a výbery'
      },
      plans: { title: 'Plány sporenia', subtitle: 'Vytvorte si podrobné plány a sledujte ich postup.' },
      transactions: { title: 'Transakcie', subtitle: 'Všetky vklady a výbery z vašich plánov.' },
      filters: { allPlans: 'Všetky plány', allTypes: 'Všetky typy' },
      type: { deposit: 'Vklad', withdrawal: 'Výber', deposits: 'Vklady', withdrawals: 'Výbery' },
      empty: {
        noPlans: 'Zatiaľ žiadne plány',
        createPlanSubtitle: 'Začnite vytvorením plánu pre svoje ciele sporenia.',
        createFirstPlan: 'Vytvoriť prvý plán',
        noTransactions: 'Zatiaľ žiadne transakcie',
        noTransactionsSubtitle: 'Zaznamenajte prvý vklad alebo výber a začnite sledovať cash flow.',
        focusPlansHint: 'Vytvorte si plány, aby ste videli prehľad postupu.'
      },
      hint: { monthlyTarget: 'mesačný cieľ', setMonthlyTarget: 'Nastavte mesačný cieľ pre sledovanie tempa' },
      settings: { title: 'Nastavenia a prehľad', subtitle: 'Prispôsobte si aplikáciu a spravujte spôsob ukladania dát.', personalisation: 'Prispôsobenie' },
      field: {
        currency: 'Mena',
        theme: 'Téma',
        language: 'Jazyk',
        monthlySavingGoal: 'Mesačný cieľ sporenia',
        password: 'Heslo',
        confirmPassword: 'Potvrďte heslo',
        planName: 'Názov plánu',
        targetAmount: 'Cieľová suma',
        accentColor: 'Doplnková farba',
        startDate: 'Dátum začiatku',
        dueDate: 'Termín',
        description: 'Popis',
        plan: 'Plán',
        type: 'Typ',
        amount: 'Suma',
        date: 'Dátum',
        note: 'Poznámka',
        vaultPassword: 'Heslo k trezoru'
      },
      theme: { light: 'Svetlá', dark: 'Tmavá', darkBlue: 'Tmavomodrá' },
      lang: { en: 'Angličtina', sk: 'Slovenčina' },
      toggle: { milestoneReminders: 'Pripomienky míľnikov', milestoneDescription: 'Zvýrazniť plány, ktoré meškajú.' },
      security: {
        title: 'Zabezpečenie',
        statusLabel: 'Stav:',
        description: 'Chráňte svoje dáta šifrovaním AES‑GCM viazaným na heslo. Zadaním rovnakého hesla na inom zariadení trezor odomknete.',
        protected: 'Chránené',
        unlocked: 'Odomknuté'
      },
      dataControl: { title: 'Správa dát', desc: 'Kedykoľvek zálohujte alebo resetujte svoje dáta.' },
      modal: {
        createPlan: 'Vytvoriť plán',
        editPlan: 'Upraviť plán',
        addTransaction: 'Pridať transakciu',
        unlockVault: 'Odomknite svoj trezor'
      },
      ph: { planNotes: 'Na čo si šetríte?', optional: 'Voliteľné' },
      legend: { deposits: 'Vklady', withdrawals: 'Výbery' }
    }
  };

  // Runtime additions for Slovak translations and extras
  try {
    const sk = dictionary.sk;
    if (sk) {
      sk.btn = Object.assign({}, sk.btn || {}, {
        deposit: 'Vklad',
        withdraw: 'Výber',
        edit: 'Upraviť',
        deleteSaving: 'Vymazať sporenie'
      });
      sk.stats = Object.assign({}, sk.stats || {}, {
        netThisMonth: 'Čisté tento mesiac',
        completeWord: 'dokončené',
        totalWord: 'celkom'
      });
      sk.legend = Object.assign({}, sk.legend || {}, {
        balance: 'Zostatok'
      });
      sk.label = Object.assign({}, sk.label || {}, {
        target: 'Cieľ',
        remaining: 'Zostáva',
        lastActivity: 'Posledná aktivita',
        noActivityYet: 'Zatiaľ žiadna aktivita'
      });
      sk.empty = Object.assign({}, sk.empty || {}, {
        noTransactionsFiltered: 'Žiadne transakcie nezodpovedajú aktuálnym filtrom.'
      });
    }
  } catch (_) {}

  const i18n = {
    current: 'en',
    setLanguage(lang) {
      this.current = dictionary[lang] ? lang : 'en';
      document.documentElement.lang = this.current;
    },
    t(key) {
      const parts = key.split('.');
      let node = dictionary[this.current];
      for (const p of parts) node = node && node[p];
      return (node == null ? '' : String(node));
    },
    apply(root = document) {
      root.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n');
        const txt = this.t(k);
        if (txt) el.textContent = txt;
      });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const k = el.getAttribute('data-i18n-placeholder');
        const txt = this.t(k);
        if (txt) el.setAttribute('placeholder', txt);
      });
    }
  };

  window.i18n = i18n;
})();
