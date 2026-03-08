import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Budget, Entry } from "../types";

type EntryWithBudget = Entry & {
  budgetId: string;
  budgetName: string;
};

function formatSignedMoneyFromCents(cents: number) {
  const absDollars = Math.abs(cents) / 100;
  const formatted = `$${absDollars.toFixed(2)}`;

  if (cents > 0) return `+${formatted}`;
  if (cents < 0) return `-${formatted}`;
  return formatted;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EntriesPage() {
  const [entries, setEntries] = useState<EntryWithBudget[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entryType, setEntryType] = useState<"expense" | "income">("expense");
  const [budgetId, setBudgetId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadData() {
    try {
      setError(null);

      const budgetData = await api.getBudgets();
      setBudgets(budgetData);

      if (!budgetId && budgetData.length > 0) {
        setBudgetId(budgetData[0].id);
      }

      const entryGroups = await Promise.all(
        budgetData.map(async (budget) => {
          const budgetEntries = await api.getEntriesByBudgetId(budget.id);

          return budgetEntries.map((entry) => ({
            ...entry,
            budgetId: budget.id,
            budgetName: budget.name,
          }));
        }),
      );

      setEntries(entryGroups.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const aTime = new Date(a.transactionDate ?? a.createdAt ?? 0).getTime();
        const bTime = new Date(b.transactionDate ?? b.createdAt ?? 0).getTime();
        return bTime - aTime;
      }),
    [entries],
  );

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const numericAmount = Number(amountDollars);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        setError("Amount must be greater than 0.");
        return;
      }

      const absoluteCents = Math.round(numericAmount * 100);
      const cents = entryType === "expense" ? -absoluteCents : absoluteCents;

      await api.createEntry(budgetId, {
        name,
        description: description || undefined,
        cents,
        transactionDate: transactionDate || new Date().toISOString().split("T")[0],
      });

      setEntryType("expense");
      setName("");
      setDescription("");
      setAmountDollars("");
      setTransactionDate("");

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    }
  }

  async function handleDeleteEntry(entryId: string) {
    try {
      await api.deleteEntry(entryId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Entries</h2>
          <p className="muted">Track income and expenses across budgets</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Create entry</h3>
        </div>

        <form className="form-grid" onSubmit={handleCreateEntry}>
          <div className="form-grid-full">
            <div className="entry-type-toggle">
              <button
                type="button"
                className={entryType === "expense" ? "toggle-button active" : "toggle-button"}
                onClick={() => setEntryType("expense")}
              >
                Expense
              </button>
              <button
                type="button"
                className={entryType === "income" ? "toggle-button active" : "toggle-button"}
                onClick={() => setEntryType("income")}
              >
                Income
              </button>
            </div>
          </div>

          <label>
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              placeholder={entryType === "expense" ? "24.99" : "2500.00"}
              required
            />
          </label>

          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={entryType === "expense" ? "Trader Joe's" : "Paycheck"}
              required
            />
          </label>

          <label>
            <span>Budget</span>
            <select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              required
            >
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Date</span>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </label>

          <label className="form-grid-full">
            <span>Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                entryType === "expense" ? "Weekly groceries" : "Biweekly direct deposit"
              }
            />
          </label>

          <div className="form-grid-full">
            <button className="primary-button" type="submit">
              Add {entryType === "expense" ? "expense" : "income"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>All entries</h3>
        </div>

        {error && <p className="error-text">{error}</p>}

        {isLoading ? (
          <p>Loading...</p>
        ) : sortedEntries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Budget</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.budgetName}</td>
                    <td>{entry.description || "—"}</td>
                    <td>{formatSignedMoneyFromCents(entry.cents)}</td>
                    <td>{formatDate(entry.transactionDate ?? entry.createdAt)}</td>
                    <td className="mono-text">{entry.id}</td>
                    <td>
                      <button
                        className="danger-button small-button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}