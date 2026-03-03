import React from 'react';
import { ExpenseItem, ExpenseCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Trash2, FileText } from 'lucide-react';

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete }) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="mx-auto h-12 w-12 text-slate-300">
          <FileText size={48} strokeWidth={1} />
        </div>
        <h3 className="mt-2 text-sm font-medium text-slate-900">経費データなし</h3>
        <p className="mt-1 text-sm text-slate-500">新しい経費を入力してください。</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-100">
      <ul className="divide-y divide-slate-100">
        {expenses.map((expense) => {
          const Icon = CATEGORY_ICONS[expense.category];
          const color = CATEGORY_COLORS[expense.category];

          return (
            <li key={expense.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <div 
                  className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{expense.date}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{CATEGORY_LABELS[expense.category]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {expense.receiptImage && (
                     <div className="hidden sm:block">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          領収書あり
                        </span>
                     </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ¥{expense.amount.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};