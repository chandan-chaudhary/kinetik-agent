"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FloatingIconProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const FloatingIcon = ({
  children,
  delay = 0,
  className = "",
}: FloatingIconProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-card rounded-2xl p-4 shadow-float ${className}`}
      style={{
        animation: `float ${4 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </motion.div>
  );
};

export default FloatingIcon;
