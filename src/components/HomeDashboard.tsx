import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Sparkles, Flame, BookOpen, HeartHandshake, Plus, 
  Calendar, User, ChevronRight, Church, Heart, CheckCircle2, Clock, Square, Radio,
  Crown, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SermonLog, PrayerItem, UserProfile } from '../types';
import { storageService } from '../services/storage';
import { VerseOfTheDayCard } from './VerseOfTheDayCard';
import { Footer } from './Footer';
import { LegalModal, LegalDocType } from './LegalModal';

interface HomeDashboardProps {
  userProfile: UserProfile;
  sermons: SermonLog[];
  prayers: PrayerItem[];
  onOpenRecording: () => void;
  onNavigateToNotebook: (sermonId?: string) => void;
  onNavigateToPrayers: () => void;
  onOpenAddPrayerWithVerse?: (text: string, reference: string) => void;
  onSermonCreated?: (sermon: SermonLog) => void;
  onOpenUpgrade?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userProfile,
  sermons,
  prayers,
  onOpenRecording,
  onNavigateToNotebook,
  onNavigateToPrayers,
  onOpenAddPrayerWithVerse,
  onSermonCreated,
  onOpenUpgrade,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocType>('privacy');
  const timerRef = useRef<number | null>(null);

  // Active recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecordButton = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      setRecordSeconds(0);
    } else {
      // Stop recording and generate realistic mock sermon entry
      setIsRecording(false);
      const finalDurationSec = Math.max(recordSeconds, 5);
      if (timerRef.current) clearInterval(timerRef.current);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e6be44', '#f59e0b', '#3b82f6', '#10b981', '#ffffff'],
        });
      } catch {
        // ignore
      }

      const sermonTitles = [
        'The Unshakable Kingdom - Finding Peace in Cultural Storms',
        'Walking by Faith, Not by Sight - Trusting in the Valleys',
        'Grace in the Wilderness - The Deep Provision of God',
        'Living with Kingdom Purpose - Salt and Light in Daily Life',
      ];
      const selectedTitle = sermonTitles[Math.floor(Math.random() * sermonTitles.length)];

      const newMockSermon: SermonLog = {
        id: 'sermon-' + Date.now(),
        title: selectedTitle,
        speaker: 'Pastor David Evans',
        church: userProfile.churchName || 'Sovereign Grace Church',
        series: 'Unshakable Faith in Modern Times',
        date: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(finalDurationSec / 60)),
        audioLengthSeconds: finalDurationSec,
        rawNotes: `Captured live sermon recording on ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}. Explored the spiritual anchor of God's covenant, steadfast prayer during hardship, and actionable community love.`,
        tags: ['Faith', 'Perseverance', 'Community', 'Grace'],
        isFavorite: false,
        status: 'completed',
        structuredNotes: {
          coreMessage:
            "In seasons of shifting culture and unexpected trials, believers are anchored in Christ's unshakable kingdom, empowered by the Holy Spirit to walk in courageous faith, unwavering love, and authentic worship.",
          keyTakeaways: [
            "True faith is not the absence of trouble, but the presence of Christ in the midst of it.",
            "Scripture is our daily compass; without constant meditation on God's Word, the world dictates our mindset.",
            "Christian community provides mutual encouragement and protective accountability against spiritual drift.",
            "A posture of reverence and gratitude transforms our perspective during seasons of trial."
          ],
          scripturesCited: [
            {
              reference: 'Hebrews 12:28-29',
              verseText:
                'Therefore, since we are receiving a kingdom that cannot be shaken, let us be thankful, and so worship God acceptably with reverence and awe, for our God is a consuming fire.',
              contextNote:
                'The author of Hebrews contrasts the temporary shaking of worldly realms with the permanent, unshakable reign of Jesus Christ.'
            },
            {
              reference: 'Philippians 4:6-7',
              verseText:
                'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
              contextNote:
                "Paul's apostolic instruction on exchanging worldly anxiety for supernatural peace through persistent thanksgiving."
            },
            {
              reference: 'Psalm 46:1-3',
              verseText:
                'God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea.',
              contextNote:
                'A sacred psalm declaring absolute confidence in the sovereignty and protection of God.'
            }
          ],
          lifeApplications: [
            {
              id: 'app-auto-' + Date.now() + '-1',
              task: 'Set aside 15 minutes of uninterrupted morning prayer to surrender weekly anxieties before God.',
              category: 'Personal Devotion',
              isCompleted: false,
              targetTimeline: 'Daily This Week'
            },
            {
              id: 'app-auto-' + Date.now() + '-2',
              task: 'Reach out to a fellow church member facing difficulty and share the promise of Hebrews 12:28.',
              category: 'Church Fellowship',
              isCompleted: false,
              targetTimeline: 'Before Wednesday'
            },
            {
              id: 'app-auto-' + Date.now() + '-3',
              task: 'Memorize Psalm 46:1-2 to recite during moments of anxiety or stress.',
              category: 'Scripture Memory',
              isCompleted: false,
              targetTimeline: 'This Sunday'
            }
          ],
          reflectionQuestions: [
            'In what areas of my life am I placing trust in perishable securities instead of the unshakeable kingdom of God?',
            'How can I practice active thanksgiving before seeing the tangible resolution to my prayers?'
          ]
        }
      };

      storageService.saveSermon(newMockSermon);

      // Update User profile stats
      const user = storageService.getUserProfile();
      user.totalSermonsLogged = (user.totalSermonsLogged || 0) + 1;
      storageService.saveUserProfile(user);

      if (onSermonCreated) {
        onSermonCreated(newMockSermon);
      } else {
        onNavigateToNotebook(newMockSermon.id);
      }
    }
  };

  const recentSermons = sermons.slice(0, 3);
  const activePrayers = prayers.filter(p => !p.isCompleted).slice(0, 3);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400/90 font-heading">
              {userProfile.churchName}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-heading tracking-tight mt-0.5">
            Grace & Peace, {userProfile.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-amber-300 border border-slate-700/80">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            {todayFormatted}
          </span>
        </div>
      </div>

      {/* PROMINENT "START RECORDING SERMON" HERO CARD */}
      <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 ${
        isRecording 
          ? 'border-red-500/80 bg-gradient-to-br from-[#2a0d18] via-[#1a0812] to-[#070b1a] shadow-2xl shadow-red-900/40' 
          : 'border-amber-500/40 bg-gradient-to-br from-[#152454] via-[#0e193c] to-[#070b1a] shadow-2xl shadow-black/50'
      } p-6 md:p-8 text-slate-100 group`}>
        
        {/* Luminous Ambient Background Elements */}
        {isRecording ? (
          <>
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-red-600/25 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" />
          </>
        ) : (
          <>
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl group-hover:bg-amber-500/30 transition-all duration-700" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
          </>
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="max-w-xl space-y-2.5">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border transition-colors ${
              isRecording
                ? 'bg-red-500/25 text-red-300 border-red-500/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isRecording ? 'bg-red-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isRecording ? 'bg-red-500' : 'bg-amber-500'
                }`}></span>
              </span>
              <span>{isRecording ? 'Live Recording Active' : 'Live Sanctuary Companion'}</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-amber-100 font-heading leading-tight tracking-wide">
              {isRecording ? 'Capturing Sanctuary Sermon...' : 'Document Today’s Sermon'}
            </h2>

            <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
              {isRecording ? (
                <>
                  Audio stream is actively recording with live timer. Click the button below to stop recording and generate your structured <strong className="text-amber-300">AI Notebook</strong> notes!
                </>
              ) : (
                <>
                  Capture audio frequencies, auto-log service dates, and let our theological AI distill the{' '}
                  <strong className="text-amber-300">Core Message</strong>,{' '}
                  <strong className="text-amber-300">Key Takeaways</strong>,{' '}
                  <strong className="text-amber-300">Scriptures Cited</strong>, and{' '}
                  <strong className="text-amber-300">Life Applications</strong>.
                </>
              )}
            </p>

            {/* Live Visual Waveform when recording */}
            {isRecording && (
              <div className="pt-2 flex items-center gap-1.5 h-7">
                {[14, 28, 42, 20, 56, 32, 48, 64, 30, 50, 70, 36, 60, 24, 44, 68, 22, 52, 38, 58, 26, 46].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-red-500 to-rose-300 animate-pulse transition-all duration-300"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Prominent Recording Trigger Button */}
          <div className="shrink-0 flex flex-col items-center md:items-end">
            <button
              onClick={handleToggleRecordButton}
              className={`relative inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-4 text-base font-bold transition-all cursor-pointer font-heading active:scale-[0.98] ${
                isRecording
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/50 animate-pulse border border-red-400'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-110'
              }`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-full shadow ${
                isRecording ? 'bg-white text-red-600' : 'bg-slate-950 text-amber-400'
              }`}>
                {isRecording ? <Square className="h-4 w-4 fill-red-600" /> : <Mic className="h-4 w-4" />}
              </div>
              <span className="tracking-wide">
                {isRecording ? `Recording... [${formatTimer(recordSeconds)}] (Stop & Save)` : 'Start Recording Sermon'}
              </span>
            </button>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">
                {isRecording ? 'Click to finish & generate AI Notebook' : 'Instant date logging & waveform animation'}
              </span>
              {!isRecording && (
                <button
                  onClick={onOpenRecording}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  (Or open studio modal)
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* QUICK METRICS & STREAK BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Streak Tile */}
        <div 
          onClick={onNavigateToPrayers}
          className="cursor-pointer rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#101b3d] to-[#0a1128] p-4.5 hover:border-amber-500/45 transition-all shadow-lg flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prayer Streak
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-300 font-mono">
                {userProfile.streakCount}
              </span>
              <span className="text-xs text-slate-300">Consecutive Days</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="h-6 w-6 fill-amber-400" />
          </div>
        </div>

        {/* Sermons Documented Tile */}
        <div 
          onClick={() => onNavigateToNotebook()}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-[#091129] p-4.5 hover:border-amber-500/30 transition-all shadow-lg flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sermons Documented
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-200 font-mono">
                {sermons.length}
              </span>
              <span className="text-xs text-slate-300">Structured Notes</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        {/* Answered Prayers Tile */}
        <div 
          onClick={onNavigateToPrayers}
          className="cursor-pointer rounded-2xl border border-slate-800 bg-[#091129] p-4.5 hover:border-amber-500/30 transition-all shadow-lg flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prayers Answered
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {prayers.filter(p => p.isCompleted).length}
              </span>
              <span className="text-xs text-slate-300">Praise Reports</span>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* SANCTUARY PRO UPGRADE CALLOUT (PAYSTACK GHS MOBILE MONEY) */}
      {userProfile.subscriptionStatus !== 'active' && onOpenUpgrade && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#121c3d] via-[#0e1633] to-[#080d22] p-4.5 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-200 font-heading">
                  Upgrade to Sanctuary Pro
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  GHS 49/mo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pay via <strong>Ghana Mobile Money (MTN MoMo, Telecel, AirtelTigo)</strong> using Paystack. Unlimited sermon AI & live cloud sync.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenUpgrade}
            className="self-start sm:self-center shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upgrade Now</span>
          </button>
        </div>
      )}

      {/* VERSE OF THE DAY SECTION */}
      <div>
        <VerseOfTheDayCard
          onAddToPrayer={onOpenAddPrayerWithVerse}
          onSelectForSermon={ref => {
            onNavigateToNotebook();
          }}
        />
      </div>

      {/* TWO COLUMN SUMMARY: RECENT SERMONS & ACTIVE PRAYERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Sermons Shelf */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-200 font-heading flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              Recent AI Sermon Notebooks
            </h2>
            <button
              onClick={() => onNavigateToNotebook()}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All ({sermons.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentSermons.map(sermon => (
              <div
                key={sermon.id}
                onClick={() => onNavigateToNotebook(sermon.id)}
                className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#0a122e]/80 p-4 hover:border-amber-500/40 hover:bg-[#0f1b3d] transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">
                      {sermon.series ? `Series: ${sermon.series}` : sermon.church}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-200 transition-colors font-heading mt-0.5">
                      {sermon.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700 shrink-0">
                    {sermon.durationMinutes} min
                  </span>
                </div>

                <p className="text-xs text-slate-300/90 line-clamp-2 mt-2 font-serif italic">
                  “{sermon.structuredNotes.coreMessage}”
                </p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span className="flex items-center gap-1 text-amber-300">
                    <User className="h-3 w-3" />
                    {sermon.speaker}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(sermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Prayer Requests Shelf */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-200 font-heading flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-amber-400" />
              Active Prayer Petitions
            </h2>
            <button
              onClick={onNavigateToPrayers}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Manage List</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activePrayers.map(prayer => (
              <div
                key={prayer.id}
                onClick={onNavigateToPrayers}
                className="cursor-pointer rounded-2xl border border-slate-800 bg-[#091129] p-4 hover:border-amber-500/30 transition-all shadow-md"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-slate-700">
                    {prayer.category}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Prayed {prayer.prayCount || 1}x
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-200 font-heading line-clamp-1">
                  {prayer.title}
                </h3>
                {prayer.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {prayer.description}
                  </p>
                )}
              </div>
            ))}

            <button
              onClick={onNavigateToPrayers}
              className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-xs font-semibold text-slate-400 hover:text-amber-300 hover:border-amber-500/40 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add or View More Prayers</span>
            </button>
          </div>
        </div>

      </div>

      {/* Minimalist Sanctuary Legal Footer */}
      <Footer
        onOpenLegal={(type) => {
          setLegalDocType(type);
          setIsLegalModalOpen(true);
        }}
      />

      {/* Full Legal Modal Overlay */}
      <LegalModal
        isOpen={isLegalModalOpen}
        initialDoc={legalDocType}
        onClose={() => setIsLegalModalOpen(false)}
      />

    </div>
  );
};
