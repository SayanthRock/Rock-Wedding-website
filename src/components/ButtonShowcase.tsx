import React, { useState } from "react";
import { LiquidButton, MetalButton } from "@/components/ui/liquid-glass-button";
import { Sparkles, Check, Award, Eye, ShieldAlert, Heart } from "lucide-react";

export default function ButtonShowcase() {
  const [activeMaterial, setActiveMaterial] = useState<"liquid" | "metal">("liquid");
  const [metalVariant, setMetalVariant] = useState<"default" | "primary" | "success" | "error" | "gold" | "bronze">("gold");
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="p-8 md:p-12 glass-morphism rounded-[3.5rem] border border-white/20 shadow-2xl relative overflow-hidden backdrop-blur-3xl space-y-8">
      {/* Decorative Lights */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-stone-300/20 dark:bg-stone-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-[0.3em]">
            <Sparkles className="w-3 h-3 animate-pulse" /> Premium Materials Lab
          </span>
          <h3 className="text-2xl font-bold font-serif italic text-stone-900 dark:text-white">Aesthetic Tactile Control Panel</h3>
          <p className="text-xs text-stone-400 max-w-md">
            Experiment with physical element buttons that use SVG Turbulence Refraction filters and physical 3D state metal transforms.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-stone-100 dark:bg-white/5 p-1 rounded-2xl border border-stone-200 dark:border-white/10 self-center md:self-auto">
          <button
            onClick={() => setActiveMaterial("liquid")}
            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeMaterial === "liquid"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Liquid Glass
          </button>
          <button
            onClick={() => setActiveMaterial("metal")}
            className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
              activeMaterial === "metal"
                ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-400 hover:text-stone-900 dark:hover:text-white"
            }`}
          >
            Liquid Metal
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        {/* Playfield Element */}
        <div className="lg:col-span-7 bg-stone-50 dark:bg-zinc-950/45 border border-stone-200/50 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden shadow-inner">
          
          {activeMaterial === "liquid" ? (
            <div className="space-y-8 py-6 w-full max-w-sm">
              <div className="relative h-28 flex items-center justify-center">
                {/* Simulated Glass Refraction background highlights */}
                <div className="absolute w-48 h-20 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-xl animate-pulse" />
                
                {/* The Liquid Glass Button */}
                <LiquidButton 
                  onClick={() => setClickCount(prev => prev + 1)}
                  className="relative z-10 min-w-[200px]"
                >
                  <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-serif italic text-lg whitespace-nowrap">
                    Liquid Refraction
                  </span>
                </LiquidButton>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                Uses SVG Turbulence & Displacement for organic real-time glass refraction bends
              </p>
            </div>
          ) : (
            <div className="space-y-8 py-4 w-full">
              <div className="flex flex-wrap items-center justify-center gap-6 py-6 min-h-[100px]">
                {/* The 3D Beveled Metal Button */}
                <MetalButton 
                  variant={metalVariant}
                  onClick={() => setClickCount(prev => prev + 1)}
                  className="min-w-[180px]"
                >
                  <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold leading-none font-sans">
                    {metalVariant === "success" && <Check className="w-4 h-4" />}
                    {metalVariant === "error" && <ShieldAlert className="w-4 h-4" />}
                    {metalVariant === "gold" && <Award className="w-4 h-4" />}
                    {metalVariant === "primary" && <Sparkles className="w-4 h-4" />}
                    {metalVariant === "bronze" && <Heart className="w-4 h-4" />}
                    {metalVariant.toUpperCase()} ACTUATOR
                  </span>
                </MetalButton>
              </div>

              {/* Metal finishes Selector */}
              <div className="space-y-3">
                <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Select Metal Finish</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(["default", "primary", "success", "error", "gold", "bronze"] as const).map((finish) => (
                    <button
                      key={finish}
                      onClick={() => setMetalVariant(finish)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${
                        metalVariant === finish
                          ? "bg-stone-905 dark:bg-white text-stone-900 dark:text-stone-950 border-stone-900 dark:border-white shadow-sm"
                          : "bg-white dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {clickCount > 0 && (
            <div className="absolute bottom-4 right-6 text-[10px] font-mono text-stone-400">
              Interaction Counter: {clickCount} cycles
            </div>
          )}
        </div>

        {/* Technical Specification Deck & Code block */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="p-6 rounded-[2rem] bg-stone-100 dark:bg-white/5 border border-stone-200/50 dark:border-white/5 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> Physical Metallurgy Info
            </h4>
            
            {activeMaterial === "liquid" ? (
              <ul className="space-y-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Backdrop-Filter Compound:</strong> Backdrop filters connect into <code>container-glass</code> mapping coordinates with scales up to 70.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Chrome Reflection Layer:</strong> 3D internal envelope shadows mimicking organic fluid micro-concave glass transitions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Dynamic Transition:</strong> Elastic scale-on-press and hover effects coordinate with soft blur-composite sweeps.</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-3 text-xs text-stone-500 dark:text-stone-400 font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Polished Outer Bevel:</strong> Dual-layer metallic stroke with distinct border-bottom offsets mapping material properties.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Click Response Mechanism:</strong> Physical scale contraction combined with active 3D translateY down-movement of 2.5px.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  <span><strong>Finish Shines:</strong> Dynamic mouseover highlights paired with touch-screen preventative overrides for seamless tactile feedback.</span>
                </li>
              </ul>
            )}
          </div>

          <div className="p-6 rounded-[2rem] bg-stone-900 border border-white/5 text-stone-300 font-mono text-[10px] space-y-3 shadow-inner">
            <p className="text-stone-400 font-bold border-b border-white/5 pb-2 text-[8px] uppercase tracking-widest text-[#EAD98F]">Import Syntax</p>
            {activeMaterial === "liquid" ? (
              <pre className="text-white/80 overflow-x-auto whitespace-pre leading-relaxed font-mono">
{`import { LiquidButton } from "@/components/ui/liquid-glass-button";

<LiquidButton>
  <span>Liquid Refraction</span>
</LiquidButton>`}
              </pre>
            ) : (
              <pre className="text-white/80 overflow-x-auto whitespace-pre leading-relaxed font-mono">
{`import { MetalButton } from "@/components/ui/liquid-glass-button";

<MetalButton variant="${metalVariant}">
  Authorize Archive
</MetalButton>`}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
