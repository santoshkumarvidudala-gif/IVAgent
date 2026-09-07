import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  speaker: 'agent' | 'receptionist' | 'idle';
  colorClass?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  speaker,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const barCount = 32;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isActive) {
          const freq = (i / barCount) * Math.PI * 4;
          const dynamic = Math.sin(freq + phase) * Math.cos(phase * 0.8 + i * 0.2);
          const amp = speaker === 'agent' ? 24 : 18;
          barHeight = Math.max(4, Math.abs(dynamic) * amp + 6);
        }

        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        let fillStyle = '#27272A'; // Dark zinc
        if (isActive) {
          if (speaker === 'agent') {
            fillStyle = '#6366F1'; // Indigo 500
          } else if (speaker === 'receptionist') {
            fillStyle = '#38BDF8'; // Sky 400
          }
        }

        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      phase += isActive ? 0.18 : 0.03;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, speaker]);

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={320}
        height={56}
        className="w-full max-w-[320px] h-14"
      />
      <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400 mt-2 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isActive
              ? speaker === 'agent'
                ? 'bg-indigo-500 shadow-[0_0_8px_#6366F1] animate-pulse'
                : 'bg-sky-400 shadow-[0_0_8px_#38BDF8] animate-pulse'
              : 'bg-zinc-700'
          }`}
        />
        {isActive ? (
          <span className={speaker === 'agent' ? 'text-indigo-400' : 'text-sky-300'}>
            {speaker === 'agent' ? 'Voice Agent Transmitting' : 'Receptionist Speaking'}
          </span>
        ) : (
          <span className="text-zinc-500">Audio Line Standby</span>
        )}
      </div>
    </div>
  );
};
