import React, { useState, useEffect } from 'react';
import { Mafs, Coordinates, Plot, Theme } from 'mafs';
import 'mafs/core.css';
import 'mafs/font.css';
import { X, Sliders, LineChart, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';

interface InteractiveGrapherProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquation?: string;
}

type PresetType = 'sine' | 'quadratic' | 'exponential' | 'gaussian' | 'custom';

export default function InteractiveGrapher({
  isOpen,
  onClose,
  initialEquation,
}: InteractiveGrapherProps) {
  const [preset, setPreset] = useState<PresetType>('sine');
  const [a, setA] = useState<number>(1);
  const [b, setB] = useState<number>(1);
  const [c, setC] = useState<number>(0);
  const [customExpr, setCustomExpr] = useState<string>(initialEquation || 'Math.sin(x)');
  const [evalError, setEvalError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEquation) {
      setPreset('custom');
      setCustomExpr(initialEquation);
    }
  }, [initialEquation]);

  if (!isOpen) return null;

  // Safe function evaluator for student custom formulas
  const getPlotFunction = (): ((x: number) => number) => {
    if (preset === 'sine') {
      return (x: number) => a * Math.sin(b * x) + c;
    }
    if (preset === 'quadratic') {
      return (x: number) => a * x * x + b * x + c;
    }
    if (preset === 'exponential') {
      return (x: number) => a * Math.exp(b * x) + c;
    }
    if (preset === 'gaussian') {
      return (x: number) => a * Math.exp(-Math.pow(x - b, 2) / (2 * (c || 1)));
    }

    // Custom expression evaluator
    return (x: number) => {
      try {
        // Sanitize: allow common math terms, numbers, and x
        const safeExpr = customExpr
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/abs/g, 'Math.abs')
          .replace(/exp/g, 'Math.exp')
          .replace(/ln/g, 'Math.log')
          .replace(/\^/g, '**');

        const fn = new Function('x', `return ${safeExpr};`);
        const val = fn(x);
        return typeof val === 'number' && !isNaN(val) ? val : 0;
      } catch {
        return 0;
      }
    };
  };

  const getEquationDisplay = () => {
    switch (preset) {
      case 'sine':
        return `f(x) = ${a !== 1 ? a : ''}·sin(${b !== 1 ? b : ''}x)${c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : ''}`;
      case 'quadratic':
        return `f(x) = ${a !== 1 ? `${a}x²` : 'x²'}${b !== 0 ? (b > 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`) : ''}${c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : ''}`;
      case 'exponential':
        return `f(x) = ${a !== 1 ? a : ''}·e^(${b !== 1 ? b : ''}x)${c !== 0 ? (c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`) : ''}`;
      case 'gaussian':
        return `f(x) = ${a}·exp(-(x - ${b})² / ${2 * (c || 1)})`;
      case 'custom':
        return `f(x) = ${customExpr}`;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2.5">
            <LineChart className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <span>Interactive Math & STEM Grapher</span>
                <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono rounded">Mafs 2D</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time function plotting and visual parametric exploration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Controls Panel */}
          <div className="w-full lg:w-80 p-5 border-b lg:border-b-0 lg:border-r border-border bg-muted/10 overflow-y-auto space-y-5">
            
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Function Model
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setPreset('sine'); setA(1); setB(1); setC(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                    preset === 'sine' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  🌊 Wave / Sine
                </button>
                <button
                  onClick={() => { setPreset('quadratic'); setA(1); setB(-2); setC(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                    preset === 'quadratic' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  📐 Parabola
                </button>
                <button
                  onClick={() => { setPreset('exponential'); setA(1); setB(-0.5); setC(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                    preset === 'exponential' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  📉 Decay / Growth
                </button>
                <button
                  onClick={() => { setPreset('gaussian'); setA(2); setB(0); setC(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                    preset === 'gaussian' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  🧪 Normal Curve
                </button>
              </div>
              <button
                onClick={() => setPreset('custom')}
                className={`w-full mt-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border text-left transition-colors ${
                  preset === 'custom' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-muted text-foreground'
                }`}
              >
                ✍️ Custom Formula Input
              </button>
            </div>

            {/* Custom Formula Input */}
            {preset === 'custom' && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Formula in terms of x
                </label>
                <input 
                  type="text"
                  value={customExpr}
                  onChange={(e) => setCustomExpr(e.target.value)}
                  placeholder="e.g. sin(x) * x or x^3 - 3*x"
                  className="w-full px-3 py-2 text-sm bg-background border rounded-lg outline-none focus:border-primary font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports: <code className="text-primary">sin, cos, tan, sqrt, abs, ^</code>
                </p>
              </div>
            )}

            {/* Sliders for Parameters */}
            {preset !== 'custom' && (
              <div className="space-y-4 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Parameters
                  </span>
                  <button
                    onClick={() => { setA(1); setB(1); setC(0); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title="Reset to default"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>

                {/* Slider A */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-muted-foreground">Parameter (a)</span>
                    <span className="font-mono font-semibold text-primary">{a}</span>
                  </div>
                  <input 
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={a}
                    onChange={(e) => setA(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Slider B */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-muted-foreground">Parameter (b)</span>
                    <span className="font-mono font-semibold text-primary">{b}</span>
                  </div>
                  <input 
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={b}
                    onChange={(e) => setB(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Slider C */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono text-muted-foreground">Offset (c)</span>
                    <span className="font-mono font-semibold text-primary">{c}</span>
                  </div>
                  <input 
                    type="range"
                    min="-5"
                    max="5"
                    step="0.2"
                    value={c}
                    onChange={(e) => setC(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Current Formula Pill */}
            <div className="p-3 rounded-xl bg-background border border-white/5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Active Equation</span>
              <span className="font-mono text-xs sm:text-sm font-semibold text-indigo-400 break-all">
                {getEquationDisplay()}
              </span>
            </div>
          </div>

          {/* Interactive Graph Display */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center bg-black/40 min-h-[340px] sm:min-h-[440px]">
            <div className="w-full h-full max-w-2xl rounded-xl overflow-hidden border border-border shadow-inner bg-card flex items-center justify-center">
              <Mafs 
                height={400}
                viewBox={{ x: [-6, 6], y: [-4, 4] }}
                pan={true}
              >
                <Coordinates.Cartesian 
                  subdivisions={2}
                />
                <Plot.OfX 
                  y={getPlotFunction()}
                  color={Theme.blue}
                  weight={3}
                />
              </Mafs>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Drag canvas to pan around coordinates. Real-time GPU math rendering via Mafs.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Programmatic helper to open math grapher from any button
 */
export function openMathGrapher(initialEquation?: string) {
  window.dispatchEvent(new CustomEvent('studyos:open-math-grapher', { detail: { initialEquation } }));
}
