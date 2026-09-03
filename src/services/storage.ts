import { SermonLog, PrayerItem, UserProfile } from '../types';
import { INITIAL_SERMONS, INITIAL_PRAYERS, INITIAL_USER } from '../data/initialData';
import { supabaseService } from './supabase';

const KEYS = {
  SERMONS: 'ritualnotes_sermons_v1',
  PRAYERS: 'ritualnotes_prayers_v1',
  USER: 'ritualnotes_user_v1',
};

export const storageService = {
  // Actively pull latest live records from Supabase tables ('sermons', 'prayers', 'profiles')
  async fetchLiveFromSupabase(): Promise<{ sermons: SermonLog[]; prayers: PrayerItem[]; user: UserProfile } | null> {
    if (!supabaseService.isConfigured()) return null;
    try {
      const userSession = await supabaseService.getCurrentUser();
      const userId = userSession?.id;

      const [cloudSermons, cloudPrayers, cloudProfile] = await Promise.all([
        supabaseService.fetchSermons(userId),
        supabaseService.fetchPrayers(userId),
        userId ? supabaseService.fetchProfile(userId) : null,
      ]);

      const localSermons = this.getSermons();
      const localPrayers = this.getPrayers();
      const localUser = this.getUserProfile();

      let finalSermons = localSermons;
      if (cloudSermons !== null) {
        if (cloudSermons.length > 0) {
          finalSermons = cloudSermons;
          localStorage.setItem(KEYS.SERMONS, JSON.stringify(finalSermons));
        } else if (localSermons.length > 0) {
          // If live table is empty, seed live tables with local records
          localSermons.forEach(s => supabaseService.upsertSermon(s, userId));
        }
      }

      let finalPrayers = localPrayers;
      if (cloudPrayers !== null) {
        if (cloudPrayers.length > 0) {
          finalPrayers = cloudPrayers;
          localStorage.setItem(KEYS.PRAYERS, JSON.stringify(finalPrayers));
        } else if (localPrayers.length > 0) {
          localPrayers.forEach(p => supabaseService.upsertPrayer(p, userId));
        }
      }

      let finalUser = localUser;
      if (cloudProfile) {
        finalUser = { ...localUser, ...cloudProfile };
        localStorage.setItem(KEYS.USER, JSON.stringify(finalUser));
      }

      return {
        sermons: finalSermons,
        prayers: finalPrayers,
        user: finalUser,
      };
    } catch (err) {
      console.warn('Live fetch from Supabase table encountered notice:', err);
      return null;
    }
  },

  // Synchronize local storage with Supabase if online/connected
  async syncWithSupabase(): Promise<{ sermons: SermonLog[]; prayers: PrayerItem[]; user: UserProfile } | null> {
    return this.fetchLiveFromSupabase();
  },

  // Sermons
  getSermons(): SermonLog[] {
    try {
      const data = localStorage.getItem(KEYS.SERMONS);
      if (!data) {
        localStorage.setItem(KEYS.SERMONS, JSON.stringify(INITIAL_SERMONS));
        return INITIAL_SERMONS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SERMONS;
    }
  },

  async getLiveSermons(): Promise<SermonLog[]> {
    if (supabaseService.isConfigured()) {
      const live = await supabaseService.fetchSermons();
      if (live && live.length > 0) {
        localStorage.setItem(KEYS.SERMONS, JSON.stringify(live));
        return live;
      }
    }
    return this.getSermons();
  },

  saveSermon(sermon: SermonLog): SermonLog[] {
    const list = this.getSermons();
    const existingIndex = list.findIndex(s => s.id === sermon.id);
    let updated: SermonLog[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = sermon;
    } else {
      updated = [sermon, ...list];
    }
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(updated));

    // Submit live INSERT / UPSERT statement to live Supabase 'sermons' table
    if (supabaseService.isConfigured()) {
      supabaseService.insertSermon(sermon).catch(e => console.warn('Supabase sermon INSERT notice:', e));
    }

    return updated;
  },

  deleteSermon(id: string): SermonLog[] {
    const list = this.getSermons().filter(s => s.id !== id);
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(list));

    if (supabaseService.isConfigured()) {
      supabaseService.deleteSermon(id).catch(e => console.warn('Supabase delete sermon notice:', e));
    }

    return list;
  },

  toggleSermonFavorite(id: string): SermonLog[] {
    let targetSermon: SermonLog | null = null;
    const list = this.getSermons().map(s => {
      if (s.id === id) {
        targetSermon = { ...s, isFavorite: !s.isFavorite };
        return targetSermon;
      }
      return s;
    });
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(list));

    if (targetSermon && supabaseService.isConfigured()) {
      supabaseService.upsertSermon(targetSermon).catch(e => console.warn('Supabase favorite sync notice:', e));
    }

    return list;
  },

  toggleLifeApplication(sermonId: string, applicationId: string): SermonLog[] {
    let targetSermon: SermonLog | null = null;
    const list = this.getSermons().map(sermon => {
      if (sermon.id === sermonId) {
        const updatedApplications = sermon.structuredNotes.lifeApplications.map(app => {
          if (app.id === applicationId) {
            return { ...app, isCompleted: !app.isCompleted };
          }
          return app;
        });
        targetSermon = {
          ...sermon,
          structuredNotes: {
            ...sermon.structuredNotes,
            lifeApplications: updatedApplications,
          },
        };
        return targetSermon;
      }
      return sermon;
    });
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(list));

    if (targetSermon && supabaseService.isConfigured()) {
      supabaseService.upsertSermon(targetSermon).catch(e => console.warn('Supabase app sync notice:', e));
    }

    return list;
  },

  addLifeApplicationItem(sermonId: string, task: string, category: string): SermonLog[] {
    let targetSermon: SermonLog | null = null;
    const list = this.getSermons().map(sermon => {
      if (sermon.id === sermonId) {
        const newItem = {
          id: 'app-' + Date.now(),
          task,
          category: category || 'Personal Reflection',
          isCompleted: false,
          targetTimeline: 'This Week',
        };
        targetSermon = {
          ...sermon,
          structuredNotes: {
            ...sermon.structuredNotes,
            lifeApplications: [...sermon.structuredNotes.lifeApplications, newItem],
          },
        };
        return targetSermon;
      }
      return sermon;
    });
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(list));

    if (targetSermon && supabaseService.isConfigured()) {
      supabaseService.upsertSermon(targetSermon).catch(e => console.warn('Supabase app sync notice:', e));
    }

    return list;
  },

  // Prayers
  getPrayers(): PrayerItem[] {
    try {
      const data = localStorage.getItem(KEYS.PRAYERS);
      if (!data) {
        localStorage.setItem(KEYS.PRAYERS, JSON.stringify(INITIAL_PRAYERS));
        return INITIAL_PRAYERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PRAYERS;
    }
  },

  async getLivePrayers(): Promise<PrayerItem[]> {
    if (supabaseService.isConfigured()) {
      const live = await supabaseService.fetchPrayers();
      if (live && live.length > 0) {
        localStorage.setItem(KEYS.PRAYERS, JSON.stringify(live));
        return live;
      }
    }
    return this.getPrayers();
  },

  savePrayer(prayer: PrayerItem): PrayerItem[] {
    const list = this.getPrayers();
    const existingIndex = list.findIndex(p => p.id === prayer.id);
    let updated: PrayerItem[];
    const itemToSave = { ...prayer, updatedAt: new Date().toISOString() };

    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = itemToSave;
    } else {
      updated = [itemToSave, ...list];
    }
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(updated));

    // Submit live INSERT / UPSERT statement to live Supabase 'prayers' table
    if (supabaseService.isConfigured()) {
      supabaseService.insertPrayer(itemToSave).catch(e => console.warn('Supabase prayer INSERT notice:', e));
    }

    return updated;
  },

  deletePrayer(id: string): PrayerItem[] {
    const list = this.getPrayers().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (supabaseService.isConfigured()) {
      supabaseService.deletePrayer(id).catch(e => console.warn('Supabase delete prayer notice:', e));
    }

    return list;
  },

  togglePrayerFavorite(id: string): PrayerItem[] {
    let targetPrayer: PrayerItem | null = null;
    const list = this.getPrayers().map(p => {
      if (p.id === id) {
        targetPrayer = { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() };
        return targetPrayer;
      }
      return p;
    });
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (targetPrayer && supabaseService.isConfigured()) {
      supabaseService.upsertPrayer(targetPrayer).catch(e => console.warn('Supabase prayer sync notice:', e));
    }

    return list;
  },

  incrementPrayCount(id: string): { prayers: PrayerItem[]; user: UserProfile } {
    let targetPrayer: PrayerItem | null = null;
    const list = this.getPrayers().map(p => {
      if (p.id === id) {
        targetPrayer = {
          ...p,
          prayCount: (p.prayCount || 0) + 1,
          lastPrayedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return targetPrayer;
      }
      return p;
    });
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (targetPrayer && supabaseService.isConfigured()) {
      supabaseService.upsertPrayer(targetPrayer).catch(e => console.warn('Supabase prayer sync notice:', e));
    }

    // Also update daily streak
    const user = this.recordDailyPrayerCheckIn();
    return { prayers: list, user };
  },

  markPrayerAnswered(id: string, testimony: string): { prayers: PrayerItem[]; user: UserProfile } {
    let targetPrayer: PrayerItem | null = null;
    const list = this.getPrayers().map(p => {
      if (p.id === id) {
        targetPrayer = {
          ...p,
          isCompleted: true,
          answeredDate: new Date().toISOString(),
          answeredTestimony: testimony || 'Praise God for His faithfulness!',
          updatedAt: new Date().toISOString(),
        };
        return targetPrayer;
      }
      return p;
    });
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (targetPrayer && supabaseService.isConfigured()) {
      supabaseService.upsertPrayer(targetPrayer).catch(e => console.warn('Supabase prayer sync notice:', e));
    }

    const user = this.getUserProfile();
    const updatedUser = {
      ...user,
      totalPrayersAnswered: (user.totalPrayersAnswered || 0) + 1,
    };
    this.saveUserProfile(updatedUser);

    return { prayers: list, user: updatedUser };
  },

  togglePrayerAnswered(id: string, defaultTestimony?: string): { prayers: PrayerItem[]; user: UserProfile } {
    let wasAnswered = false;
    let targetPrayer: PrayerItem | null = null;

    const list = this.getPrayers().map(p => {
      if (p.id === id) {
        wasAnswered = !p.isCompleted;
        targetPrayer = {
          ...p,
          isCompleted: !p.isCompleted,
          answeredDate: !p.isCompleted ? new Date().toISOString() : undefined,
          answeredTestimony: !p.isCompleted ? (defaultTestimony || 'Praise God for answering this prayer request!') : undefined,
          updatedAt: new Date().toISOString(),
        };
        return targetPrayer;
      }
      return p;
    });
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (targetPrayer && supabaseService.isConfigured()) {
      supabaseService.upsertPrayer(targetPrayer).catch(e => console.warn('Supabase prayer sync notice:', e));
    }

    const user = this.getUserProfile();
    const currentCount = user.totalPrayersAnswered || 0;
    const updatedUser = {
      ...user,
      totalPrayersAnswered: wasAnswered ? currentCount + 1 : Math.max(0, currentCount - 1),
    };
    this.saveUserProfile(updatedUser);

    return { prayers: list, user: updatedUser };
  },

  reactivatePrayer(id: string): PrayerItem[] {
    let targetPrayer: PrayerItem | null = null;
    const list = this.getPrayers().map(p => {
      if (p.id === id) {
        targetPrayer = {
          ...p,
          isCompleted: false,
          answeredDate: undefined,
          updatedAt: new Date().toISOString(),
        };
        return targetPrayer;
      }
      return p;
    });
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(list));

    if (targetPrayer && supabaseService.isConfigured()) {
      supabaseService.upsertPrayer(targetPrayer).catch(e => console.warn('Supabase prayer sync notice:', e));
    }

    return list;
  },

  // User Profile & Streaks
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.USER);
      if (!data) {
        localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
        return INITIAL_USER;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USER;
    }
  },

  saveUserProfile(user: UserProfile): UserProfile {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));

    if (supabaseService.isConfigured()) {
      supabaseService.upsertProfile(user).catch(e => console.warn('Supabase profile sync notice:', e));
    }

    return user;
  },

  recordDailyPrayerCheckIn(): UserProfile {
    const user = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];

    // If already checked in today, just ensure today is in list
    if (user.lastPrayedDate === today) {
      if (!user.prayedDates.includes(today)) {
        user.prayedDates = [today, ...user.prayedDates];
        return this.saveUserProfile(user);
      }
      return user;
    }

    // Check if yesterday was prayed to continue streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = user.streakCount || 0;
    if (user.lastPrayedDate === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const longest = Math.max(user.longestStreak || 0, newStreak);
    const updatedDates = Array.from(new Set([today, ...(user.prayedDates || [])]));

    const updatedUser: UserProfile = {
      ...user,
      streakCount: newStreak,
      longestStreak: longest,
      lastPrayedDate: today,
      prayedDates: updatedDates,
    };

    return this.saveUserProfile(updatedUser);
  },

  resetAllData(): { sermons: SermonLog[]; prayers: PrayerItem[]; user: UserProfile } {
    localStorage.setItem(KEYS.SERMONS, JSON.stringify(INITIAL_SERMONS));
    localStorage.setItem(KEYS.PRAYERS, JSON.stringify(INITIAL_PRAYERS));
    localStorage.setItem(KEYS.USER, JSON.stringify(INITIAL_USER));
    return {
      sermons: INITIAL_SERMONS,
      prayers: INITIAL_PRAYERS,
      user: INITIAL_USER,
    };
  },
};
