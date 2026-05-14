import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Mic, BrainCircuit, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    id: 1,
    title: "Habla",
    desc: "Texto o voz, tú decides.",
    icon: Mic,
  },
  {
    id: 2,
    title: "Entiende",
    desc: "IA que capta tu intención.",
    icon: BrainCircuit,
  },
  {
    id: 3,
    title: "Orquesta",
    desc: "Automatiza tus flujos.",
    icon: Zap,
  },
  {
    id: 4,
    title: "Ejecuta",
    desc: "Acción completada.",
    icon: Rocket,
  },
];

export function FlowDiagram({ className }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth spring for the path drawing
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Horizontal translate: move the track from 0% to reveal all 4 panels
  // Each panel is ~100vw, we need to move 3 panels worth to the left
  const translateX = useTransform(smoothProgress, [0.05, 0.95], ["0%", "-75%"]);

  // Progress line width
  const lineWidth = useTransform(smoothProgress, [0.05, 0.92], ["0%", "100%"]);

  // Per-step activation thresholds
  const stepActivation = [
    [0.0, 0.15],
    [0.22, 0.37],
    [0.44, 0.59],
    [0.66, 0.81],
  ];

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ height: "400vh" }}
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center">

        {/* Ambient background glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse, rgba(249,158,2,0.06) 0%, transparent 70%)",
            opacity: useTransform(smoothProgress, [0, 0.1], [0, 1]),
          }}
        />

        {/* ─── Progress line (top) ─── */}
        <div className="relative w-full h-[3px] mb-12 mt-4 z-10">
          {/* Track background */}
          <div className="absolute inset-0 bg-white/[0.04] rounded-full" />
          {/* Drawn line */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: lineWidth,
              background: "linear-gradient(90deg, #f99e02, #ffb640, #f99e02)",
              boxShadow: "0 0 20px rgba(249,158,2,0.4), 0 0 60px rgba(249,158,2,0.15)",
            }}
          />
          {/* Travelling particle on the line */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white z-10"
            style={{
              left: lineWidth,
              boxShadow: "0 0 12px 4px rgba(249,158,2,0.8), 0 0 30px 8px rgba(249,158,2,0.3)",
              opacity: useTransform(smoothProgress, [0.03, 0.08, 0.88, 0.93], [0, 1, 1, 0]),
            }}
          />

          {/* Step markers on the line */}
          {steps.map((step, i) => {
            const markerLeft = `${12.5 + i * 25}%`;
            const [start, end] = stepActivation[i];
            return (
              <motion.div
                key={step.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ left: markerLeft }}
              >
                {/* Outer ring */}
                <motion.div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: useTransform(
                      smoothProgress,
                      [start, end],
                      ["rgba(255,255,255,0.1)", "#f99e02"]
                    ),
                    background: useTransform(
                      smoothProgress,
                      [start, end],
                      ["rgba(0,0,0,0.5)", "rgba(249,158,2,0.15)"]
                    ),
                  }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: useTransform(
                        smoothProgress,
                        [start, end],
                        ["rgba(255,255,255,0.15)", "#f99e02"]
                      ),
                    }}
                  />
                </motion.div>
                {/* Step number below marker */}
                <motion.span
                  className="text-[10px] font-bold mt-2 tracking-wider"
                  style={{
                    color: useTransform(
                      smoothProgress,
                      [start, end],
                      ["rgba(255,255,255,0.2)", "#f99e02"]
                    ),
                  }}
                >
                  0{step.id}
                </motion.span>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Horizontal sliding track ─── */}
        <motion.div
          ref={trackRef}
          className="flex w-[400vw] relative z-10"
          style={{ x: translateX }}
        >
          {steps.map((step, i) => {
            const [start, end] = stepActivation[i];
            return (
              <StepPanel
                key={step.id}
                step={step}
                index={i}
                scrollProgress={smoothProgress}
                start={start}
                end={end}
              />
            );
          })}
        </motion.div>

        {/* ─── Scroll indicator ─── */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          style={{
            opacity: useTransform(smoothProgress, [0, 0.08], [1, 0]),
          }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/25 font-medium">
            Scroll para explorar
          </span>
          <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1">
            <motion.div
              className="w-1 h-1 bg-[#f99e02] rounded-full"
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Individual Step Panel ─── */
function StepPanel({ step, index, scrollProgress, start, end }) {
  const opacity = useTransform(scrollProgress, [start, end - 0.03, end], [0, 0.5, 1]);
  const scale = useTransform(scrollProgress, [start, end], [0.85, 1]);
  const y = useTransform(scrollProgress, [start, end], [40, 0]);

  // Icon container animation
  const iconRotate = useTransform(scrollProgress, [start, end], [-10, 0]);
  const iconScale = useTransform(scrollProgress, [start, end], [0.6, 1]);

  // Glow behind card
  const glowOpacity = useTransform(scrollProgress, [start, end, end + 0.05], [0, 0, 0.6]);

  return (
    <div className="w-[100vw] flex items-center justify-center px-8 md:px-16">
      <motion.div
        className="relative max-w-lg w-full"
        style={{ opacity, scale, y }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute -inset-8 rounded-3xl pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, rgba(249,158,2,0.08) 0%, transparent 70%)`,
            opacity: glowOpacity,
          }}
        />

        {/* Card */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 md:p-12 overflow-hidden group hover:border-[#f99e02]/30 transition-colors duration-500">

          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#f99e02]/0 via-transparent to-[#f99e02]/0 group-hover:from-[#f99e02]/[0.03] group-hover:to-[#f99e02]/[0.01] transition-all duration-700 pointer-events-none" />

          {/* Step number watermark */}
          <div className="absolute top-4 right-6 text-[120px] font-black text-white/[0.02] leading-none select-none pointer-events-none">
            {step.id}
          </div>

          {/* Icon */}
          <motion.div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 relative"
            style={{
              background: "linear-gradient(135deg, rgba(249,158,2,0.15), rgba(249,158,2,0.05))",
              border: "1px solid rgba(249,158,2,0.25)",
              rotate: iconRotate,
              scale: iconScale,
            }}
          >
            {/* Animated ring around icon */}
            <motion.div
              className="absolute inset-[-4px] rounded-2xl border border-[#f99e02]/20"
              style={{
                opacity: useTransform(scrollProgress, [end, end + 0.03], [0, 1]),
              }}
            />
            <step.icon className="w-8 h-8 md:w-10 md:h-10 text-[#f99e02]" strokeWidth={1.5} />
          </motion.div>

          {/* Step label */}
          <motion.div
            className="flex items-center gap-3 mb-3"
            style={{
              opacity: useTransform(scrollProgress, [start + 0.02, end], [0, 1]),
            }}
          >
            <span className="text-[#f99e02]/60 text-sm font-mono font-bold tracking-widest">
              PASO {String(step.id).padStart(2, '0')}
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-[#f99e02]/20 to-transparent" />
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight"
            style={{
              opacity: useTransform(scrollProgress, [start + 0.03, end], [0, 1]),
              x: useTransform(scrollProgress, [start + 0.03, end], [20, 0]),
            }}
          >
            {step.title}
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-base md:text-lg text-white/50 leading-relaxed max-w-sm"
            style={{
              opacity: useTransform(scrollProgress, [start + 0.05, end + 0.02], [0, 1]),
              x: useTransform(scrollProgress, [start + 0.05, end + 0.02], [15, 0]),
            }}
          >
            {step.desc}
          </motion.p>

          {/* Decorative corner accent */}
          <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none">
            <div className="absolute bottom-4 right-4 w-8 h-px bg-gradient-to-l from-[#f99e02]/30 to-transparent" />
            <div className="absolute bottom-4 right-4 w-px h-8 bg-gradient-to-t from-[#f99e02]/30 to-transparent" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
