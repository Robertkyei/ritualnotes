import React, { useState } from 'react';
import { X, HeartHandshake, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { PrayerCategory, PrayerPriority, PrayerItem } from '../types';

interface AddPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePrayer: (prayerData: Omit<PrayerItem, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'prayCount'>) => void;
  initialScripture?: string;
  initialText?: string;
}

const CATEGORIES: PrayerCategory[] = [
  'General',
  'Family',
  'Health',
  'Spiritual Growth',
  'Church & Mission',
  'Gratitude',
  'Guidance',
  'Relationships',
];

export const AddPrayerModal: React.FC<AddPrayerModalProps> = ({
  isOpen,
  onClose,
  onSavePrayer,
  initialScripture = '',
  initialText = '',
}) => {
  const [title, setTitle] = useState(initialText ? `Meditation on ${initialScripture || 'Scripture'}` : '');
  const [description, setDescription] = useState(initialText || '');
  const [category, setCategory] = useState<PrayerCategory>('General');
  const [priority, setPriority] = useState<PrayerPriority>('regular');
  const [scriptureAnchor, setScriptureAnchor] = useState(initialScripture);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSavePrayer({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      scriptureAnchor: scriptureAnchor.trim() || undefined,
      isFavorite,
    });

    setTitle('');
    setDescription('');
    setScriptureAnchor('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0e1738] via-[#091129] to-[#070b1c] p-5 md:p-6 text-slate-100 shadow-2xl shadow-black overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HeartHandshake className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200 font-heading">Add Personal Prayer Request</h2>
              <p className="text-[11px] text-slate-400">Bring your petitions, intercessions, and praises before God</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-300/90 mb-1">
              Prayer Title / Focus *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Wisdom in Family Decision, Healing for Friend"
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Prayer Details & Specific Requests
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Pour out your heart with specific requests, people, circumstances, and hopes..."
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PrayerCategory)}
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority / Urgency
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as PrayerPriority)}
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
              >
                <option value="regular">Regular Petition</option>
                <option value="urgent">Urgent / Time-Sensitive</option>
                <option value="ongoing">Ongoing / Continuous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              Scripture Anchor / Promise (Optional)
            </label>
            <input
              type="text"
              value={scriptureAnchor}
              onChange={e => setScriptureAnchor(e.target.value)}
              placeholder="e.g. Philippians 4:6, Jeremiah 29:11, Psalm 23"
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={e => setIsFavorite(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-900"
              />
              <span>Mark as Starred Prayer</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110"
              >
                Save Prayer
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
