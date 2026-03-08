export type User = {
  id: string;
  email: string;
  name: string;
};

export type Budget = {
  id: string;
  name: string;
  createdAt?: string;
};

export type Entry = {
  id: string;
  name: string;
  description?: string | null;
  cents: number;
  transactionDate?: string | null;
  createdAt?: string;
  budgetId?: string;
};