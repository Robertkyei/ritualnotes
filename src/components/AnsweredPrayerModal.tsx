import React, { useState } from 'react';
import { X, Sparkles, Trophy, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrayerItem } from '../types';

interface AnsweredPrayerModalProps {
  isOpen: boolean;
  prayer: PrayerItem | null;
  onClose: () => void;
  onConfirmAnswered: (prayerId: string, testimony: string) => void;
}

export const AnsweredPrayerModal: React.FC<AnsweredPrayerModalProps> = ({
  isOpen,
  prayer,
  onClose,
  onConfirmAnswered,
}) => {
  const [testimony, setTestimony] = useState('');

  if (!isOpen || !prayer) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger celebratory gold & blue confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e6be44', '#f3d37a', '#ffffff', '#3b82f6', '#1e40af'],
      });
    } catch {
      // ignore
    }

    onConfirmAnswered(prayer.id, testimony.trim() || 'Praise God for His faithful answer!');
    setTestimony('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/40 bg-gradient-to-b from-[#111e47] via-[#0b1430] to-[#070b1c] p-6 text-slate-100 shadow-2xl shadow-amber-500/10 overflow-hidden">
        
        {/* Glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-500/20 blur-2xl" />

        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-md">
              <Trophy className="h-5 w-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200 font-heading">Celebrate Answered Prayer</h2>
              <p className="text-[11px] text-slate-400">Give glory to God and document this testimony</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3.5 mb-4">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
            Original Prayer Request:
          </span>
          <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{prayer.title}</h3>
          {prayer.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prayer.description}</p>
          )}
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-300/90 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Praise Report / How God Answered
            </label>
            <textarea
              rows={3}
              value={testimony}
              onChange={e => setTestimony(e.target.value)}
              placeholder="Share how God worked, provided, healed, or brought peace into this situation..."
              className="w-full rounded-lg bg-slate-950/90 border border-amber-500/30 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              <span>Mark Answered & Add to Praise Wall</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
