"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import AuthMarketingPanel from "./AuthMarketingPanel";

type AuthPageShellProps = {
  children: ReactNode;
  activeMessageIndex: number;
};

export default function AuthPageShell({
  children,
  activeMessageIndex,
}: AuthPageShellProps) {
  return (
    <div className="gradient-hero relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-100px] h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto grid min-h-screen w-full grid-cols-1 lg:grid-cols-2"
      >
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12"
        >
          {children}
        </motion.section>

        <AuthMarketingPanel activeMessageIndex={activeMessageIndex} />
      </motion.div>
    </div>
  );
}
