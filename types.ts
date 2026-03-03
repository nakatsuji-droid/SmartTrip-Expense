export enum ExpenseCategory {
  TRANSPORTATION = 'TRANSPORTATION',
  ACCOMMODATION = 'ACCOMMODATION',
  MEALS = 'MEALS',
  ENTERTAINMENT = 'ENTERTAINMENT',
  SUPPLIES = 'SUPPLIES',
  ALLOWANCE = 'ALLOWANCE', // Added for 日当
  OTHER = 'OTHER',
}

export interface ExpenseItem {
  id: string;
  userId: string; // Link expense to a specific user
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  transportMethod?: string; // e.g., '車', '電車'
  receiptImage?: string; // Base64 string
}

export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
}

export interface AiParsedExpense {
  date?: string;
  category?: string;
  amount?: number;
  description?: string;
  transportMethod?: string;
}

export interface UserProfile {
  id: string; // Unique ID for the user
  name: string;
  allowanceCost: number;
  accommodationCost: number;
  destinations: string[];
}