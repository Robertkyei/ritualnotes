import React, { useState } from 'react';
import { 
  BookOpen, Sparkles, CheckCircle2, Circle, Copy, Check, Plus, 
  Share2, Calendar, Church, User, ChevronRight, Tag, Bookmark, 
  Heart, Download, Printer, Search, Filter, MessageSquare, ArrowLeft, RefreshCw, Database
} from 'lucide-react';
import { SermonLog, LifeApplicationItem } from '../types';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabase';

interface AINotebookViewProps {
  sermons: SermonLog[];
  selectedSermonId?: string;
  onSelectSermon: (id: string) => void;
  onUpdateSermon: (sermon: SermonLog) => void;
  onOpenRecording: () => void;
  onRefreshLive?: (silent?: boolean) => Promise<void>;
  isSyncing?: boolean;
}

export const AINotebookView: React.FC<AINotebookViewProps> = ({
  sermons,
  selectedSermonId,
  onSelectSermon,
  onUpdateSermon,
  onOpenRecording,
  onRefreshLive,
  isSyncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [newAppTask, setNewAppTask] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('Personal Devotion');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);

  // Active sermon selection
  const currentSermon = sermons.find(s => s.id === selectedSermonId) || sermons[0];

  // Filtered sermons for the sidebar / switcher
  const allTags = ['All', ...Array.from(new Set(sermons.flatMap(s => s.tags || [])))];

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.series && s.series.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.structuredNotes.coreMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'All' || s.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleToggleApplication = (appId: string) => {
    if (!currentSermon) return;
    const updatedSermons = storageService.toggleLifeApplication(currentSermon.id, appId);
    const updated = updatedSermons.find(s => s.id === currentSermon.id);
    if (updated) onUpdateSermon(updated);
  };

  const handleAddCustomApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppTask.trim() || !currentSermon) return;

    const updatedSermons = storageService.addLifeApplicationItem(
      currentSermon.id,
      newAppTask.trim(),
      newAppCategory
    );
    const updated = updatedSermons.find(s => s.id === currentSermon.id);
    if (updated) onUpdateSermon(updated);

    setNewAppTask('');
    setShowAddApplication(false);
  };

  const handleToggleFavorite = () => {
    if (!currentSermon) return;
    const updatedList = storageService.toggleSermonFavorite(currentSermon.id);
    const updated = updatedList.find(s => s.id === currentSermon.id);
    if (updated) onUpdateSermon(updated);
  };

  const handleCopySection = async (sectionName: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionName);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleRegenerateBreakdown = async () => {
    if (!currentSermon) return;
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/sermon/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentSermon.title,
          speaker: currentSermon.speaker,
          church: currentSermon.church,
          series: currentSermon.series,
          notesOrTranscript: currentSermon.rawNotes || currentSermon.structuredNotes.coreMessage,
        }),
      });

      const res = await response.json();
      if (res.data) {
        const updated: SermonLog = {
          ...currentSermon,
          structuredNotes: {
            coreMessage: res.data.coreMessage || currentSermon.structuredNotes.coreMessage,
            keyTakeaways: res.data.keyTakeaways || currentSermon.structuredNotes.keyTakeaways,
            scripturesCited: res.data.scripturesCited || currentSermon.structuredNotes.scripturesCited,
            lifeApplications: res.data.lifeApplications?.map((app: any, idx: number) => ({
              id: `app-regen-${Date.now()}-${idx}`,
              task: typeof app === 'string' ? app : app.task,
              category: typeof app === 'object' && app.category ? app.category : 'Action Step',
              isCompleted: false,
              targetTimeline: typeof app === 'object' && app.targetTimeline ? app.targetTimeline : 'This Week',
            })) || currentSermon.structuredNotes.lifeApplications,
            reflectionQuestions: res.data.reflectionQuestions || currentSermon.structuredNotes.reflectionQuestions,
          },
        };
        storageService.saveSermon(updated);
        onUpdateSermon(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const completedAppsCount = currentSermon?.structuredNotes.lifeApplications.filter(a => a.isCompleted).length || 0;
  const totalAppsCount = currentSermon?.structuredNotes.lifeApplications.length || 0;
  const progressPercent = totalAppsCount > 0 ? Math.round((completedAppsCount / totalAppsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-amber-200 font-heading">
              AI Sermon Notebook
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Theological distillations, key biblical takeaways, scriptures cited, and practical life applications.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {supabaseService.isConfigured() ? (
            <button
              onClick={() => onRefreshLive && onRefreshLive(false)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 transition-all shadow-sm"
              title="Live connected to Supabase table 'sermons'. Click to sync."
            >
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Supabase Live:</span>
              <span className="font-semibold text-emerald-200">sermons</span>
              <RefreshCw className={`h-3 w-3 ml-0.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-850 border border-slate-700/60 px-3 py-1.5 text-[11px] font-medium text-slate-400">
              <Database className="h-3 w-3 text-slate-500" />
              <span>Local Storage Mode</span>
            </div>
          )}

          <button
            onClick={() => setShowMobileList(!showMobileList)}
            className="md:hidden flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-amber-300 border border-slate-700"
          >
            <BookOpen className="h-4 w-4" />
            <span>Switch Sermon ({sermons.length})</span>
          </button>

          <button
            onClick={onOpenRecording}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-4 py-2 text-xs md:text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Sermon</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Sidebar on Desktop, Full view on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sermon Selector Sidebar / Drawer */}
        <div className={`lg:col-span-4 space-y-4 ${showMobileList ? 'block' : 'hidden lg:block'}`}>
          <div className="rounded-2xl border border-slate-800 bg-[#091129]/90 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-300 font-heading flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                Documented Sermons ({filteredSermons.length})
              </h2>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topic, preacher, series..."
                className="w-full rounded-lg bg-slate-900/90 border border-slate-700/70 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
              {allTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all ${
                    selectedTag === tag
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-amber-200 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sermons List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredSermons.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No sermons found matching your search.
                </div>
              ) : (
                filteredSermons.map(sermon => {
                  const isSelected = currentSermon?.id === sermon.id;
                  const dateStr = new Date(sermon.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={sermon.id}
                      onClick={() => {
                        onSelectSermon(sermon.id);
                        setShowMobileList(false);
                      }}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        isSelected
                          ? 'border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-[#132047] to-[#0d1633] shadow-md'
                          : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-xs font-semibold line-clamp-2 ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                          {sermon.title}
                        </h3>
                        {sermon.isFavorite && (
                          <Heart className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <User className="h-3 w-3 text-amber-400/80" />
                        <span className="truncate">{sermon.speaker}</span>
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {dateStr}
                        </span>
                        <span className="text-amber-400/90 font-medium">
                          {sermon.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Selected Sermon AI Structured View */}
        <div className="lg:col-span-8 space-y-6">
          {currentSermon ? (
            <div className="space-y-6">
              
              {/* Top Sermon Identity Banner */}
              <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#111e42] via-[#0d1736] to-[#080f24] p-5 md:p-6 shadow-xl relative overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/15 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                      <Calendar className="h-3 w-3" />
                      {new Date(currentSermon.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {currentSermon.series && (
                      <span className="inline-flex items-center rounded-full bg-blue-950/80 px-3 py-1 text-xs font-medium text-amber-200/90 border border-amber-500/20">
                        Series: {currentSermon.series}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleRegenerateBreakdown}
                      disabled={isRegenerating}
                      title="Re-analyze sermon breakdown with AI"
                      className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:text-amber-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin text-amber-400' : ''}`} />
                      <span className="hidden sm:inline">{isRegenerating ? 'Analyzing...' : 'AI Refresh'}</span>
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      className={`rounded-lg p-2 transition-colors ${
                        currentSermon.isFavorite
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${currentSermon.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-heading tracking-wide">
                    {currentSermon.title}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <User className="h-3.5 w-3.5" />
                      {currentSermon.speaker}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Church className="h-3.5 w-3.5" />
                      {currentSermon.church}
                    </span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">
                      Duration: <strong className="text-amber-300">{currentSermon.durationMinutes} minutes</strong>
                    </span>
                  </div>
                </div>

                {/* Application Progress Bar */}
                <div className="mt-5 rounded-xl bg-slate-900/80 border border-slate-800 p-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                      Life Application Checklist Progress
                    </span>
                    <span className="text-slate-300 font-medium">
                      {completedAppsCount} of {totalAppsCount} applied ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 1. CORE MESSAGE */}
              <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#121f47] via-[#0d1636] to-[#0a1129] p-5 md:p-6 shadow-lg shadow-black/30">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-heading">
                      1. Core Message
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopySection('core', currentSermon.structuredNotes.coreMessage)}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    {copiedSection === 'core' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedSection === 'core' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <blockquote className="border-l-2 border-amber-400/80 pl-4 py-1 italic font-serif text-base md:text-lg leading-relaxed text-slate-100 bg-amber-500/5 rounded-r-xl">
                  “{currentSermon.structuredNotes.coreMessage}”
                </blockquote>
              </section>

              {/* 2. KEY TAKEAWAYS */}
              <section className="rounded-2xl border border-slate-800 bg-[#091129]/95 p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-heading">
                      2. Key Takeaways
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      handleCopySection(
                        'takeaways',
                        currentSermon.structuredNotes.keyTakeaways.map(t => `• ${t}`).join('\n')
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    {copiedSection === 'takeaways' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedSection === 'takeaways' ? 'Copied All' : 'Copy Takeaways'}</span>
                  </button>
                </div>

                <ul className="space-y-3">
                  {currentSermon.structuredNotes.keyTakeaways.map((takeaway, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-xl bg-slate-900/60 border border-slate-800/80 p-3.5 hover:border-amber-500/30 transition-colors"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300 border border-amber-500/40 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <p className="text-xs md:text-sm leading-relaxed text-slate-200">
                        {takeaway}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 3. SCRIPTURES CITED */}
              <section className="rounded-2xl border border-slate-800 bg-[#091129]/95 p-5 md:p-6 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-heading">
                      3. Scriptures Cited ({currentSermon.structuredNotes.scripturesCited.length})
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentSermon.structuredNotes.scripturesCited.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-[#0f1b3b] to-[#0a1128] p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-300 font-heading tracking-wide">
                            {item.reference}
                          </span>
                          <button
                            onClick={() => handleCopySection(`scrip-${idx}`, `"${item.verseText}" — ${item.reference}`)}
                            title="Copy verse"
                            className="text-slate-400 hover:text-amber-300"
                          >
                            {copiedSection === `scrip-${idx}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <p className="font-serif text-xs leading-relaxed text-slate-200 italic mb-2.5">
                          {item.verseText}
                        </p>
                      </div>

                      {item.contextNote && (
                        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <strong className="text-amber-400/90 font-medium">Context: </strong>
                          {item.contextNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. LIFE APPLICATIONS CHECKLIST */}
              <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0d1633] via-[#091129] to-[#070b1c] p-5 md:p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 font-heading">
                      4. Life Applications Checklist
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowAddApplication(!showAddApplication)}
                    className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Action Item</span>
                  </button>
                </div>

                {/* Add Item Form Drawer */}
                {showAddApplication && (
                  <form
                    onSubmit={handleAddCustomApplication}
                    className="mb-4 rounded-xl border border-amber-500/30 bg-slate-900/90 p-3.5 space-y-2 animate-in fade-in"
                  >
                    <h4 className="text-xs font-semibold text-amber-300">Add Personal Life Application</h4>
                    <input
                      type="text"
                      value={newAppTask}
                      onChange={e => setNewAppTask(e.target.value)}
                      placeholder="e.g. Schedule 15 minutes of silent prayer on Thursday..."
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={newAppCategory}
                        onChange={e => setNewAppCategory(e.target.value)}
                        className="rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="Personal Devotion">Personal Devotion</option>
                        <option value="Family & Home">Family & Home</option>
                        <option value="Community & Service">Community & Service</option>
                        <option value="Workplace Witness">Workplace Witness</option>
                        <option value="Spiritual Disciplines">Spiritual Disciplines</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddApplication(false)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                        >
                          Save Action
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Checkable List */}
                <div className="space-y-2.5">
                  {currentSermon.structuredNotes.lifeApplications.map(app => (
                    <div
                      key={app.id}
                      onClick={() => handleToggleApplication(app.id)}
                      className={`group cursor-pointer flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                        app.isCompleted
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-slate-300'
                          : 'border-slate-800 bg-slate-900/70 hover:border-amber-500/40 text-slate-100'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-400"
                      >
                        {app.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-500" />
                        )}
                      </button>

                      <div className="flex-1">
                        <p
                          className={`text-xs md:text-sm font-medium leading-relaxed ${
                            app.isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {app.task}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-amber-300/90 border border-slate-700">
                            {app.category}
                          </span>
                          {app.targetTimeline && (
                            <span className="text-slate-400">
                              Timeline: {app.targetTimeline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reflection Questions for Discussion */}
              {currentSermon.structuredNotes.reflectionQuestions && (
                <section className="rounded-2xl border border-slate-800 bg-[#091129]/80 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-heading mb-3 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                    Meditation & Small Group Questions
                  </h3>
                  <div className="space-y-2">
                    {currentSermon.structuredNotes.reflectionQuestions.map((q, idx) => (
                      <p key={idx} className="text-xs text-slate-300 bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                        <strong className="text-amber-400 mr-1.5">Q{idx + 1}:</strong> {q}
                      </p>
                    ))}
                  </div>
                </section>
              )}

            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-[#091129] p-12 text-center">
              <BookOpen className="h-10 w-10 text-amber-400/50 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200 font-heading">No Sermons Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Start recording a sermon or choose an existing message from the sidebar to view its structured breakdown.
              </p>
              <button
                onClick={onOpenRecording}
                className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
              >
                Record Sermon Now
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
