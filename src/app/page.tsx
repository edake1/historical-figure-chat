"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import { AnimatedGrid } from "@/components/effects/BackgroundEffects";
import { Confetti } from "@/components/effects/Confetti";
import { CharacterEntrance } from "@/components/effects/CharacterEntrance";
import { Toast } from "@/components/effects/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { ChatScreen } from "@/components/screens/ChatScreen";

export default function HistoricalChatPage() {
  const { isDark, loadFromStorage: loadSettings } = useSettingsStore();
  const {
    isChatStarted,
    showConfetti,
    showEntrance,
    toast,
    setShowConfetti,
    setShowEntrance,
    hideToast,
    loadFromStorage: loadChat,
  } = useChatStore();

  // Hydrate stores from localStorage on mount
  useEffect(() => {
    loadSettings();
    loadChat();
  }, [loadSettings, loadChat]);

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-hidden transition-colors duration-500",
        isDark
          ? "bg-slate-950 text-white"
          : "bg-gradient-to-br from-amber-50 via-white to-orange-50 text-slate-900"
      )}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={cn(
            "absolute inset-0",
            isDark
              ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
              : "bg-gradient-to-br from-amber-50 via-white to-orange-50"
          )}
        />

        <motion.div
          className={cn(
            "absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full",
            isDark ? "opacity-100" : "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle, ${
              isDark
                ? "rgba(251, 191, 36, 0.08)"
                : "rgba(251, 191, 36, 0.15)"
            }, transparent 60%)`,
            filter: "blur(40px)",
          }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={cn(
            "absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full",
            isDark ? "opacity-100" : "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle, ${
              isDark
                ? "rgba(245, 158, 11, 0.06)"
                : "rgba(245, 158, 11, 0.12)"
            }, transparent 60%)`,
            filter: "blur(40px)",
          }}
          animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <AnimatedGrid isDark={isDark} />

      <Confetti
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      <AnimatePresence>
        {showEntrance && (
          <CharacterEntrance
            figure={showEntrance}
            onComplete={() => setShowEntrance(null)}
          />
        )}
      </AnimatePresence>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={hideToast}
      />

      <Header />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!isChatStarted ? <SetupScreen /> : <ChatScreen />}
        </AnimatePresence>
      </main>

      <Footer />

      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
