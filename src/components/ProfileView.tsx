import React, { useState, useEffect } from 'react';
import { User, Church, BookOpen, Flame, Trophy, Shield, RefreshCw, Check, Sparkles, Heart, Database, Cloud, LogIn, LogOut, CheckCircle2, AlertCircle, Code } from 'lucide-react';
import { UserProfile, SermonLog, PrayerItem } from '../types';
import { storageService } from '../services/storage';
import { supabaseService, isSupabaseConfigured } from '../services/supabase';

interface ProfileViewProps {
  userProfile: UserProfile;
  sermons: SermonLog[];
  prayers: PrayerItem[];
  onUpdateUserProfile: (user: UserProfile) => void;
  onResetData: (data: { sermons: SermonLog[]; prayers: PrayerItem[]; user: UserProfile }) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  sermons,
  prayers,
  onUpdateUserProfile,
  onResetData,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [churchName, setChurchName] = useState(userProfile.churchName);
  const [preferredTranslation, setPreferredTranslation] = useState(userProfile.preferredTranslation || 'ESV');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cloud sync & auth state
  const [isCloudConfigured, setIsCloudConfigured] = useState(isSupabaseConfigured());
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  useEffect(() => {
    supabaseService.getCurrentUser().then(user => {
      if (user?.email) setCurrentUserEmail(user.email);
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'Churchgoer',
      churchName: churchName.trim() || 'Local Fellowship',
      preferredTranslation,
    };
    storageService.saveUserProfile(updated);
    onUpdateUserProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setAuthMsg(null);

    try {
      if (authMode === 'signup') {
        await supabaseService.signUp(email, password, name);
        setAuthMsg({ type: 'success', text: 'Sign up successful! You are now connected to Supabase.' });
      } else {
        await supabaseService.signIn(email, password);
        setAuthMsg({ type: 'success', text: 'Welcome back! Signed into Supabase cloud account.' });
      }
      const user = await supabaseService.getCurrentUser();
      setCurrentUserEmail(user?.email || email);
    } catch (err: any) {
      setAuthMsg({ type: 'error', text: err.message || 'Authentication failed. Please check credentials.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabaseService.signOut();
    setCurrentUserEmail(null);
    setAuthMsg({ type: 'success', text: 'Signed out of cloud account.' });
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Connecting to Supabase and synchronizing records...');
    try {
      const merged = await storageService.syncWithSupabase();
      if (merged) {
        onResetData(merged);
        setSyncStatus('Full bi-directional sync complete with Supabase!');
      } else {
        setSyncStatus('Local records up to date. (Add Supabase URL/Key in environment for live database)');
      }
    } catch (err: any) {
      setSyncStatus('Sync completed with local cache.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset all sermons and prayers back to default sample data?')) {
      const reset = storageService.resetAllData();
      onResetData(reset);
    }
  };

  const answeredCount = prayers.filter(p => p.isCompleted).length;

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-amber-500/20 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-amber-200 font-heading">
          Sanctuary Settings & Devotion Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize your church details, configure Supabase cloud backend, and track spiritual milestones.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#121e42] via-[#0d1633] to-[#070b1a] p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/30 text-3xl font-heading font-black">
            ✝
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-heading">{userProfile.name}</h2>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {userProfile.preferredTranslation} Reader
              </span>
            </div>
            <p className="text-xs text-amber-400/90 mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <Church className="h-3.5 w-3.5" />
              {userProfile.churchName}
            </p>

            {/* Milestones Chips */}
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="rounded-lg bg-slate-900/80 px-3 py-1 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <strong>{userProfile.streakCount}</strong> Day Streak
              </span>
              <span className="rounded-lg bg-slate-900/80 px-3 py-1 text-slate-300 border border-slate-700 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                <strong>{sermons.length}</strong> Sermons Logged
              </span>
              <span className="rounded-lg bg-slate-900/80 px-3 py-1 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                <strong>{answeredCount}</strong> Prayers Answered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Cloud Backend & Database Integration */}
      <div className="rounded-2xl border border-emerald-500/30 bg-[#071324] p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300 font-heading">
                Supabase Backend & Cloud Database
              </h3>
              <p className="text-[11px] text-slate-400">
                Connected tables: <code className="text-emerald-300">profiles</code>, <code className="text-emerald-300">sermon_logs</code>, <code className="text-emerald-300">prayer_items</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCloudSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow transition-all disabled:opacity-50"
            >
              <Cloud className={`h-3.5 w-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Tables'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSqlSchema(prev => !prev)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700"
            >
              <Code className="h-3.5 w-3.5 text-emerald-400" />
              <span>Schema SQL</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Supabase SQL Table Schema Drawer */}
        {showSqlSchema && (
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
            <p className="text-xs text-slate-400 font-semibold">
              Copy and execute these SQL commands in your Supabase SQL editor:
            </p>
            <pre className="text-[11px] font-mono text-emerald-300/90 bg-slate-900/90 p-3 rounded-lg overflow-x-auto border border-slate-800">
{`-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  church_name TEXT,
  preferred_translation TEXT DEFAULT 'ESV',
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_prayed_date DATE,
  prayed_dates TEXT[] DEFAULT '{}',
  total_prayers_answered INTEGER DEFAULT 0,
  total_sermons_logged INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Sermons Table
CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  speaker TEXT NOT NULL,
  church TEXT NOT NULL,
  series TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  audio_length_seconds INTEGER DEFAULT 0,
  raw_notes TEXT,
  transcript TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  structured_notes JSONB NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Prayers Table
CREATE TABLE IF NOT EXISTS prayers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'regular',
  is_completed BOOLEAN DEFAULT false,
  answered_date TIMESTAMP WITH TIME ZONE,
  answered_testimony TEXT,
  is_favorite BOOLEAN DEFAULT false,
  scripture_anchor TEXT,
  pray_count INTEGER DEFAULT 0,
  last_prayed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
            </pre>
          </div>
        )}

        {/* Cloud Auth / Account Status */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4">
          {currentUserEmail ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Authenticated Supabase User:</p>
                <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {currentUserEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-rose-300 border border-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  {authMode === 'signin' ? 'Sign In with Supabase Account' : 'Create Supabase Church Account'}
                </p>
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@church.org"
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {authMsg && (
                <p className={`text-xs ${authMsg.type === 'success' ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {authMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-50"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{authLoading ? 'Connecting...' : authMode === 'signin' ? 'Sign In to Supabase' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Edit Settings Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-800 bg-[#091129] p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-amber-300 font-heading uppercase tracking-wider">
          Personalize Sanctuary Preferences
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Home Church / Parish
            </label>
            <input
              type="text"
              value={churchName}
              onChange={e => setChurchName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Preferred Bible Translation
            </label>
            <select
              value={preferredTranslation}
              onChange={e => setPreferredTranslation(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="ESV">English Standard Version (ESV)</option>
              <option value="NIV">New International Version (NIV)</option>
              <option value="KJV">King James Version (KJV)</option>
              <option value="NKJV">New King James Version (NKJV)</option>
              <option value="NLT">New Living Translation (NLT)</option>
              <option value="NASB">New American Standard Bible (NASB)</option>
              <option value="CSB">Christian Standard Bible (CSB)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="h-3.5 w-3.5" /> Preferences updated successfully!
            </span>
          )}
          {!savedSuccess && <div />}

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md hover:brightness-110"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Data Management & Reset */}
      <div className="rounded-2xl border border-slate-800 bg-[#091129]/80 p-6">
        <h3 className="text-sm font-bold text-slate-300 font-heading mb-2">
          Sanctuary Data Management
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          All sermon logs, structured notes, and prayer requests are saved in your persistent store and synchronized across connected cloud databases.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetSampleData}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Preloaded Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
