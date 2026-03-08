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

function formatMoneyFromCents(cents: number) {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`;
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

export function DashboardPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<EntryWithBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);

        const budgetData = await api.getBudgets();
        setBudgets(budgetData);

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
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const incomeCents = useMemo(
    () =>
      entries
        .filter((entry) => entry.cents > 0)
        .reduce((sum, entry) => sum + entry.cents, 0),
    [entries],
  );

  const expenseCents = useMemo(
    () =>
      Math.abs(
        entries
          .filter((entry) => entry.cents < 0)
          .reduce((sum, entry) => sum + entry.cents, 0),
      ),
    [entries],
  );

  const netCents = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.cents, 0),
    [entries],
  );

  const recentEntries = useMemo(
    () =>
      [...entries]
        .sort((a, b) => {
          const aTime = new Date(a.transactionDate ?? a.createdAt ?? 0).getTime();
          const bTime = new Date(b.transactionDate ?? b.createdAt ?? 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 5),
    [entries],
  );

  if (isLoading) {
    return (
      <div className="page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">Quick view of your budgets and cash flow</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="muted">Income</span>
          <strong>{formatMoneyFromCents(incomeCents)}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Expenses</span>
          <strong>{formatMoneyFromCents(expenseCents)}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">Net</span>
          <strong>{formatSignedMoneyFromCents(netCents)}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Recent entries</h3>
        </div>

        {recentEntries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Budget</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.budgetName}</td>
                    <td>{formatSignedMoneyFromCents(entry.cents)}</td>
                    <td>{formatDate(entry.transactionDate ?? entry.createdAt)}</td>
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