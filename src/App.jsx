import { useEffect, useMemo, useState } from "react";
import "./index.css";

const STORAGE_KEY_PREFIX = "ringgitlife_v3_";

const currencyTargets = [
  { code: "KRW", name: "Korean Won", flag: "🇰🇷" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "IDR", name: "Indonesian Rupiah", flag: "🇮🇩" },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭" },
  { code: "VND", name: "Vietnamese Dong", flag: "🇻🇳" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
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

const baseCommitments = [
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

const koreanExtraCategories = [
  "Korea phone bill",
  "Korean insurance",
  "Korean credit card payment",
  "Korean family support",
  "KRW savings",
  "USD investment",
  "Remittance to Korea",
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
  "Budget Mode": [
    ["Rent", 900, 1],
    ["Utilities", 150, 10],
    ["Phone", 50, 15],
    ["Transport", 250, 1],
    ["Food baseline", 800, 1],
    ["Subscriptions", 30, 25],
  ],
};

function getCurrentMonthKey() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthDate(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function getDaysInSelectedMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getDaysLeftInSelectedMonth(monthKey) {
  const now = new Date();
  const currentMonthKey = getCurrentMonthKey();
  const daysInMonth = getDaysInSelectedMonth(monthKey);

  if (monthKey === currentMonthKey) {
    return Math.max(daysInMonth - now.getDate() + 1, 1);
  }

  const selectedMonth = getMonthDate(monthKey);
  const currentMonth = getMonthDate(currentMonthKey);

  if (selectedMonth < currentMonth) {
    return 1;
  }

  return daysInMonth;
}

function getMonthProgressRatio(monthKey) {
  const now = new Date();
  const currentMonthKey = getCurrentMonthKey();
  const daysInMonth = getDaysInSelectedMonth(monthKey);

  if (monthKey === currentMonthKey) {
    return now.getDate() / daysInMonth;
  }

  const selectedMonth = getMonthDate(monthKey);
  const currentMonth = getMonthDate(currentMonthKey);

  if (selectedMonth < currentMonth) {
    return 1;
  }

  return 0;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMYR(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatKRW(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPlain(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function createCommitment(name, amount, dueDay) {
  return {
    id: crypto.randomUUID(),
    name,
    category: name,
    amount,
    dueDay,
    paid: false,
    recurring: true,
    notes: "",
  };
}

function createDefaultData(monthKey = getCurrentMonthKey()) {
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
    exchangeRatesManual: {
      rmToKrw: 290,
      usdToRm: 4.7,
    },
    koreanMode: false,
    reflection: {
      wentWell: "",
      reduceNextMonth: "",
      unnecessarySpending: "",
      nextMonthFocus: "",
    },
    converter: {
      amount: 1000,
      from: "MYR",
      to: "KRW",
    },
  };
}

function createSampleData(monthKey = getCurrentMonthKey()) {
  return {
    selectedMonth: monthKey,
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
      createCommitment("Rent", 2800, 1),
      createCommitment("Utilities", 250, 10),
      createCommitment("Phone", 100, 15),
      createCommitment("Internet", 150, 15),
      createCommitment("Transport", 500, 1),
      createCommitment("Food baseline", 1800, 1),
      createCommitment("Gym / Fitness", 350, 5),
      createCommitment("Insurance", 300, 20),
      createCommitment("Remittance", 1000, 25),
      createCommitment("Subscriptions", 100, 25),
    ],
    spendingLogs: [
      {
        id: crypto.randomUUID(),
        date: getTodayDateInput(),
        amount: 12,
        category: "Coffee",
        note: "Coffee",
      },
      {
        id: crypto.randomUUID(),
        date: getTodayDateInput(),
        amount: 18,
        category: "Food",
        note: "Lunch",
      },
      {
        id: crypto.randomUUID(),
        date: getTodayDateInput(),
        amount: 25,
        category: "Grab / Transport",
        note: "Grab",
      },
      {
        id: crypto.randomUUID(),
        date: getTodayDateInput(),
        amount: 120,
        category: "Groceries",
        note: "Groceries",
      },
    ],
    exchangeRatesManual: {
      rmToKrw: 290,
      usdToRm: 4.7,
    },
    koreanMode: false,
    reflection: {
      wentWell: "",
      reduceNextMonth: "",
      unnecessarySpending: "",
      nextMonthFocus: "",
    },
    converter: {
      amount: 1000,
      from: "MYR",
      to: "KRW",
    },
  };
}

function App() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [data, setData] = useState(() => createDefaultData(getCurrentMonthKey()));

  const [spendingDraft, setSpendingDraft] = useState({
    date: getTodayDateInput(),
    amount: "",
    category: "Food",
    note: "",
  });

  const [fxData, setFxData] = useState({
    loading: false,
    error: "",
    base: "MYR",
    timeLastUpdateUtc: "",
    rates: {},
  });

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${selectedMonth}`;
    const raw = localStorage.getItem(storageKey);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setData({
          ...createDefaultData(selectedMonth),
          ...parsed,
          selectedMonth,
        });
      } catch {
        setData(createDefaultData(selectedMonth));
      }
    } else {
      setData(createDefaultData(selectedMonth));
    }
  }, [selectedMonth]);

  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${selectedMonth}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...data,
        selectedMonth,
      })
    );
  }, [data, selectedMonth]);

  useEffect(() => {
    fetchLatestRates();
  }, []);

  const categories = useMemo(() => {
    return data.koreanMode
      ? [...baseCommitments, ...koreanExtraCategories]
      : baseCommitments;
  }, [data.koreanMode]);

  const totals = useMemo(() => {
    const totalIncome =
      numberValue(data.income.netSalary) +
      numberValue(data.income.extraIncome) +
      numberValue(data.income.startingBalance);

    const fixedCommitments = data.commitments.reduce(
      (sum, item) => sum + numberValue(item.amount),
      0
    );

    const savingsTarget =
      numberValue(data.savings.monthlySavingsTarget) +
      numberValue(data.savings.emergencyFundTarget) +
      numberValue(data.savings.investmentTarget) +
      numberValue(data.savings.lifestyleTarget);

    const flexibleSpent = data.spendingLogs.reduce(
      (sum, item) => sum + numberValue(item.amount),
      0
    );

    const monthlySpendableBeforeFlexible =
      totalIncome - fixedCommitments - savingsTarget;

    const remainingSpendable = monthlySpendableBeforeFlexible - flexibleSpent;

    const daysLeft = getDaysLeftInSelectedMonth(selectedMonth);
    const dailySafeToSpend = remainingSpendable / daysLeft;

    const savingsRate = totalIncome > 0 ? (savingsTarget / totalIncome) * 100 : 0;
    const fixedCostRatio =
      totalIncome > 0 ? (fixedCommitments / totalIncome) * 100 : 0;

    const expectedFlexibleUsed =
      monthlySpendableBeforeFlexible * getMonthProgressRatio(selectedMonth);

    const spendingPaceRatio =
      expectedFlexibleUsed > 0
        ? (flexibleSpent / expectedFlexibleUsed) * 100
        : 0;

    let score = 100;

    if (fixedCostRatio > 60) score -= Math.min(25, (fixedCostRatio - 60) * 1.2);
    if (savingsRate < 10) score -= 15;
    if (dailySafeToSpend < 0) score -= 30;
    if (spendingPaceRatio > 120) score -= 15;
    if (remainingSpendable < 0) score -= 15;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let status = "Set your salary and fixed costs to see your daily safe-to-spend.";
    let statusType = "neutral";

    if (totalIncome > 0) {
      if (dailySafeToSpend < 0) {
        status = "You are already over budget. Reduce spending or adjust savings target.";
        statusType = "danger";
      } else if (dailySafeToSpend < 40) {
        status = "Tight month. Keep daily spending controlled.";
        statusType = "warning";
      } else if (dailySafeToSpend < 120) {
        status = "You are okay, but avoid random big spending.";
        statusType = "moderate";
      } else {
        status = "You have room this month. Stay consistent.";
        statusType = "good";
      }
    }

    let paceMessage = "No flexible spending pace yet.";
    let paceType = "neutral";

    if (monthlySpendableBeforeFlexible > 0) {
      if (spendingPaceRatio > 120) {
        paceMessage = "You are spending faster than planned.";
        paceType = "danger";
      } else if (spendingPaceRatio < 80) {
        paceMessage = "You are spending below your monthly pace.";
        paceType = "good";
      } else {
        paceMessage = "Your spending pace is close to plan.";
        paceType = "moderate";
      }
    }

    return {
      totalIncome,
      fixedCommitments,
      savingsTarget,
      flexibleSpent,
      monthlySpendableBeforeFlexible,
      remainingSpendable,
      daysLeft,
      dailySafeToSpend,
      savingsRate,
      fixedCostRatio,
      expectedFlexibleUsed,
      spendingPaceRatio,
      score,
      status,
      statusType,
      paceMessage,
      paceType,
    };
  }, [data, selectedMonth]);

  const converterResult = useMemo(() => {
    const amount = numberValue(data.converter.amount);
    const from = data.converter.from;
    const to = data.converter.to;

    if (amount <= 0) return 0;
    if (from === to) return amount;

    const rmToKrw = numberValue(data.exchangeRatesManual.rmToKrw);
    const usdToRm = numberValue(data.exchangeRatesManual.usdToRm);

    let amountInRm = amount;

    if (from === "KRW") amountInRm = rmToKrw > 0 ? amount / rmToKrw : 0;
    if (from === "USD") amountInRm = amount * usdToRm;
    if (from === "MYR") amountInRm = amount;

    if (to === "MYR") return amountInRm;
    if (to === "KRW") return amountInRm * rmToKrw;
    if (to === "USD") return usdToRm > 0 ? amountInRm / usdToRm : 0;

    return 0;
  }, [data.converter, data.exchangeRatesManual]);

  async function fetchLatestRates() {
    setFxData((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      const response = await fetch("https://open.er-api.com/v6/latest/MYR");
      const result = await response.json();

      if (!response.ok || result.result !== "success") {
        throw new Error("Failed to fetch exchange rates");
      }

      setFxData({
        loading: false,
        error: "",
        base: result.base_code || "MYR",
        timeLastUpdateUtc: result.time_last_update_utc || "",
        rates: result.rates || {},
      });
    } catch {
      setFxData((prev) => ({
        ...prev,
        loading: false,
        error: "FX snapshot fetch failed. Manual converter still works.",
      }));
    }
  }

  function updateIncome(field, value) {
    setData((prev) => ({
      ...prev,
      income: {
        ...prev.income,
        [field]: numberValue(value),
      },
    }));
  }

  function updateSavings(field, value) {
    setData((prev) => ({
      ...prev,
      savings: {
        ...prev.savings,
        [field]: numberValue(value),
      },
    }));
  }

  function updateManualRate(field, value) {
    setData((prev) => ({
      ...prev,
      exchangeRatesManual: {
        ...prev.exchangeRatesManual,
        [field]: numberValue(value),
      },
    }));
  }

  function updateConverter(field, value) {
    setData((prev) => ({
      ...prev,
      converter: {
        ...prev.converter,
        [field]: field === "amount" ? numberValue(value) : value,
      },
    }));
  }

  function addCommitment(formData) {
    const name = formData.get("name") || "Untitled";

    const item = {
      id: crypto.randomUUID(),
      name,
      category: formData.get("category") || "Other",
      amount: numberValue(formData.get("amount")),
      dueDay: numberValue(formData.get("dueDay")) || 1,
      paid: false,
      recurring: true,
      notes: formData.get("notes") || "",
    };

    setData((prev) => ({
      ...prev,
      commitments: [item, ...prev.commitments],
    }));
  }

  function updateCommitment(id, field, value) {
    setData((prev) => ({
      ...prev,
      commitments: prev.commitments.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "amount" || field === "dueDay"
                  ? numberValue(value)
                  : value,
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
  }

  function toggleCommitmentPaid(id) {
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
      id: crypto.randomUUID(),
      date: spendingDraft.date || getTodayDateInput(),
      amount: numberValue(spendingDraft.amount),
      category: spendingDraft.category || "Other",
      note: spendingDraft.note || "",
    };

    if (item.amount <= 0) return;

    setData((prev) => ({
      ...prev,
      spendingLogs: [item, ...prev.spendingLogs],
    }));

    setSpendingDraft({
      date: getTodayDateInput(),
      amount: "",
      category: "Food",
      note: "",
    });
  }

  function deleteSpending(id) {
    setData((prev) => ({
      ...prev,
      spendingLogs: prev.spendingLogs.filter((item) => item.id !== id),
    }));
  }

  function loadPreset(name) {
    const commitmentItems = presets[name].map(([category, amount, dueDay]) =>
      createCommitment(category, amount, dueDay)
    );

    setData((prev) => ({
      ...prev,
      commitments: commitmentItems,
    }));
  }

  function loadSample() {
    setData(createSampleData(selectedMonth));
  }

  function clearCurrentMonth() {
    const storageKey = `${STORAGE_KEY_PREFIX}${selectedMonth}`;
    localStorage.removeItem(storageKey);
    setData(createDefaultData(selectedMonth));
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

  const manualSalaryKrw =
    data.income.netSalary * data.exchangeRatesManual.rmToKrw;

  const manualSalaryUsd =
    data.exchangeRatesManual.usdToRm > 0
      ? data.income.netSalary / data.exchangeRatesManual.usdToRm
      : 0;

  function formatConverterValue(value, currency) {
    if (currency === "MYR") return formatMYR(value);
    if (currency === "KRW") return formatKRW(value);
    if (currency === "USD") return formatUSD(value);
    return formatPlain(value);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Malaysia salary cash flow</p>
          <h1>RinggitLife</h1>
          <p className="tagline">Know what you can safely spend today.</p>
        </div>

        <div className="hero-actions">
          <label className="month-picker">
            <span>Budget month</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>

          <button className="ghost-button" onClick={loadSample}>
            Load sample Bangsar South data
          </button>
        </div>
      </section>

      <section className="layout">
        <div className="main-column">
          <section className={`safe-card ${totals.statusType}`}>
            <div className="safe-card-top">
              <div>
                <p className="label">Today’s Safe-to-Spend</p>
                <h2>{formatMYR(totals.dailySafeToSpend)}</h2>
              </div>
              <div className="days-pill">{totals.daysLeft} days left</div>
            </div>
            <p className="status-text">{totals.status}</p>
          </section>

          <section className="grid-cards">
            <SummaryCard title="Monthly income" value={formatMYR(totals.totalIncome)} />
            <SummaryCard title="Fixed commitments" value={formatMYR(totals.fixedCommitments)} />
            <SummaryCard title="Savings target" value={formatMYR(totals.savingsTarget)} />
            <SummaryCard title="Remaining spendable" value={formatMYR(totals.remainingSpendable)} />
            <SummaryCard title="Flexible spent" value={formatMYR(totals.flexibleSpent)} />
            <SummaryCard title="Savings rate" value={`${totals.savingsRate.toFixed(1)}%`} />
          </section>

          <section className="card score-card">
            <div>
              <p className="label">Monthly Survival Score</p>
              <h3>{totals.score}/100</h3>
            </div>
            <div className="score-bar">
              <div style={{ width: `${totals.score}%` }} />
            </div>
            <p className={`mini-status ${totals.paceType}`}>
              {totals.paceMessage}
            </p>
          </section>

          <details className="card" open>
            <summary>Monthly Income Setup</summary>
            <div className="form-grid">
              <Input
                label="Monthly salary after tax"
                value={data.income.netSalary}
                onChange={(value) => updateIncome("netSalary", value)}
              />
              <Input
                label="Salary day"
                value={data.income.salaryDay}
                onChange={(value) => updateIncome("salaryDay", value)}
              />
              <Input
                label="Optional extra income"
                value={data.income.extraIncome}
                onChange={(value) => updateIncome("extraIncome", value)}
              />
              <Input
                label="Starting cash balance"
                value={data.income.startingBalance}
                onChange={(value) => updateIncome("startingBalance", value)}
              />
            </div>
          </details>

          <details className="card" open>
            <summary>Savings Goal</summary>
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
              <strong>Total target savings:</strong> {formatMYR(totals.savingsTarget)}
              <br />
              <strong>Fixed cost ratio:</strong> {totals.fixedCostRatio.toFixed(1)}%
              <br />
              <strong>Reality check:</strong>{" "}
              {totals.remainingSpendable >= 0
                ? "Your savings target is currently workable."
                : "Your savings target is too aggressive for this month."}
            </div>
          </details>

          <details className="card" open>
            <summary>Malaysian City Presets</summary>
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

            <form
              className="commitment-form"
              onSubmit={(event) => {
                event.preventDefault();
                addCommitment(new FormData(event.currentTarget));
                event.currentTarget.reset();
              }}
            >
              <input name="name" placeholder="Name, e.g. Rent" required />

              <select name="category">
                {categories.map((item) => (
                  <option key={item}>{item}</option>
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
                  No commitments yet. Add rent, bills, savings, and other fixed costs.
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
                      onClick={() => toggleCommitmentPaid(item.id)}
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

          <details className="card" open>
            <summary>Quick Spending Log</summary>

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
                {spendingCategories.map((item) => (
                  <option key={item}>{item}</option>
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

              <button type="submit">Save spending</button>
            </form>
          </details>

          <details className="card">
            <summary>Spending History</summary>

            <div className="list">
              {data.spendingLogs.length === 0 && (
                <p className="empty">
                  No spending logs yet. Reality remains temporarily unmeasured.
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
                label="Biggest unnecessary spending"
                value={data.reflection.unnecessarySpending}
                onChange={(value) =>
                  updateReflection("unnecessarySpending", value)
                }
              />
              <Textarea
                label="Next month focus"
                value={data.reflection.nextMonthFocus}
                onChange={(value) => updateReflection("nextMonthFocus", value)}
              />
            </div>
          </details>

          <section className="pricing-grid">
            <div className="pricing-card free">
              <p className="label">Free</p>
              <h3>RM 0</h3>
              <ul>
                <li>One monthly budget</li>
                <li>Safe-to-spend calculator</li>
                <li>Spending log</li>
                <li>Manual currency converter</li>
              </ul>
            </div>

            <div className="pricing-card pro">
              <p className="label">Pro</p>
              <h3>RM 9/month</h3>
              <ul>
                <li>Multiple monthly plans</li>
                <li>Monthly report</li>
                <li>Export to CSV</li>
                <li>Smart reminders</li>
                <li>Cloud backup later</li>
              </ul>
              <button disabled>Pro coming soon</button>
            </div>
          </section>

          <button className="danger-zone" onClick={clearCurrentMonth}>
            Reset this month only
          </button>
        </div>

        <aside className="side-column">
          <section className="card fx-card">
            <div className="fx-header">
              <div>
                <p className="label">Latest FX Snapshot</p>
                <h3>MYR vs Korea + SEA</h3>
              </div>

              <button type="button" onClick={fetchLatestRates}>
                {fxData.loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {fxData.error && <p className="error-text">{fxData.error}</p>}

            <div className="fx-list">
              {currencyTargets.map((item) => {
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
              Base: 1 MYR. This is a latest FX snapshot, not tick-by-tick trading data.
            </p>

            {fxData.timeLastUpdateUtc && (
              <p className="fx-date">Last update: {fxData.timeLastUpdateUtc}</p>
            )}
          </section>

          <section className="card">
            <p className="label">Manual Currency Snapshot</p>
            <h3>Salary conversion</h3>

            <div className="form-grid one">
              <Input
                label="1 RM = KRW"
                value={data.exchangeRatesManual.rmToKrw}
                onChange={(value) => updateManualRate("rmToKrw", value)}
              />

              <Input
                label="1 USD = RM"
                value={data.exchangeRatesManual.usdToRm}
                onChange={(value) => updateManualRate("usdToRm", value)}
              />
            </div>

            <div className="conversion-list">
              <div>
                <span>Salary in KRW</span>
                <strong>{formatKRW(manualSalaryKrw)}</strong>
              </div>

              <div>
                <span>Salary in USD</span>
                <strong>{formatUSD(manualSalaryUsd)}</strong>
              </div>

              <div>
                <span>Savings in KRW</span>
                <strong>
                  {formatKRW(totals.savingsTarget * data.exchangeRatesManual.rmToKrw)}
                </strong>
              </div>

              <div>
                <span>Savings in USD</span>
                <strong>
                  {formatUSD(
                    data.exchangeRatesManual.usdToRm > 0
                      ? totals.savingsTarget / data.exchangeRatesManual.usdToRm
                      : 0
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="card converter-card">
            <p className="label">Quick Converter</p>
            <h3>RM / KRW / USD</h3>

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
              {formatConverterValue(converterResult, data.converter.to)}
            </div>

            <p className="fx-note light">
              Uses your manual rates above. Useful for salary, remittance, and savings checks.
            </p>
          </section>

          <section className="card korean-card">
            <div className="toggle-row">
              <div>
                <p className="label">Optional</p>
                <h3>Korean expat mode</h3>
              </div>

              <button
                type="button"
                className={data.koreanMode ? "toggle active" : "toggle"}
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    koreanMode: !prev.koreanMode,
                  }))
                }
              >
                {data.koreanMode ? "On" : "Off"}
              </button>
            </div>

            {data.koreanMode && (
              <p className="expat-note">
                Moving from KRW income to MYR income? Track your fixed costs carefully.
              </p>
            )}
          </section>

          <section className="card">
            <p className="label">Cash flow formula</p>
            <div className="formula">
              Income
              <br />− Fixed commitments
              <br />− Savings target
              <br />− Flexible spending
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

export default App;