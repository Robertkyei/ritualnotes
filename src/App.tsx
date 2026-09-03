import React, { useState, useEffect, useCallback } from 'react';
import { SermonLog, PrayerItem, UserProfile } from './types';
import { storageService } from './services/storage';
import { supabaseService } from './services/supabase';
import { Navigation, NavTab } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { AINotebookView } from './components/AINotebookView';
import { PrayerTrackerView } from './components/PrayerTrackerView';
import { ProfileView } from './components/ProfileView';
import { RecordingModal } from './components/RecordingModal';
import { AddPrayerModal } from './components/AddPrayerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [sermons, setSermons] = useState<SermonLog[]>([]);
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedSermonId, setSelectedSermonId] = useState<string | undefined>(undefined);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isAddPrayerModalOpen, setIsAddPrayerModalOpen] = useState(false);
  const [prayerInitialText, setPrayerInitialText] = useState('');
  const [prayerInitialScripture, setPrayerInitialScripture] = useState('');

  // Actively pull from live Supabase tables ('sermons', 'prayers', 'profiles')
  const refreshLiveCloudData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      if (supabaseService.isConfigured()) {
        const liveData = await storageService.fetchLiveFromSupabase();
        if (liveData) {
          if (liveData.sermons && liveData.sermons.length > 0) {
            setSermons(liveData.sermons);
            setSelectedSermonId(prev => (prev ? prev : liveData.sermons[0]?.id));
          }
          if (liveData.prayers && liveData.prayers.length > 0) {
            setPrayers(liveData.prayers);
          }
          if (liveData.user) {
            setUserProfile(liveData.user);
          }
        }
      }
    } catch (err) {
      console.warn('Live backend data fetch notice:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Initial load: fast cache bootstrap + immediate live Supabase query
  useEffect(() => {
    const loadedSermons = storageService.getSermons();
    const loadedPrayers = storageService.getPrayers();
    const loadedUser = storageService.getUserProfile();

    setSermons(loadedSermons);
    setPrayers(loadedPrayers);
    setUserProfile(loadedUser);
    if (loadedSermons.length > 0) {
      setSelectedSermonId(loadedSermons[0].id);
    }

    // Actively query live Supabase tables
    refreshLiveCloudData(true);
  }, [refreshLiveCloudData]);

  // When switching to AI Notebook or Prayer Tracker, verify and pull latest live table data
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'notebook' || tab === 'prayers' || tab === 'home') {
      refreshLiveCloudData(true);
    }
  };

  const handleSermonCreated = (newSermon: SermonLog) => {
    // Real INSERT executed via storageService.saveSermon
    const updated = storageService.saveSermon(newSermon);
    setSermons(updated);
    setSelectedSermonId(newSermon.id);
    setActiveTab('notebook');
  };

  const handleUpdateSermon = (updatedSermon: SermonLog) => {
    // Real UPDATE/UPSERT executed via storageService.saveSermon
    const updated = storageService.saveSermon(updatedSermon);
    setSermons(updated);
  };

  const handleOpenAddPrayerWithVerse = (verseText: string, reference: string) => {
    setPrayerInitialText(`Reflecting on: "${verseText}"`);
    setPrayerInitialScripture(reference);
    setIsAddPrayerModalOpen(true);
  };

  const handleSaveDirectPrayer = (prayerData: any) => {
    const newPrayer: PrayerItem = {
      ...prayerData,
      id: 'pray-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
      prayCount: 1,
      lastPrayedAt: new Date().toISOString(),
    };
    // Real INSERT executed via storageService.savePrayer
    const updated = storageService.savePrayer(newPrayer);
    setPrayers(updated);

    const user = storageService.recordDailyPrayerCheckIn();
    setUserProfile(user);
  };

  const handleResetData = (reset: { sermons: SermonLog[]; prayers: PrayerItem[]; user: UserProfile }) => {
    setSermons(reset.sermons);
    setPrayers(reset.prayers);
    setUserProfile(reset.user);
    if (reset.sermons.length > 0) {
      setSelectedSermonId(reset.sermons[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1e] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navbar */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenRecording={() => setIsRecordingModalOpen(true)}
        userProfile={userProfile}
        sermonCount={sermons.length}
        prayerCount={prayers.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 pt-5 md:pt-6">
        {activeTab === 'home' && (
          <HomeDashboard
            userProfile={userProfile}
            sermons={sermons}
            prayers={prayers}
            onOpenRecording={() => setIsRecordingModalOpen(true)}
            onNavigateToNotebook={(sermonId) => {
              if (sermonId) setSelectedSermonId(sermonId);
              handleTabChange('notebook');
            }}
            onNavigateToPrayers={() => handleTabChange('prayers')}
            onOpenAddPrayerWithVerse={handleOpenAddPrayerWithVerse}
            onSermonCreated={handleSermonCreated}
          />
        )}

        {activeTab === 'notebook' && (
          <AINotebookView
            sermons={sermons}
            selectedSermonId={selectedSermonId}
            onSelectSermon={setSelectedSermonId}
            onUpdateSermon={handleUpdateSermon}
            onOpenRecording={() => setIsRecordingModalOpen(true)}
            onRefreshLive={refreshLiveCloudData}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'prayers' && (
          <PrayerTrackerView
            prayers={prayers}
            userProfile={userProfile}
            onUpdatePrayers={setPrayers}
            onUpdateUserProfile={setUserProfile}
            onRefreshLive={refreshLiveCloudData}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            sermons={sermons}
            prayers={prayers}
            onUpdateUserProfile={setUserProfile}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Recording Suite Modal */}
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onSermonCreated={handleSermonCreated}
      />

      {/* Add Prayer Modal from Verse / Direct */}
      <AddPrayerModal
        isOpen={isAddPrayerModalOpen}
        onClose={() => {
          setIsAddPrayerModalOpen(false);
          setPrayerInitialText('');
          setPrayerInitialScripture('');
        }}
        onSavePrayer={handleSaveDirectPrayer}
        initialText={prayerInitialText}
        initialScripture={prayerInitialScripture}
      />

    </div>
  );
}
