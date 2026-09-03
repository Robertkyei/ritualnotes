import React from 'react';
import { Home, BookOpen, HeartHandshake, Mic, Sparkles, Settings, Church, Flame, Crown } from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'home' | 'notebook' | 'prayers' | 'profile';

interface NavigationProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenRecording: () => void;
  onOpenUpgrade?: () => void;
  userProfile: UserProfile;
  sermonCount: number;
  prayerCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  onOpenRecording,
  onOpenUpgrade,
  userProfile,
  sermonCount,
  prayerCount,
}) => {
  const isPro = userProfile.subscriptionStatus === 'active';
  return (
    <>
      {/* DESKTOP TOP HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 hidden md:block border-b border-amber-500/20 bg-[#070c1e]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => onChangeTab('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <span className="font-heading font-black text-lg">✝</span>
            </div>
            <div>
              <span className="text-lg font-extrabold text-amber-200 font-heading tracking-wider">
                RitualNotes
              </span>
              <span className="block text-[10px] text-amber-400/80 font-sans tracking-wide uppercase font-semibold -mt-1">
                Sanctuary AI Companion
              </span>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 rounded-2xl bg-slate-900/90 border border-slate-800 p-1.5 shadow-inner">
            <button
              onClick={() => onChangeTab('home')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home Dashboard</span>
            </button>

            <button
              onClick={() => onChangeTab('notebook')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'notebook'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>AI Notebook ({sermonCount})</span>
            </button>

            <button
              onClick={() => onChangeTab('prayers')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'prayers'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-white/5'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Prayer Tracker</span>
              <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] text-amber-300">
                <Flame className="h-2.5 w-2.5 fill-amber-400" />
                {userProfile.streakCount}
              </span>
            </button>
          </nav>

          {/* Right Action: Upgrade CTA, Record CTA & Profile */}
          <div className="flex items-center gap-2.5">
            {onOpenUpgrade && (
              isPro ? (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="hidden lg:flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                  title="Sanctuary Pro Active • Paystack Mobile Money"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pro Active</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:border-amber-400 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                  title="Upgrade with Ghana Mobile Money (GHS) via Paystack"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Upgrade Now</span>
                </button>
              )
            )}

            <button
              onClick={onOpenRecording}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Record Sermon</span>
            </button>

            <button
              onClick={() => onChangeTab('profile')}
              title="Profile & Settings"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                activeTab === 'profile'
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-amber-300'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-amber-500/20 bg-[#070c1e]/95 backdrop-blur-lg px-3 py-2 pb-safe">
        <div className="flex items-center justify-around">
          
          {/* Home */}
          <button
            onClick={() => onChangeTab('home')}
            className={`flex flex-col items-center gap-1 p-1 transition-colors ${
              activeTab === 'home' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </button>

          {/* AI Notebook */}
          <button
            onClick={() => onChangeTab('notebook')}
            className={`flex flex-col items-center gap-1 p-1 transition-colors relative ${
              activeTab === 'notebook' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-[10px]">Notebook</span>
            {sermonCount > 0 && (
              <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Floating Central Record Action */}
          <button
            onClick={onOpenRecording}
            className="flex flex-col items-center -mt-5 focus:outline-none"
          >
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/40 border-2 border-[#070c1e] active:scale-90 transition-transform">
              <Mic className="h-6 w-6" />
            </div>
            <span className="text-[9px] font-bold text-amber-300 mt-0.5">Record</span>
          </button>

          {/* Prayer Tracker */}
          <button
            onClick={() => onChangeTab('prayers')}
            className={`flex flex-col items-center gap-1 p-1 transition-colors relative ${
              activeTab === 'prayers' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <HeartHandshake className="h-5 w-5" />
            <span className="text-[10px]">Prayers</span>
            {userProfile.streakCount > 0 && (
              <span className="absolute -top-1 right-0 rounded-full bg-amber-500 px-1 text-[8px] font-bold text-slate-950">
                {userProfile.streakCount}🔥
              </span>
            )}
          </button>

          {/* Profile / Sanctuary */}
          <button
            onClick={() => onChangeTab('profile')}
            className={`flex flex-col items-center gap-1 p-1 transition-colors ${
              activeTab === 'profile' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px]">Profile</span>
          </button>

        </div>
      </nav>
    </>
  );
};
