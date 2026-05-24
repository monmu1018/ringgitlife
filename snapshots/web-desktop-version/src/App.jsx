import { useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "ringgitlife_v5_";
const SETTINGS_KEY = "ringgitlife_settings_v1";

const commitmentCategories = [
  "Rent",
  "Utilities",
  "Phone",
  "Internet",
  "Transport",
  "Food baseline",
  "Gym / Fitness",
  "Insurance",
  "Loan",
  "Family support",
  "Subscriptions",
  "Remittance",
  "Investment",
  "Other",
];

const homeCountryCategories = [
  "Home phone bill",
  "Home insurance",
  "Home credit card payment",
  "Family support abroad",
  "Home-currency savings",
  "USD investment",
  "Remittance home",
];

const spendingCategories = [
  "Food",
  "Coffee",
  "Grab / Transport",
  "Shopping",
  "Gym / Wellness",
  "Dating / Social",
  "Delivery",
  "Groceries",
  "Entertainment",
  "Other",
];

const fxTargets = [
  { code: "KRW", name: "Korean Won", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
];

const presets = {
  "KL Young Professional": [
    ["Rent", 1800, 1],
    ["Utilities", 200, 10],
    ["Phone", 80, 15],
    ["Internet", 120, 15],
    ["Transport", 500, 1],
    ["Food baseline", 1200, 1],
    ["Gym / Fitness", 250, 5],
    ["Insurance", 250, 20],
    ["Subscriptions", 80, 25],
  ],
  "Bangsar South Expat": [
    ["Rent", 2800, 1],
    ["Utilities", 250, 10],
    ["Phone", 100, 15],
    ["Internet", 150, 15],
    ["Transport", 500, 1],
    ["Food baseline", 1800, 1],
    ["Gym / Fitness", 350, 5],
    ["Insurance", 300, 20],
    ["Remittance", 1000, 25],
    ["Subscriptions", 100, 25],
  ],
  "Penang Young Professional": [
    ["Rent", 1200, 1],
    ["Utilities", 180, 10],
    ["Phone", 70, 15],
    ["Internet", 120, 15],
    ["Transport", 400, 1],
    ["Food baseline", 1000, 1],
    ["Gym / Fitness", 200, 5],
    ["Insurance", 200, 20],
  ],
  "Lean Expat Month": [
    ["Rent", 900, 1],
    ["Utilities", 150, 10],
    ["Phone", 50, 15],
    ["Transport", 250, 1],
    ["Food baseline", 800, 1],
    ["Subscriptions", 30, 25],
  ],
};

function uid() {
  return crypto.randomUUID();
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function monthDate(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function previousMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 2, 1).toISOString().slice(0, 7);
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function daysLeft(monthKey) {
  const now = new Date();
  const current = currentMonth();
  const totalDays = daysInMonth(monthKey);

  if (monthKey === current) {
    return Math.max(totalDays - now.getDate() + 1, 1);
  }

  if (monthDate(monthKey) < monthDate(current)) return 1;
  return totalDays;
}

function monthProgress(monthKey) {
  const now = new Date();
  const current = currentMonth();
  const totalDays = daysInMonth(monthKey);

  if (monthKey === current) return now.getDate() / totalDays;
  if (monthDate(monthKey) < monthDate(current)) return 1;
  return 0;
}

function formatMYR(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(num(value));
}

function formatKRW(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(num(value));
}

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num(value));
}

function formatPlain(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(num(value));
}

function makeCommitment(name, amount, dueDay) {
  return {
    id: uid(),
    name,
    category: name,
    amount,
    dueDay,
    paid: false,
    recurring: true,
    notes: "",
  };
}

function blankData(monthKey = currentMonth()) {
  return {
    selectedMonth: monthKey,
    income: {
      netSalary: 0,
      salaryDay: 25,
      extraIncome: 0,
      startingBalance: 0,
    },
    savings: {
      monthlySavingsTarget: 0,
      emergencyFundTarget: 0,
      investmentTarget: 0,
      lifestyleTarget: 0,
    },
    commitments: [],
    spendingLogs: [],
    exchangeRates: {
      rmToKrw: 290,
      usdToRm: 4.7,
    },
    converter: {
      amount: 1000,
      from: "MYR",
      to: "KRW",
    },
    homeCountryMode: false,
    reflection: {
      wentWell: "",
      reduceNextMonth: "",
      unnecessarySpending: "",
      nextMonthFocus: "",
    },
  };
}

function sampleData(monthKey = currentMonth()) {
  return {
    ...blankData(monthKey),
    income: {
      netSalary: 14000,
      salaryDay: 25,
      extraIncome: 0,
      startingBalance: 0,
    },
    savings: {
      monthlySavingsTarget: 4000,
      emergencyFundTarget: 0,
      investmentTarget: 1000,
      lifestyleTarget: 0,
    },
    commitments: [
      makeCommitment("Rent", 2800, 1),
      makeCommitment("Utilities", 250, 10),
      makeCommitment("Phone", 100, 15),
      makeCommitment("Internet", 150, 15),
      makeCommitment("Transport", 500, 1),
      makeCommitment("Food baseline", 1800, 1),
      makeCommitment("Gym / Fitness", 350, 5),
      makeCommitment("Insurance", 300, 20),
      makeCommitment("Remittance", 1000, 25),
      makeCommitment("Subscriptions", 100, 25),
    ],
    spendingLogs: [
      { id: uid(), date: todayInput(), amount: 12, category: "Coffee", note: "Coffee" },
      { id: uid(), date: todayInput(), amount: 18, category: "Food", note: "Lunch" },
      { id: uid(), date: todayInput(), amount: 25, category: "Grab / Transport", note: "Grab" },
      { id: uid(), date: todayInput(), amount: 120, category: "Groceries", note: "Groceries" },
    ],
  };
}

export default function App() {
  const initialAppState = (() => {
    let selectedMonth = currentMonth();
    let showOnboarding = true;

    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      try {
        const settings = JSON.parse(rawSettings);
        if (settings.selectedMonth) selectedMonth = settings.selectedMonth;
        if (typeof settings.showOnboarding === "boolean") {
          showOnboarding = settings.showOnboarding;
        }
      } catch {
        // corrupted settings ignored
      }
    }

    let data = blankData(selectedMonth);
    const rawData = localStorage.getItem(`${STORAGE_PREFIX}${selectedMonth}`);

    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        data = {
          ...blankData(selectedMonth),
          ...parsed,
          selectedMonth,
        };
      } catch {
        data = blankData(selectedMonth);
      }
    }

    return { selectedMonth, showOnboarding, data };
  })();

  const [selectedMonth, setSelectedMonth] = useState(initialAppState.selectedMonth);
  const [data, setData] = useState(initialAppState.data);
  const [toast, setToast] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(initialAppState.showOnboarding);

  const [spendingDraft, setSpendingDraft] = useState({
    date: todayInput(),
    amount: "",
    category: "Food",
    note: "",
  });

  const [fxData, setFxData] = useState({
    loading: false,
    error: "",
    timeLastUpdateUtc: "",
    rates: {},
  });

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ selectedMonth, showOnboarding })
    );
  }, [selectedMonth, showOnboarding]);

  function loadMonthData(monthKey) {
    setSelectedMonth(monthKey);

    const raw = localStorage.getItem(`${STORAGE_PREFIX}${monthKey}`);
    if (!raw) {
      setData(blankData(monthKey));
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setData({
        ...blankData(monthKey),
        ...parsed,
        selectedMonth: monthKey,
      });
    } catch {
      setData(blankData(monthKey));
    }
  }

  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_PREFIX}${selectedMonth}`,
      JSON.stringify({ ...data, selectedMonth })
    );

    setLastSavedAt(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [data, selectedMonth]);

  useEffect(() => {
    fetchLatestRates();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const categories = data.homeCountryMode || data.koreanMode
    ? [...commitmentCategories, ...homeCountryCategories]
    : commitmentCategories;

  const totals = useMemo(() => {
    const income =
      num(data.income.netSalary) +
      num(data.income.extraIncome) +
      num(data.income.startingBalance);

    const fixed = data.commitments.reduce((sum, item) => sum + num(item.amount), 0);

    const savings =
      num(data.savings.monthlySavingsTarget) +
      num(data.savings.emergencyFundTarget) +
      num(data.savings.investmentTarget) +
      num(data.savings.lifestyleTarget);

    const flexible = data.spendingLogs.reduce((sum, item) => sum + num(item.amount), 0);

    const spendableBeforeFlexible = income - fixed - savings;
    const remaining = spendableBeforeFlexible - flexible;
    const left = daysLeft(selectedMonth);
    const daily = remaining / left;

    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const fixedRatio = income > 0 ? (fixed / income) * 100 : 0;

    const expectedFlexibleUsed =
      spendableBeforeFlexible * monthProgress(selectedMonth);

    const paceRatio =
      expectedFlexibleUsed > 0 ? (flexible / expectedFlexibleUsed) * 100 : 0;

    const spendableProgress =
      spendableBeforeFlexible > 0
        ? clamp((flexible / spendableBeforeFlexible) * 100, 0, 999)
        : 0;

    let score = 100;
    if (fixedRatio > 60) score -= Math.min(25, (fixedRatio - 60) * 1.2);
    if (savingsRate < 10) score -= 15;
    if (daily < 0) score -= 30;
    if (paceRatio > 120) score -= 15;
    if (remaining < 0) score -= 15;
    score = clamp(Math.round(score), 0, 100);

    let status = "Set your MYR income and fixed costs to see today's safe-to-spend.";
    let statusType = "neutral";

    if (income > 0) {
      if (daily < 0) {
        status = "Your Malaysia month is over plan. Reduce flexible spending or adjust savings.";
        statusType = "danger";
      } else if (daily < 40) {
        status = "Tight month. Keep everyday MYR spending controlled.";
        statusType = "warning";
      } else if (daily < 120) {
        status = "You are okay, but avoid random big spending.";
        statusType = "moderate";
      } else {
        status = "You have room this month. Stay consistent.";
        statusType = "good";
      }
    }

    let paceMessage = "No local spending pace yet.";
    let paceType = "neutral";

    if (spendableBeforeFlexible > 0) {
      if (paceRatio > 120) {
        paceMessage = "Your local spending is faster than planned.";
        paceType = "danger";
      } else if (paceRatio < 80) {
        paceMessage = "Your local spending is below your monthly pace.";
        paceType = "good";
      } else {
        paceMessage = "Your local spending pace is close to plan.";
        paceType = "moderate";
      }
    }

    return {
      income,
      fixed,
      savings,
      flexible,
      spendableBeforeFlexible,
      remaining,
      left,
      daily,
      savingsRate,
      fixedRatio,
      expectedFlexibleUsed,
      paceRatio,
      spendableProgress,
      score,
      status,
      statusType,
      paceMessage,
      paceType,
    };
  }, [data, selectedMonth]);

  const onboarding = useMemo(() => {
    const steps = [
      { label: "Add MYR income", done: data.income.netSalary > 0 },
      { label: "Add Malaysia commitments", done: data.commitments.length > 0 },
      { label: "Set savings or remittance target", done: totals.savings > 0 },
      { label: "Log first local spending", done: data.spendingLogs.length > 0 },
    ];

    return {
      steps,
      completed: steps.filter((step) => step.done).length,
    };
  }, [data, totals.savings]);

  const topSpending = useMemo(() => {
    const grouped = {};

    for (const item of data.spendingLogs) {
      grouped[item.category] = (grouped[item.category] || 0) + num(item.amount);
    }

    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [data.spendingLogs]);

  const paidCommitments = useMemo(() => {
    const paid = data.commitments.filter((item) => item.paid);
    const amount = paid.reduce((sum, item) => sum + num(item.amount), 0);

    return {
      count: paid.length,
      amount,
      percent:
        totals.fixed > 0 ? clamp(Math.round((amount / totals.fixed) * 100), 0, 100) : 0,
    };
  }, [data.commitments, totals.fixed]);

  const upcomingCommitments = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = selectedMonth === currentMonth();
    const startDay = isCurrentMonth ? today.getDate() : 1;

    return data.commitments
      .filter((item) => !item.paid)
      .map((item) => ({
        ...item,
        daysAway: Math.max(num(item.dueDay) - startDay, 0),
      }))
      .sort((a, b) => a.daysAway - b.daysAway)
      .slice(0, 3);
  }, [data.commitments, selectedMonth]);

  const launchInsights = useMemo(() => {
    const buffer = totals.income > 0 ? (totals.remaining / totals.income) * 100 : 0;
    const fixedRisk =
      totals.fixedRatio > 55
        ? "Fixed costs are heavy. Review rent, transport, and subscriptions first."
        : "Fixed costs are inside a manageable range for this month.";
    const savingsRisk =
      totals.savingsRate >= 20
        ? "Savings target is strong. Keep flexible spending steady."
        : totals.savingsRate >= 10
          ? "Savings target is acceptable. Try to lift it once the month stabilizes."
          : "Savings target is light. Add even a small automatic transfer if possible.";

    return [
      { label: "Malaysia buffer", value: `${buffer.toFixed(1)}%`, text: "Remaining MYR as share of income" },
      { label: "Fixed cost read", value: `${totals.fixedRatio.toFixed(1)}%`, text: fixedRisk },
      { label: "Savings read", value: `${totals.savingsRate.toFixed(1)}%`, text: savingsRisk },
    ];
  }, [totals]);

  const converterResult = useMemo(() => {
    const amount = num(data.converter.amount);
    const rmToKrw = num(data.exchangeRates.rmToKrw);
    const usdToRm = num(data.exchangeRates.usdToRm);

    if (amount <= 0) return 0;
    if (data.converter.from === data.converter.to) return amount;

    let amountInRm = amount;

    if (data.converter.from === "KRW") amountInRm = rmToKrw > 0 ? amount / rmToKrw : 0;
    if (data.converter.from === "USD") amountInRm = amount * usdToRm;
    if (data.converter.from === "MYR") amountInRm = amount;

    if (data.converter.to === "MYR") return amountInRm;
    if (data.converter.to === "KRW") return amountInRm * rmToKrw;
    if (data.converter.to === "USD") return usdToRm > 0 ? amountInRm / usdToRm : 0;

    return 0;
  }, [data.converter, data.exchangeRates]);

  const salaryKrw = data.income.netSalary * data.exchangeRates.rmToKrw;
  const salaryUsd =
    data.exchangeRates.usdToRm > 0
      ? data.income.netSalary / data.exchangeRates.usdToRm
      : 0;

  function notify(message) {
    setToast(message);
  }

  async function fetchLatestRates() {
    setFxData((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const response = await fetch("https://open.er-api.com/v6/latest/MYR");
      const result = await response.json();

      if (!response.ok || result.result !== "success") {
        throw new Error("FX fetch failed");
      }

      setFxData({
        loading: false,
        error: "",
        timeLastUpdateUtc: result.time_last_update_utc || "",
        rates: result.rates || {},
      });
    } catch {
      setFxData((prev) => ({
        ...prev,
        loading: false,
        error: "FX snapshot failed. Manual converter still works.",
      }));
    }
  }

  function updateIncome(field, value) {
    setData((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [field]: num(value),
      },
    }));
  }

  function updateSavings(field, value) {
    setData((prev) => ({
      ...prev,
      savings: {
        ...prev.savings,
        [field]: num(value),
      },
    }));
  }

  function updateExchange(field, value) {
    setData((prev) => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [field]: num(value),
      },
    }));
  }

  function updateConverter(field, value) {
    setData((prev) => ({
      ...prev,
      converter: {
        ...prev.converter,
        [field]: field === "amount" ? num(value) : value,
      },
    }));
  }

  function addCommitment(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const item = {
      id: uid(),
      name: form.get("name") || "Untitled",
      category: form.get("category") || "Other",
      amount: num(form.get("amount")),
      dueDay: num(form.get("dueDay")) || 1,
      paid: false,
      recurring: true,
      notes: form.get("notes") || "",
    };

    if (item.amount <= 0) {
      notify("Add a valid amount.");
      return;
    }

    setData((prev) => ({
      ...prev,
      commitments: [item, ...prev.commitments],
    }));

    event.currentTarget.reset();
    notify("Commitment added.");
  }

  function updateCommitment(id, field, value) {
    setData((prev) => ({
      ...prev,
      commitments: prev.commitments.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "amount" || field === "dueDay" ? num(value) : value,
            }
          : item
      ),
    }));
  }

  function deleteCommitment(id) {
    setData((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((item) => item.id !== id),
    }));
    notify("Commitment deleted.");
  }

  function togglePaid(id) {
    setData((prev) => ({
      ...prev,
      commitments: prev.commitments.map((item) =>
        item.id === id ? { ...item, paid: !item.paid } : item
      ),
    }));
  }

  function addSpending(event) {
    event.preventDefault();

    const item = {
      id: uid(),
      date: spendingDraft.date || todayInput(),
      amount: num(spendingDraft.amount),
      category: spendingDraft.category || "Other",
      note: spendingDraft.note || "",
    };

    if (item.amount <= 0) {
      notify("Add a valid spending amount.");
      return;
    }

    setData((prev) => ({
      ...prev,
      spendingLogs: [item, ...prev.spendingLogs],
    }));

    setSpendingDraft({
      date: todayInput(),
      amount: "",
      category: "Food",
      note: "",
    });

    notify("Spending saved.");
  }

  function deleteSpending(id) {
    setData((prev) => ({
      ...prev,
      spendingLogs: prev.spendingLogs.filter((item) => item.id !== id),
    }));
    notify("Spending deleted.");
  }

  function loadPreset(name) {
    setData((prev) => ({
      ...prev,
      commitments: presets[name].map(([category, amount, dueDay]) =>
        makeCommitment(category, amount, dueDay)
      ),
    }));
    notify(`${name} preset loaded.`);
  }

  function loadSample() {
    setData(sampleData(selectedMonth));
    setShowOnboarding(false);
    notify("Sample data loaded.");
  }

  function copyPreviousMonth() {
    const prevMonth = previousMonth(selectedMonth);
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${prevMonth}`);

    if (!raw) {
      notify("No previous month data found.");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setData({
        ...blankData(selectedMonth),
        ...parsed,
        selectedMonth,
        spendingLogs: [],
        reflection: blankData(selectedMonth).reflection,
      });
      notify("Previous month setup copied.");
    } catch {
      notify("Could not copy previous month.");
    }
  }

  function resetMonth() {
    const ok = window.confirm("Reset this month only? This cannot be undone.");
    if (!ok) return;

    localStorage.removeItem(`${STORAGE_PREFIX}${selectedMonth}`);
    setData(blankData(selectedMonth));
    notify("This month has been reset.");
  }

  function exportBackup() {
    const payload = {
      app: "RinggitLife",
      version: "v5",
      exportedAt: new Date().toISOString(),
      selectedMonth,
      data,
    };

    downloadFile(
      `ringgitlife-backup-${selectedMonth}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );

    notify("Backup exported.");
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const importedData = payload.data || payload;

        setData({
          ...blankData(selectedMonth),
          ...importedData,
          selectedMonth,
        });

        notify("Backup imported.");
      } catch {
        notify("Invalid backup file.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function exportCsv() {
    const rows = [
      ["date", "category", "amount_myr", "note"],
      ...data.spendingLogs.map((item) => [
        item.date,
        item.category,
        item.amount,
        item.note || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

    downloadFile(
      `ringgitlife-spending-${selectedMonth}.csv`,
      csv,
      "text/csv;charset=utf-8"
    );

    notify("CSV exported.");
  }

  function csvCell(value) {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function updateReflection(field, value) {
    setData((prev) => ({
      ...prev,
      reflection: {
        ...prev.reflection,
        [field]: value,
      },
    }));
  }

  function formatConverter(value, currency) {
    if (currency === "MYR") return formatMYR(value);
    if (currency === "KRW") return formatKRW(value);
    if (currency === "USD") return formatUSD(value);
    return formatPlain(value);
  }

  return (
    <main className="app-shell">
      {toast && <div className="toast">{toast}</div>}

      <header className="topbar" aria-label="RinggitLife navigation">
        <div className="brand-lockup">
          <div className="brand-mark">RL</div>
          <div>
            <strong>RinggitLife</strong>
            <span>Money sense for expat life</span>
          </div>
        </div>

        <nav className="top-nav" aria-label="Page sections">
          <a href="#plan">Plan</a>
          <a href="#spending">Spend</a>
          <a href="#fx">FX</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Expat money sense in Malaysia</p>
          <h1>Don’t lose your money sense in Malaysia.</h1>
          <p className="tagline">
            Know what you can safely spend today, what is already committed,
            and how your MYR life translates back home.
          </p>
          <p className="trust-line">
            Private by default. Data stays in this browser unless you export it.
          </p>
        </div>

        <aside className="hero-panel" aria-label="Expat monthly money preview">
          <div className="hero-panel-head">
            <div>
              <p className="label">Expat monthly brief</p>
              <h3>{selectedMonth}</h3>
            </div>
            <span className={`hero-health ${totals.statusType}`}>
              {totals.score >= 75 ? "Healthy" : totals.score >= 50 ? "Watch" : "Risk"}
            </span>
          </div>

          <div className="hero-safe">
            <span>Safe to spend today</span>
            <strong>{formatMYR(totals.daily)}</strong>
            <ProgressBar value={totals.score} />
          </div>

          <div className="hero-mini-grid">
            <div>
              <span>Income</span>
              <strong>{formatMYR(totals.income)}</strong>
            </div>
            <div>
              <span>Left</span>
              <strong>{formatMYR(totals.remaining)}</strong>
            </div>
            <div>
              <span>Saved</span>
              <strong>{totals.savingsRate.toFixed(1)}%</strong>
            </div>
            <div>
              <span>Days</span>
              <strong>{totals.left}</strong>
            </div>
          </div>

          <div className="hero-flow" aria-hidden="true">
            <div>
              <span style={{ width: `${clamp(totals.fixedRatio, 8, 100)}%` }} />
              <strong>Fixed</strong>
            </div>
            <div>
              <span style={{ width: `${clamp(totals.savingsRate, 8, 100)}%` }} />
              <strong>Saving</strong>
            </div>
            <div>
              <span style={{ width: `${clamp(totals.spendableProgress, 8, 100)}%` }} />
              <strong>Spent</strong>
            </div>
          </div>

          <div className="hero-actions">
            <label className="month-picker">
              <span>Malaysia month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => loadMonthData(event.target.value)}
              />
            </label>

            <button className="ghost-button" onClick={loadSample}>
              Load sample expat month
            </button>
          </div>
        </aside>
      </section>

      {showOnboarding && onboarding.completed < onboarding.steps.length && (
        <section className="onboarding-card">
          <div>
            <p className="label">Start in under 3 minutes</p>
            <h3>Map your Malaysia money reality</h3>
            <p>
              Add MYR income, fixed commitments, and savings or remittance goals.
              RinggitLife will show your daily safe-to-spend amount.
            </p>
          </div>

          <div className="onboarding-steps">
            {onboarding.steps.map((step) => (
              <div className={step.done ? "step done" : "step"} key={step.label}>
                <span>{step.done ? "✓" : "•"}</span>
                {step.label}
              </div>
            ))}
          </div>

          <button className="text-button" onClick={() => setShowOnboarding(false)}>
            Hide guide
          </button>
        </section>
      )}

      <section className="layout">
        <div className="main-column">
          <section className={`safe-card ${totals.statusType}`}>
            <div className="safe-card-top">
              <div>
                <p className="label">Today’s Safe-to-Spend</p>
                <h2>{formatMYR(totals.daily)}</h2>
              </div>
              <div className="days-pill">{totals.left} days left</div>
            </div>

            <p className="status-text">{totals.status}</p>

            <div className="safe-meta-grid">
              <div>
                <span>Spendable used</span>
                <strong>{totals.spendableProgress.toFixed(0)}%</strong>
              </div>
              <div>
                <span>Fixed cost ratio</span>
                <strong>{totals.fixedRatio.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Save/send rate</span>
                <strong>{totals.savingsRate.toFixed(1)}%</strong>
              </div>
            </div>

            <ProgressBar value={totals.spendableProgress} />
          </section>

          <section className="grid-cards">
            <SummaryCard title="MYR income" value={formatMYR(totals.income)} />
            <SummaryCard title="Committed money" value={formatMYR(totals.fixed)} />
            <SummaryCard title="Save / send target" value={formatMYR(totals.savings)} />
            <SummaryCard title="Still usable" value={formatMYR(totals.remaining)} />
            <SummaryCard title="Local spending" value={formatMYR(totals.flexible)} />
            <SummaryCard title="Save / send rate" value={`${totals.savingsRate.toFixed(1)}%`} />
          </section>

          <section className="card score-card">
            <div className="score-top">
              <div>
                <p className="label">Malaysia Money Sense Score</p>
                <h3>{totals.score}/100</h3>
              </div>
              <div className={`score-badge ${totals.statusType}`}>
                {totals.score >= 75 ? "Healthy" : totals.score >= 50 ? "Watch" : "Risky"}
              </div>
            </div>

            <ProgressBar value={totals.score} />

            <p className={`mini-status ${totals.paceType}`}>
              {totals.paceMessage}
            </p>
          </section>

          <section className="insight-grid" aria-label="Monthly insights">
            {launchInsights.map((item) => (
              <article className="insight-card" key={item.label}>
                <p className="label">{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </section>

          <section className="action-strip">
            <button onClick={copyPreviousMonth}>Copy previous month setup</button>
            <button onClick={exportBackup}>Export backup</button>
            <label>
              Import backup
              <input type="file" accept="application/json,.json" onChange={importBackup} />
            </label>
            <button onClick={exportCsv}>Export spending CSV</button>
          </section>

          <details className="card" id="plan" open>
            <summary>MYR Income Setup</summary>

            <div className="form-grid">
              <Input
                label="Monthly MYR income after tax"
                value={data.income.netSalary}
                onChange={(value) => updateIncome("netSalary", value)}
              />
              <Input
                label="Income day"
                value={data.income.salaryDay}
                onChange={(value) => updateIncome("salaryDay", value)}
              />
              <Input
                label="Optional extra MYR income"
                value={data.income.extraIncome}
                onChange={(value) => updateIncome("extraIncome", value)}
              />
              <Input
                label="Starting MYR cash balance"
                value={data.income.startingBalance}
                onChange={(value) => updateIncome("startingBalance", value)}
              />
            </div>
          </details>

          <details className="card" open>
            <summary>Savings / Remittance Goal</summary>

            <div className="form-grid">
              <Input
                label="Monthly savings target"
                value={data.savings.monthlySavingsTarget}
                onChange={(value) => updateSavings("monthlySavingsTarget", value)}
              />
              <Input
                label="Emergency fund target"
                value={data.savings.emergencyFundTarget}
                onChange={(value) => updateSavings("emergencyFundTarget", value)}
              />
              <Input
                label="Investment target"
                value={data.savings.investmentTarget}
                onChange={(value) => updateSavings("investmentTarget", value)}
              />
              <Input
                label="Travel / lifestyle target"
                value={data.savings.lifestyleTarget}
                onChange={(value) => updateSavings("lifestyleTarget", value)}
              />
            </div>

            <div className="insight-box">
              <strong>Total save/send target:</strong> {formatMYR(totals.savings)}
              <br />
              <strong>Reality check:</strong>{" "}
              {totals.remaining >= 0
                ? "Your save/send target is currently workable."
                : "Your save/send target is too aggressive for this month."}
            </div>
          </details>

          <details className="card" open>
            <summary>Malaysia Expat Presets</summary>

            <div className="preset-grid">
              {Object.keys(presets).map((name) => (
                <button
                  key={name}
                  className="preset-button"
                  onClick={() => loadPreset(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </details>

          <details className="card" open>
            <summary>Fixed Monthly Commitments</summary>

            <form className="commitment-form" onSubmit={addCommitment}>
              <input name="name" placeholder="Name, e.g. Rent" required />

              <select name="category">
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount RM"
                required
              />

              <input
                name="dueDay"
                type="number"
                min="1"
                max="31"
                placeholder="Due day"
              />

              <input name="notes" placeholder="Notes" />

              <button type="submit">Add commitment</button>
            </form>

            <div className="list">
              {data.commitments.length === 0 && (
                <p className="empty">
                  No commitments yet. Add rent, bills, remittance, subscriptions, and home-country costs.
                </p>
              )}

              {data.commitments.map((item) => (
                <div className="list-item commitment-item" key={item.id}>
                  <div className="list-main">
                    <input
                      value={item.name}
                      onChange={(event) =>
                        updateCommitment(item.id, "name", event.target.value)
                      }
                    />

                    <select
                      value={item.category}
                      onChange={(event) =>
                        updateCommitment(item.id, "category", event.target.value)
                      }
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>

                    <div className="row">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(event) =>
                          updateCommitment(item.id, "amount", event.target.value)
                        }
                      />

                      <input
                        type="number"
                        value={item.dueDay}
                        onChange={(event) =>
                          updateCommitment(item.id, "dueDay", event.target.value)
                        }
                      />
                    </div>

                    <input
                      value={item.notes}
                      placeholder="Notes"
                      onChange={(event) =>
                        updateCommitment(item.id, "notes", event.target.value)
                      }
                    />
                  </div>

                  <div className="item-actions">
                    <button
                      type="button"
                      className={item.paid ? "paid-button active" : "paid-button"}
                      onClick={() => togglePaid(item.id)}
                    >
                      {item.paid ? "Paid" : "Unpaid"}
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteCommitment(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details className="card" id="spending" open>
            <summary>Quick Local Spending Log</summary>

            <div className="quick-buttons">
              {[5, 10, 20, 50, 100].map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() =>
                    setSpendingDraft((prev) => ({
                      ...prev,
                      amount,
                    }))
                  }
                >
                  RM {amount}
                </button>
              ))}
            </div>

            <form className="spending-form" onSubmit={addSpending}>
              <input
                type="date"
                value={spendingDraft.date}
                onChange={(event) =>
                  setSpendingDraft((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Amount RM"
                value={spendingDraft.amount}
                onChange={(event) =>
                  setSpendingDraft((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
                required
              />

              <select
                value={spendingDraft.category}
                onChange={(event) =>
                  setSpendingDraft((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
              >
                {spendingCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>

              <input
                placeholder="Note"
                value={spendingDraft.note}
                onChange={(event) =>
                  setSpendingDraft((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
              />

              <button type="submit">Save local spending</button>
            </form>
          </details>

          <details className="card">
            <summary>Local Spending History</summary>

            {topSpending.length > 0 && (
              <div className="top-spending">
                <p className="label">Top local spending</p>

                {topSpending.map((item) => (
                  <div key={item.category}>
                    <span>{item.category}</span>
                    <strong>{formatMYR(item.amount)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="list">
              {data.spendingLogs.length === 0 && (
                <p className="empty">
                  No local spending logs yet. Reality remains temporarily unmeasured.
                </p>
              )}

              {data.spendingLogs.map((item) => (
                <div className="list-item history-item" key={item.id}>
                  <div>
                    <strong>{item.category}</strong>
                    <p>
                      {item.date} · {item.note || "No note"}
                    </p>
                  </div>

                  <div className="history-right">
                    <strong>{formatMYR(item.amount)}</strong>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteSpending(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </details>

          <details className="card">
            <summary>End-of-Month Reflection</summary>

            <div className="reflection-grid">
              <Textarea
                label="What went well this month?"
                value={data.reflection.wentWell}
                onChange={(value) => updateReflection("wentWell", value)}
              />
              <Textarea
                label="What should I reduce next month?"
                value={data.reflection.reduceNextMonth}
                onChange={(value) => updateReflection("reduceNextMonth", value)}
              />
              <Textarea
                label="Biggest unnecessary local spending"
                value={data.reflection.unnecessarySpending}
                onChange={(value) => updateReflection("unnecessarySpending", value)}
              />
              <Textarea
                label="Next month focus"
                value={data.reflection.nextMonthFocus}
                onChange={(value) => updateReflection("nextMonthFocus", value)}
              />
            </div>
          </details>

          <button className="danger-zone" onClick={resetMonth}>
            Reset this month only
          </button>
        </div>

        <aside className="side-column">
          <section className="card sticky-summary">
            <p className="label">This month</p>
            <h3>{selectedMonth}</h3>
            <p className="save-status">Last saved: {lastSavedAt || "Not yet"}</p>
            <div className="side-meter">
              <span>Commitments paid</span>
              <strong>
                {paidCommitments.count}/{data.commitments.length}
              </strong>
            </div>
            <ProgressBar value={paidCommitments.percent} />
          </section>

          <section className="card upcoming-card">
            <p className="label">Upcoming unpaid</p>
            <h3>Next money out</h3>

            <div className="mini-list">
              {upcomingCommitments.length === 0 && (
                <p className="empty compact">Nothing unpaid right now.</p>
              )}

              {upcomingCommitments.map((item) => (
                <div key={item.id}>
                  <span>{item.name}</span>
                  <strong>{formatMYR(item.amount)}</strong>
                  <small>Due day {item.dueDay}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="card fx-card" id="fx">
            <div className="fx-header">
              <div>
                <p className="label">Latest FX Snapshot</p>
                <h3>MYR vs home currencies</h3>
              </div>

              <button type="button" onClick={fetchLatestRates}>
                {fxData.loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {fxData.error && <p className="error-text">{fxData.error}</p>}

            <div className="fx-list">
              {fxTargets.map((item) => {
                const rate = fxData.rates?.[item.code];

                return (
                  <div className="fx-row" key={item.code}>
                    <div>
                      <strong>
                        {item.flag} {item.code}
                      </strong>
                      <p>{item.name}</p>
                    </div>
                    <span>{rate ? formatPlain(rate) : "-"}</span>
                  </div>
                );
              })}
            </div>

            <p className="fx-note">
              Base: 1 MYR. Latest snapshot, not tick-by-tick trading data.
            </p>

            {fxData.timeLastUpdateUtc && (
              <p className="fx-date">Last update: {fxData.timeLastUpdateUtc}</p>
            )}
          </section>

          <section className="card">
            <p className="label">Manual Currency Snapshot</p>
            <h3>Income reality check</h3>

            <div className="form-grid one">
              <Input
                label="1 RM = KRW"
                value={data.exchangeRates.rmToKrw}
                onChange={(value) => updateExchange("rmToKrw", value)}
              />

              <Input
                label="1 USD = RM"
                value={data.exchangeRates.usdToRm}
                onChange={(value) => updateExchange("usdToRm", value)}
              />
            </div>

            <div className="conversion-list">
              <div>
                <span>Income in KRW</span>
                <strong>{formatKRW(salaryKrw)}</strong>
              </div>

              <div>
                <span>Income in USD</span>
                <strong>{formatUSD(salaryUsd)}</strong>
              </div>

              <div>
                <span>Savings in KRW</span>
                <strong>
                  {formatKRW(totals.savings * data.exchangeRates.rmToKrw)}
                </strong>
              </div>

              <div>
                <span>Savings in USD</span>
                <strong>
                  {formatUSD(
                    data.exchangeRates.usdToRm > 0
                      ? totals.savings / data.exchangeRates.usdToRm
                      : 0
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="card converter-card">
            <p className="label">Quick Converter</p>
            <h3>MYR / KRW / USD</h3>

            <div className="converter-grid">
              <input
                type="number"
                step="0.01"
                value={data.converter.amount}
                onChange={(event) => updateConverter("amount", event.target.value)}
              />

              <select
                value={data.converter.from}
                onChange={(event) => updateConverter("from", event.target.value)}
              >
                <option value="MYR">MYR</option>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </select>

              <span className="converter-arrow">→</span>

              <select
                value={data.converter.to}
                onChange={(event) => updateConverter("to", event.target.value)}
              >
                <option value="MYR">MYR</option>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div className="converter-result">
              {formatConverter(converterResult, data.converter.to)}
            </div>

            <p className="fx-note light">
              Uses your manual rates above. Useful for income, remittance, and savings checks.
            </p>
          </section>

          <section className="card korean-card">
            <div className="toggle-row">
              <div>
                <p className="label">Optional</p>
                <h3>Home-country obligations</h3>
              </div>

              <button
                type="button"
                className={data.homeCountryMode || data.koreanMode ? "toggle active" : "toggle"}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    homeCountryMode: !(prev.homeCountryMode || prev.koreanMode),
                    koreanMode: false,
                  }))
                }
              >
                {data.homeCountryMode || data.koreanMode ? "On" : "Off"}
              </button>
            </div>

            {(data.homeCountryMode || data.koreanMode) && (
              <p className="expat-note">
                Track home credit cards, insurance, family support, remittance, and savings alongside your Malaysia costs.
              </p>
            )}
          </section>

          <section className="card">
            <p className="label">Cash flow formula</p>
            <div className="formula">
              MYR income
              <br />− Fixed commitments
              <br />− Save/send target
              <br />− Local spending
              <br />÷ Days left
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function SummaryCard({ title, value }) {
  return (
    <section className="summary-card">
      <p>{title}</p>
      <strong>{value}</strong>
    </section>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress-bar">
      <div style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}
