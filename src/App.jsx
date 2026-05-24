import { useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "ringgitlife_v5_";
const SETTINGS_KEY = "ringgitlife_settings_v1";
const PROFILE_KEY = "ringgitlife_profile_v1";

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
  "Daily total",
  "Card import",
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

function makeGoal(name, target, saved = 0, dueDate = "", note = "") {
  return {
    id: uid(),
    name,
    target,
    saved,
    dueDate,
    note,
  };
}

function blankData(monthKey = currentMonth()) {
  return {
    selectedMonth: monthKey,
    personal: {
      monthlySpendingTarget: 0,
      homeCurrency: "KRW",
    },
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
    goals: [],
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
    personal: {
      monthlySpendingTarget: 5500,
      homeCurrency: "KRW",
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
    goals: [
      makeGoal("Emergency flight fund", 2500, 900, "", "A calm buffer for flights home."),
      makeGoal("Japan trip", 6000, 1800, "", "Travel without touching rent money."),
    ],
  };
}

export default function App() {
  const initialAppState = (() => {
    let selectedMonth = currentMonth();
    let showOnboarding = true;
    let profile = null;

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

    const rawProfile = localStorage.getItem(PROFILE_KEY);
    if (rawProfile) {
      try {
        profile = JSON.parse(rawProfile);
      } catch {
        profile = null;
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

    return { selectedMonth, showOnboarding, data, profile };
  })();

  const [selectedMonth, setSelectedMonth] = useState(initialAppState.selectedMonth);
  const [data, setData] = useState(initialAppState.data);
  const [toast, setToast] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(initialAppState.showOnboarding);
  const [activeTab, setActiveTab] = useState("today");
  const [profile, setProfile] = useState(initialAppState.profile);
  const [isUnlocked, setIsUnlocked] = useState(
    initialAppState.profile ? !initialAppState.profile.lockEnabled : false
  );
  const [authDraft, setAuthDraft] = useState({
    name: initialAppState.profile?.name || "",
    email: initialAppState.profile?.email || "",
    passcode: "",
  });

  const [spendingDraft, setSpendingDraft] = useState({
    date: todayInput(),
    amount: "",
    category: "Food",
    note: "",
  });
  const [dailyTotalDraft, setDailyTotalDraft] = useState({
    date: todayInput(),
    amount: "",
  });
  const [pasteDraft, setPasteDraft] = useState("");

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
    const spendingTarget = num(data.personal?.monthlySpendingTarget);
    const monthlySpendLimit =
      spendingTarget > 0
        ? Math.min(spendableBeforeFlexible, spendingTarget)
        : spendableBeforeFlexible;
    const remaining = monthlySpendLimit - flexible;
    const left = daysLeft(selectedMonth);
    const daily = remaining / left;

    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const fixedRatio = income > 0 ? (fixed / income) * 100 : 0;

    const expectedFlexibleUsed =
      monthlySpendLimit * monthProgress(selectedMonth);

    const paceRatio =
      expectedFlexibleUsed > 0 ? (flexible / expectedFlexibleUsed) * 100 : 0;

    const spendableProgress =
      monthlySpendLimit > 0
        ? clamp((flexible / monthlySpendLimit) * 100, 0, 999)
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

    if (monthlySpendLimit > 0) {
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
      spendingTarget,
      monthlySpendLimit,
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

  const goalSummary = useMemo(() => {
    const goals = data.goals || [];
    const target = goals.reduce((sum, item) => sum + num(item.target), 0);
    const saved = goals.reduce((sum, item) => sum + num(item.saved), 0);

    return {
      count: goals.length,
      target,
      saved,
      percent: target > 0 ? clamp(Math.round((saved / target) * 100), 0, 100) : 0,
    };
  }, [data.goals]);

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

  function saveProfile(event) {
    event.preventDefault();
    const nextPasscode = authDraft.passcode.trim() || profile?.passcode || "";

    const nextProfile = {
      name: authDraft.name.trim() || "Malaysia expat",
      email: authDraft.email.trim(),
      passcode: nextPasscode,
      lockEnabled: nextPasscode.length > 0,
      createdAt: profile?.createdAt || new Date().toISOString(),
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setIsUnlocked(true);
    setAuthDraft((prev) => ({ ...prev, passcode: "" }));
    notify("Profile saved.");
  }

  function unlockProfile(event) {
    event.preventDefault();

    if (!profile?.lockEnabled || authDraft.passcode === profile.passcode) {
      setIsUnlocked(true);
      setAuthDraft((prev) => ({ ...prev, passcode: "" }));
      notify("Welcome back.");
      return;
    }

    notify("Passcode does not match.");
  }

  function lockApp() {
    if (!profile?.lockEnabled) {
      setActiveTab("me");
      notify("Add a passcode in Privacy first.");
      return;
    }

    setIsUnlocked(false);
    setAuthDraft((prev) => ({ ...prev, passcode: "" }));
  }

  function saveQuickSetup(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const income = num(form.get("income"));
    const spendTarget = num(form.get("spendTarget"));
    const fixedEstimate = num(form.get("fixedEstimate"));

    if (income <= 0 || spendTarget <= 0) {
      notify("Add income and a monthly spend target.");
      return;
    }

    setData((prev) => {
      const nextCommitments = [...prev.commitments];
      const estimateIndex = nextCommitments.findIndex(
        (item) => item.name === "Fixed costs estimate"
      );

      if (fixedEstimate > 0) {
        const estimate = makeCommitment("Fixed costs estimate", fixedEstimate, 1);
        estimate.category = "Other";
        estimate.notes = "Quick setup estimate";

        if (estimateIndex >= 0) {
          nextCommitments[estimateIndex] = {
            ...nextCommitments[estimateIndex],
            amount: fixedEstimate,
          };
        } else {
          nextCommitments.unshift(estimate);
        }
      }

      return {
        ...prev,
        personal: {
          ...blankData(selectedMonth).personal,
          ...prev.personal,
          monthlySpendingTarget: spendTarget,
        },
        income: {
          ...prev.income,
          netSalary: income,
        },
        commitments: nextCommitments,
      };
    });

    setShowOnboarding(false);
    setActiveTab("today");
    notify("Simple setup saved.");
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

  function updatePersonal(field, value) {
    setData((prev) => ({
      ...prev,
      personal: {
        ...blankData(selectedMonth).personal,
        ...prev.personal,
        [field]: field === "monthlySpendingTarget" ? num(value) : value,
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

  function addDailyTotal(event) {
    event.preventDefault();

    const item = {
      id: uid(),
      date: dailyTotalDraft.date || todayInput(),
      amount: num(dailyTotalDraft.amount),
      category: "Daily total",
      note: "Daily card/cash total",
    };

    if (item.amount <= 0) {
      notify("Add today's total amount.");
      return;
    }

    setData((prev) => ({
      ...prev,
      spendingLogs: [item, ...prev.spendingLogs],
    }));

    setDailyTotalDraft({
      date: todayInput(),
      amount: "",
    });
    notify("Daily total saved.");
  }

  function addPastedTransactions(event) {
    event.preventDefault();

    const lines = pasteDraft
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const items = lines
      .map((line) => {
        const amountMatch = line.match(/(?:RM|MYR)?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|-?\d+(?:\.\d{1,2}))/i);
        if (!amountMatch) return null;

        const amount = Math.abs(num(amountMatch[1].replace(/,/g, "")));
        if (amount <= 0) return null;

        const dateMatch = line.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/);

        return {
          id: uid(),
          date: normalizePastedDate(dateMatch?.[1]) || todayInput(),
          amount,
          category: "Card import",
          note: line.slice(0, 90),
        };
      })
      .filter(Boolean);

    if (items.length === 0) {
      notify("No transaction amounts found.");
      return;
    }

    setData((prev) => ({
      ...prev,
      spendingLogs: [...items, ...prev.spendingLogs],
    }));

    setPasteDraft("");
    notify(`${items.length} transaction${items.length === 1 ? "" : "s"} added.`);
  }

  function normalizePastedDate(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const parts = value.split(/[/-]/).map(Number);
    if (parts.length < 2) return "";

    const now = new Date();
    const day = String(parts[0]).padStart(2, "0");
    const month = String(parts[1]).padStart(2, "0");
    const year = parts[2]
      ? String(parts[2]).length === 2
        ? `20${parts[2]}`
        : String(parts[2])
      : String(now.getFullYear());

    return `${year}-${month}-${day}`;
  }

  function deleteSpending(id) {
    setData((prev) => ({
      ...prev,
      spendingLogs: prev.spendingLogs.filter((item) => item.id !== id),
    }));
    notify("Spending deleted.");
  }

  function addGoal(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const target = num(form.get("target"));

    if (!name || target <= 0) {
      notify("Add a goal name and target.");
      return;
    }

    const goal = makeGoal(
      name,
      target,
      num(form.get("saved")),
      form.get("dueDate") || "",
      form.get("note") || ""
    );

    setData((prev) => ({
      ...prev,
      goals: [goal, ...(prev.goals || [])],
    }));

    event.currentTarget.reset();
    notify("Goal created.");
  }

  function updateGoal(id, field, value) {
    setData((prev) => ({
      ...prev,
      goals: (prev.goals || []).map((goal) =>
        goal.id === id
          ? {
              ...goal,
              [field]: field === "target" || field === "saved" ? num(value) : value,
            }
          : goal
      ),
    }));
  }

  function deleteGoal(id) {
    setData((prev) => ({
      ...prev,
      goals: (prev.goals || []).filter((goal) => goal.id !== id),
    }));
    notify("Goal deleted.");
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

  if (!isUnlocked) {
    const isProfileSetup = !profile;

    return (
      <main className="auth-shell">
        {toast && <div className="toast">{toast}</div>}

        <section className="auth-card">
          <div className="brand-lockup">
            <div className="brand-mark">RL</div>
            <div>
              <strong>RinggitLife</strong>
              <span>Private money sense</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">
              {isProfileSetup ? "Private profile" : "Personal finance lock"}
            </p>
            <h1>
              {isProfileSetup
                ? "Create your Malaysia money profile."
                : "Unlock your Malaysia money view."}
            </h1>
            <p className="tagline">
              Your data stays on this device. This is a local app profile,
              not a cloud account yet.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={isProfileSetup ? saveProfile : unlockProfile}
          >
            {isProfileSetup && (
              <>
                <input
                  placeholder="Name"
                  value={authDraft.name}
                  onChange={(event) =>
                    setAuthDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  autoFocus
                />
                <input
                  type="email"
                  placeholder="Email, optional"
                  value={authDraft.email}
                  onChange={(event) =>
                    setAuthDraft((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </>
            )}

            <input
              type="password"
              inputMode="numeric"
              placeholder={isProfileSetup ? "Passcode, optional" : "Passcode"}
              value={authDraft.passcode}
              onChange={(event) =>
                setAuthDraft((prev) => ({ ...prev, passcode: event.target.value }))
              }
              autoFocus={!isProfileSetup}
            />
            <button type="submit">
              {isProfileSetup ? "Start RinggitLife" : "Unlock"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (showOnboarding && onboarding.completed < onboarding.steps.length) {
    return (
      <main className="auth-shell setup-shell">
        {toast && <div className="toast">{toast}</div>}

        <section className="auth-card setup-card">
          <div className="brand-lockup">
            <div className="brand-mark">RL</div>
            <div>
              <strong>RinggitLife</strong>
              <span>Simple setup</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">No bank login needed</p>
            <h1>Start with 3 rough numbers.</h1>
            <p className="tagline">
              This gives you today’s safe-to-spend. You can adjust the details
              later in Me.
            </p>
          </div>

          <form className="quick-setup-form" onSubmit={saveQuickSetup}>
            <input
              name="income"
              type="number"
              step="0.01"
              placeholder="Monthly income RM"
              defaultValue={data.income.netSalary || ""}
            />
            <input
              name="spendTarget"
              type="number"
              step="0.01"
              placeholder="Monthly spending target RM"
              defaultValue={data.personal?.monthlySpendingTarget || ""}
            />
            <input
              name="fixedEstimate"
              type="number"
              step="0.01"
              placeholder="Fixed costs estimate RM"
              defaultValue={totals.fixed || ""}
            />
            <button type="submit">Show my safe-to-spend</button>
          </form>

          <button className="text-button" onClick={() => setShowOnboarding(false)}>
            Set up later
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell app-mode mobile-tab-${activeTab}`}>
      {toast && <div className="toast">{toast}</div>}

      <header className="topbar" aria-label="RinggitLife navigation">
        <div className="brand-lockup">
          <div className="brand-mark">RL</div>
          <div>
            <strong>RinggitLife</strong>
            <span>{profile?.name || "Money sense for expat life"}</span>
          </div>
        </div>

        <button className="lock-button" type="button" onClick={lockApp}>
          Lock
        </button>

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

      <section className="layout">
        <div className="main-column">
          <section className="screen-title tab-section today-tab">
            <p className="eyebrow">Today</p>
            <h1>Today, how much can I spend?</h1>
          </section>

          <section className="mobile-month-card tab-section today-tab">
            <label className="month-picker">
              <span>Malaysia month</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => loadMonthData(event.target.value)}
              />
            </label>

            <button className="ghost-button" onClick={loadSample}>
              Load sample
            </button>
          </section>

          {totals.income > 0 && (totals.remaining < 0 || totals.paceRatio > 120) && (
            <section className="status-card danger tab-section today-tab">
              <p className="label">Slow down</p>
              <h3>
                {totals.remaining < 0
                  ? `${formatMYR(Math.abs(totals.remaining))} over your safe plan`
                  : "Spending faster than planned"}
              </h3>
              <p>
                Use Daily Total tonight and try a low-spend day to bring your
                safe-to-spend back up.
              </p>
            </section>
          )}

          <section className="screen-title tab-section spend-tab">
            <p className="eyebrow">Spend</p>
            <h1>Log it the lazy way.</h1>
          </section>

          <section className={`safe-card tab-section today-tab ${totals.statusType}`}>
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

          <section className="card quick-today-card tab-section today-tab">
            <div className="quick-today-head">
              <div>
                <p className="label">Quick add</p>
                <h3>Spent something?</h3>
              </div>
              <button type="button" className="text-button" onClick={() => setActiveTab("spend")}>
                View all
              </button>
            </div>

            <div className="quick-buttons compact">
              {[5, 10, 20, 50].map((amount) => (
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

            <form className="quick-today-form" onSubmit={addSpending}>
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
              <button type="submit">Save</button>
            </form>
          </section>

          <section className="grid-cards tab-section today-tab">
            <SummaryCard title="MYR income" value={formatMYR(totals.income)} />
            <SummaryCard title="Committed money" value={formatMYR(totals.fixed)} />
            <SummaryCard title="Monthly spend goal" value={formatMYR(totals.monthlySpendLimit)} />
            <SummaryCard title="Still usable" value={formatMYR(totals.remaining)} />
            <SummaryCard title="Local spending" value={formatMYR(totals.flexible)} />
            <SummaryCard title="Saving goals" value={`${goalSummary.count}`} />
          </section>

          <section className="card score-card tab-section today-tab">
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

          <section className="insight-grid tab-section today-tab" aria-label="Monthly insights">
            {launchInsights.map((item) => (
              <article className="insight-card" key={item.label}>
                <p className="label">{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </section>

          <section className="screen-title tab-section me-tab">
            <p className="eyebrow">Me</p>
            <h1>Your money setup.</h1>
          </section>

          <details className="card tab-section me-tab" open>
            <summary>Personal Settings</summary>

            <div className="form-grid">
              <Input
                label="Monthly local spending target"
                value={data.personal?.monthlySpendingTarget || 0}
                onChange={(value) => updatePersonal("monthlySpendingTarget", value)}
              />

              <label className="field">
                <span>Home currency</span>
                <select
                  value={data.personal?.homeCurrency || "KRW"}
                  onChange={(event) => updatePersonal("homeCurrency", event.target.value)}
                >
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="IDR">IDR</option>
                  <option value="THB">THB</option>
                  <option value="PHP">PHP</option>
                </select>
              </label>
            </div>

            <div className="insight-box">
              <strong>Spend cap:</strong> {formatMYR(totals.monthlySpendLimit)}
              <br />
              <strong>Safe-to-spend:</strong> {formatMYR(totals.daily)} per day
            </div>
          </details>

          <details className="card tab-section me-tab" id="plan">
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

          <details className="card tab-section me-tab">
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

          <details className="card tab-section me-tab">
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

          <details className="card tab-section me-tab">
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

          <section className="screen-title tab-section goals-tab">
            <p className="eyebrow">Goals</p>
            <h1>Build money for future you.</h1>
          </section>

          <section className="card goal-hero tab-section goals-tab">
            <div>
              <p className="label">Total goal progress</p>
              <h3>{formatMYR(goalSummary.saved)}</h3>
              <p className="save-status">
                {goalSummary.count} goals toward {formatMYR(goalSummary.target)}
              </p>
            </div>
            <div className="goal-ring">
              <div>
                <strong>{goalSummary.percent}%</strong>
                <span>saved</span>
              </div>
            </div>
            <ProgressBar value={goalSummary.percent} />
          </section>

          <details className="card tab-section goals-tab" open>
            <summary>Create Goal</summary>

            <form className="goal-form" onSubmit={addGoal}>
              <input name="name" placeholder="Goal name, e.g. Emergency flight fund" required />
              <input name="target" type="number" step="0.01" placeholder="Target RM" required />
              <input name="saved" type="number" step="0.01" placeholder="Saved so far RM" />
              <input name="dueDate" type="date" />
              <input name="note" placeholder="Why this matters" />
              <button type="submit">Create goal</button>
            </form>
          </details>

          <section className="list tab-section goals-tab">
            {(data.goals || []).length === 0 && (
              <p className="empty">
                No goals yet. Create one for travel, emergency cash, a deposit, or a flight home.
              </p>
            )}

            {(data.goals || []).map((goal) => {
              const percent =
                num(goal.target) > 0
                  ? clamp(Math.round((num(goal.saved) / num(goal.target)) * 100), 0, 100)
                  : 0;

              return (
                <article className="list-item goal-item" key={goal.id}>
                  <div className="goal-item-head">
                    <div>
                      <strong>{goal.name}</strong>
                      <p>{goal.note || "Personal money goal"}</p>
                    </div>
                    <span>{percent}%</span>
                  </div>

                  <ProgressBar value={percent} />

                  <div className="form-grid">
                    <Input
                      label="Target RM"
                      value={goal.target}
                      onChange={(value) => updateGoal(goal.id, "target", value)}
                    />
                    <Input
                      label="Saved RM"
                      value={goal.saved}
                      onChange={(value) => updateGoal(goal.id, "saved", value)}
                    />
                  </div>

                  <div className="item-actions">
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Delete goal
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <details className="card tab-section spend-tab" id="spending" open>
            <summary>Fast Capture</summary>

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

          <details className="card tab-section spend-tab" open>
            <summary>Daily Total Mode</summary>

            <form className="daily-total-form" onSubmit={addDailyTotal}>
              <input
                type="date"
                value={dailyTotalDraft.date}
                onChange={(event) =>
                  setDailyTotalDraft((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder="Today total spent RM"
                value={dailyTotalDraft.amount}
                onChange={(event) =>
                  setDailyTotalDraft((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
                required
              />
              <button type="submit">Save daily total</button>
            </form>

            <p className="helper-text">
              Use this when you paid by card all day and only want the total to
              affect safe-to-spend.
            </p>
          </details>

          <details className="card tab-section spend-tab">
            <summary>Paste Card Transactions</summary>

            <form className="paste-form" onSubmit={addPastedTransactions}>
              <textarea
                placeholder={`Paste bank SMS or card lines, e.g.\n25/05 Grab RM 18.50\n2026-05-25 Coffee MYR 12.00`}
                value={pasteDraft}
                onChange={(event) => setPasteDraft(event.target.value)}
              />
              <button type="submit">Add pasted transactions</button>
            </form>

            <p className="helper-text">
              No bank login needed. RinggitLife only extracts amounts from text you paste.
            </p>
          </details>

          <details className="card tab-section spend-tab">
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

          <details className="card tab-section me-tab">
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

        </div>

        <aside className="side-column">
          <section className="card sticky-summary tab-section today-tab">
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

          <section className="card upcoming-card tab-section today-tab">
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

          <section className="action-strip tab-section me-tab">
            <button onClick={copyPreviousMonth}>Copy previous month setup</button>
            <button onClick={exportBackup}>Export backup</button>
            <label>
              Import backup
              <input type="file" accept="application/json,.json" onChange={importBackup} />
            </label>
            <button onClick={exportCsv}>Export spending CSV</button>
          </section>

          <section className="card fx-card tab-section me-tab" id="fx">
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

          <section className="card tab-section me-tab">
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

          <section className="card converter-card tab-section me-tab">
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

          <section className="card tab-section me-tab">
            <p className="label">Privacy profile</p>
            <h3>Local app lock</h3>

            <form className="auth-form profile-form" onSubmit={saveProfile}>
              <input
                placeholder="Name"
                value={authDraft.name}
                onChange={(event) =>
                  setAuthDraft((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <input
                type="email"
                placeholder="Email, optional"
                value={authDraft.email}
                onChange={(event) =>
                  setAuthDraft((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder={profile?.lockEnabled ? "New passcode" : "Passcode for this device"}
                value={authDraft.passcode}
                onChange={(event) =>
                  setAuthDraft((prev) => ({ ...prev, passcode: event.target.value }))
                }
              />
              <button type="submit">Save privacy profile</button>
            </form>

            <p className="privacy-note">
              Prototype lock only: this protects the app on this browser. Real login,
              cloud sync, and account recovery need a backend before launch.
            </p>
          </section>

          <section className="card korean-card tab-section me-tab">
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

          <section className="card tab-section me-tab">
            <p className="label">Cash flow formula</p>
            <div className="formula">
              MYR income
              <br />− Fixed commitments
              <br />− Save/send target
              <br />− Local spending
              <br />÷ Days left
            </div>
          </section>

          <button className="danger-zone tab-section me-tab" onClick={resetMonth}>
            Reset this month only
          </button>
        </aside>
      </section>

      <nav className="mobile-tabbar" aria-label="Mobile app sections">
        <TabButton activeTab={activeTab} id="today" label="Today" icon="home" onSelect={setActiveTab} />
        <TabButton activeTab={activeTab} id="spend" label="Spend" icon="log" onSelect={setActiveTab} />
        <TabButton activeTab={activeTab} id="goals" label="Goals" icon="goal" onSelect={setActiveTab} />
        <TabButton activeTab={activeTab} id="me" label="Me" icon="settings" onSelect={setActiveTab} />
      </nav>
    </main>
  );
}

function TabButton({ activeTab, id, label, icon, onSelect }) {
  return (
    <button
      type="button"
      className={activeTab === id ? "active" : ""}
      onClick={() => onSelect(id)}
    >
      <TabIcon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function TabIcon({ name }) {
  const icons = {
    home: (
      <path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z" />
    ),
    log: (
      <>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    plan: (
      <>
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8M8 13h8M8 17h5" />
      </>
    ),
    goal: (
      <>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M16.5 7.5 19 5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5 6.8 15M17.2 9l2.6-1.5" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
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
