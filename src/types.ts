export interface ScriptureReference {
  reference: string;
  verseText: string;
  contextNote: string;
}

export interface LifeApplicationItem {
  id: string;
  task: string;
  category: string;
  isCompleted: boolean;
  targetTimeline: string;
}

export interface StructuredSermonNotes {
  coreMessage: string;
  keyTakeaways: string[];
  scripturesCited: ScriptureReference[];
  lifeApplications: LifeApplicationItem[];
  reflectionQuestions?: string[];
}

export interface SermonLog {
  id: string;
  title: string;
  speaker: string;
  church: string;
  series?: string;
  date: string; // ISO String
  durationMinutes: number;
  audioLengthSeconds?: number;
  rawNotes?: string;
  transcript?: string;
  tags: string[];
  isFavorite: boolean;
  structuredNotes: StructuredSermonNotes;
  status: 'draft' | 'recording' | 'processing' | 'completed';
}

export type PrayerCategory = 
  | 'General'
  | 'Family'
  | 'Health'
  | 'Spiritual Growth'
  | 'Church & Mission'
  | 'Gratitude'
  | 'Guidance'
  | 'Relationships';

export type PrayerPriority = 'urgent' | 'regular' | 'ongoing';

export interface PrayerItem {
  id: string;
  title: string;
  description: string;
  category: PrayerCategory;
  priority: PrayerPriority;
  createdAt: string; // ISO String
  updatedAt: string;
  isCompleted: boolean; // Answered / Fulfilled
  answeredDate?: string;
  answeredTestimony?: string;
  isFavorite: boolean;
  scriptureAnchor?: string;
  prayCount: number;
  lastPrayedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  churchName: string;
  preferredTranslation: string;
  streakCount: number;
  longestStreak: number;
  lastPrayedDate?: string; // YYYY-MM-DD
  prayedDates: string[]; // List of YYYY-MM-DD
  totalPrayersAnswered: number;
  totalSermonsLogged: number;
  subscriptionStatus?: 'free' | 'active' | 'inactive' | 'trial';
  subscriptionTier?: 'free' | 'pro' | 'patron';
  subscriptionReference?: string;
  subscriptionAmount?: number;
  subscriptionCurrency?: string;
  subscriptionChannel?: string;
  subscriptionPaidAt?: string;
}

export interface PaystackSuccessResponse {
  reference: string;
  trans?: string;
  status?: string;
  message?: string;
  transaction?: string;
  trxref?: string;
  redirecturl?: string;
}

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // in pesewas
  currency: string; // 'GHS'
  ref: string;
  channels?: string[]; // e.g. ['mobile_money', 'card']
  metadata?: Record<string, any>;
  callback: (response: PaystackSuccessResponse) => void;
  onClose: () => void;
}

export interface SubscriptionRecord {
  userId: string;
  email?: string;
  name?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'free';
  subscriptionTier: 'pro' | 'patron' | 'free';
  reference: string;
  amount: number;
  currency: string;
  paymentChannel?: string;
  paidAt: string;
}

export interface VerseOfTheDay {
  id: string;
  reference: string;
  text: string;
  translation: string;
  devotionalReflection: string;
  theme: string;
  dateStr: string;
}
