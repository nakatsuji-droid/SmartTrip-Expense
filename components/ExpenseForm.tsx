
import React, { useState, useRef } from 'react';
import { ExpenseItem, ExpenseCategory, UserProfile } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { generateExpensesFromTotal } from '../services/geminiService';
import { Loader2, X, Calculator, PenTool, Calendar, Plus, Hotel } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'userId'>) => void;
  userProfile: UserProfile;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, userProfile }) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'manual' | 'generate'>('manual');

  // Manual Form State
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.TRANSPORTATION);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Generator Form State
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genTotalAmount, setGenTotalAmount] = useState('');
  const [genDates, setGenDates] = useState<string[]>([]);
  const [tempGenDate, setTempGenDate] = useState('');
  const [genAccomCount, setGenAccomCount] = useState<string>('');

  // Common State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Manual Mode Handlers ---
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onAddExpense({
      date,
      amount: parseInt(amount, 10),
      category,
      description,
      transportMethod: '車', // Default for manual
    });

    // Reset fields
    setAmount('');
    setDescription('');
    setCategory(ExpenseCategory.TRANSPORTATION);
    setDate(new Date().toISOString().split('T')[0]);
  };

  // --- Generator Mode Handlers ---

  const handleAddGenDate = () => {
    if (tempGenDate && !genDates.includes(tempGenDate)) {
      setGenDates([...genDates, tempGenDate].sort());
      setTempGenDate('');
    }
  };

  const handleRemoveGenDate = (dateToRemove: string) => {
    setGenDates(genDates.filter(d => d !== dateToRemove));
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTotalAmount || (!genMonth && genDates.length === 0)) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const total = parseInt(genTotalAmount, 10);
      const accomCount = genAccomCount ? parseInt(genAccomCount, 10) : undefined;
      
      // Pass the current user profile, specific dates, and accommodation count constraint
      // Now using purely algorithmic generation (no AI)
      const results = await generateExpensesFromTotal(total, genMonth, genDates, userProfile, accomCount);
      
      if (results.length === 0) {
        setErrorMsg('条件に合う経費パターンが見つかりませんでした。金額を見直してください。');
        return;
      }

      results.forEach(item => {
        if (item.amount && item.description && item.date) {
           let cat = ExpenseCategory.OTHER;
           if (item.category && Object.values(ExpenseCategory).includes(item.category as ExpenseCategory)) {
               cat = item.category as ExpenseCategory;
           }
           
           onAddExpense({
             date: item.date,
             amount: item.amount,
             category: cat,
             description: item.description,
             transportMethod: item.transportMethod || '車',
           });
        }
      });

      // Clear input after success (optional UX choice)
      // setGenTotalAmount('');
    } catch (err) {
      setErrorMsg('生成に失敗しました。');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'manual' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <PenTool size={16} />
          通常入力
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'generate' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calculator size={16} />
          金額から自動生成
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'manual' ? (
          <div className="space-y-6">
            {/* Manual Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">金額 (円)</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-md border-slate-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="例: 新幹線 (東京-大阪)"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70"
                >
                  登録する
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Generator Tab */
          <div className="space-y-6">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">金額からの自動計算</h3>
              <p className="text-xs text-indigo-700 mb-2">
                設定された「宿泊費」と「日当」の単価を使用し、合計金額に近づくよう自動計算します。
              </p>
              <div className="text-xs text-indigo-600 border-t border-indigo-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                    <span className="font-semibold">宿泊費:</span> ¥{userProfile.accommodationCost.toLocaleString()}
                </div>
                <div>
                    <span className="font-semibold">日当:</span> ¥{userProfile.allowanceCost.toLocaleString()}
                </div>
                <div className="col-span-2 truncate">
                    <span className="font-semibold">候補地:</span> {userProfile.destinations.join(', ')}
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">対象月 (基本)</label>
                <input
                  type="month"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              {/* Specific Date Selection */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                   <Calendar size={16} />
                   必ず含める出張日を指定
                 </label>
                 <div className="flex gap-2 mb-2">
                   <input 
                     type="date"
                     value={tempGenDate}
                     onChange={(e) => setTempGenDate(e.target.value)}
                     className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                   />
                   <button
                     type="button"
                     onClick={handleAddGenDate}
                     disabled={!tempGenDate}
                     className="px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                   >
                     <Plus size={16} />
                   </button>
                 </div>
                 
                 {/* Selected Dates Chips */}
                 <div className="flex flex-wrap gap-2">
                   {genDates.map(d => (
                     <span key={d} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                       {d}
                       <button
                         type="button"
                         onClick={() => handleRemoveGenDate(d)}
                         className="ml-1.5 inline-flex text-indigo-400 hover:text-indigo-600 focus:outline-none"
                       >
                         <X size={12} />
                       </button>
                     </span>
                   ))}
                   {genDates.length === 0 && (
                     <span className="text-xs text-slate-400 italic py-1">日付指定なし (月内で自動生成)</span>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">月の合計金額 (円)</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-slate-500 sm:text-sm">¥</span>
                      </div>
                      <input
                        type="number"
                        required
                        min="1000"
                        step="100"
                        value={genTotalAmount}
                        onChange={(e) => setGenTotalAmount(e.target.value)}
                        className="w-full rounded-md border-slate-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="例: 37000"
                      />
                    </div>
                 </div>
                 
                 {/* Accommodation Count */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Hotel size={14} />
                      宿泊回数指定 (任意)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        value={genAccomCount}
                        onChange={(e) => setGenAccomCount(e.target.value)}
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        placeholder="回数"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-slate-500 sm:text-sm">回</span>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || !genTotalAmount}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={20} />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2" size={20} />
                      計算して生成
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
