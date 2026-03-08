import type { Budget, Entry, User } from "../types";

const API_BASE_URL = "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // ignore parse errors
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  getCurrentUser() {
    return request<User>("/me");
  },

  getBudgets() {
    return request<Budget[]>("/budgets");
  },

  createBudget(name: string) {
    return request<Budget>("/budgets", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  updateBudget(id: string, name: string) {
    return request<void>(`/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  deleteBudget(id: string) {
    return request<void>(`/budgets/${id}`, {
      method: "DELETE",
    });
  },

  getEntriesByBudgetId(budgetId: string) {
    return request<Entry[]>(`/budgets/${budgetId}/entries`);
  },

  createEntry(
    budgetId: string,
    payload: {
      name: string;
      description?: string;
      cents: number;
      transactionDate?: string;
    },
  ) {
    return request<Entry>(`/budgets/${budgetId}/entries`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateEntry(
    entryId: string,
    payload: {
      name?: string;
      description?: string;
      cents?: number;
      transactionDate?: string;
    },
  ) {
    return request<Entry>(`/entries/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteEntry(entryId: string) {
    return request<void>(`/entries/${entryId}`, {
      method: "DELETE",
    });
  },
};