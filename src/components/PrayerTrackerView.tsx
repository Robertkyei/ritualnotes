import React, { useState } from 'react';
import { 
  Flame, Plus, CheckCircle2, Heart, Search, Filter, Sparkles, 
  Calendar, Check, HeartHandshake, BookOpen, Clock, Trophy, 
  ChevronRight, RefreshCw, Volume2, Timer, Award, CheckSquare, Square, Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrayerItem, UserProfile, PrayerCategory } from '../types';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabase';
import { AddPrayerModal } from './AddPrayerModal';
import { AnsweredPrayerModal } from './AnsweredPrayerModal';

interface PrayerTrackerViewProps {
  prayers: PrayerItem[];
  userProfile: UserProfile;
  onUpdatePrayers: (prayers: PrayerItem[]) => void;
  onUpdateUserProfile: (user: UserProfile) => void;
  onRefreshLive?: (silent?: boolean) => Promise<void>;
  isSyncing?: boolean;
}

export const PrayerTrackerView: React.FC<PrayerTrackerViewProps> = ({
  prayers,
  userProfile,
  onUpdatePrayers,
  onUpdateUserProfile,
  onRefreshLive,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'answered' | 'favorites'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [answeringPrayer, setAnsweringPrayer] = useState<PrayerItem | null>(null);
  const [showGuidedTimer, setShowGuidedTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180);

  const todayStr = new Date().toISOString().split('T')[0];
  const hasPrayedToday = userProfile.lastPrayedDate === todayStr;

  const handlePrayedTodayCheckIn = () => {
    // Fire confetti
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#e6be44', '#f59e0b', '#ffd700', '#ffffff'],
      });
    } catch {
      // ignore
    }

    const updatedUser = storageService.recordDailyPrayerCheckIn();
    onUpdateUserProfile(updatedUser);
  };

  const handleIncrementPrayer = (prayerId: string) => {
    const result = storageService.incrementPrayCount(prayerId);
    onUpdatePrayers(result.prayers);
    onUpdateUserProfile(result.user);
  };

  const handleToggleFavorite = (prayerId: string) => {
    const updated = storageService.togglePrayerFavorite(prayerId);
    onUpdatePrayers(updated);
  };

  const handleDeletePrayer = (prayerId: string) => {
    const updated = storageService.deletePrayer(prayerId);
    onUpdatePrayers(updated);
  };

  const handleToggleCheckPrayer = (prayerId: string) => {
    const target = prayers.find(p => p.id === prayerId);
    const willBeAnswered = target ? !target.isCompleted : true;

    if (willBeAnswered) {
      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.65 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }

    const result = storageService.togglePrayerAnswered(prayerId);
    onUpdatePrayers(result.prayers);
    onUpdateUserProfile(result.user);
  };

  const handleSaveNewPrayer = (prayerData: any) => {
    const newPrayer: PrayerItem = {
      ...prayerData,
      id: 'pray-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
      prayCount: 1,
      lastPrayedAt: new Date().toISOString(),
    };
    const updated = storageService.savePrayer(newPrayer);
    onUpdatePrayers(updated);

    // Switch to active tab so user sees their new prayer immediately
    setActiveTab('active');

    // Also count toward daily streak
    const user = storageService.recordDailyPrayerCheckIn();
    onUpdateUserProfile(user);

    try {
      confetti({
        particleCount: 45,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#e6be44', '#f59e0b', '#60a5fa'],
      });
    } catch {
      // ignore
    }
  };

  const handleConfirmAnswered = (prayerId: string, testimony: string) => {
    const result = storageService.markPrayerAnswered(prayerId, testimony);
    onUpdatePrayers(result.prayers);
    onUpdateUserProfile(result.user);
  };

  // Filter prayers
  const categoriesList = ['All', 'Family', 'Health', 'Spiritual Growth', 'Church & Mission', 'Guidance', 'Gratitude', 'General'];

  const filteredPrayers = prayers.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.scriptureAnchor && p.scriptureAnchor.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesTab = true;
    if (activeTab === 'active') matchesTab = !p.isCompleted;
    if (activeTab === 'answered') matchesTab = p.isCompleted;
    if (activeTab === 'favorites') matchesTab = p.isFavorite;

    return matchesSearch && matchesCategory && matchesTab;
  });

  const activePrayersCount = prayers.filter(p => !p.isCompleted).length;
  const answeredPrayersCount = prayers.filter(p => p.isCompleted).length;

  // Last 7 days for the mini calendar
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const isoDate = d.toISOString().split('T')[0];
    const isCompleted = userProfile.prayedDates?.includes(isoDate);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dateNumber = d.getDate();
    const isToday = isoDate === todayStr;
    return { isoDate, isCompleted, dayLabel, dateNumber, isToday };
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-200 font-heading">
              Prayer List Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cultivate steadfast communion, log petitions, and celebrate God’s faithful answers.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {supabaseService.isConfigured() ? (
            <button
              onClick={() => onRefreshLive && onRefreshLive(false)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 transition-all shadow-sm"
              title="Live connected to Supabase table 'prayers'. Click to sync."
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Supabase Live:</span>
              <span className="font-semibold text-emerald-200">prayers</span>
              <RefreshCw className={`h-3 w-3 ml-0.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-850 border border-slate-700/60 px-3 py-1.5 text-[11px] font-medium text-slate-400">
              <Database className="h-3 w-3 text-slate-500" />
              <span>Local Storage Mode</span>
            </div>
          )}

          <button
            onClick={() => setShowGuidedTimer(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-slate-700 transition-all"
          >
            <Timer className="h-4 w-4 text-amber-400" />
            <span>Silent Prayer Focus</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-4 py-2 text-xs md:text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prayer Request</span>
          </button>
        </div>
      </div>

      {/* DAILY PRAYER STREAK HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-[#13224d] via-[#0d1636] to-[#070b1a] p-5 md:p-6 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Flame Counter & Check-in */}
          <div className="md:col-span-6 flex items-center gap-4">
            <div className="relative flex h-16 w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 shadow-inner">
              <Flame className="h-9 w-9 md:h-11 md:w-11 fill-amber-400 text-amber-300 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 font-mono shadow">
                ★
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-amber-200 font-mono tracking-tight">
                  {userProfile.streakCount}
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-amber-400/90 font-heading">
                  Day Prayer Streak
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-0.5">
                {hasPrayedToday ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    You logged your devotion today! Keep the flame alive.
                  </span>
                ) : (
                  'You haven’t checked in yet today. Take a moment in prayer!'
                )}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handlePrayedTodayCheckIn}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    hasPrayedToday
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/25 active:scale-95'
                  }`}
                >
                  {hasPrayedToday ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Prayed Today (+1 Recorded)</span>
                    </>
                  ) : (
                    <>
                      <Flame className="h-3.5 w-3.5 fill-slate-950" />
                      <span>I Prayed Today</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-400">
                  Best: <strong className="text-amber-300">{userProfile.longestStreak} days</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Visual Mini Calendar */}
          <div className="md:col-span-6 rounded-xl bg-slate-900/70 border border-slate-800 p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-amber-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                Recent 7-Day Consistency
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {answeredPrayersCount} Prayers Answered
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {last7Days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center rounded-lg p-2 transition-all ${
                    day.isToday
                      ? 'border border-amber-400/60 bg-amber-500/10'
                      : 'border border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-slate-400">{day.dayLabel}</span>
                  <span className="text-xs font-bold text-slate-200 my-0.5">{day.dateNumber}</span>
                  <div
                    className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      day.isCompleted
                        ? 'bg-amber-400 text-slate-950 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {day.isCompleted ? '✓' : '·'}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* QUICK INTERACTIVE PRAYER CHECKLIST BAR */}
      {activePrayersCount > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-[#0d1738] via-[#09122c] to-[#080f24] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-amber-300 font-heading flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-amber-400" />
              Interactive Daily Prayer Checklist (Tap to Mark Answered)
            </span>
            <span className="text-[11px] text-slate-400">
              {answeredPrayersCount} answered / {prayers.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {prayers.slice(0, 6).map(p => (
              <div
                key={`quick-${p.id}`}
                onClick={() => handleToggleCheckPrayer(p.id)}
                className={`cursor-pointer flex items-center gap-2.5 rounded-xl border p-2.5 transition-all select-none ${
                  p.isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-400'
                    : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/40 hover:bg-slate-900 text-slate-200'
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    p.isCompleted
                      ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'border-slate-600 bg-slate-800 text-transparent hover:border-amber-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium truncate ${p.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                    {p.title}
                  </p>
                  <span className="text-[10px] text-amber-400/80">{p.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Navigation Bar */}
      <div className="space-y-3">
        {/* Main Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Requests ({activePrayersCount})
            </button>
            <button
              onClick={() => setActiveTab('answered')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'answered'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Praise Wall ({answeredPrayersCount})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Starred
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({prayers.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prayers, scriptures..."
              className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRAYER CARDS GRID */}
      {filteredPrayers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#091129] p-10 text-center">
          <HeartHandshake className="h-10 w-10 text-amber-400/40 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-200 font-heading">No Prayers Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {activeTab === 'answered'
              ? 'No answered prayers yet. When God moves in your petitions, check them off to mark them answered!'
              : 'Add your personal prayer petitions, family requests, and praises.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Prayer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrayers.map(prayer => {
            const isAnswered = prayer.isCompleted;

            return (
              <div
                key={prayer.id}
                className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isAnswered
                    ? 'border-amber-500/40 bg-gradient-to-b from-[#14234f] via-[#0d1633] to-[#070b1a] shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-gradient-to-b from-[#0e1738] to-[#080f24] hover:border-amber-500/30'
                }`}
              >
                {/* Answered Golden Ribbon */}
                {isAnswered && (
                  <div className="absolute top-0 right-0 overflow-hidden rounded-tr-2xl">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-4 py-0.5 shadow rotate-0">
                      ★ Answered Prayer ★
                    </div>
                  </div>
                )}

                <div>
                  {/* Top tags & actions */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      {/* Checkbox button */}
                      <button
                        onClick={() => handleToggleCheckPrayer(prayer.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                          isAnswered
                            ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 font-bold'
                            : 'border-slate-600 bg-slate-800 text-transparent hover:border-amber-400 hover:text-slate-400'
                        }`}
                        title={isAnswered ? 'Mark as Active / Unanswered' : 'Check off as Answered (+1 Answered Counter)'}
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      <span className="rounded-full bg-slate-800/90 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300/90 border border-slate-700">
                        {prayer.category}
                      </span>
                      {prayer.priority === 'urgent' && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 border border-red-500/30 uppercase">
                          Urgent
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleFavorite(prayer.id)}
                      className={`p-1 transition-colors ${
                        prayer.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-amber-300'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${prayer.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Title with strike if answered */}
                  <h3 className={`text-base font-bold font-heading leading-snug ${isAnswered ? 'line-through text-slate-300' : 'text-slate-100'}`}>
                    {prayer.title}
                  </h3>

                  {/* Description */}
                  {prayer.description && (
                    <p className="text-xs leading-relaxed text-slate-300/90 mt-2 font-sans">
                      {prayer.description}
                    </p>
                  )}

                  {/* Scripture Anchor */}
                  {prayer.scriptureAnchor && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-300 font-medium font-heading">
                      <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                      <span>Anchor: {prayer.scriptureAnchor}</span>
                    </div>
                  )}

                  {/* Praise Testimony if answered */}
                  {isAnswered && prayer.answeredTestimony && (
                    <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/25 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 mb-1">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        Praise Report:
                      </div>
                      <p className="text-xs italic text-slate-200 leading-relaxed">
                        “{prayer.answeredTestimony}”
                      </p>
                      {prayer.answeredDate && (
                        <div className="mt-1 text-[10px] text-amber-400/80">
                          Answered on {new Date(prayer.answeredDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIncrementPrayer(prayer.id)}
                      title="Log that you prayed for this today"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
                    >
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>Prayed ({prayer.prayCount || 1})</span>
                    </button>

                    <span className="text-[10px] text-slate-500">
                      {new Date(prayer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAnswered ? (
                      <button
                        onClick={() => handleToggleCheckPrayer(prayer.id)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 underline"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => setAnsweringPrayer(prayer)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Mark Answered</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeletePrayer(prayer.id)}
                      className="text-slate-500 hover:text-red-400 p-1 text-xs"
                      title="Delete prayer"
                    >
                      ×
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PROMINENT "PRAYERS ANSWERED" COUNTER BOTTOM BANNER */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#101c40] via-[#0d1633] to-[#070b1a] p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-amber-400/50 shadow-inner">
            <Trophy className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400 font-heading">
                Prayers Answered Counter:
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                +1 on Every Checked Prayer
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              “Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.” — Matthew 7:7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-3xl font-black text-amber-200 font-mono tracking-tight">
                {answeredPrayersCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {prayers.length} total
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Answered Praise Reports
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Request</span>
          </button>
        </div>
      </div>

      {/* Add Prayer Modal */}
      <AddPrayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSavePrayer={handleSaveNewPrayer}
      />

      {/* Answered Prayer Celebration Modal */}
      <AnsweredPrayerModal
        isOpen={Boolean(answeringPrayer)}
        prayer={answeringPrayer}
        onClose={() => setAnsweringPrayer(null)}
        onConfirmAnswered={handleConfirmAnswered}
      />

      {/* Guided Silent Prayer Focus Modal */}
      {showGuidedTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#111d45] via-[#09112a] to-[#070b1a] p-6 text-slate-100 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-amber-200 font-heading mb-1">
              Silent Prayer & Contemplation
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              “Be still, and know that I am God.” — Psalm 46:10
            </p>

            {/* Breathing / Focus Circle */}
            <div className="relative flex h-36 w-36 mx-auto items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.25)] animate-pulse">
              <span className="text-3xl font-mono font-bold text-amber-300">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* ACTS Prayer prompt guideline */}
            <div className="mt-6 rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                ACTS Prayer Guide:
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] text-slate-300">
                <div><strong className="text-amber-300">A</strong>doration (Praise God)</div>
                <div><strong className="text-amber-300">C</strong>onfession (Repentance)</div>
                <div><strong className="text-amber-300">T</strong>hanksgiving (Gratitude)</div>
                <div><strong className="text-amber-300">S</strong>upplication (Petitions)</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowGuidedTimer(false);
                  handlePrayedTodayCheckIn();
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110"
              >
                Complete Prayer Devotion
              </button>
              <button
                onClick={() => setShowGuidedTimer(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
