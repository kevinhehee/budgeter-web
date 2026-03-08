import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Budget } from "../types";

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadBudgets() {
    try {
      setError(null);
      const data = await api.getBudgets();
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budgets");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBudgets();
  }, []);

  async function handleCreateBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    try {
      await api.createBudget(name.trim());
      setName("");
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editingName.trim()) return;

    try {
      await api.updateBudget(id, editingName.trim());
      setEditingId(null);
      setEditingName("");
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteBudget(id);
      await loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Budgets</h2>
          <p className="muted">Create and manage budgets</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Create budget</h3>
        </div>

        <form className="inline-form" onSubmit={handleCreateBudget}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Groceries"
          />
          <button className="primary-button" type="submit">
            Add budget
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>All budgets</h3>
        </div>

        {error && <p className="error-text">{error}</p>}

        {isLoading ? (
          <p>Loading...</p>
        ) : budgets.length === 0 ? (
          <p className="muted">No budgets yet.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>
                      {editingId === budget.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                      ) : (
                        budget.name
                      )}
                    </td>
                    <td className="mono-text">{budget.id}</td>
                    <td>
                      <div className="action-row">
                        {editingId === budget.id ? (
                          <>
                            <button
                              className="primary-button small-button"
                              onClick={() => handleSaveEdit(budget.id)}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              className="secondary-button small-button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                              type="button"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="secondary-button small-button"
                              onClick={() => {
                                setEditingId(budget.id);
                                setEditingName(budget.name);
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="danger-button small-button"
                              onClick={() => handleDelete(budget.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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