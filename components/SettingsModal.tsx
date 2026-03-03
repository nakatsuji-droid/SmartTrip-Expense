import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { X, Save, User, MapPin, Coins, Hotel, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  onDelete?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSave, onDelete }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [destinationsStr, setDestinationsStr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setDestinationsStr(profile.destinations.join('、'));
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDestinations = destinationsStr
      .split(/[、,]/) // Split by Japanese comma or English comma
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onSave({
      ...formData,
      destinations: newDestinations
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User size={20} className="text-indigo-600" />
            ユーザー設定編集
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">氏名 (申請者名)</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="山田 太郎"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Allowance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Coins size={14} />
                日当 (標準単価)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm">¥</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.allowanceCost}
                  onChange={(e) => setFormData({...formData, allowanceCost: parseInt(e.target.value) || 0})}
                  className="w-full rounded-md border-slate-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
            
            {/* Accommodation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Hotel size={14} />
                宿泊費 (標準単価)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm">¥</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.accommodationCost}
                  onChange={(e) => setFormData({...formData, accommodationCost: parseInt(e.target.value) || 0})}
                  className="w-full rounded-md border-slate-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <MapPin size={14} />
              出張先候補
            </label>
            <textarea
              rows={3}
              value={destinationsStr}
              onChange={(e) => setDestinationsStr(e.target.value)}
              className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="例: セントレア空港、東京本社、大阪支店"
            />
            <p className="text-xs text-slate-500 mt-1">
              カンマ(,) または 読点(、) で区切って入力。<br/>
              ※ 手動入力した出張先もここに自動追加されます。
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
             <div>
               {onDelete && (
                 <button
                   type="button"
                   onClick={onDelete}
                   className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md hover:bg-red-100 transition-colors"
                 >
                   <Trash2 size={16} />
                   このユーザーを削除
                 </button>
               )}
             </div>
             <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 shadow-sm"
                >
                  <Save size={16} />
                  保存する
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};