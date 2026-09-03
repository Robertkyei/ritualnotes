import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { SermonLog, PrayerItem, UserProfile } from '../types';

// Load Supabase configuration from client-side environment variables
const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as any)?.env || {};
    if (metaEnv[key]) return metaEnv[key];
  } catch {}
  try {
    if (typeof window !== 'undefined' && (window as any)?.__ENV__?.[key]) {
      return (window as any).__ENV__[key];
    }
  } catch {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'your-anon-key-here' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Supabase client instance (or fallback client if unconfigured)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * SQL SCHEMA REFERENCE FOR SUPABASE:
 * 
 * CREATE TABLE IF NOT EXISTS profiles (
 *   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *   name TEXT NOT NULL,
 *   church_name TEXT,
 *   preferred_translation TEXT DEFAULT 'ESV',
 *   streak_count INTEGER DEFAULT 0,
 *   longest_streak INTEGER DEFAULT 0,
 *   last_prayed_date DATE,
 *   prayed_dates TEXT[] DEFAULT '{}',
 *   total_prayers_answered INTEGER DEFAULT 0,
 *   total_sermons_logged INTEGER DEFAULT 0,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 * 
 * CREATE TABLE IF NOT EXISTS sermons (
 *   id TEXT PRIMARY KEY,
 *   user_id UUID,
 *   title TEXT NOT NULL,
 *   speaker TEXT NOT NULL,
 *   church TEXT NOT NULL,
 *   series TEXT,
 *   date TIMESTAMP WITH TIME ZONE NOT NULL,
 *   duration_minutes INTEGER DEFAULT 0,
 *   audio_length_seconds INTEGER DEFAULT 0,
 *   raw_notes TEXT,
 *   transcript TEXT,
 *   tags TEXT[] DEFAULT '{}',
 *   is_favorite BOOLEAN DEFAULT false,
 *   structured_notes JSONB NOT NULL,
 *   status TEXT DEFAULT 'completed',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 * 
 * CREATE TABLE IF NOT EXISTS prayers (
 *   id TEXT PRIMARY KEY,
 *   user_id UUID,
 *   title TEXT NOT NULL,
 *   description TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   priority TEXT DEFAULT 'regular',
 *   is_completed BOOLEAN DEFAULT false,
 *   answered_date TIMESTAMP WITH TIME ZONE,
 *   answered_testimony TEXT,
 *   is_favorite BOOLEAN DEFAULT false,
 *   scripture_anchor TEXT,
 *   pray_count INTEGER DEFAULT 0,
 *   last_prayed_at TIMESTAMP WITH TIME ZONE,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 */

export const supabaseService = {
  // Check configuration
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  getSupabaseUrl(): string {
    return supabaseUrl;
  },

  // Auth operations
  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  async signUp(email: string, password: string, name?: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase URL and Anon Key are not configured in environment.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email.split('@')[0] },
      },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase URL and Anon Key are not configured in environment.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },

  // User Profile table operations
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name || 'Believer',
        churchName: data.church_name || 'Sanctuary Church',
        preferredTranslation: data.preferred_translation || 'ESV',
        streakCount: data.streak_count || 0,
        longestStreak: data.longest_streak || 0,
        lastPrayedDate: data.last_prayed_date || undefined,
        prayedDates: data.prayed_dates || [],
        totalPrayersAnswered: data.total_prayers_answered || 0,
        totalSermonsLogged: data.total_sermons_logged || 0,
      };
    } catch (e) {
      console.warn('Error fetching profile from Supabase:', e);
      return null;
    }
  },

  async upsertProfile(profile: UserProfile, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const uid = userId || profile.id;
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: uid,
          name: profile.name,
          church_name: profile.churchName,
          preferred_translation: profile.preferredTranslation,
          streak_count: profile.streakCount,
          longest_streak: profile.longestStreak,
          last_prayed_date: profile.lastPrayedDate,
          prayed_dates: profile.prayedDates,
          total_prayers_answered: profile.totalPrayersAnswered,
          total_sermons_logged: profile.totalSermonsLogged,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Supabase upsertProfile warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertProfile failed:', e);
      return false;
    }
  },

  // Sermons table operations (supports both 'sermons' and 'sermon_logs')
  async fetchSermons(userId?: string): Promise<SermonLog[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      // Primary table is 'sermons'
      let query = supabase.from('sermons').select('*').order('date', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      let { data, error } = await query;

      // Fallback to 'sermon_logs' if table 'sermons' is missing or returned error
      if (error || !data) {
        let fallbackQuery = supabase.from('sermon_logs').select('*').order('date', { ascending: false });
        if (userId) {
          fallbackQuery = fallbackQuery.eq('user_id', userId);
        }
        const fallbackRes = await fallbackQuery;
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error || !data) {
        console.warn('Supabase fetchSermons query result:', error?.message);
        return null;
      }

      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title || 'Untitled Sermon',
        speaker: item.speaker || 'Pastor',
        church: item.church || 'Local Fellowship',
        series: item.series || undefined,
        date: item.date || new Date().toISOString(),
        durationMinutes: item.duration_minutes ?? item.durationMinutes ?? 0,
        audioLengthSeconds: item.audio_length_seconds ?? item.audioLengthSeconds ?? 0,
        rawNotes: item.raw_notes ?? item.rawNotes ?? '',
        transcript: item.transcript ?? '',
        tags: Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? [item.tags] : [],
        isFavorite: Boolean(item.is_favorite ?? item.isFavorite),
        status: item.status || 'completed',
        structuredNotes: item.structured_notes ?? item.structuredNotes ?? {
          coreMessage: item.core_message || 'Faith in God and walking in scripture.',
          keyTakeaways: [],
          scripturesCited: [],
          lifeApplications: [],
          reflectionQuestions: [],
        },
      }));
    } catch (e) {
      console.warn('Error fetching sermons from Supabase:', e);
      return null;
    }
  },

  async insertSermon(sermon: SermonLog, userId?: string): Promise<boolean> {
    return this.upsertSermon(sermon, userId);
  },

  async upsertSermon(sermon: SermonLog, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const payload: Record<string, any> = {
        id: sermon.id,
        title: sermon.title,
        speaker: sermon.speaker,
        church: sermon.church,
        series: sermon.series || null,
        date: sermon.date,
        duration_minutes: sermon.durationMinutes,
        audio_length_seconds: sermon.audioLengthSeconds || 0,
        raw_notes: sermon.rawNotes || '',
        transcript: sermon.transcript || '',
        tags: sermon.tags || [],
        is_favorite: sermon.isFavorite,
        structured_notes: sermon.structuredNotes,
        status: sermon.status || 'completed',
      };

      if (userId) {
        payload.user_id = userId;
      }

      // Try 'sermons' table first
      let { error } = await supabase.from('sermons').upsert(payload);

      // If 'sermons' table fails, fallback to 'sermon_logs' table
      if (error) {
        console.warn('Supabase upsert to "sermons" encountered notice, trying "sermon_logs":', error.message);
        const fallbackRes = await supabase.from('sermon_logs').upsert(payload);
        if (fallbackRes.error) {
          console.warn('Supabase sermon_logs upsert warning:', fallbackRes.error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertSermon failed:', e);
      return false;
    }
  },

  async deleteSermon(sermonId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      let { error } = await supabase.from('sermons').delete().eq('id', sermonId);
      if (error) {
        await supabase.from('sermon_logs').delete().eq('id', sermonId);
      }
      return true;
    } catch (e) {
      console.warn('Supabase deleteSermon failed:', e);
      return false;
    }
  },

  // Prayers table operations (supports both 'prayers' and 'prayer_items')
  async fetchPrayers(userId?: string): Promise<PrayerItem[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      // Primary table is 'prayers'
      let query = supabase.from('prayers').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      let { data, error } = await query;

      // Fallback to 'prayer_items' if table 'prayers' is missing or returned error
      if (error || !data) {
        let fallbackQuery = supabase.from('prayer_items').select('*').order('created_at', { ascending: false });
        if (userId) {
          fallbackQuery = fallbackQuery.eq('user_id', userId);
        }
        const fallbackRes = await fallbackQuery;
        if (!fallbackRes.error && fallbackRes.data) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error || !data) {
        console.warn('Supabase fetchPrayers query result:', error?.message);
        return null;
      }

      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title || 'Prayer Request',
        description: item.description || '',
        category: item.category || 'General',
        priority: item.priority || 'regular',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        updatedAt: item.updated_at || item.updatedAt || new Date().toISOString(),
        isCompleted: Boolean(item.is_completed ?? item.isCompleted),
        answeredDate: item.answered_date ?? item.answeredDate ?? undefined,
        answeredTestimony: item.answered_testimony ?? item.answeredTestimony ?? undefined,
        isFavorite: Boolean(item.is_favorite ?? item.isFavorite),
        scriptureAnchor: item.scripture_anchor ?? item.scriptureAnchor ?? undefined,
        prayCount: item.pray_count ?? item.prayCount ?? 0,
        lastPrayedAt: item.last_prayed_at ?? item.lastPrayedAt ?? undefined,
      }));
    } catch (e) {
      console.warn('Error fetching prayers from Supabase:', e);
      return null;
    }
  },

  async insertPrayer(prayer: PrayerItem, userId?: string): Promise<boolean> {
    return this.upsertPrayer(prayer, userId);
  },

  async upsertPrayer(prayer: PrayerItem, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const payload: Record<string, any> = {
        id: prayer.id,
        title: prayer.title,
        description: prayer.description,
        category: prayer.category,
        priority: prayer.priority || 'regular',
        is_completed: Boolean(prayer.isCompleted),
        answered_date: prayer.answeredDate || null,
        answered_testimony: prayer.answeredTestimony || null,
        is_favorite: Boolean(prayer.isFavorite),
        scripture_anchor: prayer.scriptureAnchor || null,
        pray_count: prayer.prayCount || 0,
        last_prayed_at: prayer.lastPrayedAt || null,
        created_at: prayer.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (userId) {
        payload.user_id = userId;
      }

      // Try 'prayers' table first
      let { error } = await supabase.from('prayers').upsert(payload);

      // If 'prayers' table fails, fallback to 'prayer_items' table
      if (error) {
        console.warn('Supabase upsert to "prayers" encountered notice, trying "prayer_items":', error.message);
        const fallbackRes = await supabase.from('prayer_items').upsert(payload);
        if (fallbackRes.error) {
          console.warn('Supabase prayer_items upsert warning:', fallbackRes.error.message);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.warn('Supabase upsertPrayer failed:', e);
      return false;
    }
  },

  async deletePrayer(prayerId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      let { error } = await supabase.from('prayers').delete().eq('id', prayerId);
      if (error) {
        await supabase.from('prayer_items').delete().eq('id', prayerId);
      }
      return true;
    } catch (e) {
      console.warn('Supabase deletePrayer failed:', e);
      return false;
    }
  },
};
