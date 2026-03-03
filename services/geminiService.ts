
import { AiParsedExpense, ExpenseCategory, UserProfile } from "../types";

// Japanese Holidays 2024-2025 (Simple hardcoded list for logic)
const HOLIDAYS = [
  '2024-01-01', '2024-01-08', '2024-02-11', '2024-02-12', '2024-02-23', '2024-03-20',
  '2024-04-29', '2024-05-03', '2024-05-04', '2024-05-05', '2024-05-06', '2024-07-15',
  '2024-08-11', '2024-08-12', '2024-09-16', '2024-09-22', '2024-09-23', '2024-10-14',
  '2024-11-03', '2024-11-04', '2024-11-23',
  '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23', '2025-02-24', '2025-03-20',
  '2025-04-29', '2025-05-03', '2025-05-04', '2025-05-05', '2025-05-06', '2025-07-21',
  '2025-08-11', '2025-09-15', '2025-09-23', '2025-10-13', '2025-11-03', '2025-11-23',
  '2025-11-24'
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

// Main Logic: Algorithmic Generation
export const generateExpensesFromTotal = async (
  totalAmount: number, 
  yearMonth: string,
  specificDates: string[],
  profile: UserProfile,
  accommodationCount?: number
): Promise<AiParsedExpense[]> => {
  
  // 1. Calculate optimal counts (Knapsack-like problem but simpler)
  const accomCost = profile.accommodationCost;
  const allowanceCost = profile.allowanceCost;
  
  let bestAccomCount = 0;
  let bestAllowanceCount = 0;
  let minDiff = Number.MAX_SAFE_INTEGER;

  // If accommodation count is fixed
  if (accommodationCount !== undefined && accommodationCount !== null) {
    const fixedAccomCost = accommodationCount * accomCost;
    const remainder = totalAmount - fixedAccomCost;
    if (remainder >= 0) {
      bestAccomCount = accommodationCount;
      bestAllowanceCount = Math.round(remainder / allowanceCost);
    } else {
      // If fixed accommodation already exceeds total, just set 0 allowance
      bestAccomCount = accommodationCount;
      bestAllowanceCount = 0;
    }
  } else {
    // Iterate to find best combination
    // Max possible accommodations
    const maxAccom = Math.floor(totalAmount / accomCost);
    
    for (let i = 0; i <= maxAccom; i++) {
      const currentAccomCost = i * accomCost;
      const remainder = totalAmount - currentAccomCost;
      const j = Math.round(remainder / allowanceCost); // Best fit allowance count
      
      const currentTotal = currentAccomCost + (j * allowanceCost);
      const diff = Math.abs(totalAmount - currentTotal);
      
      if (diff < minDiff) {
        minDiff = diff;
        bestAccomCount = i;
        bestAllowanceCount = j;
      }
    }
  }

  const totalItemsNeeded = bestAccomCount + bestAllowanceCount;
  
  // 2. Prepare Dates
  // We strictly need to cover specificDates first.
  let finalDates = [...specificDates];
  
  // If we generated fewer items than specific dates, we must increase allowance count to fill dates
  if (totalItemsNeeded < finalDates.length) {
    const gap = finalDates.length - totalItemsNeeded;
    // Prefer adding allowances as they are usually for "just visiting"
    bestAllowanceCount += gap;
  }
  
  // If we need more dates than specific ones
  const neededAdditional = (bestAccomCount + bestAllowanceCount) - finalDates.length;
  
  if (neededAdditional > 0) {
    const availableDays = getValidDaysInMonth(yearMonth, finalDates);
    const shuffledDays = shuffleArray(availableDays);
    const pickedDays = shuffledDays.slice(0, neededAdditional);
    finalDates = [...finalDates, ...pickedDays];
  }

  // Sort dates
  finalDates.sort();

  // 3. Assign Categories to Dates
  // We need to assign `bestAccomCount` ACCOMMODATION items and rest ALLOWANCE
  // Logic: Shuffle the dates, pick N for accommodation, rest for allowance.
  // HOWEVER, if specific dates implies a trip, maybe we shouldn't shuffle blindly?
  // For simplicity and "randomness" requested, we shuffle assignment.
  
  const items: AiParsedExpense[] = [];
  const datesForAssignment = shuffleArray([...finalDates]);
  
  for (let i = 0; i < finalDates.length; i++) {
    const date = datesForAssignment[i];
    let category: ExpenseCategory;
    let amount: number;

    if (i < bestAccomCount) {
      category = ExpenseCategory.ACCOMMODATION;
      amount = accomCost;
    } else {
      category = ExpenseCategory.ALLOWANCE;
      amount = allowanceCost;
    }

    // Pick a random destination
    const randomDest = profile.destinations[Math.floor(Math.random() * profile.destinations.length)] || '出張先';

    items.push({
      date: date,
      amount: amount,
      category: category,
      description: randomDest,
      transportMethod: '車'
    });
  }

  // Sort result by date
  items.sort((a, b) => (a.date! > b.date! ? 1 : -1));

  return items;
};
