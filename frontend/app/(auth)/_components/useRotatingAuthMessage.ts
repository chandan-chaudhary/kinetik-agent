"use client";

import { useEffect, useState } from "react";
import { AUTH_ROTATING_MESSAGES } from "./auth-theme-data";

export function useRotatingAuthMessage(intervalMs = 3200) {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIndex(
        (prev) => (prev + 1) % AUTH_ROTATING_MESSAGES.length,
      );
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return activeMessageIndex;
}
