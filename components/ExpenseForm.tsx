
import React, { useState } from 'react';
import { ExpenseItem, ExpenseCategory, UserProfile } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { generateExpensesFromTotal, GenDateEntry } from '../services/geminiService';
import { Loader2, X, Calculator, PenTool, Calendar, Plus, Hotel, MapPin, ChevronDown } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'userId'>) => void;
  userProfile: UserProfile;
}

const TYPE_LABELS: Record<GenDateEntry['type'], string> = {
  auto: '自動',
  accommodation: '宿泊',
  allowance: '日当',
};

const TYPE_COLORS: Record<GenDateEntry['type'], string> = {
  auto: 'bg-slate-100 text-slate-700 border-slate-200',
  accommodation: 'bg-blue-50 text-blue-800 border-blue-200',
  allowance: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

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
  const [genDateEntries, setGenDateEntries] = useState<GenDateEntry[]>([]);
  const [tempGenDate, setTempGenDate] = useState('');
  const [genAccomCount, setGenAccomCount] = useState<string>('');

  // Expanded date entry state
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

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
      transportMethod: '車',
    });

    setAmount('');
    setDescription('');
    setCategory(ExpenseCategory.TRANSPORTATION);
    setDate(new Date().toISOString().split('T')[0]);
  };

  // --- Generator Mode Handlers ---

  const handleAddGenDate = () => {
    if (tempGenDate && !genDateEntries.some(e => e.date === tempGenDate)) {
      const newEntry: GenDateEntry = {
        date: tempGenDate,
        type: 'auto',
        destination: '',
      };
      setGenDateEntries(prev => [...prev, newEntry].sort((a, b) => a.date > b.date ? 1 : -1));
      setTempGenDate('');
      setExpandedDate(tempGenDate); // auto-expand newly added entry
    }
  };

  const handleRemoveGenDate = (dateToRemove: string) => {
    setGenDateEntries(prev => prev.filter(e => e.date !== dateToRemove));
    if (expandedDate === dateToRemove) setExpandedDate(null);
  };

  const handleUpdateEntry = (date: string, updates: Partial<GenDateEntry>) => {
    setGenDateEntries(prev =>
      prev.map(e => e.date === date ? { ...e, ...updates } : e)
    );
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTotalAmount || (!genMonth && genDateEntries.length === 0)) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const total = parseInt(genTotalAmount, 10);
      const accomCount = genAccomCount ? parseInt(genAccomCount, 10) : undefined;

      const results = await generateExpensesFromTotal(total, genMonth, genDateEntries, userProfile, accomCount);

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
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-slate-50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
          <PenTool size={16} />
          通常入力
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'generate'
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
          <div className="space-y-5">
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

            <form onSubmit={handleGenerateSubmit} className="space-y-5">

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
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  出張日を指定
                  <span className="text-xs font-normal text-slate-400">（宿泊・日当・訪問先を個別設定可）</span>
                </label>
                <div className="flex gap-2 mb-3">
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
                    className="px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Date Entry Cards */}
                {genDateEntries.length > 0 ? (
                  <div className="space-y-2">
                    {genDateEntries.map(entry => (
                      <div
                        key={entry.date}
                        className={`rounded-lg border p-3 transition-all ${TYPE_COLORS[entry.type]}`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setExpandedDate(expandedDate === entry.date ? null : entry.date)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span className="text-sm font-medium">{entry.date}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${entry.type === 'accommodation' ? 'bg-blue-200 text-blue-900' :
                                entry.type === 'allowance' ? 'bg-emerald-200 text-emerald-900' :
                                  'bg-slate-200 text-slate-700'
                              }`}>
                              {TYPE_LABELS[entry.type]}
                            </span>
                            {entry.destination && (
                              <span className="text-xs flex items-center gap-1 opacity-75 truncate max-w-[80px]">
                                <MapPin size={10} />
                                {entry.destination}
                              </span>
                            )}
                            <ChevronDown
                              size={14}
                              className={`ml-auto opacity-60 transition-transform ${expandedDate === entry.date ? 'rotate-180' : ''}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveGenDate(entry.date)}
                            className="ml-2 p-1 opacity-50 hover:opacity-100 rounded-full hover:bg-black/10"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Expanded Settings */}
                        {expandedDate === entry.date && (
                          <div className="mt-3 pt-3 border-t border-black/10 space-y-3">
                            {/* Type Selection */}
                            <div>
                              <label className="block text-xs font-semibold mb-1.5 opacity-70">種別</label>
                              <div className="flex gap-2">
                                {(['auto', 'accommodation', 'allowance'] as GenDateEntry['type'][]).map(t => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleUpdateEntry(entry.date, { type: t })}
                                    className={`flex-1 py-1.5 text-xs rounded-md font-medium border transition-colors ${entry.type === t
                                        ? t === 'accommodation' ? 'bg-blue-500 text-white border-blue-500'
                                          : t === 'allowance' ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-slate-500 text-white border-slate-500'
                                        : 'bg-white/60 text-current border-black/15 hover:bg-white/80'
                                      }`}
                                  >
                                    {t === 'accommodation' && '🏨 '}
                                    {t === 'allowance' && '🟢 '}
                                    {t === 'auto' && '✨ '}
                                    {TYPE_LABELS[t]}
                                  </button>
                                ))}
                              </div>
                              {entry.type === 'auto' && (
                                <p className="text-xs mt-1 opacity-60">合計金額に合わせて宿泊か日当を自動で決定します</p>
                              )}
                            </div>

                            {/* Destination Selection */}
                            <div>
                              <label className="block text-xs font-semibold mb-1.5 opacity-70 flex items-center gap-1">
                                <MapPin size={11} />
                                訪問先
                                <span className="font-normal">（空欄 = 候補地からランダム）</span>
                              </label>
                              <div className="flex gap-2">
                                <select
                                  value={entry.destination}
                                  onChange={(e) => handleUpdateEntry(entry.date, { destination: e.target.value })}
                                  className="flex-1 rounded-md border border-black/15 bg-white/60 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-1.5"
                                >
                                  <option value="">-- ランダム --</option>
                                  {userProfile.destinations.map(dest => (
                                    <option key={dest} value={dest}>{dest}</option>
                                  ))}
                                </select>
                              </div>
                              {/* Also allow free text override */}
                              <input
                                type="text"
                                value={entry.destination}
                                onChange={(e) => handleUpdateEntry(entry.date, { destination: e.target.value })}
                                placeholder="または直接入力..."
                                className="mt-1.5 w-full rounded-md border border-black/15 bg-white/60 text-xs p-1.5 focus:outline-none focus:border-indigo-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">日付指定なし (月内で自動生成)</p>
                )}

                {/* Summary of fixed types */}
                {genDateEntries.length > 0 && (
                  <div className="mt-2 flex gap-3 text-xs text-slate-500">
                    <span>🏨 宿泊: <strong>{genDateEntries.filter(e => e.type === 'accommodation').length}</strong>件 (固定)</span>
                    <span>🟢 日当: <strong>{genDateEntries.filter(e => e.type === 'allowance').length}</strong>件 (固定)</span>
                    <span>✨ 自動: <strong>{genDateEntries.filter(e => e.type === 'auto').length}</strong>件</span>
                  </div>
                )}
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

                {/* Accommodation Count (for auto-assigned days) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Hotel size={14} />
                    追加の宿泊回数 (任意)
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
                  <p className="mt-1 text-xs text-slate-400">自動割り当て分のみに適用</p>
                </div>
              </div>

              <div className="pt-1">
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
