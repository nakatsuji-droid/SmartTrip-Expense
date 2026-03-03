import { ExpenseCategory } from './types';
import { Plane, Hotel, Coffee, Martini, Package, CircleHelp, Coins } from 'lucide-react';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.TRANSPORTATION]: '交通費',
  [ExpenseCategory.ACCOMMODATION]: '宿泊費',
  [ExpenseCategory.MEALS]: '食事代',
  [ExpenseCategory.ENTERTAINMENT]: '接待交際費',
  [ExpenseCategory.SUPPLIES]: '消耗品費',
  [ExpenseCategory.ALLOWANCE]: '日当',
  [ExpenseCategory.OTHER]: 'その他',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.TRANSPORTATION]: '#3b82f6', // blue-500
  [ExpenseCategory.ACCOMMODATION]: '#8b5cf6', // violet-500
  [ExpenseCategory.MEALS]: '#f59e0b', // amber-500
  [ExpenseCategory.ENTERTAINMENT]: '#ec4899', // pink-500
  [ExpenseCategory.SUPPLIES]: '#10b981', // emerald-500
  [ExpenseCategory.ALLOWANCE]: '#f97316', // orange-500
  [ExpenseCategory.OTHER]: '#64748b', // slate-500
};

export const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  [ExpenseCategory.TRANSPORTATION]: Plane,
  [ExpenseCategory.ACCOMMODATION]: Hotel,
  [ExpenseCategory.MEALS]: Coffee,
  [ExpenseCategory.ENTERTAINMENT]: Martini,
  [ExpenseCategory.SUPPLIES]: Package,
  [ExpenseCategory.ALLOWANCE]: Coins,
  [ExpenseCategory.OTHER]: CircleHelp,
};