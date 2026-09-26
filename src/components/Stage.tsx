"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

export function Stage({ route, children }: { route: string; children: ReactNode }) {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  return (
    <motion.div
      key={route}
      className="stage"
      initial={live ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
