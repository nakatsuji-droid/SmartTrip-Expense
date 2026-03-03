import React, { useState, useEffect } from 'react';
import { ExpenseItem, UserProfile } from './types';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseReport } from './components/ExpenseReport';
import { SettingsModal } from './components/SettingsModal';
import { Briefcase, FileText, Settings, UserCircle, Plus, ChevronDown, LogOut } from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  id: 'default-user',
  name: '山田太郎',
  allowanceCost: 3500,
  accommodationCost: 11500,
  destinations: ['セントレア空港', '特定（支援）', 'ダンカ様（支援）', '高槻'],
};

// Robust ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const App: React.FC = () => {
  // State for Profiles (with LocalStorage persistence)
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('smarttrip_profiles');
      return saved ? JSON.parse(saved) : [DEFAULT_PROFILE];
    } catch (e) {
      console.error("Failed to load profiles", e);
      return [DEFAULT_PROFILE];
    }
  });

  // State for Current Profile ID
  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('smarttrip_currentProfileId');
      const savedProfilesStr = localStorage.getItem('smarttrip_profiles');
      const loadedProfiles = savedProfilesStr ? JSON.parse(savedProfilesStr) : [DEFAULT_PROFILE];
      
      // Ensure the saved ID actually exists
      if (savedId && loadedProfiles.some((p: UserProfile) => p.id === savedId)) {
        return savedId;
      }
      return loadedProfiles[0].id;
    } catch (e) {
      return DEFAULT_PROFILE.id;
    }
  });

  // State for Expenses (with LocalStorage persistence)
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('smarttrip_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load expenses", e);
      return [];
    }
  });
  
  const [showReport, setShowReport] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Derived State
  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0];
  const userExpenses = expenses.filter(e => e.userId === currentProfileId);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('smarttrip_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('smarttrip_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('smarttrip_currentProfileId', currentProfileId);
  }, [currentProfileId]);

  const handleAddExpense = (newExpense: Omit<ExpenseItem, 'id' | 'userId'>) => {
    const expense: ExpenseItem = {
      ...newExpense,
      id: generateId(),
      userId: currentProfileId,
    };
    setExpenses(prev => [expense, ...prev]);

    // --- Auto-Learning Feature ---
    // If the description (destination) is not in the user's list, add it automatically.
    const description = newExpense.description.trim();
    const isCandidate = !currentProfile.destinations.includes(description);
    
    // Simple heuristic: If it's not a generic term and looks like a location
    if (isCandidate && description.length > 1 && description.length < 20) {
       handleUpdateProfile({
         ...currentProfile,
         destinations: [...currentProfile.destinations, description]
       });
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleAddProfile = () => {
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      id: generateId(),
      name: '新規ユーザー',
      destinations: ['本社', '支店'],
    };
    setProfiles(prev => [...prev, newProfile]);
    setCurrentProfileId(newProfile.id);
    setIsProfileMenuOpen(false); // Close menu
    setIsSettingsOpen(true); // Open settings to let them edit immediately
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) {
      alert('これ以上ユーザーを削除できません。');
      return;
    }
    if (confirm('このユーザーと関連する経費データを削除しますか？')) {
      const newProfiles = profiles.filter(p => p.id !== id);
      setProfiles(newProfiles);
      setExpenses(prev => prev.filter(e => e.userId !== id)); // Clean up expenses
      
      // If we deleted the current profile, switch to the first available
      if (currentProfileId === id) {
        setCurrentProfileId(newProfiles[0].id);
      }
      setIsSettingsOpen(false);
    }
  };

  const handleSwitchProfile = (id: string) => {
    setCurrentProfileId(id);
    setIsProfileMenuOpen(false);
  };

  if (showReport) {
    return (
      <ExpenseReport 
        expenses={userExpenses} 
        userProfile={currentProfile}
        onBack={() => setShowReport(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-indigo-200" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">SmartTrip Expense</h1>
            <h1 className="text-lg font-bold tracking-tight sm:hidden">SmartTrip</h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Profile Selector */}
             <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  <UserCircle size={18} />
                  <span className="max-w-[100px] truncate">{currentProfile.name}</span>
                  <ChevronDown size={14} className={`opacity-70 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Backdrop to close menu */}
                {isProfileMenuOpen && (
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></div>
                )}
                
                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-100">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {profiles.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSwitchProfile(p.id)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                            currentProfileId === p.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          {currentProfileId === p.id && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></div>}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50">
                      <button 
                        type="button"
                        onClick={handleAddProfile}
                        className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-100 flex items-center gap-2 font-medium"
                      >
                        <Plus size={14} />
                        ユーザーを追加
                      </button>
                    </div>
                  </div>
                )}
             </div>

             <div className="h-6 w-px bg-indigo-400/30 mx-1"></div>

             <button
               type="button"
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 hover:bg-indigo-500 rounded-full transition-colors text-indigo-100 hover:text-white"
               title="ユーザー設定"
             >
               <Settings size={20} />
             </button>
             <button 
               type="button"
               onClick={() => setShowReport(true)}
               className="text-xs sm:text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-full transition-colors flex items-center gap-2 ml-2 shadow-sm border border-indigo-400/50"
             >
               <FileText size={16} />
               精算書を作成
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Dashboard Overview */}
        <Dashboard expenses={userExpenses} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="sticky top-24">
               <ExpenseForm 
                 onAddExpense={handleAddExpense} 
                 userProfile={currentProfile}
               />
               <div className="mt-4 text-xs text-slate-400 text-center">
                 ※ 手入力した出張先は自動的に候補リストに追加され、<br/>次回の自動生成時に利用されます。
               </div>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                 <h2 className="text-lg font-semibold text-slate-800">経費一覧</h2>
                 <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                   {currentProfile.name}
                 </span>
               </div>
               <span className="text-sm text-slate-500">{userExpenses.length} 件</span>
            </div>
            <ExpenseList expenses={userExpenses} onDelete={handleDeleteExpense} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        profile={currentProfile}
        onSave={handleUpdateProfile}
        onDelete={profiles.length > 1 ? () => handleDeleteProfile(currentProfile.id) : undefined}
      />
    </div>
  );
};

export default App;