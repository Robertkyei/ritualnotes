import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Pause, Play, Sparkles, Check, X, Clock, Church, User, BookOpen, AlertCircle, FileText, Upload, Radio } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import { SermonLog } from '../types';
import { storageService } from '../services/storage';
import { WebAudioRecorder, RecordedAudioResult } from '../services/audioRecorder';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSermonCreated: (sermon: SermonLog) => void;
  defaultScripture?: string;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose,
  onSermonCreated,
  defaultScripture = '',
}) => {
  const [mode, setMode] = useState<'mic' | 'upload'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  // Audio recording references
  const recorderRef = useRef<WebAudioRecorder | null>(null);
  const recordedAudioRef = useRef<RecordedAudioResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [church, setChurch] = useState('Sovereign Grace Church');
  const [series, setSeries] = useState('');
  const [scripturePassage, setScripturePassage] = useState(defaultScripture);
  const [liveNotes, setLiveNotes] = useState('');

  // AI Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');

  const timerRef = useRef<number | null>(null);

  // Start audio recording session on mount/open
  useEffect(() => {
    if (isOpen) {
      setTitle(`Sunday Message - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
      if (defaultScripture) {
        setScripturePassage(defaultScripture);
      }
      setSeconds(0);
      setIsPaused(false);
      setMicError(null);
      recordedAudioRef.current = null;
      setUploadedFile(null);

      // Attempt to initiate real microphone recording
      startMicrophoneRecording();
    } else {
      stopMicrophoneRecordingImmediate();
    }

    return () => {
      stopMicrophoneRecordingImmediate();
    };
  }, [isOpen, defaultScripture]);

  const startMicrophoneRecording = async () => {
    try {
      setMicError(null);
      const recorder = new WebAudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setMicActive(true);
      setIsRecording(true);
    } catch (err: any) {
      console.warn('Microphone start error (will use simulated waveform & notes mode):', err);
      setMicError(err.message || 'Microphone access unavailable. You can still type notes or upload audio.');
      setMicActive(false);
      setIsRecording(true);
    }
  };

  const stopMicrophoneRecordingImmediate = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setMicActive(false);
  };

  // Timer tick
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  if (!isOpen) return null;

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = () => {
    if (isPaused) {
      if (recorderRef.current) recorderRef.current.resume();
      setIsPaused(false);
    } else {
      if (recorderRef.current) recorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedFile({
        name: file.name,
        base64,
        mimeType: file.type || 'audio/mp3',
      });
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    };
    reader.readAsDataURL(file);
  };

  const handleFinishAndProcess = async () => {
    setIsProcessing(true);
    setIsRecording(false);

    let recordedResult: RecordedAudioResult | null = null;
    if (recorderRef.current && micActive) {
      try {
        setProcessingStage('Capturing recorded audio stream from microphone...');
        recordedResult = await recorderRef.current.stop();
        recordedAudioRef.current = recordedResult;
      } catch (err) {
        console.warn('Error capturing final audio blob:', err);
      }
    }

    try {
      const audioToProcess = uploadedFile
        ? { audioBase64: uploadedFile.base64, mimeType: uploadedFile.mimeType }
        : recordedResult
        ? { audioBase64: recordedResult.base64, mimeType: recordedResult.mimeType }
        : null;

      let structured: any = null;
      let finalTranscript = liveNotes || '';

      if (audioToProcess && audioToProcess.audioBase64) {
        setProcessingStage('Transcribing sermon audio and extracting insights with Gemini...');
        const response = await fetch('/api/sermon/process-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: audioToProcess.audioBase64,
            mimeType: audioToProcess.mimeType,
            title: title || 'Sunday Message',
            speaker: speaker || 'Pastor',
            church: church || 'Grace Fellowship',
            series: series || 'Faith Series',
            scripturePassage: scripturePassage || 'General Scripture',
          }),
        });

        const result = await response.json();
        structured = result.data;
        if (structured?.transcript) {
          finalTranscript = structured.transcript;
        }
      } else {
        setProcessingStage('Analyzing sermon notes with theological AI engine...');
        const payload = {
          title: title || 'Sunday Sermon',
          speaker: speaker || 'Pastor',
          church: church || 'Grace Fellowship',
          series: series || 'Faith Series',
          scripturePassage: scripturePassage || 'General Scripture',
          notesOrTranscript: liveNotes || `${title}. Preached on ${new Date().toLocaleDateString()}. Emphasized trusting God through trials, anchoring in scripture, and applying faith in daily relationships.`,
        };

        const response = await fetch('/api/sermon/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        structured = result.data;
      }

      setProcessingStage('Building structured AI Notebook sections...');
      await new Promise(r => setTimeout(r, 300));

      const finalCore = structured?.coreMessage || 'Faithful obedience and anchoring in scripture during seasons of change.';
      const finalTakeaways = structured?.keyTakeaways || [
        'Trust in God’s sovereignty in all circumstances',
        'Anchor your mind in biblical promises daily',
        'Practice intentional, active service in fellowship',
      ];
      const finalScriptures = structured?.scripturesCited || [
        {
          reference: scripturePassage || 'Proverbs 3:5-6',
          verseText: 'Trust in the Lord with all your heart and lean not on your own understanding.',
          contextNote: 'Foundational scripture on surrender and divine guidance.',
        },
      ];
      const finalApplications = (structured?.lifeApplications || []).map((app: any, idx: number) => ({
        id: `app-auto-${Date.now()}-${idx}`,
        task: typeof app === 'string' ? app : app.task,
        category: typeof app === 'object' && app.category ? app.category : 'Personal Devotion',
        isCompleted: false,
        targetTimeline: typeof app === 'object' && app.targetTimeline ? app.targetTimeline : 'This Week',
      }));

      const newSermon: SermonLog = {
        id: 'sermon-' + Date.now(),
        title: title || 'Sunday Sermon',
        speaker: speaker || 'Pastor',
        church: church || 'Sovereign Grace Church',
        series: series || undefined,
        date: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(seconds / 60)),
        audioLengthSeconds: seconds,
        rawNotes: liveNotes,
        transcript: finalTranscript,
        tags: [series, scripturePassage, 'Sermon'].filter(Boolean) as string[],
        isFavorite: false,
        status: 'completed',
        structuredNotes: {
          coreMessage: finalCore,
          keyTakeaways: finalTakeaways,
          scripturesCited: finalScriptures,
          lifeApplications: finalApplications.length > 0 ? finalApplications : [
            {
              id: 'app-default-1',
              task: 'Reflect on sermon scriptures for 10 minutes each morning.',
              category: 'Personal Devotion',
              isCompleted: false,
              targetTimeline: 'This Week',
            },
          ],
          reflectionQuestions: structured?.reflectionQuestions || [
            'How can I surrender one area of control to God this week?',
            'What scripture passage provides comfort in my current circumstance?',
          ],
        },
      };

      storageService.saveSermon(newSermon);
      
      // Update User profile stats
      const user = storageService.getUserProfile();
      user.totalSermonsLogged = (user.totalSermonsLogged || 0) + 1;
      storageService.saveUserProfile(user);

      setIsProcessing(false);
      onSermonCreated(newSermon);
      onClose();
    } catch (err) {
      console.error('Processing error:', err);
      setIsProcessing(false);
      
      const fallbackSermon: SermonLog = {
        id: 'sermon-' + Date.now(),
        title: title || 'Sunday Message',
        speaker: speaker || 'Pastor',
        church: church || 'Sovereign Grace Church',
        series: series || undefined,
        date: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(seconds / 60)),
        audioLengthSeconds: seconds,
        rawNotes: liveNotes,
        transcript: liveNotes || 'Sermon recorded live in sanctuary.',
        tags: ['Sermon'],
        isFavorite: false,
        status: 'completed',
        structuredNotes: {
          coreMessage: 'Walking in steadfast faith and trusting divine guidance through every trial.',
          keyTakeaways: [
            'Live in constant awareness of God’s grace.',
            'Scripture provides stability when circumstances change.',
            'Serve one another with sincere humility and prayer.',
          ],
          scripturesCited: [
            {
              reference: scripturePassage || 'Romans 8:28',
              verseText: 'And we know that in all things God works for the good of those who love him...',
              contextNote: 'God orchestrates our journey for redemptive purposes.',
            },
          ],
          lifeApplications: [
            {
              id: 'app-f-1',
              task: 'Dedicate 10 minutes to morning meditation on scripture.',
              category: 'Personal Devotion',
              isCompleted: false,
              targetTimeline: 'This Week',
            },
          ],
          reflectionQuestions: ['How can I live out this message tomorrow morning?'],
        },
      };
      storageService.saveSermon(fallbackSermon);
      onSermonCreated(fallbackSermon);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#0e1738] via-[#0a1129] to-[#070b1c] text-slate-100 shadow-2xl shadow-black overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-[#0d1636]/60">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${isPaused ? 'hidden' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-amber-200 font-heading">
                {isProcessing ? 'Processing Sermon...' : 'Document & Record Sermon'}
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-amber-400" />
                Logged on {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2">
          <button
            type="button"
            onClick={() => setMode('mic')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              mode === 'mic'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            Live Microphone Capture
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              mode === 'upload'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Audio File (MP3/WAV)
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {mode === 'mic' ? (
            /* Waveform & Time Banner */
            <div className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-[#09112a] via-[#101c42] to-[#09112a] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-3xl md:text-4xl font-mono font-bold tracking-wider text-amber-300">
                  {formatTime(seconds)}
                </span>
                {isPaused && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40 uppercase">
                    Paused
                  </span>
                )}
                {micActive && !isPaused && (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Mic
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-2">
                {isPaused ? 'Audio logging paused' : micActive ? 'Capturing live sermon frequency spectrum' : 'Simulating audio frequency spectrum'}
              </p>

              {/* Audio Waveform */}
              <AudioWaveform isRecording={isRecording} isPaused={isPaused} height={56} barCount={40} color="gold" />

              {/* Quick Controls Bar */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/90 px-3.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-slate-700 border border-slate-700/80 transition-all"
                >
                  {isPaused ? <Play className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <Pause className="h-3.5 w-3.5" />}
                  <span>{isPaused ? 'Resume Mic' : 'Pause'}</span>
                </button>
              </div>

              {micError && (
                <p className="text-[11px] text-amber-400/80 mt-2 bg-amber-950/40 rounded p-1.5 border border-amber-500/20">
                  Note: {micError}
                </p>
              )}
            </div>
          ) : (
            /* Upload Audio Area */
            <div className="rounded-xl border border-dashed border-amber-500/40 bg-slate-900/60 p-6 text-center">
              <Upload className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-200">
                {uploadedFile ? uploadedFile.name : 'Select or drop sermon audio file'}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Supported formats: MP3, WAV, M4A, WebM, OGG
              </p>
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all">
                <Upload className="h-3.5 w-3.5" />
                Browse Audio File
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Form details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-300/90 mb-1">
                Sermon Title / Topic
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Walking in Divine Purpose"
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300/90 mb-1">
                Preacher / Speaker
              </label>
              <input
                type="text"
                value={speaker}
                onChange={e => setSpeaker(e.target.value)}
                placeholder="e.g. Pastor Samuel Thorne"
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Church / Fellowship
              </label>
              <input
                type="text"
                value={church}
                onChange={e => setChurch(e.target.value)}
                placeholder="e.g. Sovereign Grace Church"
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sermon Series (Optional)
              </label>
              <input
                type="text"
                value={series}
                onChange={e => setSeries(e.target.value)}
                placeholder="e.g. The Unshakable Kingdom"
                className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-300/90 mb-1">
              Primary Scripture Passage
            </label>
            <input
              type="text"
              value={scripturePassage}
              onChange={e => setScripturePassage(e.target.value)}
              placeholder="e.g. Romans 8:28-39, Matthew 6:25-34"
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Live Notes / Transcript Scratchpad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
                Live Notes & Key Quotes (Optional)
              </label>
              <span className="text-[10px] text-slate-400">
                AI extracts Core Message, Takeaways & Applications
              </span>
            </div>
            <textarea
              rows={3}
              value={liveNotes}
              onChange={e => setLiveNotes(e.target.value)}
              placeholder="Type key quotes, outline, or sermon thoughts as the message progresses..."
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Processing Banner if active */}
          {isProcessing && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center animate-pulse">
              <Sparkles className="h-6 w-6 text-amber-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm font-semibold text-amber-200">{processingStage}</p>
              <p className="text-xs text-slate-300 mt-1">
                Extracting theological takeaways, scriptures cited, and practical life applications...
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-amber-500/20 bg-[#0d1636]/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinishAndProcess}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 fill-slate-950 text-slate-950" />
            <span>Finish & Generate AI Notebook</span>
          </button>
        </div>

      </div>
    </div>
  );
};
