import React, { useState } from 'react';
import { BookOpen, Sparkles, Copy, Check, Volume2, Share2, Heart, RefreshCw } from 'lucide-react';
import { VerseOfTheDay } from '../types';
import { VERSES_COLLECTION } from '../data/initialData';

interface VerseOfTheDayCardProps {
  onAddToPrayer?: (verseText: string, reference: string) => void;
  onSelectForSermon?: (reference: string) => void;
}

export const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({
  onAddToPrayer,
  onSelectForSermon,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAiReflection, setShowAiReflection] = useState(false);
  const [aiCustomReflection, setAiCustomReflection] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const verse = VERSES_COLLECTION[currentIndex] || VERSES_COLLECTION[0];

  const handleNextVerse = () => {
    setCurrentIndex(prev => (prev + 1) % VERSES_COLLECTION.length);
    setCopied(false);
    setShowAiReflection(false);
    setAiCustomReflection(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${verse.text}" — ${verse.reference} (${verse.translation})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReciteAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(`${verse.reference}. ${verse.text}`);
      utterance.rate = 0.88;
      utterance.pitch = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleGetAiDevotional = async () => {
    if (aiCustomReflection) {
      setShowAiReflection(!showAiReflection);
      return;
    }

    setLoadingAi(true);
    setShowAiReflection(true);
    try {
      const res = await fetch('/api/verse/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseReference: verse.reference,
          verseText: verse.text,
        }),
      });
      const data = await res.json();
      setAiCustomReflection(data.reflection || verse.devotionalReflection);
    } catch (e) {
      setAiCustomReflection(verse.devotionalReflection);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#111c3e] via-[#0d1633] to-[#090f24] p-5 md:p-6 shadow-xl shadow-black/40">
      {/* Decorative golden ambient radial glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/15 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 font-heading">
              Verse of the Day
            </span>
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-950/80 px-2 py-0.5 text-[10px] font-medium text-amber-200/80 border border-amber-500/20">
              {verse.theme}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNextVerse}
            title="Cycle another verse"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-amber-300 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            title="Bookmark verse"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-400 bg-amber-500/20'
                : 'text-slate-400 hover:bg-white/5 hover:text-amber-300'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scripture Body */}
      <div className="my-4">
        <blockquote className="font-serif-quote text-lg md:text-xl font-normal leading-relaxed text-slate-100 text-balance tracking-wide">
          {verse.text}
        </blockquote>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-amber-400 font-heading">
            — {verse.reference}{' '}
            <span className="text-xs font-normal text-slate-400 font-sans">
              ({verse.translation})
            </span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReciteAudio}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                isPlayingAudio
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/60'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{isPlayingAudio ? 'Listening...' : 'Recite'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/60 transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Devotional Reflection Card */}
      <div className="mt-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-amber-300/80 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Spiritual Reflection
          </span>
          <button
            onClick={handleGetAiDevotional}
            disabled={loadingAi}
            className="text-[11px] font-medium text-amber-400/90 hover:text-amber-300 hover:underline inline-flex items-center gap-1"
          >
            {loadingAi ? 'Reflecting...' : showAiReflection ? 'Hide Deep Insight' : 'Deep Reflection'}
          </button>
        </div>

        <p className="text-xs leading-relaxed text-slate-300/90 font-sans">
          {showAiReflection && aiCustomReflection ? aiCustomReflection : verse.devotionalReflection}
        </p>

        {/* Action Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          {onAddToPrayer && (
            <button
              onClick={() => onAddToPrayer(verse.text, verse.reference)}
              className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all"
            >
              + Turn into Prayer Request
            </button>
          )}
          {onSelectForSermon && (
            <button
              onClick={() => onSelectForSermon(verse.reference)}
              className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Cite in New Sermon Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
