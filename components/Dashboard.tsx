import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ExpenseItem, ExpenseCategory } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  expenses: ExpenseItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const data = Object.values(ExpenseCategory).map((category) => {
    const value = expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      name: CATEGORY_LABELS[category],
      value,
      category, // keep original key for color mapping
    };
  }).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Total Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex flex-col justify-center items-center">
        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">精算合計金額</h3>
        <p className="text-4xl font-bold text-slate-800">
          ¥{totalAmount.toLocaleString()}
        </p>
        <div className="mt-4 text-xs text-slate-400">
          {expenses.length} 件の経費
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 min-h-[300px]">
        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-4">カテゴリ別内訳</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category as ExpenseCategory]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            データがありません
          </div>
        )}
      </div>
    </div>
  );
};