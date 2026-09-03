import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  isPaused?: boolean;
  barCount?: number;
  height?: number;
  color?: 'gold' | 'blue' | 'white';
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  isPaused = false,
  barCount = 36,
  height = 72,
  color = 'gold',
}) => {
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 15)
  );

  useEffect(() => {
    if (!isRecording || isPaused) {
      setFrequencies(Array.from({ length: barCount }, () => 12));
      return;
    }

    const interval = setInterval(() => {
      setFrequencies(prev =>
        prev.map((_, i) => {
          // Create an organic wave shape with higher energy in the center
          const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          const baseHeight = 15 + centerFactor * 25;
          const noise = (Math.sin(Date.now() / 180 + i * 0.4) + 1) * 22 * (0.4 + centerFactor * 0.6);
          const randomSpike = Math.random() > 0.7 ? Math.random() * 28 : 0;
          return Math.min(height, Math.max(10, baseHeight + noise + randomSpike));
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, barCount, height]);

  const getColorClasses = (index: number) => {
    if (!isRecording) return 'bg-slate-700/60';
    if (isPaused) return 'bg-amber-800/40';

    if (color === 'gold') {
      const isCenter = Math.abs(index - barCount / 2) < barCount / 4;
      return isCenter
        ? 'bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
        : 'bg-gradient-to-t from-amber-700/80 via-amber-500/70 to-amber-300/80';
    }
    return 'bg-gradient-to-t from-blue-600 to-indigo-300';
  };

  return (
    <div
      className="flex items-center justify-center gap-[3px] w-full px-2 py-4 select-none overflow-hidden"
      style={{ height: `${height + 16}px` }}
      aria-label="Audio waveform visualizer"
    >
      {frequencies.map((freq, idx) => (
        <div
          key={idx}
          className={`w-[4px] rounded-full transition-all duration-100 ease-out ${getColorClasses(
            idx
          )}`}
          style={{
            height: `${freq}px`,
            opacity: isPaused ? 0.4 : isRecording ? 0.95 : 0.25,
          }}
        />
      ))}
    </div>
  );
};
