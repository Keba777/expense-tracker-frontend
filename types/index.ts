export type Plan = "free" | "pro" | "enterprise";
export type TransactionType = "income" | "expense";
export type CategoryType = "income" | "expense";
export type Recurrence = "once" | "daily" | "weekly" | "monthly";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  currency: string;
  timezone: string;
  avatarUrl?: string;
  plan: Plan;
  isActive: boolean;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: string;
  recurrence: Recurrence;
  recurrenceEndDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category?: Category;
  /** Client-only: true while queued for offline sync, never from server */
  _pending?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  amount: number;
  period: BudgetPeriod;
  year: number;
  month?: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  allTimeNetBalance: number;
  savingsRate: number;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
}

export interface MonthlyTrend {
  year: number;
  month: number;
  income: number;
  expense: number;
}

export interface MonthlyReport {
  period: { year: number; month: number; from: string; to: string };
  summary: Summary;
  breakdown: CategoryTotal[];
  daily: DailyTotal[];
}

export interface WeeklyReport {
  period: { from: string; to: string };
  summary: Summary;
  daily: DailyTotal[];
  breakdown: CategoryTotal[];
}

export interface ApiMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: ApiMeta;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface TransactionFilter {
  type?: TransactionType;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface CreateTransactionInput {
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  date: string;
  recurrence?: Recurrence;
  recurrenceEndDate?: string;
  tags?: string[];
}

export interface RegisterInput {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  currency?: string;
  timezone?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}
