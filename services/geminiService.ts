
import { AiParsedExpense, ExpenseCategory, UserProfile } from "../types";

// Japanese Holidays 2024-2026 (Simple hardcoded list for logic)
const HOLIDAYS = [
  '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-02-23', '2024-03-20',
  '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05', '2024-05-06', '2024-07-15',
  '2024-08-11', '2024-08-12', '2024-09-16', '2024-09-22', '2024-09-23', '2024-10-14',
  '2024-11-03', '2024-11-04', '2024-11-23',
  '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23', '2025-02-24', '2025-03-20',
  '2025-04-29', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06', '2025-07-21',
  '2025-08-11', '2025-09-15', '2025-09-23', '2025-10-13', '2025-11-03', '2025-11-23',
  '2025-11-24',
  '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20',
  '2026-04-29', '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-20',
  '2026-08-11', '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12', '2026-11-03',
  '2026-11-23',
];

// Helper: Check if date is valid (not weekend, not holiday)
const isValidBusinessDay = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const day = date.getDay();
  // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  if (HOLIDAYS.includes(dateStr)) return false;
  return true;
};

// Helper: Get all valid business days in a month
const getValidDaysInMonth = (yearMonth: string, excludeDates: string[] = []): string[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const validDays: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!excludeDates.includes(dateStr) && isValidBusinessDay(dateStr)) {
      validDays.push(dateStr);
    }
  }
  return validDays;
};

// Helper: Shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Stubbed functions for removed AI features
export const parseReceiptImage = async (base64Image: string, mimeType: string): Promise<AiParsedExpense> => {
  console.warn("AI parsing is disabled.");
  return {};
};

export const parseExpenseText = async (textInput: string): Promise<AiParsedExpense> => {
  console.warn("AI parsing is disabled.");
  return {};
};

// Type for specific date entry with optional overrides
export interface GenDateEntry {
  date: string;
  type: 'auto' | 'accommodation' | 'allowance';
  destination: string; // empty = random from profile
}

// Main Logic: Algorithmic Generation
export const generateExpensesFromTotal = async (
  totalAmount: number, 
  yearMonth: string,
  specificDateEntries: GenDateEntry[],
  profile: UserProfile,
  accommodationCount?: number
): Promise<AiParsedExpense[]> => {
  
  // 1. Calculate optimal counts (Knapsack-like problem but simpler)
  const accomCost = profile.accommodationCost;
  const allowanceCost = profile.allowanceCost;

  // Pre-calculate cost from fixed (non-auto) specific dates
  const fixedEntries = specificDateEntries.filter(e => e.type !== 'auto');
  const autoEntries = specificDateEntries.filter(e => e.type === 'auto');

  const fixedAccomCount = fixedEntries.filter(e => e.type === 'accommodation').length;
  const fixedAllowanceCount = fixedEntries.filter(e => e.type === 'allowance').length;
  const fixedCost = fixedAccomCount * accomCost + fixedAllowanceCount * allowanceCost;

  const remainingAmount = totalAmount - fixedCost;

  let bestAccomCount = 0;
  let bestAllowanceCount = 0;

  if (remainingAmount >= 0) {
    // If accommodation count is provided, it refers to ADDITIONAL (auto) accommodations
    if (accommodationCount !== undefined && accommodationCount !== null) {
      const additionalAccomCost = accommodationCount * accomCost;
      const rem2 = remainingAmount - additionalAccomCost;
      bestAccomCount = accommodationCount;
      bestAllowanceCount = rem2 >= 0 ? Math.round(rem2 / allowanceCost) : 0;
    } else {
      // Iterate to find best combination for remaining amount
      const maxAccom = Math.floor(remainingAmount / accomCost);
      let minDiff = Number.MAX_SAFE_INTEGER;

      for (let i = 0; i <= maxAccom; i++) {
        const currentAccomCost = i * accomCost;
        const rem2 = remainingAmount - currentAccomCost;
        const j = Math.round(rem2 / allowanceCost);
        
        const currentTotal = currentAccomCost + (j * allowanceCost);
        const diff = Math.abs(remainingAmount - currentTotal);
        
        if (diff < minDiff) {
          minDiff = diff;
          bestAccomCount = i;
          bestAllowanceCount = j;
        }
      }
    }
  }

  const totalItemsNeeded = fixedEntries.length + bestAccomCount + bestAllowanceCount;
  const specificDates = specificDateEntries.map(e => e.date);
  
  // 2. Prepare additional dates (for auto entries + extra needed)
  let additionalDates: string[] = autoEntries.map(e => e.date);
  
  // If we need even more dates than auto-specified ones
  const extraNeeded = (bestAccomCount + bestAllowanceCount) - additionalDates.length;
  
  if (extraNeeded > 0) {
    const availableDays = getValidDaysInMonth(yearMonth, specificDates);
    const shuffledDays = shuffleArray(availableDays);
    const pickedDays = shuffledDays.slice(0, extraNeeded);
    additionalDates = [...additionalDates, ...pickedDays];
  }

  // Sort additional dates
  additionalDates.sort();

  // 3. Assign Categories to auto/additional dates
  const items: AiParsedExpense[] = [];

  // Add fixed entries first (with their specified category and destination)
  for (const entry of fixedEntries) {
    const dest = entry.destination.trim() || (profile.destinations[Math.floor(Math.random() * profile.destinations.length)] || '出張先');
    items.push({
      date: entry.date,
      amount: entry.type === 'accommodation' ? accomCost : allowanceCost,
      category: entry.type === 'accommodation' ? ExpenseCategory.ACCOMMODATION : ExpenseCategory.ALLOWANCE,
      description: dest,
      transportMethod: '車',
    });
  }

  // Add auto/additional entries with optimal split
  const shuffledAdditional = shuffleArray([...additionalDates]);

  for (let i = 0; i < shuffledAdditional.length; i++) {
    const date = shuffledAdditional[i];
    let category: ExpenseCategory;
    let amount: number;

    if (i < bestAccomCount) {
      category = ExpenseCategory.ACCOMMODATION;
      amount = accomCost;
    } else {
      category = ExpenseCategory.ALLOWANCE;
      amount = allowanceCost;
    }

    // Check if this date has an auto-entry with a destination specified
    const autoEntry = autoEntries.find(e => e.date === date);
    const dest = (autoEntry?.destination.trim()) || (profile.destinations[Math.floor(Math.random() * profile.destinations.length)] || '出張先');

    items.push({
      date: date,
      amount: amount,
      category: category,
      description: dest,
      transportMethod: '車',
    });
  }

  // Sort result by date
  items.sort((a, b) => (a.date! > b.date! ? 1 : -1));

  return items;
};
