import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ message = 'Chargement...' }) => {
  const [dots, setDots] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const dotTimer = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.random() * 8;
      });
    }, 300);
    return () => { clearInterval(dotTimer); clearInterval(progressTimer); };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[500]">
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-red-900/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo animated */}
        <div className="relative">
          <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/40 animate-[pulse_2s_infinite]">
            {/* Sound wave icon */}
            <div className="flex items-end gap-1 h-8">
              {[0.4, 0.7, 1, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  style={{
                    height: `${h * 100}%`,
                    animation: `bounce ${0.6 + i * 0.1}s ${i * 0.08}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Ping rings */}
          <div className="absolute inset-0 rounded-2xl bg-red-600/20 animate-ping" />
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl font-black italic tracking-tight text-white mb-1">
            MOOZIK
          </h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">
            {message}{'.'.repeat(dots)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
