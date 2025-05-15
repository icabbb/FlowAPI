'use client';

import { NoisePatternCard, NoisePatternCardBody } from "@/components/ui/card-with-noise-patter";

export function NoisePatternCardDemo() {
  return (
    <NoisePatternCard>
      <NoisePatternCardBody>
        <h3 className="text-lg font-bold mb-1 dark:text-foreground text-background">
          Noise Texture Pattern
        </h3>
        <p className="text-wrap text-sm dark:text-foreground/60 text-background/60">
          A sophisticated noise pattern created using SVG filters. 
          The organic texture adds depth and visual interest while 
          maintaining a modern, premium feel.
        </p>
      </NoisePatternCardBody>
    </NoisePatternCard>
  )
} 