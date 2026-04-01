"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import {
  AUTH_CAPABILITY_TAGS,
  AUTH_ROTATING_MESSAGES,
} from "./auth-theme-data";

type AuthMarketingPanelProps = {
  activeMessageIndex: number;
};

export default function AuthMarketingPanel({
  activeMessageIndex,
}: AuthMarketingPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay: 0.16 }}
      className="gradient-hero relative hidden overflow-hidden border-l border-border/70 lg:block"
    >
      <div className="pointer-events-none absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.86_0.015_264/.45)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.86_0.015_264/.45)_1px,transparent_1px)] bg-size-[48px_48px]" />

      <div className="relative flex h-full flex-col justify-center px-10 xl:px-16">
        <div className="max-w-xl">
          <p className="text-primary mb-4 inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Platform Capabilities
          </p>

          <div className="shadow-float min-h-[140px] rounded-2xl border border-border bg-card/90 p-4 backdrop-blur-sm xl:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMessageIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.32 }}
                className="flex items-center justify-between gap-4"
              >
                <p className="text-lg font-semibold leading-7 text-foreground xl:text-xl">
                  {AUTH_ROTATING_MESSAGES[activeMessageIndex]}
                </p>
                <span className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <ArrowUp className="h-4 w-4" />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {AUTH_CAPABILITY_TAGS.map((label) => (
              <span
                key={label}
                className="text-muted-foreground rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
