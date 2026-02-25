"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useScrollReveal();
  return <>{children}</>;
}
