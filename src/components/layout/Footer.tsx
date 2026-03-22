'use client';

import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings-store';

export function Footer() {
  const { isDark, settings, toggleTimestamps } = useSettingsStore();

  return (
    <footer className={cn(
      "relative border-t backdrop-blur-xl mt-auto",
      isDark 
        ? "border-white/5 bg-slate-950/50"
        : "border-slate-200 bg-white/50"
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-center text-xs">
            <span className="bg-gradient-to-r from-amber-200/50 to-orange-200/50 bg-clip-text text-transparent font-medium">
              Historical Figure Group Chat
            </span>
            <span className={cn("mx-2", isDark ? "text-white/20" : "text-slate-400")}>—</span>
            <span className={isDark ? "text-white/20" : "text-slate-400"}>A 2026 AI Experiment</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTimestamps}
              className={cn(
                "text-xs rounded-full",
                isDark 
                  ? "text-white/30 hover:text-white/50"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Clock className="w-3 h-3 mr-1" />
              {settings.timestampsEnabled ? 'Hide Time' : 'Show Time'}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
