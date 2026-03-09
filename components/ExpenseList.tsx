import React, { useState } from 'react';
import { ExpenseItem } from '../types';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Trash2, FileText, CheckSquare, Square, Minus } from 'lucide-react';

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onDeleteMultiple }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const allSelected = expenses.length > 0 && selectedIds.size === expenses.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectMode = () => {
    setIsSelecting(prev => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map(e => e.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`選択した ${selectedIds.size} 件の経費を削除しますか？`)) {
      onDeleteMultiple([...selectedIds]);
      setSelectedIds(new Set());
      setIsSelecting(false);
    }
  };

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
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        {isSelecting ? (
          <>
            {/* Select All / Count */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-indigo-500" />
              ) : someSelected ? (
                <Minus size={18} className="text-indigo-400" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
              {selectedIds.size > 0 ? `${selectedIds.size} 件を選択中` : 'すべて選択'}
            </button>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                  <Trash2 size={13} />
                  {selectedIds.size} 件を削除
                </button>
              )}
              <button
                onClick={toggleSelectMode}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-400">{expenses.length} 件</span>
            <button
              onClick={toggleSelectMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <CheckSquare size={13} />
              選択して削除
            </button>
          </>
        )}
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-100">
        {expenses.map((expense) => {
          const Icon = CATEGORY_ICONS[expense.category];
          const color = CATEGORY_COLORS[expense.category];
          const isChecked = selectedIds.has(expense.id);

          return (
            <li
              key={expense.id}
              onClick={isSelecting ? () => toggleSelect(expense.id) : undefined}
              className={`p-4 transition-colors ${isSelecting
                  ? isChecked
                    ? 'bg-indigo-50 cursor-pointer'
                    : 'hover:bg-slate-50 cursor-pointer'
                  : 'hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center space-x-3">
                {/* Checkbox (select mode only) */}
                {isSelecting && (
                  <div className="flex-shrink-0 text-indigo-500">
                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                  </div>
                )}

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
                  {/* Single delete (hidden in select mode) */}
                  {!isSelecting && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};