/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, atomDark, dracula, oneLight, tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Move, Plus, X, AlertTriangle, Lightbulb, AlertCircle, BookOpen, CheckSquare, Info, Calculator, MessageSquare, ArrowRight, Clock, Settings, AlignLeft, AlignCenter, AlignRight, Maximize2, Minimize2, Layout, GripVertical, Image as ImageIcon, Type, Square, Check, Brain, Star, ClipboardList, Sword, Ghost, ChevronDown, ChevronRight, ArrowUpDown, Zap, Sparkles } from 'lucide-react';
import { GameIcon } from './GameIcons';
import { type Theme } from './ThemeContext';

import { isFuzzyMatch } from '../utils/blurtUtils';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface PlacedImage {
  url: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  alignment: 'left' | 'center' | 'right';
  width?: number;
  caption?: string;
  hasBorder?: boolean;
}

function ImgTextRenderer({ item, path, onUpdateItem, theme }: any) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item.fetchedImages && item.fetchedImages.length > 0 && item.fetchedForContent === item.CONTENT) {
      setImages(item.fetchedImages);
      setCurrentIndex(item.currentImageIndex || 0);
      return;
    }

    if (!item.CONTENT) return;

    // Use a free, no-API-key service for realistic placeholders
    // We use a seed based on the content to get a consistent image
    // This is 100% free and requires no API keys
    const placeholderUrl = `https://picsum.photos/seed/${encodeURIComponent(item.CONTENT)}/800/600`;
    setImages([placeholderUrl]);
    onUpdateItem?.(path, { fetchedImages: [placeholderUrl], currentImageIndex: 0, fetchedForContent: item.CONTENT });
  }, [item.CONTENT, item.fetchedImages, item.fetchedForContent]);

  const handleTripleClick = (e: React.MouseEvent) => {
    if (e.detail === 3 && images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      onUpdateItem?.(path, { currentImageIndex: nextIndex });
    }
  };

  const currentUrl = images[currentIndex];

  return (
    <div className="my-4 relative group/img-text-block-container" onClick={handleTripleClick}>
      <div className={cn(
        "relative group/img-text-block overflow-hidden cursor-pointer",
        theme === 'modern' && "rounded-2xl shadow-md",
        theme === 'professional' && "rounded-none border border-slate-200 shadow-sm",
        theme === 'cyberpunk' && "rounded-none border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]",
        theme === 'vintage' && "rounded-sm border-4 border-double border-[#8b4513] p-1 bg-[#fdfbf7]",
        theme === 'terminal' && "rounded-none border-2 border-green-500 bg-black p-2",
        theme === 'prism' && "rounded-[2rem] shadow-2xl",
        theme === 'minecraft' && "rounded-none border-8 border-[#373737] bg-[#c6c6c6] p-2",
        theme === 'undertale' && "rounded-none border-4 border-white bg-black p-2",
        theme === 'comic' && "rounded-none border-4 border-black bg-white p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1",
      )}>
        {loading ? (
          <div className="w-full h-48 flex items-center justify-center bg-slate-100 animate-pulse">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
        ) : currentUrl ? (
          <>
            <img src={currentUrl} alt={item.CONTENT} className="w-full h-auto block select-none" referrerPolicy="no-referrer" />
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-2 text-sm text-center font-medium select-none",
              theme === 'professional' ? "bg-white/90 text-slate-800 border-t border-slate-100" : "bg-black/60 text-white"
            )}>
              {item.CONTENT}
            </div>
            {images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs opacity-0 group-hover/img-text-block-container:opacity-100 transition-opacity pointer-events-none">
                Triple-click to change
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">No Image Found</span>
            <span className="text-xs mt-1">{item.CONTENT}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  key?: React.Key;
  data: any;
  level?: number;
  path?: string;
  isDragModeActive?: boolean;
  isOrderingMode?: boolean;
  isPresentation?: boolean;
  highlightWords?: string[];
  missingWords?: string[];
  imagePlacements?: Record<string, PlacedImage[]>;
  onZoneClick?: (path: string) => void;
  onRemoveImage?: (path: string, index: number) => void;
  onUpdateImage?: (path: string, index: number, updates: Partial<PlacedImage>) => void;
  onUpdateItem?: (path: string, updates: any) => void;
  onReorderGroupClick?: (groupIndex: number) => void;
  selectedColors?: string[];
  groupColor?: string;
  theme?: 'realistic' | 'modern' | 'professional' | 'cyberpunk' | 'vintage' | 'terminal' | 'ethereal' | 'prism' | 'minecraft' | 'undertale' | 'god-of-war' | 'cuphead' | 'comic' | 'custom';
}

export const ColorContext = React.createContext<{ groupColor?: string, nextColor?: string, theme?: string }>({});
export const DocumentContext = React.createContext<{ 
  fullData: any, 
  highlightWords?: string[], 
  missingWords?: string[] 
}>({ fullData: null });

function getShade(hex: string, percent: number) {
  const f = parseInt(hex.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

function DroppableZone({ id, active, onClick }: { id: string, active: boolean, onClick?: () => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  if (!active) {
    return (
      <div 
        onClick={onClick}
        className="h-2 my-1 hover:h-16 hover:my-4 rounded-xl border-2 border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center transition-all duration-200 cursor-pointer group/zone"
      >
        <div className="opacity-0 group-hover/zone:opacity-100 flex items-center space-x-2 pointer-events-none">
          <Plus className="w-5 h-5 text-blue-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Add Image Here</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      onClick={onClick}
      className={cn(
        "h-20 my-4 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-200 cursor-pointer",
        isOver ? "border-blue-500 bg-blue-100 scale-[1.02] shadow-inner" : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-300"
      )}
    >
      <div className="flex items-center space-x-2 pointer-events-none">
        <Plus className={cn("w-5 h-5", isOver ? "text-blue-600" : "text-slate-400")} />
        <span className={cn(
          "text-sm font-bold uppercase tracking-wider",
          isOver ? "text-blue-600" : "text-slate-400"
        )}>
          {isOver ? "Drop Here!" : "Tap or Drop Image"}
        </span>
      </div>
    </div>
  );
}

export function MCQRenderer({ item, theme, isPresentation = false }: any) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  let mcqData = { question: '', options: [], answer: '', explanation: '' };
  try {
    mcqData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
  } catch (e) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-lg">Error parsing MCQ data. Please ensure it is valid JSON.</div>;
  }

  const { question, options, answer, explanation } = mcqData;

  const handleSubmit = () => {
    if (selectedOption) {
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  // Theme-specific color mapping for text and accents
  const getThemeStyles = () => {
    switch (theme) {
      case 'professional':
        return {
          container: "bg-white border-slate-200 shadow-sm rounded-xl",
          question: "text-slate-900 font-serif",
          optionBase: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          optionSelected: "border-blue-600 bg-blue-50/30 text-blue-900",
          optionCorrect: "border-emerald-600 bg-emerald-50 text-emerald-900",
          optionIncorrect: "border-red-600 bg-red-50 text-red-900",
          accent: "bg-slate-800 text-white",
          label: "text-slate-500",
          submitBtn: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
          feedback: "bg-slate-50 border-slate-200 text-slate-800"
        };
      case 'cyberpunk':
        return {
          container: "bg-[#0a0a0f]/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]",
          question: "text-cyan-100",
          optionBase: "border-slate-800 bg-black/40 text-slate-400 hover:border-cyan-500/50",
          optionSelected: "border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.3)]",
          optionCorrect: "border-emerald-400 bg-emerald-950/40 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.3)]",
          optionIncorrect: "border-red-400 bg-red-950/40 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
          accent: "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]",
          label: "text-cyan-400",
          submitBtn: "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]",
          feedback: "bg-emerald-950/30 border-emerald-500/50 text-emerald-100"
        };
      case 'terminal':
        return {
          container: "bg-black border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
          question: "text-green-400 font-mono",
          optionBase: "border-green-900 bg-black text-green-800 hover:border-green-700",
          optionSelected: "border-green-500 bg-green-950/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
          optionCorrect: "border-green-400 bg-green-900/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
          optionIncorrect: "border-red-500 bg-red-950/40 text-red-500",
          accent: "bg-green-500 text-black",
          label: "text-green-500",
          submitBtn: "bg-green-500 text-black",
          feedback: "bg-green-950/30 border-green-500 text-green-400"
        };
      case 'undertale':
        return {
          container: "bg-black border-4 border-white",
          question: "text-white font-retro tracking-wider",
          optionBase: "border-white bg-black text-white hover:border-yellow-400 hover:text-yellow-400",
          optionSelected: "border-yellow-400 bg-black text-yellow-400",
          optionCorrect: "border-green-500 bg-black text-green-500",
          optionIncorrect: "border-red-500 bg-black text-red-500",
          accent: "bg-white text-black",
          label: "text-white",
          submitBtn: "bg-black text-white border-4 border-white hover:text-yellow-400 hover:border-yellow-400",
          feedback: "bg-black border-4 border-white text-white"
        };
      case 'god-of-war':
        return {
          container: "bg-[#1a0f0f]/90 border-2 border-[#8b0000] shadow-[0_0_40px_rgba(139,0,0,0.2)]",
          question: "text-slate-100 font-serif",
          optionBase: "border-[#4a0000] bg-black/40 text-slate-400 hover:border-[#8b0000]",
          optionSelected: "border-[#ffd700] bg-[#4a0000]/40 text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]",
          optionCorrect: "border-emerald-500 bg-emerald-950/40 text-emerald-100",
          optionIncorrect: "border-red-600 bg-red-950/40 text-red-100",
          accent: "bg-[#8b0000] text-[#ffd700]",
          label: "text-[#8b0000]",
          submitBtn: "bg-[#8b0000] text-[#ffd700] border-2 border-[#ffd700]/30",
          feedback: "bg-[#2a0000] border-[#8b0000] text-slate-100"
        };
      case 'cuphead':
        return {
          container: "bg-[#f4e4bc] border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
          question: "text-black font-black",
          optionBase: "bg-white border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 text-black",
          optionSelected: "bg-yellow-200 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1 text-black",
          optionCorrect: "bg-emerald-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black",
          optionIncorrect: "bg-red-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black",
          accent: "bg-black text-white",
          label: "text-black",
          submitBtn: "bg-black text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
          feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black"
        };
      case 'comic':
        return {
          container: "bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
          question: "text-black font-black",
          optionBase: "bg-white border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 text-black",
          optionSelected: "bg-yellow-200 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1 text-black",
          optionCorrect: "bg-emerald-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black",
          optionIncorrect: "bg-red-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black",
          accent: "bg-yellow-400 text-black border-2 border-black",
          label: "text-black opacity-60",
          submitBtn: "bg-blue-500 text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
          feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black"
        };
      case 'ethereal':
        return {
          container: "bg-white/40 backdrop-blur-xl border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)]",
          question: "text-indigo-900",
          optionBase: "border-indigo-50 bg-white/50 text-indigo-700 hover:border-indigo-200 hover:bg-white",
          optionSelected: "border-indigo-400 bg-indigo-50/80 text-indigo-900 shadow-lg shadow-indigo-500/10",
          optionCorrect: "border-emerald-400 bg-emerald-50/80 text-emerald-900",
          optionIncorrect: "border-red-400 bg-red-50/80 text-red-900",
          accent: "bg-indigo-400 text-white",
          label: "text-indigo-400",
          submitBtn: "bg-indigo-600 text-white shadow-indigo-500/25",
          feedback: "bg-white/60 border-indigo-100 text-indigo-900"
        };
      case 'prism':
        return {
          container: "bg-white/90 backdrop-blur-md border-blue-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]",
          question: "text-slate-900",
          optionBase: "border-slate-100 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-white",
          optionSelected: "border-blue-500 bg-blue-50/50 text-blue-900 shadow-md ring-2 ring-blue-500/20",
          optionCorrect: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10",
          optionIncorrect: "border-red-500 bg-red-50 text-red-900",
          accent: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
          label: "text-blue-500",
          submitBtn: "bg-slate-900 text-white hover:bg-black shadow-black/25",
          feedback: "bg-white border-slate-200 text-slate-900"
        };
      case 'minecraft':
        return {
          container: "bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
          question: "text-[#373737] font-pixel text-3xl",
          optionBase: "border-4 border-[#373737] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0]",
          optionSelected: "border-4 border-white bg-[#373737] text-white",
          optionCorrect: "border-4 border-[#388e3c] bg-[#4caf50] text-white",
          optionIncorrect: "border-4 border-[#d32f2f] bg-[#f44336] text-white",
          accent: "bg-[#8b8b8b] text-white border-2 border-[#373737]",
          label: "text-[#373737]",
          submitBtn: "bg-[#8b8b8b] text-white border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]",
          feedback: "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737]"
        };
      default: // modern
        return {
          container: "bg-white border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]",
          question: "text-slate-900",
          optionBase: "border-slate-200 bg-white/50 hover:border-blue-300 hover:bg-white text-slate-700",
          optionSelected: "border-blue-500 bg-blue-50/50 text-blue-900 shadow-md ring-2 ring-blue-500/20",
          optionCorrect: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10",
          optionIncorrect: "border-red-500 bg-red-50 text-red-900",
          accent: "bg-blue-600 text-white",
          label: "text-blue-600",
          submitBtn: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25",
          feedback: "bg-white border-blue-100 text-slate-900"
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mcq-container my-4 p-4 sm:p-6 transition-all relative overflow-hidden",
        theme === 'professional' ? "rounded-xl border shadow-sm" : "rounded-2xl border-2 shadow-lg",
        isPresentation ? "max-w-4xl mx-auto" : "w-full",
        styles.container
      )}
      data-mcq-answer={answer}
      data-theme={theme}
    >
      {/* Background Glow for Futuristic Feel */}
      {isPresentation && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Question Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg shadow-md",
            styles.accent
          )}>
            ?
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-[0.625rem] font-black uppercase tracking-[0.2em] mb-0.5",
              styles.label
            )}>
              Assessment Module
            </span>
            <span className={cn(
              "text-[0.625rem] font-bold uppercase tracking-widest opacity-40",
              theme === 'cyberpunk' && "text-cyan-400",
              theme === 'terminal' && "text-green-500"
            )}>
              Multiple Choice Question
            </span>
          </div>
        </div>
        <h3 className={cn(
          "font-bold text-lg sm:text-xl leading-tight text-balance",
          styles.question
        )}>
          <MarkdownContent content={question} isPresentation={isPresentation} />
        </h3>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-2 mb-4 mcq-options">
        {options.map((option: string, i: number) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === answer;
          
          return (
            <motion.button
              key={i}
              whileHover={!isSubmitted ? { scale: 1.01, x: 4 } : {}}
              whileTap={!isSubmitted ? { scale: 0.99 } : {}}
              onClick={() => !isSubmitted && setSelectedOption(option)}
              disabled={isSubmitted}
              data-option={option}
              className={cn(
                "mcq-option w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                !isSubmitted ? (
                  isSelected ? styles.optionSelected : styles.optionBase
                ) : (
                  isCorrect ? styles.optionCorrect : isSelected ? styles.optionIncorrect : "opacity-30 grayscale-[0.5] border-transparent"
                ),
                theme === 'undertale' && "rounded-none border-4 font-retro",
                theme === 'minecraft' && "rounded-none border-4"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 border-2 transition-all",
                  !isSubmitted ? (
                    isSelected ? "bg-white text-blue-600 border-white" : "bg-slate-100 border-slate-200 text-slate-400 group-hover:bg-blue-100 group-hover:border-blue-200 group-hover:text-blue-500"
                  ) : (
                    isCorrect ? "bg-white text-emerald-600 border-white" : isSelected ? "bg-white text-red-600 border-white" : "bg-slate-200 border-slate-300 text-slate-400"
                  ),
                  theme === 'cyberpunk' && !isSubmitted && isSelected && "bg-cyan-400 text-black border-cyan-400",
                  theme === 'terminal' && !isSubmitted && isSelected && "bg-green-500 text-black border-green-500",
                  theme === 'minecraft' && "rounded-none"
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-base sm:text-lg font-bold leading-tight">
                  <MarkdownContent content={option} isPresentation={isPresentation} />
                </span>
              </div>
              
              <div className="shrink-0 ml-2">
                <AnimatePresence mode="wait">
                  {isSubmitted && isCorrect && (
                    <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                      <Check className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <motion.div initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                      <X className="w-5 h-5 text-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className={cn("mcq-actions", isSubmitted ? "hidden" : "block")}>
          <motion.button
            whileHover={selectedOption ? { scale: 1.01, y: -2 } : {}}
            whileTap={selectedOption ? { scale: 0.99 } : {}}
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={cn(
              "mcq-submit-btn w-full py-3 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg",
              !selectedOption 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200" 
                : styles.submitBtn,
              theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400",
              theme === 'minecraft' && "rounded-none"
            )}
          >
            {selectedOption ? "Confirm Selection" : "Select an Option"}
          </motion.button>
        </div>

        <div className={cn("mcq-feedback", !isSubmitted ? "hidden" : "block")}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={isSubmitted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className={cn(
              "mcq-feedback-box p-4 sm:p-6 rounded-2xl border-2 relative overflow-hidden shadow-inner",
              styles.feedback,
              theme === 'comic' && "rounded-none border-4"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn(
                  "mcq-feedback-icon p-2 rounded-xl shrink-0 shadow-md",
                  selectedOption === answer ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}>
                  {selectedOption === answer ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="mcq-feedback-title text-lg font-black uppercase tracking-widest mb-1">
                    {selectedOption === answer ? "Correct Analysis" : "Incorrect Analysis"}
                  </h4>
                  <div className="mcq-feedback-content text-sm sm:text-base leading-relaxed opacity-90 font-medium">
                    <MarkdownContent content={explanation} isPresentation={isPresentation} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className={cn(
                "mcq-reset-btn w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all border-2",
                theme === 'modern' && "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300",
                theme === 'cyberpunk' && "border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-cyan-400",
                theme === 'terminal' && "border-green-900 text-green-900 hover:text-green-500",
                theme === 'comic' && "border-4 border-black text-black font-black bg-slate-100 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-none",
                theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400",
                theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#8b8b8b] text-white"
              )}
            >
              Reset Module
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function EssayRenderer({ item, theme, isPresentation = false }: any) {
  const [answerText, setAnswerText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  let essayData = { question: '', answer: '', explanation: '' };
  try {
    essayData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
  } catch (e) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-lg">Error parsing ESSAY data. Please ensure it is valid JSON.</div>;
  }

  const { question, answer, explanation } = essayData;

  const handleSubmit = () => {
    if (answerText.trim()) {
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setAnswerText('');
    setIsSubmitted(false);
  };

  // Theme-specific color mapping
  const getThemeStyles = () => {
    switch (theme) {
      case 'professional':
        return {
          container: "bg-white border-slate-200 shadow-sm rounded-xl",
          question: "text-slate-900 font-serif",
          textarea: "bg-white border-slate-200 text-slate-800 focus:border-blue-600 focus:ring-blue-600/10 placeholder-slate-400 font-serif",
          accent: "bg-slate-800 text-white",
          label: "text-slate-500",
          submitBtn: "bg-blue-600 text-white hover:bg-blue-700 rounded-lg",
          feedback: "bg-slate-50 border-slate-200 text-slate-800"
        };
      case 'cyberpunk':
        return {
          container: "bg-[#0a0a0f]/80 border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.15)]",
          question: "text-fuchsia-100",
          textarea: "bg-black/40 border-slate-800 text-cyan-50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20 placeholder-slate-700",
          accent: "bg-fuchsia-500 text-black shadow-[0_0_15px_rgba(217,70,239,0.5)]",
          label: "text-fuchsia-400",
          submitBtn: "bg-fuchsia-500 text-black shadow-[0_0_20px_rgba(217,70,239,0.4)]",
          feedback: "bg-fuchsia-950/20 border-fuchsia-500/50 text-fuchsia-100"
        };
      case 'terminal':
        return {
          container: "bg-black border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]",
          question: "text-green-400 font-mono",
          textarea: "bg-black border-green-900 text-green-400 focus:border-green-500 focus:ring-green-500/20 placeholder-green-950 font-mono",
          accent: "bg-green-500 text-black",
          label: "text-green-500",
          submitBtn: "bg-green-500 text-black",
          feedback: "bg-green-950/20 border-green-500 text-green-400"
        };
      case 'undertale':
        return {
          container: "bg-black border-4 border-white",
          question: "text-white font-retro tracking-wider",
          textarea: "bg-black border-4 border-white text-white font-retro rounded-none focus:border-yellow-400",
          accent: "bg-white text-black",
          label: "text-white",
          submitBtn: "bg-black text-white border-4 border-white hover:text-yellow-400 hover:border-yellow-400 font-retro",
          feedback: "bg-black border-4 border-white text-white"
        };
      case 'god-of-war':
        return {
          container: "bg-[#1a0f0f]/90 border-2 border-[#8b0000] shadow-[0_0_40px_rgba(139,0,0,0.2)]",
          question: "text-slate-100 font-serif",
          textarea: "bg-black/40 border-[#4a0000] text-slate-100 focus:border-[#8b0000] focus:ring-[#8b0000]/20 placeholder-slate-700 font-serif",
          accent: "bg-[#8b0000] text-[#ffd700]",
          label: "text-[#8b0000]",
          submitBtn: "bg-[#8b0000] text-[#ffd700] border-2 border-[#ffd700]/30",
          feedback: "bg-[#2a0000] border-[#8b0000] text-slate-100"
        };
      case 'cuphead':
        return {
          container: "bg-[#f4e4bc] border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
          question: "text-black font-black",
          textarea: "bg-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_rgba(0,0,0,1)] font-bold rounded-none text-black",
          accent: "bg-black text-white",
          label: "text-black",
          submitBtn: "bg-black text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
          feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black rounded-none"
        };
      case 'comic':
        return {
          container: "bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]",
          question: "text-black font-black",
          textarea: "bg-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_rgba(0,0,0,1)] font-bold rounded-none text-black",
          accent: "bg-purple-500 text-white border-2 border-black",
          label: "text-black opacity-60",
          submitBtn: "bg-purple-500 text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
          feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black rounded-none"
        };
      case 'ethereal':
        return {
          container: "bg-white/40 backdrop-blur-xl border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)]",
          question: "text-indigo-900",
          textarea: "bg-white/50 border-indigo-50 focus:border-indigo-400 focus:ring-indigo-400/20 text-indigo-800 placeholder-indigo-200",
          accent: "bg-indigo-400 text-white",
          label: "text-indigo-400",
          submitBtn: "bg-indigo-600 text-white shadow-indigo-500/25",
          feedback: "bg-white/60 border-indigo-100 text-indigo-900"
        };
      case 'prism':
        return {
          container: "bg-white/90 backdrop-blur-md border-purple-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]",
          question: "text-slate-900",
          textarea: "bg-slate-50 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 text-slate-800",
          accent: "bg-gradient-to-br from-purple-500 to-pink-600 text-white",
          label: "text-purple-500",
          submitBtn: "bg-slate-900 text-white hover:bg-black shadow-black/25",
          feedback: "bg-white border-slate-200 text-slate-900"
        };
      case 'minecraft':
        return {
          container: "bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
          question: "text-[#373737] font-pixel text-3xl",
          textarea: "bg-[#8b8b8b] border-4 border-[#373737] text-white font-pixel text-2xl placeholder-[#555] focus:bg-[#a0a0a0]",
          accent: "bg-[#8b8b8b] text-white border-2 border-[#373737]",
          label: "text-[#373737]",
          submitBtn: "bg-[#8b8b8b] text-white border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]",
          feedback: "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737]"
        };
      default: // modern
        return {
          container: "bg-white border-purple-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]",
          question: "text-slate-900",
          textarea: "bg-slate-50 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 text-slate-800",
          accent: "bg-purple-600 text-white",
          label: "text-purple-600",
          submitBtn: "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/25",
          feedback: "bg-white border-purple-100 text-slate-900"
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "essay-container my-4 p-4 sm:p-6 transition-all relative overflow-hidden",
        theme === 'professional' ? "rounded-xl border shadow-sm" : "rounded-2xl border-2 shadow-lg",
        isPresentation ? "max-w-4xl mx-auto" : "w-full",
        styles.container
      )}
      data-theme={theme}
    >
      {/* Background Glow */}
      {isPresentation && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg shadow-md",
            styles.accent
          )}>
            <Type className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-[0.625rem] font-black uppercase tracking-[0.2em] mb-0.5",
              styles.label
            )}>
              Creative Module
            </span>
            <span className={cn(
              "text-[0.625rem] font-bold uppercase tracking-widest opacity-40",
              theme === 'cyberpunk' && "text-fuchsia-400",
              theme === 'terminal' && "text-green-500"
            )}>
              Essay Question
            </span>
          </div>
        </div>
        <h3 className={cn(
          "font-bold text-lg sm:text-xl leading-tight text-balance",
          styles.question
        )}>
          <MarkdownContent content={question} isPresentation={isPresentation} />
        </h3>
      </div>

      <div className="mb-4">
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          disabled={isSubmitted}
          placeholder="Type your detailed response here..."
          className={cn(
            "essay-textarea w-full min-h-[120px] p-3 rounded-xl border-2 resize-y transition-all outline-none focus:ring-4 text-sm sm:text-base leading-relaxed",
            styles.textarea,
            isSubmitted && "opacity-60 grayscale-[0.5] cursor-not-allowed",
            theme === 'undertale' && "rounded-none border-4 font-retro",
            theme === 'minecraft' && "rounded-none border-4"
          )}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className={cn("essay-actions", isSubmitted ? "hidden" : "block")}>
          <motion.button
            whileHover={answerText.trim() ? { scale: 1.01, y: -2 } : {}}
            whileTap={answerText.trim() ? { scale: 0.99 } : {}}
            onClick={handleSubmit}
            disabled={!answerText.trim()}
            className={cn(
              "essay-submit-btn w-full py-3 rounded-xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-lg",
              !answerText.trim() 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200" 
                : styles.submitBtn,
              theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400",
              theme === 'minecraft' && "rounded-none"
            )}
          >
            {answerText.trim() ? "Submit Response" : "Awaiting Response..."}
          </motion.button>
        </div>

        <div className={cn("essay-feedback", !isSubmitted ? "hidden" : "block")}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={isSubmitted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className={cn(
              "p-4 sm:p-6 rounded-2xl border-2 relative overflow-hidden shadow-inner",
              styles.feedback
            )}>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-purple-500 text-white rounded-xl shrink-0 shadow-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="essay-feedback-title text-lg font-black uppercase tracking-widest mb-1">Suggested Analysis</h4>
                  <p className="essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium uppercase tracking-wider">Compare your response with the module's key points</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                <div className="essay-feedback-box p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                  <h5 className="essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 opacity-50">Key Points to Cover:</h5>
                  <div className="essay-feedback-content font-medium">
                    <MarkdownContent content={answer} isPresentation={isPresentation} />
                  </div>
                </div>
                
                {explanation && (
                  <div className="essay-feedback-box p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm">
                    <h5 className="essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 opacity-50">Contextual Insight:</h5>
                    <div className="essay-feedback-content font-medium">
                      <MarkdownContent content={explanation} isPresentation={isPresentation} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleReset}
              className={cn(
                "essay-reset-btn w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all border-2",
                theme === 'modern' && "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300",
                theme === 'cyberpunk' && "border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-fuchsia-400",
                theme === 'terminal' && "border-green-900 text-green-900 hover:text-green-500",
                theme === 'comic' && "border-4 border-black text-black font-black bg-slate-100 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-none",
                theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400",
                theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#8b8b8b] text-white"
              )}
            >
              Revise Response
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function ImageSettingsModal({ 
  image, 
  onClose, 
  onUpdate, 
  onRemove,
  onConfirm,
  confirmLabel = "Done",
  theme = 'modern'
}: { 
  image: PlacedImage, 
  onClose: () => void, 
  onUpdate: (updates: Partial<PlacedImage>) => void, 
  onRemove?: () => void,
  onConfirm?: () => void,
  confirmLabel?: string,
  theme?: Theme
}) {
  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 sm:p-6",
        theme === 'modern' && "bg-slate-900/60",
        theme === 'vintage' && "bg-[#2c241a]/80",
        theme === 'prism' && "bg-slate-900/40",
        theme === 'professional' && "bg-slate-900/70",
        theme === 'cyberpunk' && "bg-black/80",
        theme === 'terminal' && "bg-black/80",
        theme === 'ethereal' && "bg-indigo-900/40",
        theme === 'minecraft' && "bg-black/60",
        theme === 'undertale' && "bg-black/90",
        theme === 'god-of-war' && "bg-black/80",
        theme === 'cuphead' && "bg-black/60",
        theme === 'comic' && "bg-black/60"
      )}
      onClick={onClose}
    >
      <div 
        className={cn(
          "w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200",
          theme === 'modern' && "bg-white rounded-2xl shadow-2xl border border-slate-200",
          theme === 'vintage' && "bg-[#fdfbf7] rounded-none shadow-[15px_15px_0_rgba(0,0,0,0.1)] border-2 border-[#4a3728]",
          theme === 'prism' && "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40",
          theme === 'professional' && "bg-white rounded-xl shadow-xl border border-slate-200",
          theme === 'cyberpunk' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] border-2 border-cyan-500",
          theme === 'terminal' && "bg-black rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.2)] border-2 border-green-500",
          theme === 'ethereal' && "bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100",
          theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-t-[#ffffff] border-l-[#ffffff] border-b-[#555555] border-r-[#555555] shadow-[8px_8px_0_rgba(0,0,0,0.4)]",
          theme === 'undertale' && "bg-black rounded-none border-4 border-white shadow-[0_0_0_4px_black]",
          theme === 'god-of-war' && "bg-[#1a1a1a] rounded-none border-2 border-[#8b0000] shadow-[0_0_50px_rgba(139,0,0,0.3)]",
          theme === 'cuphead' && "bg-[#f4e4bc] rounded-none border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
          theme === 'comic' && "bg-white rounded-none border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]"
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          "px-6 py-4 flex items-center justify-between",
          theme === 'modern' && "border-b border-slate-100 bg-slate-50/50",
          theme === 'vintage' && "border-b-2 border-[#4a3728] bg-[#f4f1ea]",
          theme === 'prism' && "border-b border-white/20 bg-white/10",
          theme === 'professional' && "border-b border-slate-100 bg-slate-50",
          theme === 'cyberpunk' && "border-b border-cyan-900 bg-black",
          theme === 'terminal' && "border-b border-green-900 bg-black",
          theme === 'ethereal' && "border-b border-indigo-100 bg-indigo-50/30",
          theme === 'minecraft' && "border-b border-[#1e1e1e] bg-[#1e1e1e]",
          theme === 'undertale' && "border-b border-white/20 bg-black",
          theme === 'god-of-war' && "border-b border-[#8b0000]/30 bg-[#1a1a1a]",
          theme === 'cuphead' && "border-b border-black bg-[#f4e4bc]",
          theme === 'comic' && "border-b border-black bg-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              theme === 'modern' && "bg-blue-100 text-blue-600",
              theme === 'vintage' && "bg-[#4a3728] text-[#f4f1ea]",
              theme === 'prism' && "bg-indigo-500 text-white",
              theme === 'professional' && "bg-slate-800 text-white",
              theme === 'cyberpunk' && "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50",
              theme === 'terminal' && "bg-green-500/20 text-green-400 border border-green-500/50",
              theme === 'ethereal' && "bg-indigo-600 text-white",
              theme === 'minecraft' && "bg-[#545454] text-white",
              theme === 'undertale' && "bg-white text-black",
              theme === 'god-of-war' && "bg-[#8b0000] text-white",
              theme === 'cuphead' && "bg-black text-white",
              theme === 'comic' && "bg-black text-white"
            )}>
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn(
                "font-bold",
                theme === 'modern' && "text-slate-900",
                theme === 'vintage' && "text-[#4a3728] font-serif",
                theme === 'prism' && "text-slate-900",
                theme === 'professional' && "text-slate-900",
                theme === 'cyberpunk' && "text-cyan-400 uppercase tracking-widest",
                theme === 'terminal' && "text-green-400 font-mono",
                theme === 'ethereal' && "text-indigo-900",
                theme === 'minecraft' && "text-white font-mono",
                theme === 'undertale' && "text-white font-mono",
                theme === 'god-of-war' && "text-[#e5e5e5] uppercase tracking-[0.2em]",
                theme === 'cuphead' && "text-black font-black",
                theme === 'comic' && "text-black font-black italic"
              )}>Image Properties</h3>
              <p className={cn(
                "text-[10px] uppercase tracking-wider font-bold",
                theme === 'modern' && "text-slate-500",
                theme === 'vintage' && "text-[#4a3728]/60",
                theme === 'prism' && "text-slate-500",
                theme === 'professional' && "text-slate-500",
                theme === 'cyberpunk' && "text-cyan-900",
                theme === 'terminal' && "text-green-900",
                theme === 'ethereal' && "text-indigo-400",
                theme === 'minecraft' && "text-[#545454]",
                theme === 'undertale' && "text-white/40",
                theme === 'god-of-war' && "text-[#e5e5e5]/40",
                theme === 'cuphead' && "text-black/60",
                theme === 'comic' && "text-black/60"
              )}>Adjust appearance & behavior</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={cn(
              "p-2 transition-colors rounded-full",
              theme === 'modern' && "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
              theme === 'vintage' && "text-[#4a3728] hover:bg-[#4a3728]/10",
              theme === 'prism' && "text-slate-400 hover:text-slate-600 hover:bg-white/40",
              theme === 'professional' && "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
              theme === 'cyberpunk' && "text-cyan-400 hover:bg-cyan-500/20",
              theme === 'terminal' && "text-green-400 hover:bg-green-500/20",
              theme === 'ethereal' && "text-indigo-400 hover:bg-indigo-50",
              theme === 'minecraft' && "text-white hover:bg-[#545454]",
              theme === 'undertale' && "text-white hover:bg-white/10",
              theme === 'god-of-war' && "text-[#e5e5e5] hover:bg-[#8b0000]/20",
              theme === 'cuphead' && "text-black hover:bg-black/10",
              theme === 'comic' && "text-black hover:bg-black/10"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* Caption */}
          <div className="space-y-2">
            <label className={cn(
              "text-[11px] font-bold uppercase tracking-wider flex items-center gap-2",
              theme === 'modern' && "text-slate-500",
              theme === 'vintage' && "text-[#4a3728]",
              theme === 'prism' && "text-slate-500",
              theme === 'professional' && "text-slate-500",
              theme === 'cyberpunk' && "text-cyan-400",
              theme === 'terminal' && "text-green-500",
              theme === 'ethereal' && "text-indigo-400",
              theme === 'minecraft' && "text-white",
              theme === 'undertale' && "text-white",
              theme === 'god-of-war' && "text-[#e5e5e5]",
              theme === 'cuphead' && "text-black",
              theme === 'comic' && "text-black"
            )}>
              <Type className="w-3 h-3" /> Caption (Optional)
            </label>
            <input 
              type="text"
              value={image.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              className={cn(
                "w-full px-3 py-2.5 outline-none transition-all font-medium text-sm",
                theme === 'modern' && "bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700",
                theme === 'vintage' && "bg-transparent border-b-2 border-[#4a3728] rounded-none focus:bg-[#4a3728]/5 text-[#4a3728] italic",
                theme === 'prism' && "bg-white/40 border border-white/60 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700",
                theme === 'professional' && "bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-700",
                theme === 'cyberpunk' && "bg-black border border-cyan-500/30 rounded-lg focus:border-cyan-400 text-cyan-400 placeholder:text-cyan-900",
                theme === 'terminal' && "bg-black border border-green-500/30 rounded-lg focus:border-green-400 text-green-400 placeholder:text-green-900 font-mono",
                theme === 'ethereal' && "bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 text-indigo-900",
                theme === 'minecraft' && "bg-[#1e1e1e] border-2 border-[#545454] rounded-none focus:border-white text-white font-mono",
                theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none focus:border-white text-white font-mono",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-b-2 border-[#8b0000]/30 rounded-none focus:border-[#8b0000] text-[#e5e5e5] uppercase tracking-wider",
                theme === 'cuphead' && "bg-[#f4e4bc] border-2 border-black rounded-none focus:bg-white text-black font-bold",
                theme === 'comic' && "bg-white border-2 border-black rounded-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-bold"
              )}
              placeholder="Enter a caption for this image..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Alignment */}
            <div className="space-y-2">
              <label className={cn(
                "text-[11px] font-bold uppercase tracking-wider flex items-center gap-2",
                theme === 'modern' && "text-slate-500",
                theme === 'vintage' && "text-[#4a3728]",
                theme === 'prism' && "text-slate-500",
                theme === 'professional' && "text-slate-500",
                theme === 'cyberpunk' && "text-cyan-400",
                theme === 'terminal' && "text-green-500",
                theme === 'ethereal' && "text-indigo-400",
                theme === 'minecraft' && "text-white",
                theme === 'undertale' && "text-white",
                theme === 'god-of-war' && "text-[#e5e5e5]",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black"
              )}>
                <Move className="w-3 h-3" /> Alignment
              </label>
              <div className={cn(
                "flex p-1",
                theme === 'modern' && "bg-slate-100 rounded-xl",
                theme === 'vintage' && "bg-[#f4f1ea] border-2 border-[#4a3728] rounded-none",
                theme === 'prism' && "bg-white/40 border border-white/60 rounded-2xl",
                theme === 'professional' && "bg-slate-100 rounded-lg",
                theme === 'cyberpunk' && "bg-black border-2 border-cyan-900 rounded-xl",
                theme === 'terminal' && "bg-black border-2 border-green-900 rounded-xl",
                theme === 'ethereal' && "bg-indigo-50/50 border border-indigo-100 rounded-2xl",
                theme === 'minecraft' && "bg-[#1e1e1e] border-2 border-[#545454] rounded-none",
                theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30 rounded-none",
                theme === 'cuphead' && "bg-[#f4e4bc] border-2 border-black rounded-none",
                theme === 'comic' && "bg-white border-2 border-black rounded-none"
              )}>
                {['left', 'center', 'right'].map((align) => (
                  <button 
                    key={align}
                    onClick={() => onUpdate({ alignment: align as any })}
                    className={cn(
                      "flex-1 py-2 flex justify-center rounded-lg text-sm transition-all",
                      image.alignment === align 
                        ? (
                            theme === 'modern' ? "bg-white shadow-sm text-blue-600 font-bold" :
                            theme === 'professional' ? "bg-slate-800 text-white font-bold" :
                            theme === 'cyberpunk' ? "bg-cyan-500 text-black font-bold" :
                            theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea] font-bold" :
                            theme === 'terminal' ? "bg-green-500 text-black font-bold" :
                            theme === 'ethereal' ? "bg-indigo-600 text-white font-bold" :
                            theme === 'prism' ? "bg-indigo-500 text-white font-bold" :
                            theme === 'minecraft' ? "bg-[#545454] text-white font-bold" :
                            theme === 'undertale' ? "bg-white text-black font-bold" :
                            theme === 'god-of-war' ? "bg-[#8b0000] text-white font-bold" :
                            theme === 'cuphead' ? "bg-black text-white font-bold" :
                            theme === 'comic' ? "bg-black text-white font-bold" :
                            "bg-white shadow-sm text-blue-600 font-bold"
                          ) 
                        : (
                            theme === 'modern' ? "text-slate-500 font-medium hover:text-slate-700" :
                            theme === 'professional' ? "text-slate-500 font-medium hover:text-slate-700" :
                            theme === 'cyberpunk' ? "text-cyan-900 font-medium hover:text-cyan-400" :
                            theme === 'vintage' ? "text-[#4a3728] hover:bg-[#4a3728]/10 font-medium" :
                            theme === 'terminal' ? "text-green-900 font-medium hover:text-green-500" :
                            theme === 'ethereal' ? "text-indigo-300 font-medium hover:text-indigo-600" :
                            theme === 'prism' ? "text-slate-500 font-medium hover:text-slate-700" :
                            theme === 'minecraft' ? "text-[#545454] font-medium hover:text-white" :
                            theme === 'undertale' ? "text-white/40 font-medium hover:text-white" :
                            theme === 'god-of-war' ? "text-[#e5e5e5]/40 font-medium hover:text-[#e5e5e5]" :
                            theme === 'cuphead' ? "text-black/40 font-medium hover:text-black" :
                            theme === 'comic' ? "text-black/40 font-medium hover:text-black" :
                            "text-slate-500 font-medium hover:text-slate-700"
                          )
                    )}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <label className={cn(
                "text-[11px] font-bold uppercase tracking-wider flex items-center gap-2",
                theme === 'modern' && "text-slate-500",
                theme === 'professional' && "text-slate-500",
                theme === 'cyberpunk' && "text-cyan-400",
                theme === 'vintage' && "text-[#4a3728]",
                theme === 'terminal' && "text-green-500",
                theme === 'ethereal' && "text-indigo-400",
                theme === 'prism' && "text-slate-500",
                theme === 'minecraft' && "text-white",
                theme === 'undertale' && "text-white",
                theme === 'god-of-war' && "text-[#e5e5e5]",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black"
              )}>
                <Square className="w-3 h-3" /> Border Style
              </label>
              <div className={cn(
                "flex p-1",
                theme === 'modern' && "bg-slate-100 rounded-xl",
                theme === 'professional' && "bg-slate-100 rounded-lg",
                theme === 'cyberpunk' && "bg-black border-2 border-cyan-900 rounded-xl",
                theme === 'vintage' && "bg-[#f4f1ea] border-2 border-[#4a3728] rounded-none",
                theme === 'terminal' && "bg-black border-2 border-green-900 rounded-xl",
                theme === 'ethereal' && "bg-indigo-50/50 border border-indigo-100 rounded-2xl",
                theme === 'prism' && "bg-white/40 border border-white/60 rounded-2xl",
                theme === 'minecraft' && "bg-[#1e1e1e] border-2 border-[#545454] rounded-none",
                theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30 rounded-none",
                theme === 'cuphead' && "bg-[#f4e4bc] border-2 border-black rounded-none",
                theme === 'comic' && "bg-white border-2 border-black rounded-none"
              )}>
                <button 
                  onClick={() => onUpdate({ hasBorder: false })}
                  className={cn(
                    "flex-1 py-2 text-xs rounded-lg transition-all",
                    !image.hasBorder 
                      ? (
                          theme === 'modern' ? "bg-white shadow-sm text-blue-600 font-bold" :
                          theme === 'professional' ? "bg-slate-800 text-white font-bold" :
                          theme === 'cyberpunk' ? "bg-cyan-500 text-black font-bold" :
                          theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea] font-bold" :
                          theme === 'terminal' ? "bg-green-500 text-black font-bold" :
                          theme === 'ethereal' ? "bg-indigo-600 text-white font-bold" :
                          theme === 'prism' ? "bg-indigo-500 text-white font-bold" :
                          theme === 'minecraft' ? "bg-[#545454] text-white font-bold" :
                          theme === 'undertale' ? "bg-white text-black font-bold" :
                          theme === 'god-of-war' ? "bg-[#8b0000] text-white font-bold" :
                          theme === 'cuphead' ? "bg-black text-white font-bold" :
                          theme === 'comic' ? "bg-black text-white font-bold" :
                          "bg-white shadow-sm text-blue-600 font-bold"
                        ) 
                      : (
                          theme === 'modern' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'professional' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'cyberpunk' ? "text-cyan-900 font-medium hover:text-cyan-400" :
                          theme === 'vintage' ? "text-[#4a3728] hover:bg-[#4a3728]/10 font-medium" :
                          theme === 'terminal' ? "text-green-900 font-medium hover:text-green-500" :
                          theme === 'ethereal' ? "text-indigo-300 font-medium hover:text-indigo-600" :
                          theme === 'prism' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'minecraft' ? "text-[#545454] font-medium hover:text-white" :
                          theme === 'undertale' ? "text-white/40 font-medium hover:text-white" :
                          theme === 'god-of-war' ? "text-[#e5e5e5]/40 font-medium hover:text-[#e5e5e5]" :
                          theme === 'cuphead' ? "text-black/40 font-medium hover:text-black" :
                          theme === 'comic' ? "text-black/40 font-medium hover:text-black" :
                          "text-slate-500 font-medium hover:text-slate-700"
                        )
                  )}
                >
                  None
                </button>
                <button 
                  onClick={() => onUpdate({ hasBorder: true })}
                  className={cn(
                    "flex-1 py-2 text-xs rounded-lg transition-all",
                    image.hasBorder 
                      ? (
                          theme === 'modern' ? "bg-white shadow-sm text-blue-600 font-bold" :
                          theme === 'professional' ? "bg-slate-800 text-white font-bold" :
                          theme === 'cyberpunk' ? "bg-cyan-500 text-black font-bold" :
                          theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea] font-bold" :
                          theme === 'terminal' ? "bg-green-500 text-black font-bold" :
                          theme === 'ethereal' ? "bg-indigo-600 text-white font-bold" :
                          theme === 'prism' ? "bg-indigo-500 text-white font-bold" :
                          theme === 'minecraft' ? "bg-[#545454] text-white font-bold" :
                          theme === 'undertale' ? "bg-white text-black font-bold" :
                          theme === 'god-of-war' ? "bg-[#8b0000] text-white font-bold" :
                          theme === 'cuphead' ? "bg-black text-white font-bold" :
                          theme === 'comic' ? "bg-black text-white font-bold" :
                          "bg-white shadow-sm text-blue-600 font-bold"
                        ) 
                      : (
                          theme === 'modern' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'professional' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'cyberpunk' ? "text-cyan-900 font-medium hover:text-cyan-400" :
                          theme === 'vintage' ? "text-[#4a3728] hover:bg-[#4a3728]/10 font-medium" :
                          theme === 'terminal' ? "text-green-900 font-medium hover:text-green-500" :
                          theme === 'ethereal' ? "text-indigo-300 font-medium hover:text-indigo-600" :
                          theme === 'prism' ? "text-slate-500 font-medium hover:text-slate-700" :
                          theme === 'minecraft' ? "text-[#545454] font-medium hover:text-white" :
                          theme === 'undertale' ? "text-white/40 font-medium hover:text-white" :
                          theme === 'god-of-war' ? "text-[#e5e5e5]/40 font-medium hover:text-[#e5e5e5]" :
                          theme === 'cuphead' ? "text-black/40 font-medium hover:text-black" :
                          theme === 'comic' ? "text-black/40 font-medium hover:text-black" :
                          "text-slate-500 font-medium hover:text-slate-700"
                        )
                  )}
                >
                  Solid
                </button>
              </div>
            </div>
          </div>

          {/* Width Slider */}
          <div className={cn(
            "space-y-4 pt-4 border-t",
            theme === 'modern' && "border-slate-100",
            theme === 'professional' && "border-slate-100",
            theme === 'cyberpunk' && "border-cyan-900/30",
            theme === 'vintage' && "border-[#4a3728]/20",
            theme === 'terminal' && "border-green-900/30",
            theme === 'ethereal' && "border-indigo-100",
            theme === 'prism' && "border-white/20",
            theme === 'minecraft' && "border-[#1e1e1e]",
            theme === 'undertale' && "border-white/20",
            theme === 'god-of-war' && "border-[#8b0000]/30",
            theme === 'cuphead' && "border-black/20",
            theme === 'comic' && "border-black/20"
          )}>
            <div className="flex items-center justify-between">
              <label className={cn(
                "text-[11px] font-bold uppercase tracking-wider flex items-center gap-2",
                theme === 'modern' && "text-slate-500",
                theme === 'professional' && "text-slate-500",
                theme === 'cyberpunk' && "text-cyan-400",
                theme === 'vintage' && "text-[#4a3728]",
                theme === 'terminal' && "text-green-500",
                theme === 'ethereal' && "text-indigo-400",
                theme === 'prism' && "text-slate-500",
                theme === 'minecraft' && "text-white",
                theme === 'undertale' && "text-white",
                theme === 'god-of-war' && "text-[#e5e5e5]",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black"
              )}>
                <Maximize2 className="w-3 h-3" /> Width ({image.width || 100}%)
              </label>
              <div className="flex gap-1">
                {[25, 50, 75, 100].map((w) => (
                  <button 
                    key={w}
                    onClick={() => onUpdate({ width: w, size: undefined })}
                    className={cn(
                      "px-2 py-1 text-[10px] rounded-md transition-all font-bold",
                      image.width === w 
                        ? (
                            theme === 'modern' ? "bg-blue-100 text-blue-700" :
                            theme === 'professional' ? "bg-slate-800 text-white" :
                            theme === 'cyberpunk' ? "bg-cyan-500 text-black" :
                            theme === 'vintage' ? "bg-[#4a3728] text-[#f4f1ea]" :
                            theme === 'terminal' ? "bg-green-500 text-black" :
                            theme === 'ethereal' ? "bg-indigo-600 text-white" :
                            theme === 'prism' ? "bg-indigo-500 text-white" :
                            theme === 'minecraft' ? "bg-[#545454] text-white" :
                            theme === 'undertale' ? "bg-white text-black" :
                            theme === 'god-of-war' ? "bg-[#8b0000] text-white" :
                            theme === 'cuphead' ? "bg-black text-white" :
                            theme === 'comic' ? "bg-black text-white" :
                            "bg-blue-100 text-blue-700"
                          ) 
                        : (
                            theme === 'modern' ? "bg-slate-100 text-slate-500 hover:bg-slate-200" :
                            theme === 'professional' ? "bg-slate-100 text-slate-500 hover:bg-slate-200" :
                            theme === 'cyberpunk' ? "bg-cyan-900/20 text-cyan-900 hover:bg-cyan-900/40" :
                            theme === 'vintage' ? "bg-[#f4f1ea] text-[#4a3728] hover:bg-[#4a3728]/10" :
                            theme === 'terminal' ? "bg-green-900/20 text-green-900 hover:bg-green-900/40" :
                            theme === 'ethereal' ? "bg-indigo-50 text-indigo-300 hover:bg-indigo-100" :
                            theme === 'prism' ? "bg-slate-100 text-slate-500 hover:bg-slate-200" :
                            theme === 'minecraft' ? "bg-[#1e1e1e] text-[#545454] hover:bg-[#545454] hover:text-white" :
                            theme === 'undertale' ? "bg-black text-white/40 hover:bg-white/10 hover:text-white" :
                            theme === 'god-of-war' ? "bg-[#1a1a1a] text-[#e5e5e5]/40 hover:bg-[#8b0000]/20 hover:text-white" :
                            theme === 'cuphead' ? "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black" :
                            theme === 'comic' ? "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black" :
                            "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          )
                    )}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-xs font-bold",
                theme === 'vintage' && "text-[#4a3728]/40",
                theme === 'cyberpunk' && "text-cyan-900",
                theme === 'terminal' && "text-green-900",
                theme === 'ethereal' && "text-indigo-400/40",
                theme === 'minecraft' && "text-[#545454]",
                theme === 'undertale' && "text-white/40",
                theme === 'god-of-war' && "text-[#e5e5e5]/40",
                theme === 'cuphead' && "text-black/40",
                theme === 'comic' && "text-black/40",
                "text-slate-400"
              )}>10%</span>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="1" 
                value={image.width || 100} 
                onChange={(e) => onUpdate({ width: parseInt(e.target.value), size: undefined })}
                className={cn(
                  "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
                  theme === 'modern' && "bg-slate-200 accent-blue-600",
                  theme === 'professional' && "bg-slate-200 accent-slate-900",
                  theme === 'cyberpunk' && "bg-cyan-900/30 accent-cyan-400",
                  theme === 'vintage' && "bg-[#4a3728]/20 accent-[#4a3728]",
                  theme === 'terminal' && "bg-green-900/30 accent-green-500",
                  theme === 'ethereal' && "bg-indigo-100 accent-indigo-600",
                  theme === 'prism' && "bg-white/20 accent-indigo-500",
                  theme === 'minecraft' && "bg-[#1e1e1e] accent-white",
                  theme === 'undertale' && "bg-white/20 accent-white",
                  theme === 'god-of-war' && "bg-[#8b0000]/20 accent-[#8b0000]",
                  theme === 'cuphead' && "bg-black/20 accent-black",
                  theme === 'comic' && "bg-black/20 accent-black"
                )}
              />
              <span className={cn(
                "text-xs font-bold",
                theme === 'vintage' && "text-[#4a3728]/40",
                theme === 'cyberpunk' && "text-cyan-900",
                theme === 'terminal' && "text-green-900",
                theme === 'ethereal' && "text-indigo-400/40",
                theme === 'minecraft' && "text-[#545454]",
                theme === 'undertale' && "text-white/40",
                theme === 'god-of-war' && "text-[#e5e5e5]/40",
                theme === 'cuphead' && "text-black/40",
                theme === 'comic' && "text-black/40",
                "text-slate-400"
              )}>100%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          "px-6 py-4 flex justify-between items-center gap-4",
          theme === 'modern' && "bg-slate-50 border-t border-slate-100",
          theme === 'professional' && "bg-slate-50 border-t border-slate-100",
          theme === 'cyberpunk' && "bg-black border-t border-cyan-900",
          theme === 'vintage' && "bg-[#f4f1ea] border-t-2 border-[#4a3728]",
          theme === 'terminal' && "bg-black border-t border-green-900",
          theme === 'ethereal' && "bg-indigo-50/30 border-t border-indigo-100",
          theme === 'prism' && "bg-white/10 border-t border-white/20",
          theme === 'minecraft' && "bg-[#1e1e1e] border-t border-[#1e1e1e]",
          theme === 'undertale' && "bg-black border-t border-white/20",
          theme === 'god-of-war' && "bg-[#1a1a1a] border-t border-[#8b0000]/30",
          theme === 'cuphead' && "bg-[#f4e4bc] border-t border-black",
          theme === 'comic' && "bg-white border-t border-black"
        )}>
          {onRemove && (
            <button 
              onClick={() => { onRemove(); onClose(); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95",
                theme === 'modern' && "bg-red-50 hover:bg-red-100 text-red-600 rounded-xl",
                theme === 'professional' && "bg-red-50 hover:bg-red-100 text-red-600 rounded-lg",
                theme === 'cyberpunk' && "bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-xl",
                theme === 'vintage' && "bg-transparent border-2 border-[#4a3728] text-[#4a3728] hover:bg-red-500 hover:text-white rounded-none",
                theme === 'terminal' && "bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-xl",
                theme === 'ethereal' && "bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl",
                theme === 'prism' && "bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl",
                theme === 'minecraft' && "bg-[#1e1e1e] text-red-500 hover:bg-[#545454] border-b-4 border-black rounded-none",
                theme === 'undertale' && "bg-black text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white rounded-none",
                theme === 'god-of-war' && "bg-[#1a1a1a] text-red-600 border border-red-600 hover:bg-red-600 hover:text-white rounded-none",
                theme === 'cuphead' && "bg-transparent border-2 border-black text-black hover:bg-red-600 hover:text-white rounded-none",
                theme === 'comic' && "bg-transparent border-2 border-black text-black hover:bg-red-600 hover:text-white rounded-none"
              )}
            >
              <X className="w-4 h-4" /> Remove Image
            </button>
          )}
          <button 
            onClick={onConfirm || onClose}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95",
              theme === 'modern' && "bg-slate-900 hover:bg-slate-800 text-white rounded-xl",
              theme === 'professional' && "bg-slate-900 hover:bg-slate-800 text-white rounded-lg",
              theme === 'cyberpunk' && "bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl shadow-cyan-900/40",
              theme === 'vintage' && "bg-[#4a3728] hover:bg-[#4a3728]/90 text-[#f4f1ea] rounded-none",
              theme === 'terminal' && "bg-green-500 hover:bg-green-400 text-black rounded-xl shadow-green-900/40",
              theme === 'ethereal' && "bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-indigo-100",
              theme === 'prism' && "bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl shadow-indigo-100",
              theme === 'minecraft' && "bg-[#545454] text-white hover:bg-[#373737] border-b-4 border-[#1e1e1e] rounded-none",
              theme === 'undertale' && "bg-white text-black hover:bg-white/90 rounded-none",
              theme === 'god-of-war' && "bg-[#8b0000] hover:bg-[#a00000] text-white rounded-none shadow-[#8b0000]/40",
              theme === 'cuphead' && "bg-black hover:bg-black/90 text-white rounded-none",
              theme === 'comic' && "bg-black hover:bg-black/90 text-white rounded-none"
            )}
          >
            <Check className="w-4 h-4" /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DraggablePlacedImage({ id, image, active, path, index, onRemove, onUpdate }: { key?: React.Key, id: string, image: PlacedImage, active: boolean, path: string, index: number, onRemove?: () => void, onUpdate?: (updates: Partial<PlacedImage>) => void }) {
  const [isSelected, setIsSelected] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [localWidth, setLocalWidth] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { url: image.url, source: 'placed', sourcePath: path, sourceIndex: index },
    disabled: !active || isResizing || isSelected
  });

  const getInitialWidth = () => {
    if (localWidth !== null) return localWidth;
    if (image.width !== undefined) return image.width;
    // Default to 25% for left/right if not specified
    if (image.alignment === 'left' || image.alignment === 'right') return 25;
    
    switch (image.size) {
      case 'small': return 25;
      case 'medium': return 50;
      case 'large': return 75;
      case 'full':
      default: return 25;
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = getInitialWidth();
    const parentWidth = containerRef.current?.parentElement?.clientWidth || 1;
    let finalWidth = startWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / parentWidth) * 100;
      
      let newWidth = startWidth + deltaPercent;
      if (image.alignment === 'center') {
        newWidth = startWidth + (deltaPercent * 2);
      }

      newWidth = Math.min(Math.max(newWidth, 10), 100);
      finalWidth = Math.round(newWidth);
      setLocalWidth(finalWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      setLocalWidth(null);
      onUpdate?.({ width: finalWidth, size: undefined });
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  const initialWidth = getInitialWidth();
  const canFloat = (image.alignment === 'left' || image.alignment === 'right') && initialWidth <= 65;
  const isFloating = canFloat;

  if (!active) {
    return (
      <div 
        className={cn(
          "group/img-container relative", 
          !isResizing && "transition-all",
          isFloating ? "mb-4" : "my-4 flex w-full", 
          !isFloating && alignmentClasses[image.alignment || 'center']
        )}
        style={isFloating ? {
          float: image.alignment as 'left' | 'right',
          width: `${initialWidth}%`,
          marginRight: image.alignment === 'left' ? '1.5rem' : '0',
          marginLeft: image.alignment === 'right' ? '1.5rem' : '0',
          marginBottom: '1rem',
          maxWidth: '100%'
        } : {
          width: `${initialWidth}%`
        }}
      >
        <div 
          className={cn(
            "relative group rounded-xl overflow-hidden flex flex-col",
            image.hasBorder && "border-4 border-slate-800 p-1 bg-white shadow-lg"
          )}
        >
          <img 
            src={image.url} 
            alt={image.caption || "Placed"} 
            className={cn(
              "h-auto w-full transition-all group-hover:ring-4 group-hover:ring-blue-500/20",
              !image.hasBorder && "shadow-md border border-slate-200"
            )} 
            style={{ maxHeight: '600px' }} 
          />
          {image.caption && (
            <div className="p-2 text-center text-sm text-slate-600 italic bg-slate-50/80 backdrop-blur-sm border-t border-slate-100">
              {image.caption}
            </div>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsSelected(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors flex items-center justify-center group"
          >
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-blue-100 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Image Properties</span>
            </div>
          </button>
        </div>
        {isSelected && (
          <ImageSettingsModal
            image={image}
            onClose={() => setIsSelected(false)}
            onUpdate={(updates) => onUpdate?.(updates)}
            onRemove={() => onRemove?.()}
          />
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group/img-container relative", 
        !isResizing && "transition-all",
        isFloating ? "mb-4" : "my-4 flex w-full", 
        !isFloating && alignmentClasses[image.alignment || 'center']
      )}
      style={isFloating ? {
        float: image.alignment as 'left' | 'right',
        width: `${initialWidth}%`,
        marginRight: image.alignment === 'left' ? '1.5rem' : '0',
        marginLeft: image.alignment === 'right' ? '1.5rem' : '0',
        marginBottom: '1rem',
        maxWidth: '100%'
      } : {
        width: `${initialWidth}%`
      }}
      ref={containerRef}
    >
      <div 
        ref={setNodeRef} 
        className={cn(
          "relative border-2 rounded-xl overflow-hidden shadow-sm flex justify-center bg-slate-50 transition-all group",
          isSelected ? "border-blue-500 ring-4 ring-blue-500/20" : "border-slate-200 hover:border-blue-400 hover:shadow-md",
          isDragging ? "opacity-40 scale-95" : "opacity-100"
        )}
        style={{ width: '100%' }}
      >
        {/* Drag Handle */}
        <div 
          {...listeners} 
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 bg-slate-900/70 p-2 rounded-lg text-white backdrop-blur-md shadow-lg flex items-center space-x-2 cursor-grab active:cursor-grabbing z-20"
        >
          <Move className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase">Drag</span>
        </div>

        {/* Settings Button */}
        {!isSelected && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsSelected(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2 rounded-lg text-blue-600 shadow-lg flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-blue-50"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Settings</span>
          </button>
        )}

        {/* Resize Handle */}
        {isSelected && (
          <div 
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 cursor-nwse-resize flex items-center justify-center rounded-tl-xl z-40 shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Control Panel */}
        {isSelected && (
          <ImageSettingsModal
            image={image}
            onClose={() => setIsSelected(false)}
            onUpdate={(updates) => onUpdate?.(updates)}
            onRemove={() => onRemove?.()}
          />
        )}

        <div className={cn("w-full flex flex-col", image.hasBorder && "border-4 border-slate-800 p-1 bg-white")}>
          <img src={image.url} alt={image.caption || "Placed"} className="w-full h-auto object-contain" style={{ maxHeight: '600px' }} />
          {image.caption && (
            <div className="p-2 text-center text-sm text-slate-600 italic bg-slate-50/80 border-t border-slate-100">
              {image.caption}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlacedImages({ images, path, isDragModeActive, onRemove, onUpdate, filter = 'all' }: { images?: PlacedImage[], path: string, isDragModeActive: boolean, onRemove?: (index: number) => void, onUpdate?: (index: number, updates: Partial<PlacedImage>) => void, filter?: 'all' | 'floating' | 'centered' }) {
  if (!images || images.length === 0) return null;
  
  const filterImage = (img: PlacedImage) => {
    if (!img) return false;
    const initialWidth = img.width !== undefined ? img.width : (img.alignment === 'left' || img.alignment === 'right' ? 25 : 25);
    const isFloating = (img.alignment === 'left' || img.alignment === 'right') && initialWidth <= 65;
    
    if (filter === 'floating') return isFloating;
    if (filter === 'centered') return !isFloating;
    return true;
  };

  return (
    <>
      {images.map((img, i) => {
        if (!img || !filterImage(img)) return null;
        return (
          <DraggablePlacedImage 
            key={`${path}-${i}`} 
            id={`placed-${path}-${i}`} 
            image={img} 
            active={isDragModeActive} 
            path={path} 
            index={i} 
            onRemove={() => onRemove?.(i)} 
            onUpdate={(updates) => onUpdate?.(i, updates)}
          />
        );
      })}
    </>
  );
}

const GROUP_COLORS = [
  'border-blue-400 bg-blue-100/40',
  'border-emerald-400 bg-emerald-100/40',
  'border-purple-400 bg-purple-100/40',
  'border-amber-400 bg-amber-100/40',
  'border-rose-400 bg-rose-100/40',
  'border-cyan-400 bg-cyan-100/40',
  'border-lime-400 bg-lime-100/40',
  'border-fuchsia-400 bg-fuchsia-100/40',
  'border-orange-400 bg-orange-100/40',
  'border-indigo-400 bg-indigo-100/40',
  'border-pink-400 bg-pink-100/40',
  'border-teal-400 bg-teal-100/40',
];

function DraggableItemWrapper({ item, groupIndex, itemIndex, isDragModeActive, children }: { key?: React.Key, item: any, groupIndex: number, itemIndex: number, isDragModeActive: boolean, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `drag-item-${item.id}`,
    data: { type: 'document-item', groupIndex, itemIndex, item },
    disabled: !isDragModeActive
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "relative transition-all",
        isDragModeActive && "p-2 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 bg-white/50",
        isDragging && "opacity-50 scale-95 z-50 shadow-xl"
      )}
    >
      {isDragModeActive && (
        <div 
          {...listeners} 
          {...attributes}
          className="absolute top-2 right-2 bg-slate-800 text-white p-1 rounded text-xs z-10 cursor-grab active:cursor-grabbing"
        >
          <Move className="w-3 h-3" />
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}

function BrickItem({ item, groupIndex, itemIndex, isOrderingMode, isPresentation, imagePlacements, path, onRemoveImage, onUpdateImage, onUpdateItem, onZoneClick, groupColor, theme }: any) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `brick-${item.id}`,
    data: { type: 'document-item', groupIndex, itemIndex, item },
    disabled: selectedImageIndex !== null
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
  };

  const images = imagePlacements[path] || [];
  const beforeImages = imagePlacements[`${path}.before`] || [];

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative transition-all flex flex-col gap-3",
        isDragging 
          ? "bg-white border-2 rounded-2xl p-4 opacity-75 scale-95 shadow-2xl border-blue-500" 
          : "border-2 border-transparent hover:border-blue-200/50 rounded-xl p-2 -mx-2"
      )}
    >
      <div className={cn("flex items-start gap-4", !isDragging && "items-stretch")}>
        {/* Drag Handle */}
        <div 
          {...listeners} 
          {...attributes}
          className={cn(
            "mt-1 p-2 rounded-xl cursor-grab active:cursor-grabbing transition-colors shrink-0",
            isDragging 
              ? "bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600" 
              : "bg-slate-50/50 hover:bg-slate-100 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100"
          )}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isDragging ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border"
                  style={theme === 'comic' ? { color: '#000', borderColor: '#000', backgroundColor: '#fbbf24' } : { 
                    color: groupColor, 
                    borderColor: groupColor,
                    backgroundColor: getShade(groupColor, 0.95)
                  }}
                >
                  {item.TYPE}
                </span>
              </div>
              <div className="text-sm text-slate-600 line-clamp-3 font-medium">
                {item.CONTENT || JSON.stringify(item)}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {item.TYPE === 'IMG' && !item.CONTENT && (
                <div 
                  onClick={() => onZoneClick?.(path)}
                  className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group/upload"
                >
                  <ImageIcon className="w-8 h-8 mb-2 opacity-20 group-hover/upload:opacity-100 group-hover/upload:text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40 group-hover/upload:opacity-100 group-hover/upload:text-blue-500">Click to Upload Image</span>
                </div>
              )}
              <div className="pointer-events-none">
                <DocumentRenderer 
                  data={item} 
                  level={2} 
                  path={path} 
                  isDragModeActive={false} 
                  isOrderingMode={false} 
                  isPresentation={isPresentation}
                  imagePlacements={imagePlacements} 
                  onUpdateItem={onUpdateItem}
                  theme={theme} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Sideways Images (Visible in Ordering Mode) */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 max-w-[200px] shrink-0 items-center">
            {images.filter(Boolean).map((img: any, i: number) => (
              <div 
                key={i} 
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 group/img cursor-pointer"
              >
                <img src={img.url} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(i);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1 bg-white rounded-md text-blue-600 hover:bg-blue-50 shadow-sm"
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage?.(path, i);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1 bg-white rounded-md text-red-600 hover:bg-red-50 shadow-sm"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImageIndex !== null && (
        <ImageSettingsModal
          image={images[selectedImageIndex]}
          onClose={() => setSelectedImageIndex(null)}
          onUpdate={(updates) => onUpdateImage?.(path, selectedImageIndex, updates)}
          onRemove={() => {
            onRemoveImage?.(path, selectedImageIndex);
            setSelectedImageIndex(null);
          }}
        />
      )}

      {/* Add Image Zone (Visible in Ordering Mode) */}
      {!isDragging && (
        <div 
          onClick={() => onZoneClick?.(path)}
          className="h-8 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group/add"
        >
          <Plus className="w-4 h-4 text-slate-300 group-hover/add:text-blue-500 transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 group-hover/add:text-blue-500 ml-2">Add Image</span>
        </div>
      )}
    </div>
  );
}

function GroupRenderer({ group, groupIndex, level, path, isDragModeActive, isOrderingMode, isPresentation, imagePlacements, onZoneClick, onRemoveImage, onUpdateImage, onReorderGroupClick, selectedColors, theme = 'modern' }: { group: any, groupIndex: number, level: number, path: string, isDragModeActive: boolean, isOrderingMode: boolean, isPresentation: boolean, imagePlacements: Record<string, PlacedImage[]>, onZoneClick: (path: string) => void, onRemoveImage: (path: string, index: number) => void, onUpdateImage: (path: string, index: number, updates: Partial<PlacedImage>) => void, onReorderGroupClick: (groupIndex: number) => void, selectedColors: string[], theme?: Props['theme'] }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const defaultColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#a855f7', // purple
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#06b6d4', // cyan
  ];

  const colorsToUse = selectedColors && selectedColors.length > 0 ? selectedColors : defaultColors;
  const groupColor = colorsToUse[groupIndex % colorsToUse.length];
  const nextColor = colorsToUse[(groupIndex + 1) % colorsToUse.length];
  const lightBg = getShade(groupColor, 0.95);
  const borderColor = groupColor;

  const { setNodeRef, isOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: { type: 'group', groupIndex }
  });

  const renderFloatingImages = (currentPath: string) => {
    return <PlacedImages images={imagePlacements[currentPath]} path={currentPath} isDragModeActive={isDragModeActive} onRemove={(index) => onRemoveImage?.(currentPath, index)} onUpdate={(index, updates) => onUpdateImage?.(currentPath, index, updates)} filter="floating" />;
  };

  const renderDropAndImages = (currentPath: string) => (
    <>
      {isOrderingMode && <DroppableZone id={currentPath} active={isDragModeActive} onClick={() => onZoneClick?.(currentPath)} />}
      <PlacedImages images={imagePlacements[currentPath]} path={currentPath} isDragModeActive={isDragModeActive} onRemove={(index) => onRemoveImage?.(currentPath, index)} onUpdate={(index, updates) => onUpdateImage?.(currentPath, index, updates)} filter="centered" />
    </>
  );

  return (
    <ColorContext.Provider value={{ groupColor, nextColor, theme }}>
      <div 
        id={`doc-item-${path.replace(/\s+/g, '_')}`}
        ref={isDragModeActive ? setNodeRef : undefined}
        className={cn(
          "border-2 p-6 transition-all",
          theme === 'modern' && "rounded-2xl",
          theme === 'professional' && "rounded-xl border-slate-200 bg-white shadow-sm",
          theme === 'cyberpunk' && "rounded-none border-purple-500/50 bg-[#0a0a0f] shadow-[0_0_20px_rgba(168,85,247,0.1)]",
          theme === 'vintage' && "rounded-sm border-[#d4c5a1] bg-[#fdfbf7] shadow-inner",
          theme === 'terminal' && "rounded-none border-green-500 bg-black font-mono",
          theme === 'ethereal' && "rounded-[2rem] border-indigo-100 bg-white/80 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.05)]",
          theme === 'prism' && "rounded-3xl border-transparent bg-white shadow-xl relative overflow-hidden",
          theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#c6c6c6] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] p-6 font-pixel",
          theme === 'undertale' && "rounded-none border-2 border-white bg-black p-8 font-retro text-white",
          theme === 'god-of-war' && "rounded-none border-4 border-[#4a4a4a] bg-[#1a1a1a] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden",
          theme === 'cuphead' && "rounded-none border-4 border-black bg-[#f5f5dc] p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] relative",
          theme === 'comic' && "rounded-none border-4 border-black bg-white p-8 shadow-[12px_12px_0_rgba(0,0,0,1)] relative",
          isPresentation && "max-w-5xl mx-auto shadow-2xl",
          isOver && isDragModeActive ? "ring-4 ring-blue-400 scale-[1.01]" : ""
        )}
        style={{ 
          borderColor: (theme === 'modern' || theme === 'professional') ? borderColor : undefined,
          backgroundColor: (theme === 'modern' || theme === 'professional') ? (theme === 'professional' ? '#ffffff' : lightBg) : undefined,
          backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined
        }}
      >
        {theme === 'prism' && (
          <div 
            className="absolute top-0 left-0 w-full h-2" 
            style={{ backgroundImage: `linear-gradient(90deg, ${groupColor}, ${nextColor})` }}
          />
        )}
        {theme === 'god-of-war' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#8b0000_0%,transparent_70%)]" />
          </div>
        )}
        {theme === 'cuphead' && (
          <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        )}
        <div 
          className="flex items-center justify-between mb-6 group"
        >
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="w-6 h-6 transition-transform" style={{ color: groupColor }} />
            ) : (
              <ChevronDown className="w-6 h-6 transition-transform" style={{ color: groupColor }} />
            )}
            <h2 
              className={cn(
                "text-2xl font-bold transition-colors",
                theme === 'professional' && "font-serif text-slate-900 tracking-tight",
                theme === 'cyberpunk' && "uppercase tracking-widest font-mono italic",
                theme === 'vintage' && "font-serif italic",
                theme === 'terminal' && "uppercase font-mono text-green-500",
                theme === 'ethereal' && "font-serif text-indigo-900 tracking-tight",
                theme === 'prism' && "text-3xl font-black tracking-tighter italic",
                theme === 'minecraft' && "text-2xl text-[#373737] uppercase tracking-wider",
                theme === 'undertale' && "text-2xl text-white uppercase tracking-widest flex items-center gap-4",
                theme === 'god-of-war' && "text-3xl text-[#ffd700] uppercase tracking-[0.3em] font-serif flex items-center gap-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]",
                theme === 'cuphead' && "text-4xl text-black uppercase font-black tracking-tighter flex items-center gap-4 transform -rotate-2",
                theme === 'comic' && "text-4xl text-black uppercase font-black tracking-tighter flex items-center gap-4 transform -skew-x-12 bg-yellow-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]",
              )}
              style={{ 
                color: theme === 'modern' ? getShade(groupColor, -0.2) : 
                       (theme === 'professional' ? '#0f172a' :
                       (theme === 'cyberpunk' ? groupColor : 
                       (theme === 'terminal' ? '#22c55e' : 
                       (theme === 'ethereal' ? '#312e81' : 
                       (theme === 'prism' ? groupColor : 
                       (theme === 'minecraft' ? '#373737' : 
                       (theme === 'undertale' ? '#ffffff' : 
                       (theme === 'god-of-war' ? '#ffd700' : 
                       (theme === 'cuphead' ? '#000000' : 
                       (theme === 'comic' ? '#000000' : '#4a3728')))))))))) 
              }}
            >
              {theme === 'terminal' && "> "}
              {theme === 'undertale' && <span className="text-red-600">❤</span>}
              {theme === 'god-of-war' && <Sword className="w-8 h-8 text-[#8b0000]" />}
              {theme === 'cuphead' && <div className="w-10 h-10 rounded-full bg-red-600 border-4 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]" />}
              {theme === 'comic' && <Zap className="w-10 h-10 text-yellow-400 fill-yellow-400 stroke-black stroke-[3px]" />}
              <MarkdownContent content={group.GROUP} isPresentation={isPresentation} />
            </h2>
          </div>
          <button 
            className="opacity-50 hover:opacity-100 transition-all p-2 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer" 
            style={{ color: groupColor }}
            onClick={(e) => {
              e.stopPropagation();
              onReorderGroupClick?.(groupIndex);
            }}
            title="Reorder Group"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="flex flex-col gap-4 flow-root">
            {isOrderingMode ? (
              <SortableContext 
                items={group.ITEMS.map((item: any) => `brick-${item.id}`)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3">
                  {group.ITEMS.map((item: any, itemIndex: number) => (
                    <BrickItem 
                      key={item.id}
                      item={item}
                      groupIndex={groupIndex}
                      itemIndex={itemIndex}
                      isOrderingMode={isOrderingMode}
                      isPresentation={isPresentation}
                      imagePlacements={imagePlacements}
                      path={item.id}
                      onRemoveImage={onRemoveImage}
                      onUpdateImage={onUpdateImage}
                      onZoneClick={onZoneClick}
                      groupColor={groupColor}
                      theme={theme}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <>
                {renderFloatingImages(`${group.id}.start`)}
                {renderDropAndImages(`${group.id}.start`)}
                {group.ITEMS.map((item: any, itemIndex: number) => (
                  <React.Fragment key={item.id}>
                    <DraggableItemWrapper 
                      item={item} 
                      groupIndex={groupIndex} 
                      itemIndex={itemIndex} 
                      isDragModeActive={isDragModeActive}
                    >
                      <DocumentRenderer 
                        data={item} 
                        level={level + 1} 
                        path={item.id} 
                        isDragModeActive={isDragModeActive} 
                        isOrderingMode={isOrderingMode}
                        imagePlacements={imagePlacements} 
                        onZoneClick={onZoneClick} 
                        onRemoveImage={onRemoveImage} 
                        onUpdateImage={onUpdateImage}
                        onReorderGroupClick={onReorderGroupClick}
                        groupColor={groupColor}
                        theme={theme}
                      />
                    </DraggableItemWrapper>
                  </React.Fragment>
                ))}
                {renderFloatingImages(`${group.id}.end`)}
                {renderDropAndImages(`${group.id}.end`)}
              </>
            )}
          </div>
        )}
      </div>
    </ColorContext.Provider>
  );
}

function MemoryLinkPopover({ concept, children }: { concept: string, children: React.ReactNode }) {
  const { fullData } = React.useContext(DocumentContext);
  const { groupColor, theme } = React.useContext(ColorContext);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const occurrences = React.useMemo(() => {
    const results: { group: string, text: string, type: string, path: string }[] = [];
    if (!fullData || !Array.isArray(fullData)) return results;

    fullData.forEach((group: any, groupIdx: number) => {
      // Check if it's a grouped format or flat format
      if (group.GROUP && Array.isArray(group.ITEMS)) {
        const groupName = group.GROUP || 'Untitled Group';
        group.ITEMS.forEach((item: any, itemIdx: number) => {
          const content = String(item.CONTENT || '');
          const isMention = content.includes(`[[${concept}]]`);
          const isDefinition = item.TYPE === 'CONCEPT' && content.trim().toLowerCase() === concept.trim().toLowerCase();
          
          if (isMention || isDefinition) {
            const cleanText = content
              .replace(/\[\[([^\]]+)\]\]/g, '$1')
              .replace(/\[([^\]]+)\]\{([^}]+)\}/g, '$1');
            
            results.push({
              group: groupName,
              text: cleanText,
              type: item.TYPE,
              path: item.id || `root.${groupIdx}.${itemIdx}`
            });
          }
        });
      } else {
        // Flat format
        const content = String(group.CONTENT || '');
        const isMention = content.includes(`[[${concept}]]`);
        const isDefinition = group.TYPE === 'CONCEPT' && content.trim().toLowerCase() === concept.trim().toLowerCase();
        
        if (isMention || isDefinition) {
          const cleanText = content
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .replace(/\[([^\]]+)\]\{([^}]+)\}/g, '$1');
          
          results.push({
            group: 'General',
            text: cleanText,
            type: group.TYPE || 'ITEM',
            path: group.id || `root.${groupIdx}`
          });
        }
      }
    });
    return results;
  }, [fullData, concept]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    
    // Use a small timeout to ensure the popover is closed and document layout is stable
    setTimeout(() => {
      const sanitizedPath = path.replace(/\s+/g, '_');
      const elementId = `doc-item-${sanitizedPath}`;
      const element = document.getElementById(elementId);
      
      console.log(`Navigating to ${elementId}`, element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a temporary highlight effect
        const highlightClasses = ['ring-4', 'ring-blue-500/50', 'ring-offset-4', 'transition-all', 'duration-500', 'z-50', 'relative'];
        element.classList.add(...highlightClasses);
        
        setTimeout(() => {
          element.classList.remove(...highlightClasses);
        }, 2000);
      } else {
        console.warn(`Element with ID ${elementId} not found for path ${path}`);
      }
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const popoverContent = (
    <div 
      ref={popoverRef}
      className={cn(
        "fixed z-[9999] w-80 max-h-96 overflow-y-auto shadow-2xl border transition-all duration-300 animate-in fade-in zoom-in-95",
        theme === 'modern' && "bg-white border-slate-200 rounded-2xl p-6",
        theme === 'cyberpunk' && "bg-black border-cyan-500 rounded-none p-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]",
        theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm p-6",
        theme === 'terminal' && "bg-black border-green-500 rounded-none p-6 shadow-[0_0_20px_rgba(34,197,94,0.2)]",
        theme === 'ethereal' && "bg-white/95 backdrop-blur-xl border-indigo-100 rounded-[2rem] p-8",
        theme === 'prism' && "bg-white border-slate-200 rounded-3xl p-8 shadow-2xl",
        theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none p-4 shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
        theme === 'undertale' && "bg-black border-2 border-white rounded-none p-4",
        theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000] rounded-none p-6 shadow-[0_0_40px_rgba(139,0,0,0.4)]",
        theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none p-6 shadow-[8px_8px_0_rgba(0,0,0,1)]",
        theme === 'comic' && "bg-white border-4 border-black rounded-none p-6 shadow-[8px_8px_0_rgba(0,0,0,1)]"
      )}
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className={cn(
            "w-5 h-5",
            theme === 'modern' && "text-blue-500",
            theme === 'cyberpunk' && "text-cyan-400",
            theme === 'terminal' && "text-green-500",
            theme === 'god-of-war' && "text-[#ffd700]",
            theme === 'comic' && "text-black"
          )} />
          <h3 className={cn(
            "font-bold uppercase tracking-wider text-sm",
            theme === 'modern' && "text-slate-900",
            theme === 'cyberpunk' && "text-cyan-400 font-mono",
            theme === 'terminal' && "text-green-500 font-mono",
            theme === 'god-of-war' && "text-[#ffd700] font-serif",
            theme === 'comic' && "text-black font-black italic uppercase"
          )}>
            Memory Links: {concept}
          </h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="space-y-4">
        {occurrences.length <= 1 ? (
          <p className="text-sm text-slate-500 italic">No other occurrences found.</p>
        ) : (
          occurrences.map((occ, idx) => (
            <div 
              key={idx} 
              onClick={() => handleNavigate(occ.path)}
              className={cn(
                "p-3 rounded-xl border transition-all cursor-pointer group/item",
                theme === 'modern' && "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50",
                theme === 'cyberpunk' && "bg-cyan-950/20 border-cyan-500/30 hover:bg-cyan-900/30 hover:border-cyan-400",
                theme === 'terminal' && "bg-green-900/10 border-green-500/30 hover:bg-green-900/20 hover:border-green-400",
                theme === 'god-of-war' && "bg-[#8b0000]/10 border-[#8b0000]/30 hover:bg-[#8b0000]/20 hover:border-[#8b0000]",
                theme === 'comic' && "bg-white border-4 border-black hover:bg-yellow-100 hover:shadow-[4px_4px_0_rgba(0,0,0,1)]"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                  theme === 'modern' && "bg-blue-100 text-blue-700",
                  theme === 'cyberpunk' && "bg-cyan-500/20 text-cyan-400",
                  theme === 'terminal' && "bg-green-500/20 text-green-500",
                  theme === 'comic' && "bg-yellow-400 text-black border-2 border-black"
                )}>
                  {occ.group}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">{occ.type}</span>
              </div>
              <p className={cn(
                "text-xs leading-relaxed line-clamp-3",
                theme === 'modern' && "text-slate-600",
                theme === 'cyberpunk' && "text-cyan-100/70 font-mono",
                theme === 'terminal' && "text-green-400/70 font-mono",
                theme === 'comic' && "text-black font-bold italic"
              )}>
                {occ.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <span 
        onClick={() => setIsOpen(true)}
        data-memory-link={concept}
        className={cn(
          "cursor-pointer transition-all border-b-2 border-dashed print:border-none print:cursor-default",
          theme === 'modern' && "hover:bg-blue-50",
          theme === 'cyberpunk' && "hover:bg-cyan-400/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
          theme === 'terminal' && "hover:bg-green-500/10",
          theme === 'ethereal' && "hover:bg-indigo-50/50",
          theme === 'prism' && "hover:bg-indigo-50",
          theme === 'minecraft' && "hover:bg-white/20",
          theme === 'undertale' && "hover:bg-white/10",
          theme === 'god-of-war' && "hover:bg-[#8b0000]/20",
          theme === 'cuphead' && "hover:bg-white/20",
          theme === 'comic' && "hover:bg-yellow-100 font-bold italic"
        )}
        style={{ 
          color: groupColor || (theme === 'cyberpunk' ? '#22d3ee' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : (theme === 'undertale' ? '#ffff00' : (theme === 'cuphead' ? '#2563eb' : (theme === 'comic' ? '#000000' : '#2563eb')))))),
          borderColor: groupColor ? `${groupColor}60` : undefined
        }}
      >
        {children}
      </span>
      {isOpen && createPortal(popoverContent, document.body)}
    </>
  );
}

function ExplanationPopover({ data, children, isPresentation }: { data: string, children: React.ReactNode, isPresentation?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, groupColor, nextColor } = React.useContext(ColorContext);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const parts = data.split('|');
  const title = parts[0] || '';
  const def = parts[1] || '';
  const simple = parts[2] || '';
  const extra = parts[3] || '';

  return (
    <span className="relative inline-block explanation-wrapper" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "explanation-btn font-bold underline decoration-dashed decoration-2 underline-offset-4 cursor-pointer transition-colors relative z-10",
          theme === 'modern' && "hover:text-blue-800",
          theme === 'cyberpunk' && "text-cyan-400 hover:text-cyan-300 decoration-cyan-500/50",
          theme === 'vintage' && "text-[#8b4513] hover:text-[#5d4037] decoration-[#d4c5a1]",
          theme === 'terminal' && "text-green-400 hover:text-green-300 decoration-green-500/50",
          theme === 'ethereal' && "text-indigo-600 hover:text-indigo-800 decoration-indigo-300",
          theme === 'prism' && "text-transparent bg-clip-text decoration-slate-300",
          theme === 'minecraft' && "text-[#373737] hover:text-black decoration-[#373737]",
          theme === 'undertale' && "text-yellow-400 hover:text-yellow-300 decoration-yellow-400/50",
          theme === 'god-of-war' && "text-[#ffd700] hover:text-white decoration-[#8b0000]",
          theme === 'cuphead' && "text-red-600 hover:text-red-800 decoration-black",
          theme === 'comic' && "text-blue-600 hover:text-blue-800 decoration-black font-black italic"
        )}
        style={theme === 'prism' ? { backgroundImage: `linear-gradient(to right, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` } : (theme === 'modern' ? { color: groupColor } : {})}
      >
        {children}
      </button>
      <div 
        className={cn(
          "explanation-popover absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-5 text-left animate-in fade-in slide-in-from-bottom-2 duration-200",
          !isOpen && "hidden",
          theme === 'modern' && "rounded-2xl shadow-xl bg-white border border-slate-200",
            theme === 'cyberpunk' && "rounded-none bg-black/90 border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md",
            theme === 'vintage' && "rounded-sm bg-[#fdfbf7] border-2 border-[#d4c5a1] shadow-lg",
            theme === 'terminal' && "rounded-none bg-black border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
            theme === 'ethereal' && "rounded-3xl bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-[0_8px_32px_rgba(99,102,241,0.1)]",
            theme === 'prism' && "rounded-3xl bg-white shadow-2xl border-none",
            theme === 'minecraft' && "rounded-none bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
            theme === 'undertale' && "rounded-none bg-black border-2 border-white p-6",
            theme === 'god-of-war' && "rounded-none bg-[#1a1a1a] border-2 border-[#ffd700] shadow-[0_10px_30px_rgba(0,0,0,0.8)]",
            theme === 'cuphead' && "rounded-none bg-[#f5f5dc] border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
            theme === 'comic' && "rounded-none bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]"
          )}
        >
          {theme === 'prism' && (
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundImage: `linear-gradient(to right, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` }} />
          )}
          
          {/* Triangle pointer */}
          <div className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b",
            theme === 'modern' && "bg-white border-slate-200",
            theme === 'cyberpunk' && "bg-black border-cyan-500",
            theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1]",
            theme === 'terminal' && "bg-black border-green-500",
            theme === 'ethereal' && "bg-white border-indigo-100",
            theme === 'prism' && "bg-white border-transparent",
            theme === 'minecraft' && "bg-[#c6c6c6] border-[#373737]",
            theme === 'undertale' && "bg-black border-white",
            theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700]",
            theme === 'cuphead' && "bg-[#f5f5dc] border-black border-r-4 border-b-4",
            theme === 'comic' && "bg-white border-black border-r-4 border-b-4"
          )} />

          <div className="relative z-10">
            {title && (
              <div className={cn(
                "font-bold text-lg mb-2 flex items-center gap-2",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-cyan-400 font-mono uppercase",
                theme === 'vintage' && "text-[#4a3728] font-serif italic",
                theme === 'terminal' && "text-green-500 font-mono uppercase",
                theme === 'ethereal' && "text-indigo-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'minecraft' && "text-[#373737] font-pixel",
                theme === 'undertale' && "text-white font-retro tracking-widest",
                theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase tracking-widest",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic"
              )}>
                <Lightbulb className="w-5 h-5 flex-shrink-0" />
                <MarkdownContent content={title} isPresentation={isPresentation} />
              </div>
            )}
            
            {def && (
              <div className={cn(
                "mb-3",
                theme === 'modern' && "text-slate-700",
                theme === 'cyberpunk' && "text-cyan-100/80 font-mono text-sm",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-green-400/80 font-mono text-sm",
                theme === 'ethereal' && "text-indigo-800/80 font-serif",
                theme === 'prism' && "text-slate-600",
                theme === 'minecraft' && "text-[#373737] font-pixel",
                theme === 'undertale' && "text-gray-300 font-retro text-sm",
                theme === 'god-of-war' && "text-gray-300 font-serif",
                theme === 'cuphead' && "text-[#2c1e14] font-medium",
                theme === 'comic' && "text-black font-bold"
              )}>
                <MarkdownContent content={def} isPresentation={isPresentation} />
              </div>
            )}
            
            {simple && (
              <div className={cn(
                "p-3 mb-3",
                theme === 'modern' && "bg-blue-50 rounded-xl text-blue-800 font-medium",
                theme === 'cyberpunk' && "bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 font-mono text-sm",
                theme === 'vintage' && "bg-[#f4ecd8] border-l-2 border-[#d4c5a1] text-[#854d0e] font-serif italic",
                theme === 'terminal' && "bg-green-900/30 border-l-2 border-green-500 text-green-300 font-mono text-sm",
                theme === 'ethereal' && "bg-indigo-50/50 rounded-2xl text-indigo-900 font-medium",
                theme === 'prism' && "bg-slate-50 rounded-xl text-slate-700 font-medium",
                theme === 'minecraft' && "bg-[#a0a0a0] border-2 border-[#373737] text-[#1e1e1e] font-pixel p-2",
                theme === 'undertale' && "bg-gray-900 border border-gray-700 text-white font-retro text-sm p-2",
                theme === 'god-of-war' && "bg-[#8b0000]/20 border-l-4 border-[#8b0000] text-[#ffd700] font-serif p-2",
                theme === 'cuphead' && "bg-[#fef08a] border-2 border-black text-black font-bold p-2 shadow-[2px_2px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-yellow-400 border-4 border-black text-black font-black p-2 shadow-[4px_4px_0_rgba(0,0,0,1)]"
              )}>
                <MarkdownContent content={simple} isPresentation={isPresentation} />
              </div>
            )}
            
            {extra && (
              <div className={cn(
                "text-xs",
                theme === 'modern' && "text-slate-500 font-mono",
                theme === 'cyberpunk' && "text-purple-400 font-mono opacity-80",
                theme === 'vintage' && "text-[#8b4513] font-serif opacity-80",
                theme === 'terminal' && "text-green-600 font-mono",
                theme === 'ethereal' && "text-indigo-400 font-mono",
                theme === 'prism' && "text-slate-400 font-mono",
                theme === 'minecraft' && "text-[#555] font-pixel",
                theme === 'undertale' && "text-gray-500 font-retro",
                theme === 'god-of-war' && "text-gray-500 font-serif italic",
                theme === 'cuphead' && "text-gray-600 font-mono font-bold",
                theme === 'comic' && "text-gray-500 font-mono font-black italic uppercase"
              )}>
                <MarkdownContent content={extra} isPresentation={isPresentation} />
              </div>
            )}
          </div>
        </div>
    </span>
  );
}

export function MarkdownContent({ 
  content, 
  className, 
  disableExplanations = false, 
  asBlock = false,
  isReading = false,
  isPresentation = false,
  spokenText = '',
  spokenCharIndex = 0,
  highlightWords: propHighlightWords = [],
  missingWords: propMissingWords = []
}: { 
  content: string, 
  className?: string, 
  disableExplanations?: boolean, 
  asBlock?: boolean,
  isReading?: boolean,
  isPresentation?: boolean,
  spokenText?: string,
  spokenCharIndex?: number,
  highlightWords?: string[],
  missingWords?: string[]
}) {
  const { groupColor, nextColor, theme } = React.useContext(ColorContext);
  const { highlightWords: contextHighlightWords, missingWords: contextMissingWords } = React.useContext(DocumentContext);
  
  const highlightWords = propHighlightWords.length > 0 ? propHighlightWords : (contextHighlightWords || []);
  const missingWords = propMissingWords.length > 0 ? propMissingWords : (contextMissingWords || []);
  
  // Simple regex to support [c:color]text[/c] for color coding
  // and ==text== for highlighting
  let processedContent = content.replace(/\[c:([^\]]+)\]([^\[]*)\[\/c\]/g, (match, color, text) => {
    return `<span style="color: ${color}">${text}</span>`;
  });
  
  processedContent = processedContent.replace(/==([^=]+)==/g, (match, text) => {
    return `<mark>${text}</mark>`;
  });

  // Parse [term]{title|def|simple|extra} into <explanation>
  if (!disableExplanations) {
    processedContent = processedContent.replace(/\[([^\]]+)\]\{([^}]+)\}/g, (match, term, data) => {
      const safeData = data.replace(/"/g, '&quot;');
      return `<explanation data="${safeData}">${term}</explanation>`;
    });

    // Parse [[concept]] into <memorylink>
    processedContent = processedContent.replace(/\[\[([^\]]+)\]\]/g, (match, concept) => {
      return `<memorylink concept="${concept}">${concept}</memorylink>`;
    });
  } else {
    // Just render the term as plain text
    processedContent = processedContent.replace(/\[([^\]]+)\]\{([^}]+)\}/g, (match, term, data) => {
      return term;
    });

    // Just render the concept as plain text
    processedContent = processedContent.replace(/\[\[([^\]]+)\]\]/g, (match, concept) => {
      return concept;
    });
  }
  
  const boldColor = groupColor ? getShade(groupColor, -0.4) : undefined;
  const italicColor = groupColor ? getShade(groupColor, -0.2) : undefined;
  const markBg = groupColor ? getShade(groupColor, 0.8) : '#fef08a';
  const markText = groupColor ? getShade(groupColor, -0.6) : '#854d0e';
  
  const Wrapper = asBlock ? 'div' : 'span';

  const getSyntaxStyle = () => {
    switch (theme) {
      case 'cyberpunk': return dracula;
      case 'vintage': return tomorrow;
      case 'terminal': return vscDarkPlus;
      case 'ethereal':
      case 'prism':
      case 'cuphead':
      case 'comic': return oneLight;
      default: return vscDarkPlus;
    }
  };

  const syntaxStyle = getSyntaxStyle();
  
  const wordCounterRef = React.useRef(0);

  const activeWordIndex = React.useMemo(() => {
    if (!isReading || !spokenText) return -1;
    // Count words in spokenText up to spokenCharIndex
    const textBefore = spokenText.substring(0, spokenCharIndex).trim();
    if (!textBefore) return 0;
    return textBefore.split(/\s+/).length;
  }, [isReading, spokenText, spokenCharIndex]);

  const renderTextWithHighlight = (node: any): any => {
    if (typeof node === 'string') {
      const parts = node.split(/(\s+)/);
      
      return parts.map((part, i) => {
        if (!part) return null;
        
        const isWord = /[^\s]+/.test(part);
        
        if (!isWord) {
          return <span key={i}>{part}</span>;
        }

        const currentIndex = wordCounterRef.current;
        if (isReading) wordCounterRef.current++;
        
        const isSpoken = isReading && currentIndex === activeWordIndex;
        const isPast = isReading && currentIndex < activeWordIndex;

        // Check for Blurting Mode highlight
        const isBlurtHighlighted = highlightWords?.some(hw => isFuzzyMatch(hw, part));
        const isMissingHighlighted = missingWords?.some(mw => isFuzzyMatch(mw, part));
        
        return (
          <span 
            key={i} 
            className={cn(
              "transition-all duration-300 inline-block px-0.5 rounded",
              isSpoken ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] font-bold" : 
              isPast ? "opacity-50" : "",
              isBlurtHighlighted && "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] font-bold scale-105",
              isMissingHighlighted && "text-red-500/80 bg-red-50/50 line-through decoration-red-400/50"
            )}
          >
            {part}
          </span>
        );
      });
    }

    if (Array.isArray(node)) {
      return node.map((child, i) => <React.Fragment key={i}>{renderTextWithHighlight(child)}</React.Fragment>);
    }

    if (React.isValidElement(node)) {
      return React.cloneElement(node as React.ReactElement, {
        ...(node.props as any),
        children: renderTextWithHighlight((node.props as any).children)
      });
    }

    return node;
  };

  // Reset word counter before each render pass
  wordCounterRef.current = 0;

  return (
    <Wrapper className={cn("markdown-content", !asBlock && "inline", isPresentation && "text-xl sm:text-2xl leading-relaxed", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => asBlock ? <p className="mb-4 last:mb-0">{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</p> : <span className="inline">{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</span>,
          strong: ({ children }) => (
            <strong 
              className={cn("font-bold", theme === 'prism' && "text-transparent bg-clip-text", theme === 'god-of-war' && "text-[#ffd700] uppercase tracking-wider", theme === 'cuphead' && "text-black font-black", theme === 'comic' && "text-black font-black italic uppercase")} 
              style={theme === 'prism' ? { backgroundImage: `linear-gradient(to right, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` } : (theme === 'god-of-war' || theme === 'cuphead' || theme === 'comic' ? {} : { color: boldColor })}
            >
              {(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}
            </strong>
          ),
          em: ({ children }) => <em className={cn("italic", theme === 'god-of-war' && "text-[#8b0000]", theme === 'cuphead' && "text-[#4a3728]", theme === 'comic' && "text-blue-600 font-bold")} style={theme === 'god-of-war' || theme === 'cuphead' || theme === 'comic' ? {} : { color: italicColor }}>{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</em>,
          del: ({ children }) => <del className="opacity-50 line-through">{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</del>,
          mark: ({ children }) => (
            <mark 
              className={cn("px-1 rounded-sm font-medium", theme === 'prism' && "text-white shadow-sm", theme === 'god-of-war' && "bg-[#8b0000] text-white px-2 py-0.5 rounded-none", theme === 'cuphead' && "bg-[#fef08a] text-black border-2 border-black px-2 py-0.5 rounded-none", theme === 'comic' && "bg-yellow-400 text-black border-4 border-black px-2 py-0.5 rounded-none shadow-[2px_2px_0_rgba(0,0,0,1)] font-black")} 
              style={theme === 'prism' ? { backgroundImage: `linear-gradient(to right, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` } : (theme === 'god-of-war' || theme === 'cuphead' || theme === 'comic' ? {} : { backgroundColor: markBg, color: markText })}
            >
              {(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}
            </mark>
          ),
          explanation: ({ node, children, ...props }: any) => (
            <ExplanationPopover data={props.data} isPresentation={isPresentation}>{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</ExplanationPopover>
          ),
          memorylink: ({ node, children, ...props }: any) => (
            <MemoryLinkPopover concept={props.concept}>{(isReading || (highlightWords && highlightWords.length > 0)) ? renderTextWithHighlight(children) : children}</MemoryLinkPopover>
          ),
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, '')}
                style={syntaxStyle}
                language={match[1]}
                PreTag="div"
                customStyle={{ 
                  borderRadius: '0.5rem', 
                  padding: '1rem', 
                  fontSize: '0.875em', 
                  marginTop: '1rem', 
                  marginBottom: '1rem',
                  background: theme === 'terminal' ? 'rgba(0,0,0,0.8)' : 
                              theme === 'cyberpunk' ? 'rgba(0,0,0,0.6)' :
                              theme === 'vintage' ? 'rgba(244,236,216,0.4)' :
                              theme === 'ethereal' ? 'rgba(255,255,255,0.4)' :
                              theme === 'prism' ? 'rgba(255,255,255,0.6)' :
                              theme === 'god-of-war' ? 'rgba(0,0,0,0.6)' :
                              theme === 'cuphead' ? 'rgba(245,245,220,0.6)' :
                              theme === 'comic' ? 'rgba(255,255,255,0.6)' :
                              undefined,
                  border: theme === 'terminal' ? '1px solid rgba(34,197,94,0.5)' :
                          theme === 'cyberpunk' ? '1px solid rgba(217,70,239,0.3)' :
                          theme === 'vintage' ? '1px solid rgba(212,163,115,0.3)' :
                          theme === 'god-of-war' ? '1px solid rgba(139,0,0,0.5)' :
                          theme === 'cuphead' ? '2px solid black' :
                          theme === 'comic' ? '4px solid black' :
                          undefined
                }}
              />
            ) : (
              <code {...props} className={cn(
                "px-1.5 py-0.5 rounded-md text-[0.9em]",
                theme === 'terminal' ? "bg-black text-green-400 border border-green-500/30" :
                theme === 'cyberpunk' ? "bg-black text-cyan-400 border border-fuchsia-500/30" :
                theme === 'vintage' ? "bg-[#d4a373]/20 text-[#4a3728] border border-[#d4a373]/30" :
                theme === 'ethereal' ? "bg-indigo-50 text-indigo-900 border border-indigo-100" :
                theme === 'prism' ? "bg-slate-100 text-slate-800 border border-slate-200" :
                theme === 'god-of-war' ? "bg-black text-[#ffd700] border border-[#8b0000]/50" :
                theme === 'cuphead' ? "bg-[#f5f5dc] text-black border-2 border-black" :
                theme === 'comic' ? "bg-white text-black border-4 border-black font-bold" :
                "bg-slate-800 text-slate-200",
                className
              )}>
                {children}
              </code>
            )
          }
        } as any}
      >
        {processedContent}
      </ReactMarkdown>
    </Wrapper>
  );
}

export default function DocumentRenderer({ 
  data, 
  level = 1, 
  path = "root", 
  isDragModeActive = false, 
  isOrderingMode = false, 
  isPresentation = false,
  highlightWords = [],
  missingWords = [],
  imagePlacements = {}, 
  onZoneClick, 
  onRemoveImage, 
  onUpdateImage, 
  onUpdateItem,
  onReorderGroupClick, 
  selectedColors, 
  groupColor: inheritedGroupColor,
  nextColor: inheritedNextColor,
  theme = 'modern',
}: Props & { nextColor?: string }) {
  const { groupColor: contextGroupColor, nextColor: contextNextColor } = React.useContext(ColorContext);
  const groupColor = inheritedGroupColor || contextGroupColor;
  const nextColor = inheritedNextColor || contextNextColor;

  const sanitizedPath = path.replace(/\s+/g, '_');

  if (data === null || data === undefined) return null;

  const renderFloatingImages = (currentPath: string) => {
    return <PlacedImages images={imagePlacements[currentPath]} path={currentPath} isDragModeActive={isDragModeActive} onRemove={(index) => onRemoveImage?.(currentPath, index)} onUpdate={(index, updates) => onUpdateImage?.(currentPath, index, updates)} filter="floating" />;
  };

  const renderDropAndImages = (currentPath: string) => (
    <>
      {isOrderingMode && <DroppableZone id={currentPath} active={isDragModeActive} onClick={() => onZoneClick?.(currentPath)} />}
      <PlacedImages images={imagePlacements[currentPath]} path={currentPath} isDragModeActive={isDragModeActive} onRemove={(index) => onRemoveImage?.(currentPath, index)} onUpdate={(index, updates) => onUpdateImage?.(currentPath, index, updates)} filter="centered" />
    </>
  );

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    const text = String(data);
    const lowerText = text.toLowerCase();
    
    // Simple heuristic for highlighting
    const isImportant = lowerText.includes('important') || lowerText.includes('warning') || lowerText.includes('red flag') || lowerText.includes('complication') || lowerText.includes('treatment') || lowerText.includes('diagnosis');
    const isHighlight = lowerText.includes('highlight') || lowerText.includes('note');

    return (
      <div id={`doc-item-${sanitizedPath}`} className={cn("break-inside-avoid flow-root", isPresentation && "max-w-4xl mx-auto")}>
        {renderFloatingImages(`${path}.before`)}
        {renderDropAndImages(`${path}.before`)}
        {renderFloatingImages(path)}
        <div className={cn(
          "mb-3 leading-relaxed transition-all",
          theme === 'modern' && "text-slate-700",
          theme === 'professional' && "text-slate-800 font-sans leading-relaxed",
          theme === 'cyberpunk' && "text-purple-100 font-mono",
          theme === 'vintage' && "text-[#4a3728] font-serif italic",
          theme === 'terminal' && "text-green-400 font-mono",
          theme === 'ethereal' && "text-indigo-900/80 font-serif leading-loose",
          theme === 'prism' && "text-slate-700 font-sans",
          theme === 'god-of-war' && "text-slate-300 font-serif",
          theme === 'cuphead' && "text-[#2c1e14] font-sans font-medium",
          theme === 'comic' && "text-black font-bold italic",
          isImportant && theme === 'modern' && "text-red-600 font-semibold bg-red-50 px-2 py-1 rounded border-l-4 border-red-500",
          isImportant && theme === 'professional' && "text-red-900 font-medium bg-red-50 px-4 py-3 rounded-r-lg border-l-4 border-red-600 shadow-sm",
          isImportant && theme === 'cyberpunk' && "text-red-400 font-bold bg-red-950/30 px-2 py-1 rounded border-l-4 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
          isImportant && theme === 'vintage' && "text-red-900 font-bold bg-red-100/50 px-2 py-1 border-2 border-red-900/20 rounded-sm",
          isImportant && theme === 'terminal' && "text-red-500 font-bold border-2 border-red-500 px-2 py-1 bg-red-500/10",
          isImportant && theme === 'ethereal' && "text-rose-900 font-medium bg-rose-50/50 px-3 py-2 rounded-2xl border border-rose-100",
          isImportant && theme === 'prism' && "text-white font-bold p-4 rounded-2xl shadow-lg",
          isImportant && theme === 'god-of-war' && "text-white font-bold bg-[#8b0000] p-4 border-l-8 border-[#ffd700] uppercase tracking-widest",
          isImportant && theme === 'cuphead' && "text-black font-black bg-white p-4 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform rotate-1",
          isImportant && theme === 'comic' && "text-white font-black bg-red-600 p-6 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] transform -skew-x-6 uppercase tracking-tighter italic",
          isHighlight && theme === 'modern' && "bg-yellow-100 px-2 py-1 rounded text-amber-900 font-medium",
          isHighlight && theme === 'professional' && "bg-blue-50 px-3 py-1 rounded-md text-blue-900 font-medium border border-blue-100",
          isHighlight && theme === 'cyberpunk' && "bg-yellow-400/20 px-2 py-1 rounded text-yellow-300 font-bold border border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]",
          isHighlight && theme === 'vintage' && "bg-[#f4ecd8] px-2 py-1 rounded-sm text-[#854d0e] font-serif border-b-2 border-[#d4c5a1]",
          isHighlight && theme === 'terminal' && "bg-green-500 text-black px-1 font-bold",
          isHighlight && theme === 'ethereal' && "bg-amber-100/40 px-2 py-1 rounded-full text-amber-900 italic border border-amber-200/50",
          isHighlight && theme === 'prism' && "px-3 py-1 rounded-lg font-bold shadow-sm",
          isHighlight && theme === 'god-of-war' && "bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700] px-3 py-1 font-bold italic",
          isHighlight && theme === 'cuphead' && "bg-[#fef08a] text-black border-2 border-black px-3 py-1 font-black shadow-[2px_2px_0_rgba(0,0,0,1)]",
          isHighlight && theme === 'comic' && "bg-yellow-400 text-black border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform skew-x-12 italic uppercase"
        )}
        style={{
          backgroundImage: isImportant && theme === 'prism' ? `linear-gradient(135deg, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` : 
                      isHighlight && theme === 'prism' ? `linear-gradient(to right, ${groupColor || '#fef08a'}, ${nextColor || '#fef3c7'})` : undefined,
          color: isHighlight && theme === 'prism' ? '#ffffff' : undefined
        }}
      >
          <MarkdownContent content={text} isPresentation={isPresentation} />
        </div>
        {renderDropAndImages(path)}
      </div>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return null;

    const isGroupArray = data.length > 0 && data.every(item => item && typeof item === 'object' && item.GROUP && item.ITEMS);
    
    if (isGroupArray) {
      return (
        <div className="flex flex-col gap-16 flow-root">
          {data.map((group, i) => (
            <GroupRenderer 
              key={group.id} 
              group={group} 
              groupIndex={i} 
              level={level} 
              path={`${path}.${i}`} 
              isDragModeActive={isDragModeActive} 
              isOrderingMode={isOrderingMode}
              isPresentation={isPresentation}
              imagePlacements={imagePlacements} 
              onZoneClick={onZoneClick} 
              onRemoveImage={onRemoveImage} 
              onUpdateImage={onUpdateImage}
              onReorderGroupClick={onReorderGroupClick}
              selectedColors={selectedColors}
              theme={theme}
            />
          ))}
        </div>
      );
    }

    // Check if it's an array of TYPE/CONTENT objects
    const isTypeContentArray = data.length > 0 && data.every(item => item && typeof item === 'object' && item.TYPE);
    
    if (isTypeContentArray) {
      return (
        <div className="relative flex flex-col gap-2 flow-root">
          {renderFloatingImages(`${path}.before`)}
          {renderDropAndImages(`${path}.before`)}
          {renderFloatingImages(path)}
          {data.map((item, i) => (
            <React.Fragment key={i}>
              <DocumentRenderer 
                data={item} 
                level={level} 
                path={item.id || `${path}.${i}`} 
                isDragModeActive={isDragModeActive} 
                isOrderingMode={isOrderingMode}
                imagePlacements={imagePlacements} 
                onZoneClick={onZoneClick} 
                onRemoveImage={onRemoveImage} 
                onUpdateImage={onUpdateImage} 
                onReorderGroupClick={onReorderGroupClick} 
                theme={theme}
              />
            </React.Fragment>
          ))}
          {renderDropAndImages(path)}
        </div>
      );
    }

    // Check if it's an array of objects (render as table)
    const isTable = typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0]);
    
    if (isTable) {
      const keys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
      
      return (
        <div className="break-inside-avoid flow-root">
          {renderFloatingImages(`${path}.before`)}
          {renderDropAndImages(`${path}.before`)}
          {renderFloatingImages(path)}
          <div className={cn(
            "overflow-x-auto mb-6 transition-all",
            theme === 'modern' && "rounded-xl border border-slate-200 shadow-sm",
            theme === 'professional' && "rounded-lg border border-slate-200 shadow-sm bg-white",
            theme === 'cyberpunk' && "border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-black/80 backdrop-blur-sm",
            theme === 'vintage' && "border-2 border-[#d4a373] bg-[#fff9f0] p-1",
            theme === 'terminal' && "border-2 border-green-500 bg-black",
            theme === 'ethereal' && "rounded-3xl border border-indigo-100 bg-white/60 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.05)]",
            theme === 'prism' && "rounded-2xl bg-white shadow-xl border-none relative",
            theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] p-1",
            theme === 'undertale' && "bg-black border-4 border-white p-2",
            theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000] shadow-[0_10px_30px_rgba(0,0,0,0.8)]",
            theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]",
            theme === 'comic' && "bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]"
          )}>
            <table className={cn(
              "min-w-full",
              (theme === 'modern' || theme === 'prism' || theme === 'ethereal') && "divide-y",
              theme === 'modern' && "divide-slate-200",
              theme === 'ethereal' && "divide-indigo-50/50",
              theme === 'prism' && "divide-slate-100",
              (theme === 'vintage' || theme === 'minecraft' || theme === 'undertale' || theme === 'god-of-war' || theme === 'cuphead') && "border-collapse",
              theme === 'cyberpunk' && "divide-y divide-cyan-500/30",
              theme === 'terminal' && "divide-y divide-green-500/50"
            )}>
              <thead className={cn(
                theme === 'modern' && "bg-slate-50",
                theme === 'professional' && "bg-slate-50 border-b border-slate-200",
                theme === 'cyberpunk' && "bg-cyan-950/40",
                theme === 'vintage' && "border-b-2 border-[#d4a373]",
                theme === 'terminal' && "bg-green-900/30",
                theme === 'ethereal' && "border-b border-indigo-100/50",
                theme === 'prism' && "bg-slate-50/50",
                theme === 'minecraft' && "bg-[#8b8b8b] border-b-4 border-[#373737]",
                theme === 'undertale' && "border-b-4 border-white",
                theme === 'god-of-war' && "bg-[#8b0000]/20 border-b-2 border-[#ffd700]",
                theme === 'cuphead' && "bg-[#fef08a] border-b-4 border-black"
              )}>
                <tr>
                  {keys.map(k => (
                      <th key={k} className={cn(
                        "px-6 py-3 text-left uppercase",
                        theme === 'modern' && "text-[0.75em] font-bold text-slate-500 tracking-wider",
                        theme === 'professional' && "text-[0.75em] font-bold text-slate-600 tracking-wider font-sans",
                        theme === 'cyberpunk' && "text-[0.75em] font-bold text-cyan-400 tracking-widest font-mono",
                        theme === 'vintage' && "text-[0.85em] font-bold text-[#8b4513] tracking-wider font-serif",
                        theme === 'terminal' && "text-[0.75em] font-bold text-green-400 tracking-widest font-mono",
                        theme === 'ethereal' && "text-[0.75em] font-bold text-indigo-400 tracking-widest font-serif",
                        theme === 'prism' && "text-[0.75em] font-black text-slate-400 tracking-widest",
                        theme === 'minecraft' && "px-4 text-[0.75em] text-white font-pixel drop-shadow-[2px_2px_0_#373737]",
                        theme === 'undertale' && "px-4 text-[0.85em] text-yellow-400 font-retro",
                        theme === 'god-of-war' && "text-[0.85em] text-[#ffd700] font-serif tracking-widest",
                        theme === 'cuphead' && "text-[0.85em] text-black font-black tracking-wider",
                        theme === 'comic' && "text-[0.85em] text-black font-black uppercase tracking-tight"
                      )}>
                        <MarkdownContent content={k} disableExplanations isPresentation={isPresentation} />
                      </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn(
                theme === 'modern' && "bg-white divide-y divide-slate-200",
                theme === 'cyberpunk' && "divide-y divide-cyan-500/20",
                theme === 'vintage' && "divide-y divide-[#d4a373]/30",
                theme === 'terminal' && "divide-y divide-green-500/30",
                theme === 'ethereal' && "divide-y divide-indigo-50/50",
                theme === 'prism' && "divide-y divide-slate-100",
                theme === 'minecraft' && "divide-y-4 divide-[#8b8b8b]",
                theme === 'undertale' && "divide-y-2 divide-white/30",
                theme === 'god-of-war' && "divide-y divide-[#4a4a4a]",
                theme === 'cuphead' && "divide-y-2 divide-black"
              )}>
                {data.map((row, i) => (
                  <tr key={i} className={cn(
                    "transition-colors",
                    theme === 'modern' && (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-blue-50/50'),
                    theme === 'professional' && (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30 hover:bg-slate-50'),
                    theme === 'cyberpunk' && (i % 2 === 0 ? 'bg-transparent' : 'bg-cyan-950/20 hover:bg-cyan-900/40'),
                    theme === 'vintage' && (i % 2 === 0 ? 'bg-transparent' : 'bg-[#f4ecd8]/50 hover:bg-[#e6d5b8]/50'),
                    theme === 'terminal' && 'hover:bg-green-900/40',
                    theme === 'ethereal' && 'hover:bg-indigo-50/30',
                    theme === 'prism' && (i % 2 === 0 ? 'bg-transparent' : 'bg-slate-50/30 hover:bg-slate-50'),
                    theme === 'minecraft' && (i % 2 === 0 ? 'bg-transparent' : 'bg-[#b0b0b0] hover:bg-[#a0a0a0]'),
                    theme === 'undertale' && 'hover:bg-white/10',
                    theme === 'god-of-war' && (i % 2 === 0 ? 'bg-transparent' : 'bg-[#2a2a2a] hover:bg-[#8b0000]/10'),
                    theme === 'cuphead' && (i % 2 === 0 ? 'bg-transparent' : 'bg-[#e8e8d0] hover:bg-[#fef08a]/50'),
                    theme === 'comic' && (i % 2 === 0 ? 'bg-transparent' : 'bg-yellow-50 hover:bg-yellow-100')
                  )}>
                    {keys.map(k => (
                      <td key={k} className={cn(
                        "px-6 py-4 text-[0.875em] whitespace-pre-wrap",
                        theme === 'modern' && "text-slate-700",
                        theme === 'professional' && "text-slate-700 font-sans",
                        theme === 'cyberpunk' && "text-cyan-100 font-mono",
                        theme === 'vintage' && "text-[#5d4037] font-serif",
                        theme === 'terminal' && "text-green-300 font-mono",
                        theme === 'ethereal' && "text-indigo-900/80 font-serif",
                        theme === 'prism' && "text-slate-700 font-medium",
                        theme === 'minecraft' && "px-4 py-3 text-[#373737] font-pixel",
                        theme === 'undertale' && "px-4 py-4 text-white font-retro",
                        theme === 'god-of-war' && "text-slate-300 font-serif",
                        theme === 'cuphead' && "text-[#2c1e14] font-medium",
                        theme === 'comic' && "text-black font-bold italic"
                      )}>
                        {row[k] !== undefined ? (
                          <MarkdownContent content={typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])} disableExplanations isPresentation={isPresentation} />
                        ) : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderDropAndImages(path)}
        </div>
      );
    }

    // Render as bullet list
    return (
      <div id={`doc-item-${sanitizedPath}`} className="break-inside-avoid flow-root">
        {renderFloatingImages(`${path}.before`)}
        {renderDropAndImages(`${path}.before`)}
        {renderFloatingImages(path)}
        <ul className={cn(
          "list-disc pl-6 mb-6 space-y-2",
          theme === 'modern' && "marker:text-blue-400",
          theme === 'professional' && "marker:text-slate-400",
          theme === 'cyberpunk' && "marker:text-purple-500",
          theme === 'vintage' && "marker:text-[#8b4513]",
          theme === 'terminal' && "list-none pl-0",
          theme === 'ethereal' && "marker:text-indigo-200"
        )}>
          {data.map((item, i) => (
            <li key={i} className={cn(
              theme === 'modern' && "text-slate-700",
              theme === 'professional' && "text-slate-700 font-sans",
              theme === 'cyberpunk' && "text-purple-100 font-mono",
              theme === 'vintage' && "text-[#5d4037] font-serif",
              theme === 'terminal' && "text-green-400 font-mono before:content-['>'] before:mr-2",
              theme === 'ethereal' && "text-indigo-900/80 font-serif"
            )}>
              <DocumentRenderer data={item} level={level + 1} path={`${path}.${i}`} isDragModeActive={isDragModeActive} isOrderingMode={isOrderingMode} imagePlacements={imagePlacements} onZoneClick={onZoneClick} onRemoveImage={onRemoveImage} onUpdateImage={onUpdateImage} onUpdateItem={onUpdateItem} onReorderGroupClick={onReorderGroupClick} theme={theme} />
            </li>
          ))}
        </ul>
        {renderDropAndImages(path)}
      </div>
    );
  }

  if (typeof data === 'object') {
    if (data.TYPE && data.CONTENT !== undefined) {
      const type = String(data.TYPE).toUpperCase();
      const content = String(data.CONTENT);

      let renderedContent = null;

      switch (type) {
        case 'TITLE':
          renderedContent = (
            <h1 
              className={cn(
                "mb-6 mt-8 transition-all",
                theme === 'modern' && "text-4xl font-extrabold text-slate-900 border-b-4 pb-4",
                theme === 'professional' && "text-4xl font-serif text-slate-900 border-b-2 border-slate-900 pb-4 tracking-tight",
                theme === 'cyberpunk' && "text-5xl font-black text-white uppercase tracking-tighter italic border-l-8 pl-6 py-2 bg-gradient-to-r from-purple-900/20 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.1)]",
                theme === 'vintage' && "text-4xl font-serif text-[#2c1e14] border-double border-b-4 pb-4 text-center italic",
                theme === 'terminal' && "text-4xl font-mono text-green-500 border-2 border-green-500 p-4 uppercase text-center bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.2)]",
                theme === 'ethereal' && "text-5xl font-serif text-indigo-900 text-center tracking-tight font-light italic border-b border-indigo-100 pb-8 mb-12",
                theme === 'prism' && "text-6xl font-black tracking-tighter italic text-center mb-16 mt-12 text-transparent bg-clip-text drop-shadow-sm",
                theme === 'minecraft' && "text-5xl font-pixel text-[#373737] text-center uppercase tracking-widest mb-12 p-8 bg-[#c6c6c6] border-8 border-[#373737] shadow-[inset_-8px_-8px_0_#555,inset_8px_8px_0_#fff]",
                theme === 'undertale' && "text-6xl font-retro text-yellow-400 text-center uppercase tracking-[0.2em] mb-16 drop-shadow-[0_4px_0_#000]",
                theme === 'god-of-war' && "text-6xl font-serif text-[#ffd700] text-center uppercase tracking-[0.4em] mb-16 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] border-b-4 border-[#8b0000] pb-8",
                theme === 'cuphead' && "text-7xl font-black text-black text-center uppercase tracking-tighter mb-16 transform -rotate-3 border-8 border-black p-8 bg-white shadow-[12px_12px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "text-7xl font-black text-black text-center uppercase tracking-tighter mb-16 transform -skew-x-6 border-8 border-black p-10 bg-yellow-400 shadow-[16px_16px_0_rgba(0,0,0,1)] relative after:content-[''] after:absolute after:inset-0 after:border-4 after:border-white/30 after:pointer-events-none"
              )} 
              style={{ 
                borderBottomColor: theme !== 'cyberpunk' && theme !== 'terminal' && theme !== 'ethereal' && theme !== 'prism' && theme !== 'god-of-war' && theme !== 'cuphead' && theme !== 'comic' ? (groupColor || '#f1f5f9') : undefined,
                borderLeftColor: theme === 'cyberpunk' ? (groupColor || '#a855f7') : undefined,
                color: theme === 'cyberpunk' ? (groupColor || undefined) : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(to bottom right, ${groupColor || '#0f172a'}, ${nextColor || '#334155'})` : undefined
              }}
            >
              {theme === 'terminal' && "[ "}
              <MarkdownContent content={content} isPresentation={isPresentation} />
              {theme === 'terminal' && " ]"}
            </h1>
          );
          break;
        case 'SUBHEADER':
          renderedContent = (
            <h2 
              className={cn(
                "mb-4 mt-6 flex items-center transition-all",
                theme === 'modern' && "text-2xl font-bold text-slate-900",
                theme === 'professional' && "text-2xl font-serif text-slate-800 border-b border-slate-200 pb-2",
                theme === 'cyberpunk' && "text-2xl font-bold text-cyan-400 font-mono uppercase tracking-widest border-b border-cyan-500/30 pb-1",
                theme === 'vintage' && "text-2xl font-serif text-[#4a3728] border-b border-[#d4c5a1] pb-1 italic",
                theme === 'terminal' && "text-xl font-mono text-amber-500 uppercase before:content-['#'] before:mr-2 border-b border-amber-500/30 pb-1",
                theme === 'ethereal' && "text-2xl font-serif text-indigo-800/70 border-b border-indigo-50 pb-2 font-medium tracking-wide",
                theme === 'prism' && "text-3xl font-black tracking-tighter italic text-transparent bg-clip-text mb-6 mt-10",
                theme === 'minecraft' && "text-3xl font-pixel text-[#373737] uppercase border-b-4 border-[#373737] pb-2 mb-6",
                theme === 'undertale' && "text-2xl font-retro text-white uppercase tracking-widest border-b-2 border-white pb-2 mb-6 flex items-center gap-3",
                theme === 'god-of-war' && "text-3xl font-serif text-[#ffd700] uppercase tracking-[0.2em] border-b-2 border-[#8b0000] pb-2 mb-8 flex items-center gap-4",
                theme === 'cuphead' && "text-4xl font-black text-black uppercase tracking-tighter mb-8 flex items-center gap-4 transform rotate-1",
                theme === 'comic' && "text-4xl font-black text-black uppercase tracking-tighter mb-8 flex items-center gap-4 transform -skew-x-12 bg-white px-6 py-3 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]"
              )}
              style={{
                backgroundImage: theme === 'prism' ? `linear-gradient(to right, ${groupColor || '#0f172a'}, ${nextColor || '#94a3b8'})` : undefined
              }}
            >
              {theme === 'modern' && <span className="w-2 h-8 mr-3 rounded-full" style={{ backgroundColor: groupColor || '#cbd5e1' }}></span>}
              {theme === 'cyberpunk' && <span className="w-4 h-4 mr-3 rotate-45 border-2" style={{ borderColor: groupColor || '#22d3ee', backgroundColor: `${groupColor || '#22d3ee'}33` }}></span>}
              {theme === 'ethereal' && <Star className="w-4 h-4 mr-3 text-amber-400/50" />}
              {theme === 'undertale' && <span className="text-red-600">❤</span>}
              {theme === 'god-of-war' && <Sword className="w-6 h-6 text-[#8b0000]" />}
              {theme === 'cuphead' && <div className="w-8 h-8 rounded-full bg-red-600 border-4 border-black" />}
              {theme === 'comic' && <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400 stroke-black stroke-[3px]" />}
              {theme === 'prism' && (
                <div className="w-10 h-1 mr-4 rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${groupColor}, transparent)` }} />
              )}
              <MarkdownContent content={content} isPresentation={isPresentation} />
            </h2>
          );
          break;
        case 'BULLET':
          renderedContent = (
            <div className="flex items-start mb-2 ml-4">
              {theme === 'modern' && <span className="mr-3 mt-1.5 text-xl leading-none font-bold" style={{ color: groupColor || '#3b82f6' }}>•</span>}
              {theme === 'cyberpunk' && <span className="mr-3 mt-2 w-2 h-2 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ backgroundColor: groupColor }}></span>}
              {theme === 'vintage' && <span className="mr-3 mt-1.5 font-serif italic text-lg" style={{ color: '#8b4513' }}>~</span>}
              {theme === 'terminal' && <span className="mr-3 mt-1.5 font-mono text-green-500">{">"}</span>}
              {theme === 'ethereal' && <div className="mr-4 mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-200 shadow-[0_0_8px_rgba(165,180,252,0.5)]"></div>}
              {theme === 'prism' && <div className="mr-4 mt-2.5 w-2 h-2 rounded-full shadow-lg" style={{ backgroundImage: `linear-gradient(135deg, ${groupColor}, ${nextColor})` }}></div>}
              {theme === 'minecraft' && <div className="mr-3 mt-1.5 w-3 h-3 bg-[#373737] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]"></div>}
              {theme === 'undertale' && <span className="mr-3 mt-1.5 text-red-600 text-xs">❤</span>}
              {theme === 'god-of-war' && <Sword className="mr-3 mt-1.5 w-4 h-4 text-[#8b0000]" />}
              {theme === 'cuphead' && <div className="mr-3 mt-1.5 w-4 h-4 rounded-full bg-black border-2 border-white" />}
              {theme === 'comic' && <Zap className="mr-3 mt-1.5 w-5 h-5 text-yellow-400 fill-yellow-400 stroke-black stroke-[2px]" />}
              <div className={cn(
                "text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'professional' && "text-slate-700 font-sans",
                theme === 'cyberpunk' && "text-purple-100 font-mono text-base",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-green-400 font-mono text-base",
                theme === 'ethereal' && "text-indigo-900/80 font-serif",
                theme === 'prism' && "text-slate-600 font-medium tracking-tight",
                theme === 'god-of-war' && "text-slate-200 font-serif",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-black font-black italic uppercase tracking-tight"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'EXPLANATION':
        case 'AR_EXPLANATION':
        case 'AR_SIMPLIFY':
          const isArExp = type === 'AR_EXPLANATION' || type === 'AR_SIMPLIFY';
          renderedContent = (
            <div className="flex items-start mb-4 mt-2" dir={isArExp ? "rtl" : "ltr"}>
              <div className={cn(
                "text-lg leading-relaxed",
                isArExp && "text-right font-arabic",
                theme === 'modern' && "text-slate-800",
                theme === 'professional' && "text-slate-800 font-sans",
                theme === 'cyberpunk' && "text-cyan-100 font-mono text-base",
                theme === 'vintage' && "text-[#4a3728] font-serif",
                theme === 'terminal' && "text-green-300 font-mono text-base",
                theme === 'ethereal' && "text-indigo-900/90 font-serif",
                theme === 'prism' && "text-slate-700 font-medium tracking-tight",
                theme === 'minecraft' && "text-[#373737] font-pixel text-xl",
                theme === 'undertale' && "text-white font-retro text-lg",
                theme === 'god-of-war' && "text-slate-200 font-serif",
                theme === 'cuphead' && "text-[#2c1e14] font-medium text-xl",
                theme === 'comic' && "text-black font-bold italic text-xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'WARNING':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-red-50 border-red-600 text-red-900 rounded-r-lg shadow-sm font-medium",
                theme === 'cyberpunk' && "bg-red-950/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#fff9f0] border-[#d4a373] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-red-500 rounded-none shadow-[0_0_10px_rgba(239,68,68,0.3)]",
                theme === 'ethereal' && "bg-rose-50/30 border-rose-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#4a4a4a] border-4 border-[#1e1e1e] rounded-none shadow-[inset_-4px_-4px_0_#333,inset_4px_4px_0_#666]",
                theme === 'undertale' && "bg-black border-2 border-white rounded-none p-6",
                theme === 'god-of-war' && "bg-[#8b0000]/20 border-[#8b0000] border-l-8 rounded-none",
                theme === 'cuphead' && "bg-[#fef08a] border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-red-500 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#fffbeb') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, #fff, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#ef4444' : (theme === 'terminal' ? '#ef4444' : (theme === 'god-of-war' ? '#8b0000' : '#facc15'))),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#ef4444') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#ef4444'}, ${nextColor || '#f97316'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'MinecraftSword' : 'AlertTriangle'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#ef4444' : (theme === 'terminal' ? '#ef4444' : (theme === 'minecraft' ? '#ff5555' : (theme === 'undertale' ? '#ffffff' : (theme === 'god-of-war' ? '#ffd700' : '#eab308'))))) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-red-200 font-mono",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-red-500 font-mono uppercase",
                theme === 'ethereal' && "text-rose-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'minecraft' && "text-[#373737] font-pixel text-xl",
                theme === 'undertale' && "text-white font-retro text-lg tracking-widest",
                theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase tracking-widest",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-white font-black uppercase tracking-tighter italic text-2xl drop-shadow-[2px_2px_0_#000]"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'TIP':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-emerald-50 border-emerald-600 text-emerald-900 rounded-r-lg shadow-sm font-medium",
                theme === 'cyberpunk' && "bg-emerald-950/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#f0f9f0] border-[#8fb38f] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-green-500 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.3)]",
                theme === 'ethereal' && "bg-emerald-50/30 border-emerald-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
                theme === 'undertale' && "bg-black border-2 border-yellow-400 rounded-none p-6",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700] border-2 rounded-none shadow-[inset_0_0_20px_rgba(255,215,0,0.1)]",
                theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-green-400 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#f0fdf4') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#10b981' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : '#22c55e'))),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#10b981') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#10b981'}, ${nextColor || '#3b82f6'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'GrassBlock' : 'Lightbulb'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#10b981' : (theme === 'terminal' ? '#22c55e' : (theme === 'minecraft' ? '#55ff55' : (theme === 'undertale' ? '#ffff00' : (theme === 'god-of-war' ? '#ffd700' : '#22c55e'))))) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-emerald-100 font-mono",
                theme === 'vintage' && "text-[#2d4a2d] font-serif",
                theme === 'terminal' && "text-green-400 font-mono uppercase",
                theme === 'ethereal' && "text-emerald-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'god-of-war' && "text-[#ffd700] font-serif italic",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic text-2xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'IMPORTANT':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-red-50 border-red-600 text-red-900 rounded-r-lg shadow-sm font-medium",
                theme === 'cyberpunk' && "bg-red-950/30 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#fff5f5] border-[#c0392b] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-red-500/10 border-2 border-red-500 rounded-none",
                theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#ff5555] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#aa0000,inset_4px_4px_0_#ffaaaa]",
                theme === 'undertale' && "bg-black border-2 border-red-600 rounded-none p-6",
                theme === 'god-of-war' && "bg-[#8b0000] border-[#ffd700] border-l-8 rounded-none shadow-[0_10px_30px_rgba(139,0,0,0.3)]",
                theme === 'cuphead' && "bg-[#e63946] border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-red-500 border-4 border-black rounded-none shadow-[12px_12px_0_rgba(0,0,0,1)] transform -skew-x-6 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#fef2f2') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'god-of-war' ? '#ffd700' : '#ef4444'),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#ef4444') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#f43f5e'}, ${nextColor || '#a855f7'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'DiamondBlock' : 'AlertCircle'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'god-of-war' ? '#ffd700' : '#ef4444') }} />
              <div className={cn(
                "font-bold text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-red-100 font-mono uppercase tracking-tighter",
                theme === 'vintage' && "text-[#c0392b] font-serif",
                theme === 'terminal' && "text-red-500 font-mono uppercase italic",
                theme === 'ethereal' && "text-indigo-900 font-serif font-bold",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'god-of-war' && "text-white font-serif uppercase tracking-[0.2em]",
                theme === 'cuphead' && "text-white font-black uppercase tracking-tighter",
                theme === 'comic' && "text-white font-black uppercase tracking-tighter italic text-2xl drop-shadow-[2px_2px_0_#000]"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'DEFINITION':
        case 'AR_DEFINITION':
          const isArDef = type === 'AR_DEFINITION';
          const colonIndex = content.indexOf(':');
          if (colonIndex !== -1) {
            const term = content.substring(0, colonIndex).trim();
            const definition = content.substring(colonIndex + 1).trim();
            renderedContent = (
              <div 
                dir={isArDef ? "rtl" : "ltr"}
                className={cn(
                  "mb-4 p-4 border flex items-start transition-all",
                  isArDef && "text-right font-arabic",
                  theme === 'modern' && "rounded-xl",
                  theme === 'cyberpunk' && "bg-blue-950/20 border-blue-500 rounded-none shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                  theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm border-2",
                  theme === 'terminal' && "bg-black border-2 border-green-500 rounded-none",
                  theme === 'ethereal' && "bg-white border border-indigo-50 rounded-2xl shadow-sm",
                  theme === 'prism' && "bg-white border-none rounded-3xl shadow-xl p-8 overflow-hidden relative",
                  theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
                  theme === 'undertale' && "bg-black border-2 border-white rounded-none p-6",
                  theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700] border-2 rounded-none",
                  theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)]",
                  theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-6"
                )}
                style={{ 
                  backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.98) : '#f8fafc') : undefined, 
                  backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                  borderColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.85) : '#e2e8f0') : undefined 
                }}
              >
                {theme === 'prism' && (
                  <div className={cn("absolute top-0 w-1.5 h-full", isArDef ? "right-0" : "left-0")} style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor}, ${nextColor})` }} />
                )}
                <GameIcon name="BookOpen" theme={theme} className="w-5 h-5 me-3 flex-shrink-0 mt-1" style={{ color: groupColor || (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : '#6366f1'))) }} />
                <div>
                  <span className={cn(
                    "font-bold text-lg",
                    theme === 'modern' && "text-slate-900",
                    theme === 'cyberpunk' && "text-cyan-400 font-mono uppercase",
                    theme === 'vintage' && "text-[#4a3728] font-serif italic",
                    theme === 'terminal' && "text-green-500 font-mono uppercase underline decoration-green-500/30",
                    theme === 'ethereal' && "text-indigo-900 font-serif italic",
                    theme === 'prism' && "text-2xl font-black tracking-tighter italic",
                    theme === 'minecraft' && "text-xl font-pixel text-[#373737] uppercase",
                    theme === 'undertale' && "text-lg font-retro text-yellow-400 uppercase tracking-widest",
                    theme === 'god-of-war' && "text-[#ffd700] font-serif uppercase tracking-widest",
                    theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                    theme === 'comic' && "text-black font-black uppercase tracking-tighter italic"
                  )} style={{ color: theme === 'prism' ? groupColor : undefined }}>
                    <MarkdownContent content={term} isPresentation={isPresentation} />:
                  </span> 
                  <span className={cn(
                    "text-lg ml-1",
                    theme === 'modern' && "text-slate-900",
                    theme === 'cyberpunk' && "text-blue-100 font-mono",
                    theme === 'vintage' && "text-[#5d4037] font-serif",
                    theme === 'terminal' && "text-green-400 font-mono",
                    theme === 'ethereal' && "text-indigo-900/70 font-serif",
                    theme === 'prism' && "text-slate-600 font-medium",
                    theme === 'god-of-war' && "text-slate-300 font-serif italic",
                    theme === 'cuphead' && "text-black font-medium",
                    theme === 'comic' && "text-black font-bold italic"
                  )}>
                    <MarkdownContent content={definition} isPresentation={isPresentation} />
                  </span>
                </div>
              </div>
            );
          } else {
            renderedContent = (
              <div 
                dir={isArDef ? "rtl" : "ltr"}
                className={cn(
                  "mb-4 p-4 border transition-all",
                  isArDef && "text-right font-arabic",
                  theme === 'modern' && "rounded-xl",
                  theme === 'cyberpunk' && "bg-blue-950/20 border-blue-500 rounded-none",
                  theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm border-2",
                  theme === 'terminal' && "bg-black border-2 border-green-500 rounded-none",
                  theme === 'ethereal' && "bg-white border border-indigo-50 rounded-2xl shadow-sm",
                  theme === 'minecraft' && "bg-[#373737] border-4 border-[#1e1e1e] rounded-none shadow-[inset_-4px_-4px_0_#333,inset_4px_4px_0_#666] text-[#55ff55]",
                  theme === 'undertale' && "bg-black border-2 border-white rounded-none p-4 text-white font-retro",
                  theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700] border-2 rounded-none p-4 text-[#ffd700] font-serif italic",
                  theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none p-4 text-black font-black uppercase tracking-tighter",
                )}
                style={{ 
                  backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.98) : '#f8fafc') : undefined, 
                  borderColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.85) : '#e2e8f0') : undefined 
                }}
              >
                <span className={cn(
                  "font-bold text-lg",
                  theme === 'modern' && "text-slate-900",
                  theme === 'cyberpunk' && "text-cyan-400 font-mono uppercase",
                  theme === 'vintage' && "text-[#4a3728] font-serif italic",
                  theme === 'terminal' && "text-green-500 font-mono uppercase",
                  theme === 'ethereal' && "text-indigo-900 font-serif italic",
                  theme === 'comic' && "text-black font-black uppercase tracking-tighter italic"
                )}>
                  <MarkdownContent content={content} isPresentation={isPresentation} />
                </span>
              </div>
            );
          }
          break;
        case 'CODE':
          renderedContent = (
            <div 
              className={cn(
                "p-4 rounded-xl font-mono text-sm overflow-x-auto mb-4 transition-all",
                theme === 'professional' && "bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm shadow-lg",
                theme === 'cyberpunk' && "border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-black",
                theme === 'vintage' && "bg-[#f4f1ea] border border-[#d4c5a1] text-[#4a3728] rounded-sm",
                theme === 'terminal' && "bg-black border border-green-500 text-green-500 rounded-none shadow-[inset_0_0_10px_rgba(34,197,94,0.2)]",
                theme === 'ethereal' && "bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl italic",
                theme === 'prism' && "bg-slate-900 text-white rounded-3xl shadow-2xl p-8 border-t-4",
                theme === 'god-of-war' && "bg-[#0a0a0a] border-[#8b0000] border-2 rounded-none shadow-[0_0_30px_rgba(139,0,0,0.2)] text-slate-400",
                theme === 'cuphead' && "bg-black border-4 border-black rounded-none p-4 text-white font-mono",
                theme === 'comic' && "bg-white border-8 border-black rounded-none p-8 text-black font-black italic uppercase tracking-tighter shadow-[15px_15px_0_rgba(0,0,0,1)]"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, -0.6) : '#1e293b') : undefined,
                borderTopColor: theme === 'prism' ? groupColor : undefined,
                color: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.9) : '#f8fafc') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              )}
              <MarkdownContent content={content} disableExplanations isPresentation={isPresentation} />
            </div>
          );
          break;
        case 'QUOTE':
          renderedContent = (
            <blockquote 
              className={cn(
                "border-l-4 pl-4 py-2 mb-4 italic text-lg rounded-r-xl transition-all",
                theme === 'professional' && "border-l-4 border-slate-300 pl-4 italic text-slate-600 font-serif",
                theme === 'cyberpunk' && "bg-purple-900/10 border-purple-500 font-mono text-purple-200",
                theme === 'vintage' && "bg-[#fdfbf7] border-[#8b4513] font-serif text-[#5d4037] border-y-2 border-r-2 rounded-sm",
                theme === 'terminal' && "bg-green-500/5 border-l-4 border-green-500 font-mono text-green-400 py-4",
                theme === 'ethereal' && "bg-transparent border-l-2 border-indigo-200 font-serif text-indigo-900/60 pl-8 py-6 text-xl leading-relaxed",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-lg p-10 relative italic text-2xl leading-relaxed",
                theme === 'minecraft' && "bg-[#c6c6c6] border-l-8 border-[#373737] font-pixel text-[#373737] pl-6 py-4 italic text-xl",
                theme === 'undertale' && "bg-black border-l-4 border-white font-retro text-white/80 pl-8 py-6 text-lg italic tracking-widest",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-l-8 border-[#8b0000] border-r-8 font-serif text-slate-300 pl-8 py-6 text-xl leading-relaxed italic",
                theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] p-8 text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[12px_12px_0_rgba(0,0,0,1)] p-10 text-black font-black uppercase tracking-tighter italic text-2xl transform rotate-1"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.95) : '#f8fafc') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#22c55e' : '#cbd5e1')),
                color: theme === 'modern' ? (groupColor ? getShade(groupColor, -0.4) : '#475569') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white text-3xl font-black italic shadow-lg" style={{ backgroundImage: `linear-gradient(135deg, ${groupColor}, ${nextColor})` }}>
                  "
                </div>
              )}
              <MarkdownContent content={content} isPresentation={isPresentation} />
            </blockquote>
          );
          break;
        case 'CHECKLIST':
          renderedContent = (
            <div className="flex items-start mb-2 ml-4 group/checklist">
              <div className={cn(
                "mr-3 mt-1 flex-shrink-0 transition-all",
                theme === 'professional' && "accent-blue-600",
                theme === 'cyberpunk' && "border-2 border-cyan-500 p-0.5 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
                theme === 'vintage' && "border border-[#8b4513] p-0.5 rounded-sm",
                theme === 'terminal' && "border border-green-500 p-0.5 rounded-none",
                theme === 'ethereal' && "bg-indigo-50 p-1 rounded-full",
                theme === 'prism' && "rounded-xl border-none shadow-md group-hover/checklist:scale-110 p-1",
                theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#c6c6c6] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff] p-0.5",
                theme === 'undertale' && "rounded-none border-2 border-white bg-black p-1",
                theme === 'god-of-war' && "rounded-none border-2 border-[#ffd700] bg-[#1a1a1a] p-1",
                theme === 'cuphead' && "rounded-none border-4 border-black bg-white p-1",
                theme === 'comic' && "rounded-none border-4 border-black bg-yellow-400 p-1 shadow-[4px_4px_0_rgba(0,0,0,1)]"
              )} style={{ 
                backgroundColor: theme === 'prism' ? groupColor : undefined 
              }}>
                {theme === 'prism' ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <GameIcon name="CheckSquare" theme={theme} className="w-5 h-5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'vintage' ? '#8b4513' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : (theme === 'comic' ? '#000000' : '#3b82f6'))))) }} />
                )}
              </div>
              <div className={cn(
                "text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-cyan-100 font-mono",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-green-400 font-mono",
                theme === 'ethereal' && "text-indigo-900/80 font-serif",
                theme === 'prism' && "text-slate-700 font-bold tracking-tight",
                theme === 'god-of-war' && "text-slate-300 font-serif",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-black font-black uppercase tracking-tight italic"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'EXAMPLE':
        case 'AR_EXAMPLE':
          const isArEx = type === 'AR_EXAMPLE';
          renderedContent = (
            <div 
              dir={isArEx ? "rtl" : "ltr"}
              className={cn(
                "border p-4 mb-4 transition-all",
                isArEx && "text-right font-arabic",
                theme === 'modern' && "rounded-xl",
                theme === 'cyberpunk' && cn("bg-emerald-950/10 border-emerald-500/50 rounded-none", isArEx ? "border-r-4" : "border-l-4"),
                theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm border-2 border-dashed",
                theme === 'terminal' && "bg-black border-2 border-amber-500 rounded-none",
                theme === 'ethereal' && "bg-amber-50/20 border border-amber-100 rounded-3xl",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-white rounded-none p-6",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700] border-2 rounded-none p-6",
                theme === 'cuphead' && "bg-[#f5f5dc] border-4 border-black rounded-none p-6 shadow-[4px_4px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white border-4 border-black rounded-none p-8 shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.98) : '#f8fafc') : undefined, 
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.9) : '#e2e8f0') : undefined 
              }}
            >
              {theme === 'prism' && (
                <div className={cn("absolute top-0 w-1.5 h-full", isArEx ? "right-0" : "left-0")} style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#f59e0b'}, ${nextColor || '#ef4444'})` }} />
              )}
              <div 
                className={cn(
                  "flex items-center mb-2 font-bold text-sm uppercase tracking-wider",
                  theme === 'cyberpunk' && "text-emerald-400 font-mono",
                  theme === 'vintage' && "text-[#8b4513] font-serif italic",
                  theme === 'terminal' && "text-amber-500 font-mono",
                  theme === 'ethereal' && "text-amber-700 font-serif italic",
                  theme === 'prism' && "text-amber-500 font-black tracking-tighter italic",
                  theme === 'minecraft' && "text-xl font-pixel text-[#373737] uppercase",
                  theme === 'undertale' && "text-lg font-retro text-white uppercase tracking-widest",
                  theme === 'god-of-war' && "text-[#ffd700] font-serif",
                  theme === 'cuphead' && "text-black font-black",
                  theme === 'comic' && "text-black font-black italic uppercase tracking-tighter"
                )}
                style={{ color: theme === 'modern' ? (groupColor ? getShade(groupColor, -0.2) : '#64748b') : undefined }}
              >
                <GameIcon name="Info" theme={theme} className="w-4 h-4 me-2" /> {isArEx ? "مثال" : "Example"}
              </div>
              <div className={cn(
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-emerald-50 font-mono",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-amber-400 font-mono",
                theme === 'ethereal' && "text-indigo-900/70 font-serif",
                theme === 'prism' && "text-slate-600 font-medium",
                theme === 'god-of-war' && "text-slate-300 font-serif",
                theme === 'cuphead' && "text-black font-black uppercase tracking-tighter",
                theme === 'comic' && "text-black font-black italic uppercase tracking-tight"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'FORMULA':
          renderedContent = (
            <div 
              className={cn(
                "border p-6 mb-4 flex flex-col items-center justify-center text-center transition-all",
                theme === 'professional' && "bg-white border border-slate-200 p-6 rounded-xl shadow-sm text-center font-serif italic text-xl",
                theme === 'modern' && "rounded-xl",
                theme === 'cyberpunk' && "bg-black border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] rounded-none border-2",
                theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm border-2 shadow-inner",
                theme === 'terminal' && "bg-black border-2 border-green-500 rounded-none",
                theme === 'ethereal' && "bg-indigo-50/20 border border-indigo-100 rounded-[3rem] shadow-sm",
                theme === 'prism' && "bg-slate-900 border-none rounded-[3rem] shadow-2xl p-12 relative overflow-hidden",
                theme === 'minecraft' && "bg-[#373737] border-4 border-[#1e1e1e] rounded-none shadow-[inset_-4px_-4px_0_#333,inset_4px_4px_0_#666] p-8",
                theme === 'undertale' && "bg-black border-2 border-white rounded-none p-10",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-[#ffd700] border-2 rounded-none p-12 text-[#ffd700] font-serif text-3xl uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(255,215,0,0.1)]",
                theme === 'cuphead' && "bg-white border-8 border-black rounded-none p-12 text-black font-black text-4xl uppercase tracking-tighter transform rotate-2 shadow-[15px_15px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white border-8 border-black rounded-none p-12 text-black font-black text-4xl uppercase tracking-tighter transform -rotate-2 shadow-[15px_15px_0_rgba(0,0,0,1)]"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.96) : '#eff6ff') : undefined, 
                borderColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.9) : '#dbeafe') : undefined 
              }}
            >
              {theme === 'prism' && (
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at center, ${groupColor}, transparent)` }} />
              )}
              <GameIcon name="Calculator" theme={theme} className="w-5 h-5 mb-2" style={{ color: groupColor || (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : (theme === 'comic' ? '#000000' : '#60a5fa')))) }} />
              <code 
                className={cn(
                  "text-xl",
                  theme === 'modern' && "font-serif",
                  theme === 'cyberpunk' && "font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]",
                  theme === 'vintage' && "font-serif italic text-[#2c1e14]",
                  theme === 'terminal' && "font-mono text-green-500",
                  theme === 'ethereal' && "font-serif text-indigo-900 tracking-widest",
                  theme === 'prism' && "font-mono text-white text-3xl tracking-widest",
                  theme === 'minecraft' && "font-pixel text-[#55ff55] text-4xl",
                  theme === 'undertale' && "font-retro text-white text-3xl tracking-[0.3em]",
                  theme === 'comic' && "font-black italic uppercase tracking-tighter text-black",
                )}
                style={{ color: (theme === 'modern' && groupColor) ? getShade(groupColor, -0.4) : (theme === 'modern' ? '#1e3a8a' : undefined) }}
              >
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </code>
            </div>
          );
          break;
        case 'CALLOUT':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-slate-100 border-l-4 border-slate-800 p-4 rounded-r-lg text-slate-800 font-sans",
                theme === 'cyberpunk' && "bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-purple-500 rounded-none",
                theme === 'ethereal' && "bg-indigo-50/10 border border-indigo-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_2px_2px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-purple-500 rounded-none p-6",
                theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#faf5ff') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#a855f7' : (theme === 'comic' ? '#000000' : '#a855f7'))),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#a855f7') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#a855f7'}, ${nextColor || '#3b82f6'})` }} />
              )}
              <GameIcon name="MessageSquare" theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#a855f7' : (theme === 'comic' ? '#000000' : '#a855f7'))) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-purple-100 font-mono",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'terminal' && "text-purple-400 font-mono",
                theme === 'ethereal' && "text-indigo-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'minecraft' && "text-xl font-pixel text-[#373737] uppercase",
                theme === 'undertale' && "text-lg font-retro text-white uppercase tracking-widest",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic text-2xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'CONCEPT':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg text-indigo-900 font-sans",
                theme === 'cyberpunk' && "bg-cyan-950/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#f0f7ff] border-[#a1c4d4] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-cyan-500 rounded-none",
                theme === 'ethereal' && "bg-cyan-50/10 border border-cyan-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-cyan-400 rounded-none p-6",
                theme === 'comic' && "bg-cyan-400 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#f0f9ff') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'terminal' ? '#06b6d4' : '#0ea5e9')),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#06b6d4') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#06b6d4'}, ${nextColor || '#3b82f6'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'BookOpen' : 'Lightbulb'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'terminal' ? '#06b6d4' : '#0ea5e9')) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-cyan-100 font-mono",
                theme === 'vintage' && "text-[#2d4a5d] font-serif",
                theme === 'terminal' && "text-cyan-400 font-mono",
                theme === 'ethereal' && "text-cyan-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic text-2xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'MNEMONIC':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-lg text-amber-900 font-sans italic",
                theme === 'cyberpunk' && "bg-indigo-950/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#f5f3ff] border-[#b1a1d4] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-indigo-500 rounded-none",
                theme === 'ethereal' && "bg-indigo-50/10 border border-indigo-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_2px_2px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-indigo-500 rounded-none p-6",
                theme === 'comic' && "bg-indigo-600 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#eef2ff') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#6366f1' : (theme === 'terminal' ? '#6366f1' : '#6366f1')),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#6366f1') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#6366f1'}, ${nextColor || '#ec4899'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'StoneBlock' : 'Brain'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#6366f1' : (theme === 'terminal' ? '#6366f1' : (theme === 'comic' ? '#ffffff' : '#6366f1'))) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-indigo-100 font-mono",
                theme === 'vintage' && "text-[#4a4a5d] font-serif",
                theme === 'terminal' && "text-indigo-400 font-mono",
                theme === 'ethereal' && "text-indigo-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'comic' && "text-white font-black uppercase tracking-tighter italic text-2xl drop-shadow-[2px_2px_0_#000]"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'KEY_POINT':
        case 'AR_KEY_POINT':
          const isArKp = type === 'AR_KEY_POINT';
          renderedContent = (
            <div 
              dir={isArKp ? "rtl" : "ltr"}
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                isArKp && "text-right font-arabic border-r-4",
                isArKp && theme !== 'cyberpunk' && "border-l-0",
                theme === 'cyberpunk' && "bg-amber-950/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#fffbeb] border-[#d4a373] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-amber-500 rounded-none",
                theme === 'ethereal' && "bg-amber-50/10 border border-amber-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_2px_2px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-amber-500 rounded-none p-6",
                theme === 'comic' && "bg-yellow-400 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#fffbeb') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: (!isArKp || theme === 'cyberpunk') ? (groupColor || (theme === 'cyberpunk' ? '#f59e0b' : (theme === 'terminal' ? '#f59e0b' : '#f59e0b'))) : undefined,
                borderRightColor: (isArKp || theme === 'cyberpunk') ? (groupColor || (theme === 'cyberpunk' ? '#f59e0b' : (theme === 'terminal' ? '#f59e0b' : '#f59e0b'))) : undefined
              }}
            >
              {theme === 'prism' && (
                <div className={cn("absolute top-0 w-1.5 h-full", isArKp ? "right-0" : "left-0")} style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#f59e0b'}, ${nextColor || '#3b82f6'})` }} />
              )}
              <GameIcon name="Star" theme={theme} className="w-6 h-6 me-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#f59e0b' : (theme === 'terminal' ? '#f59e0b' : '#f59e0b')) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-amber-100 font-mono",
                theme === 'vintage' && "text-[#5d4a2d] font-serif",
                theme === 'terminal' && "text-amber-400 font-mono",
                theme === 'ethereal' && "text-amber-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic text-2xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'SUMMARY':
          renderedContent = (
            <div 
              className={cn(
                "border-l-4 p-5 mb-4 rounded-r-xl flex items-start shadow-sm transition-all",
                theme === 'professional' && "bg-slate-800 text-white p-6 rounded-xl shadow-lg font-sans",
                theme === 'cyberpunk' && "bg-slate-900/50 border-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.2)] rounded-none border-r-4",
                theme === 'vintage' && "bg-[#f8fafc] border-[#64748b] rounded-sm border-2 italic",
                theme === 'terminal' && "bg-black border-2 border-slate-500 rounded-none",
                theme === 'ethereal' && "bg-slate-50/10 border border-slate-100 rounded-3xl shadow-sm",
                theme === 'prism' && "bg-white border-none rounded-3xl shadow-2xl p-8 overflow-hidden relative",
                theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_2px_2px_0_#fff] p-6",
                theme === 'undertale' && "bg-black border-2 border-slate-500 rounded-none p-6",
                theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1 p-8"
              )}
              style={{ 
                backgroundColor: theme === 'modern' ? (groupColor ? getShade(groupColor, 0.92) : '#f8fafc') : undefined,
                backgroundImage: theme === 'prism' ? `linear-gradient(135deg, white, ${groupColor}05)` : undefined,
                borderLeftColor: groupColor || (theme === 'cyberpunk' ? '#64748b' : (theme === 'terminal' ? '#64748b' : '#64748b')),
                borderRightColor: theme === 'cyberpunk' ? (groupColor || '#64748b') : undefined
              }}
            >
              {theme === 'prism' && (
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundImage: `linear-gradient(to bottom, ${groupColor || '#64748b'}, ${nextColor || '#3b82f6'})` }} />
              )}
              <GameIcon name={theme === 'minecraft' ? 'CraftingTable' : 'ClipboardList'} theme={theme} className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" style={{ color: groupColor || (theme === 'cyberpunk' ? '#94a3b8' : (theme === 'terminal' ? '#94a3b8' : '#64748b')) }} />
              <div className={cn(
                "font-medium text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'cyberpunk' && "text-slate-100 font-mono",
                theme === 'vintage' && "text-[#334155] font-serif",
                theme === 'terminal' && "text-slate-400 font-mono",
                theme === 'ethereal' && "text-slate-900 font-serif",
                theme === 'prism' && "text-slate-800 font-sans",
                theme === 'comic' && "text-black font-black uppercase tracking-tighter italic text-2xl"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'STEP':
          renderedContent = (
            <div className="flex items-start mb-3 ml-2 group/step">
              <div 
                className={cn(
                  "p-1 rounded-full mr-3 mt-0.5 flex-shrink-0 transition-all",
                  theme === 'professional' && "rounded-md bg-slate-50 border border-slate-200 shadow-sm p-1.5",
                  theme === 'cyberpunk' && "rounded-none bg-cyan-500/20 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
                  theme === 'terminal' && "rounded-none bg-black border border-green-500",
                  theme === 'ethereal' && "rounded-full bg-indigo-50 border border-indigo-100 shadow-sm",
                  theme === 'vintage' && "bg-transparent border-b-2 border-[#8b4513] rounded-none",
                  theme === 'prism' && "rounded-xl bg-white shadow-lg border-none p-2 group-hover/step:scale-110 transition-transform",
                  theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#c6c6c6] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff] p-1",
                  theme === 'undertale' && "rounded-none border-2 border-white bg-black p-1",
                  theme === 'comic' && "rounded-none border-4 border-black bg-yellow-400 p-1 shadow-[4px_4px_0_rgba(0,0,0,1)]"
                )}
                style={{ backgroundColor: (theme === 'modern' || theme === 'professional') ? (groupColor ? getShade(groupColor, 0.9) : '#dbeafe') : undefined }}
              >
                <GameIcon name={theme === 'minecraft' ? 'MinecraftPickaxe' : 'ArrowRight'} theme={theme} className="w-4 h-4" style={{ color: groupColor || (theme === 'professional' ? '#0f172a' : (theme === 'cyberpunk' ? '#06b6d4' : (theme === 'terminal' ? '#22c55e' : (theme === 'ethereal' ? '#6366f1' : (theme === 'vintage' ? '#8b4513' : (theme === 'prism' ? '#3b82f6' : '#2563eb')))))) }} />
              </div>
              <div className={cn(
                "text-lg font-medium",
                theme === 'modern' && "text-slate-900",
                theme === 'professional' && "text-slate-900 font-serif",
                theme === 'cyberpunk' && "text-cyan-50 font-mono",
                theme === 'terminal' && "text-green-400 font-mono",
                theme === 'ethereal' && "text-indigo-900 font-serif italic",
                theme === 'vintage' && "text-[#5d4037] font-serif italic",
                theme === 'prism' && "text-slate-700 font-bold tracking-tight",
                theme === 'comic' && "text-black font-black italic uppercase tracking-tight"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            </div>
          );
          break;
        case 'TIMELINE':
          const pipeIndex = content.indexOf('|');
          if (pipeIndex !== -1) {
            const time = content.substring(0, pipeIndex).trim();
            const event = content.substring(pipeIndex + 1).trim();
            renderedContent = (
              <div className="flex items-start mb-4 relative">
                <div className={cn(
                  "absolute left-[11px] top-6 bottom-[-16px] w-0.5",
                  theme === 'modern' && "bg-slate-200",
                  theme === 'professional' && "bg-slate-200",
                  theme === 'cyberpunk' && "bg-purple-500/30",
                  theme === 'terminal' && "bg-green-500/30",
                  theme === 'ethereal' && "bg-indigo-100",
                  theme === 'vintage' && "bg-[#d4c5a1]",
                  theme === 'prism' && "bg-slate-200",
                  theme === 'minecraft' && "bg-[#373737]",
                  theme === 'undertale' && "bg-white",
                  theme === 'comic' && "bg-black w-1 border-dashed border-l-2 border-black",
                )}></div>
                <div 
                  className={cn(
                    "border-2 p-1 mr-4 relative z-10 mt-1 transition-all",
                    theme === 'modern' && "bg-white rounded-full",
                    theme === 'professional' && "bg-white rounded-full border-slate-200 shadow-sm",
                    theme === 'cyberpunk' && "bg-black rounded-none border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
                    theme === 'terminal' && "bg-black rounded-none border-green-500",
                    theme === 'ethereal' && "bg-white rounded-full border-indigo-200 shadow-sm",
                    theme === 'vintage' && "bg-[#fdfbf7] rounded-sm border-[#8b4513]",
                    theme === 'prism' && "bg-white rounded-full border-none shadow-lg p-2",
                    theme === 'minecraft' && "bg-[#c6c6c6] rounded-none border-4 border-[#373737] shadow-[inset_-2px_-2px_0_#555,inset_2px_2px_0_#fff]",
                    theme === 'undertale' && "bg-black rounded-none border-2 border-white",
                    theme === 'comic' && "bg-yellow-400 rounded-none border-2 border-black rotate-12",
                  )}
                  style={{ borderColor: (theme === 'modern' || theme === 'professional') ? (groupColor || '#3b82f6') : undefined }}
                >
                  <GameIcon name="Clock" theme={theme} className="w-3 h-3" style={{ color: groupColor || (theme === 'professional' ? '#0f172a' : (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#22c55e' : (theme === 'ethereal' ? '#6366f1' : (theme === 'vintage' ? '#8b4513' : (theme === 'prism' ? '#3b82f6' : '#3b82f6')))))) }} />
                </div>
                <div className={cn(
                  "flex-1 shadow-sm p-3 transition-all",
                  theme === 'modern' && "bg-white border border-slate-100 rounded-xl",
                  theme === 'professional' && "bg-white border border-slate-200 rounded-lg shadow-sm p-4",
                  theme === 'cyberpunk' && "bg-purple-950/10 border border-purple-500/30 rounded-none",
                  theme === 'terminal' && "bg-black border border-green-900 rounded-none",
                  theme === 'ethereal' && "bg-white/50 border border-indigo-50/50 rounded-2xl shadow-sm",
                  theme === 'vintage' && "bg-[#fdfbf7] border-b-2 border-[#d4c5a1] rounded-none",
                  theme === 'prism' && "bg-white border-none rounded-2xl shadow-xl p-6",
                  theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] p-4",
                  theme === 'undertale' && "bg-black border-2 border-white rounded-none p-4",
                  theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1 p-6"
                )}>
                  <span 
                    className={cn(
                      "font-bold text-sm block mb-1",
                      theme === 'professional' && "font-serif italic text-slate-600",
                      theme === 'cyberpunk' && "font-mono uppercase tracking-widest",
                      theme === 'terminal' && "font-mono uppercase text-green-500",
                      theme === 'ethereal' && "font-serif italic text-indigo-600",
                      theme === 'vintage' && "font-serif italic",
                      theme === 'prism' && "text-blue-600 font-black tracking-tighter italic",
                      theme === 'minecraft' && "font-pixel text-[#373737] text-lg",
                      theme === 'undertale' && "font-retro text-yellow-400 text-base tracking-widest",
                      theme === 'comic' && "text-black font-black uppercase tracking-tight italic text-xl"
                    )}
                    style={{ color: groupColor || (theme === 'professional' ? '#475569' : (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#22c55e' : (theme === 'ethereal' ? '#6366f1' : (theme === 'vintage' ? '#8b4513' : (theme === 'prism' ? '#3b82f6' : '#2563eb')))))) }}
                  >
                    <MarkdownContent content={time} isPresentation={isPresentation} />
                  </span>
                  <div className={cn(
                    theme === 'modern' && "text-slate-900",
                    theme === 'professional' && "text-slate-900 font-serif",
                    theme === 'cyberpunk' && "text-purple-100 font-mono",
                    theme === 'terminal' && "text-green-400 font-mono",
                    theme === 'ethereal' && "text-slate-800 font-serif",
                    theme === 'vintage' && "text-[#5d4037] font-serif",
                    theme === 'prism' && "text-slate-700 font-bold tracking-tight",
                    theme === 'minecraft' && "text-[#373737] font-pixel text-base",
                    theme === 'undertale' && "text-white font-retro text-sm tracking-wide",
                    theme === 'comic' && "text-black font-bold italic"
                  )}>
                    <MarkdownContent content={event} isPresentation={isPresentation} />
                  </div>
                </div>
              </div>
            );
          } else {
            renderedContent = (
              <div className={cn(
                "mb-2 text-lg",
                theme === 'modern' && "text-slate-900",
                theme === 'professional' && "text-slate-900 font-serif",
                theme === 'cyberpunk' && "text-purple-100 font-mono",
                theme === 'terminal' && "text-green-400 font-mono",
                theme === 'ethereal' && "text-slate-800 font-serif italic",
                theme === 'vintage' && "text-[#5d4037] font-serif",
                theme === 'comic' && "text-black font-black uppercase tracking-tight italic"
              )}>
                <MarkdownContent content={content} isPresentation={isPresentation} />
              </div>
            );
          }
          break;
        case 'IMG':
          renderedContent = (
            <div className="my-4 relative group/img-block-container">
              {content ? (
                <div className={cn(
                  "relative group/img-block overflow-hidden",
                  theme === 'modern' && "rounded-2xl shadow-md",
                  theme === 'professional' && "rounded-lg border border-slate-200 shadow-sm bg-white p-2",
                  theme === 'cyberpunk' && "rounded-none border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]",
                  theme === 'vintage' && "rounded-sm border-4 border-double border-[#8b4513] p-1 bg-[#fdfbf7]",
                  theme === 'terminal' && "rounded-none border-2 border-green-500 bg-black p-2",
                  theme === 'prism' && "rounded-[2rem] shadow-2xl",
                  theme === 'minecraft' && "rounded-none border-8 border-[#373737] bg-[#c6c6c6] p-2",
                  theme === 'undertale' && "rounded-none border-4 border-white bg-black p-2",
                  theme === 'comic' && "rounded-none border-4 border-black bg-white p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1",
                )}>
                  <img src={content} alt="Content" className="w-full h-auto block" />
                  {isOrderingMode && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img-block:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto">
                      <button 
                        onClick={() => onZoneClick?.(path)}
                        className="px-4 py-2 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Change Image
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => isOrderingMode && onZoneClick?.(path)}
                  className={cn(
                    "p-8 border-2 border-dashed flex flex-col items-center justify-center text-slate-400",
                    isOrderingMode && "cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all",
                    theme === 'modern' && "rounded-2xl border-slate-200 bg-slate-50",
                    theme === 'professional' && "rounded-lg border-slate-200 bg-slate-50",
                    theme === 'cyberpunk' && "rounded-none border-cyan-500/30 bg-cyan-950/10",
                    theme === 'terminal' && "rounded-none border-green-900 bg-black",
                  )}
                >
                  <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40">
                    {isOrderingMode ? "Click to Upload Image" : "No Image Uploaded"}
                  </span>
                </div>
              )}
            </div>
          );
          break;
        case 'IMG_TEXT':
        case 'IMG TEXT':
          renderedContent = <ImgTextRenderer item={data} path={path} onUpdateItem={onUpdateItem} theme={theme} />;
          break;
        case 'MCQ':
          renderedContent = <MCQRenderer item={data} theme={theme} isPresentation={isPresentation} />;
          break;
        case 'ESSAY':
          renderedContent = <EssayRenderer item={data} theme={theme} isPresentation={isPresentation} />;
          break;
        case 'DIVIDER':
          renderedContent = (
            <hr 
              className={cn(
                "my-8 border-t-2 transition-all",
                theme === 'modern' && "border-slate-100",
                theme === 'professional' && "border-slate-200 my-12 opacity-50",
                theme === 'cyberpunk' && "border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]",
                theme === 'terminal' && "border-green-900 border-dashed",
                theme === 'ethereal' && "border-indigo-50 border-dotted",
                theme === 'vintage' && "border-[#d4c5a1] border-double border-t-4",
                theme === 'prism' && "border-none h-px my-12 opacity-20",
                theme === 'minecraft' && "border-[#373737] border-t-4 shadow-[0_4px_0_#555]",
                theme === 'undertale' && "border-white border-t-2 border-dashed",
                theme === 'comic' && "border-t-8 border-black shadow-[4px_4px_0_rgba(255,255,0,1)] transform -rotate-1 my-12"
              )} 
              style={{ 
                backgroundImage: (theme === 'prism' || theme === 'professional') ? `linear-gradient(90deg, transparent, ${groupColor || (theme === 'professional' ? '#cbd5e1' : '#3b82f6')}, transparent)` : undefined
              }}
            />
          );
          break;
        case 'TABLE_HEAD':
          const headers = content.split('|').map(s => s.trim());
          renderedContent = (
            <div className={cn(
              "overflow-x-auto mb-0 border-t border-l border-r transition-all",
              theme === 'modern' && "rounded-t-xl border-slate-200 bg-slate-50",
              theme === 'professional' && "rounded-t-lg border-slate-200 bg-slate-50/50",
              theme === 'cyberpunk' && "bg-blue-950/30 border-blue-500/50 rounded-none",
              theme === 'terminal' && "bg-black border-green-500 rounded-none",
              theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100 rounded-t-2xl",
              theme === 'vintage' && "bg-[#f4f1ea] border-[#d4c5a1] rounded-none",
              theme === 'prism' && "bg-slate-900 border-none rounded-t-[2rem] overflow-hidden",
              theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_2px_2px_0_#fff]",
              theme === 'undertale' && "bg-black border-2 border-white rounded-none",
              theme === 'comic' && "bg-yellow-400 border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform rotate-1"
            )}>
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    {headers.map((h, idx) => (
                      <th 
                        key={idx} 
                        className={cn(
                          "px-6 py-4 text-left text-xs font-bold uppercase tracking-wider",
                          theme === 'modern' && "text-slate-500",
                          theme === 'professional' && "text-slate-900 font-serif italic",
                          theme === 'cyberpunk' && "text-cyan-400 font-mono",
                          theme === 'terminal' && "text-green-500 font-mono",
                          theme === 'ethereal' && "text-indigo-600 font-serif",
                          theme === 'vintage' && "text-[#4a3728] font-serif",
                          theme === 'prism' && "text-white font-black tracking-tighter italic",
                          theme === 'minecraft' && "text-[#373737] font-pixel text-lg",
                          theme === 'undertale' && "text-yellow-400 font-retro text-base tracking-widest",
                          theme === 'comic' && "text-black font-black uppercase tracking-tight italic text-xl"
                        )}
                      >
                        <MarkdownContent content={h} disableExplanations isPresentation={isPresentation} />
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
          );
          break;
        case 'TABLE_ROW':
          const cells = content.split('|').map(s => s.trim());
          renderedContent = (
            <div className={cn(
              "overflow-x-auto border-l border-r border-b transition-all",
              theme === 'modern' && "bg-white border-slate-200 last:rounded-b-xl",
              theme === 'professional' && "bg-white border-slate-200 last:rounded-b-lg shadow-sm",
              theme === 'cyberpunk' && "bg-black border-blue-500/50 rounded-none",
              theme === 'terminal' && "bg-black border-green-900 rounded-none",
              theme === 'ethereal' && "bg-white/50 border-indigo-50 rounded-none",
              theme === 'vintage' && "bg-[#fdfbf7] border-[#d4c5a1] rounded-none",
              theme === 'prism' && "bg-white border-none last:rounded-b-[2rem] shadow-xl",
              theme === 'minecraft' && "bg-[#c6c6c6] border-4 border-[#373737] rounded-none shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]",
              theme === 'undertale' && "bg-black border-2 border-white rounded-none",
              theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_rgba(0,0,0,1)] transform -rotate-1"
            )}>
              <table className="min-w-full divide-y divide-slate-200">
                <tbody>
                  <tr className={cn(
                    "transition-colors",
                    theme === 'modern' && "hover:bg-slate-50",
                    theme === 'professional' && "hover:bg-slate-50/30",
                    theme === 'cyberpunk' && "hover:bg-blue-900/10",
                    theme === 'terminal' && "hover:bg-green-900/10",
                    theme === 'ethereal' && "hover:bg-indigo-50/20",
                    theme === 'vintage' && "hover:bg-[#f4f1ea]",
                    theme === 'prism' && "hover:bg-slate-50"
                  )}>
                    {cells.map((c, idx) => (
                      <td 
                        key={idx} 
                        className={cn(
                          "px-6 py-4 text-sm whitespace-pre-wrap",
                          theme === 'modern' && "text-slate-700",
                          theme === 'professional' && "text-slate-800 font-serif",
                          theme === 'cyberpunk' && "text-blue-100 font-mono",
                          theme === 'terminal' && "text-green-400 font-mono",
                          theme === 'ethereal' && "text-slate-800 font-serif",
                          theme === 'vintage' && "text-[#5d4037] font-serif",
                          theme === 'prism' && "text-slate-600 font-medium",
                          theme === 'minecraft' && "text-[#373737] font-pixel text-base",
                          theme === 'undertale' && "text-white font-retro text-sm tracking-wide",
                          theme === 'comic' && "text-black font-bold italic"
                        )}
                      >
                        <MarkdownContent content={c} disableExplanations isPresentation={isPresentation} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
          break;
        default:
          renderedContent = (
            <div className={cn(
              "mb-2 text-lg",
              theme === 'modern' && "text-slate-700",
              theme === 'cyberpunk' && "text-purple-100 font-mono",
              theme === 'vintage' && "text-[#5d4037] font-serif",
              theme === 'comic' && "text-black font-bold italic"
            )}>
              <MarkdownContent content={content} asBlock isPresentation={isPresentation} />
            </div>
          );
      }

      return (
        <div id={`doc-item-${sanitizedPath}`} className={cn("relative group flow-root", isPresentation && "max-w-4xl mx-auto")}>
          {renderFloatingImages(`${path}.before`)}
          {renderDropAndImages(`${path}.before`)}
          {renderFloatingImages(path)}
          {renderedContent}
          {renderDropAndImages(path)}
        </div>
      );
    }

    return (
      <div id={`doc-item-${sanitizedPath}`} className={cn("mb-6 space-y-4 flow-root", isPresentation && "max-w-4xl mx-auto")}>
        {renderFloatingImages(`${path}.before`)}
        {renderDropAndImages(`${path}.before`)}
        {renderFloatingImages(path)}
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="break-inside-avoid">
            <Heading level={level} theme={theme} isPresentation={isPresentation}>{key}</Heading>
            <div className={cn(
              "pl-2 ml-2 mt-2",
              theme === 'modern' && "border-l-2 border-slate-100",
              theme === 'cyberpunk' && "border-l-2 border-purple-500/30",
              theme === 'vintage' && "border-l-2 border-[#d4c5a1]"
            )}>
              <DocumentRenderer data={value} level={level + 1} path={`${path}.${key}`} isDragModeActive={isDragModeActive} isOrderingMode={isOrderingMode} isPresentation={isPresentation} imagePlacements={imagePlacements} onZoneClick={onZoneClick} onRemoveImage={onRemoveImage} onUpdateImage={onUpdateImage} onUpdateItem={onUpdateItem} onReorderGroupClick={onReorderGroupClick} theme={theme} />
            </div>
          </div>
        ))}
        {renderDropAndImages(path)}
        {path === "root" && renderFloatingImages("root.end")}
        {path === "root" && renderDropAndImages("root.end")}
      </div>
    );
  }

  return null;
}

function Heading({ level, children, theme = 'modern', isPresentation }: { level: number, children: React.ReactNode, theme?: string, isPresentation?: boolean }) {
  const text = String(children);
  const lowerText = text.toLowerCase();
  
  const isImportant = lowerText.includes('important') || lowerText.includes('warning') || lowerText.includes('red flag') || lowerText.includes('complication') || lowerText.includes('treatment') || lowerText.includes('diagnosis');
  const isHighlight = lowerText.includes('highlight') || lowerText.includes('note');

  let colorClass = "text-slate-800";
  if (theme === 'professional') colorClass = "text-slate-900 font-serif border-b border-slate-200 pb-2";
  else if (theme === 'cyberpunk') colorClass = "text-cyan-400 font-mono uppercase tracking-widest";
  else if (theme === 'vintage') colorClass = "text-[#2c1e14] font-serif italic";
  else if (theme === 'prism') colorClass = "text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 font-black tracking-tighter";
  else if (theme === 'god-of-war') colorClass = "text-[#ffd700] font-serif uppercase tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
  else if (theme === 'cuphead') colorClass = "text-[#e63946] font-black uppercase tracking-tight transform -rotate-1 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]";
  else if (theme === 'comic') colorClass = "text-black font-black uppercase tracking-tighter italic drop-shadow-[4px_4px_0_rgba(255,255,255,1)]";
  else if (theme === 'minecraft') colorClass = "text-[#373737] font-pixel uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(255,255,255,0.5)]";
  else {
    if (isImportant) colorClass = "text-red-600";
    else if (level === 1) colorClass = "text-blue-900";
    else if (level === 2) colorClass = "text-blue-800";
    else if (level === 3) colorClass = "text-blue-700";
  }
  
  let bgClass = "";
  if (isHighlight) {
    if (theme === 'professional') bgClass = "bg-slate-50 px-3 py-1 border border-slate-200 rounded-md";
    else if (theme === 'cyberpunk') bgClass = "bg-yellow-400/20 px-3 py-1 rounded-none border border-yellow-400/50";
    else if (theme === 'vintage') bgClass = "bg-[#f4ecd8] px-3 py-1 rounded-sm border-b-2 border-[#d4c5a1]";
    else if (theme === 'god-of-war') bgClass = "bg-[#8b0000]/30 px-4 py-2 border-l-4 border-[#8b0000]";
    else if (theme === 'cuphead') bgClass = "bg-[#f5f5dc] px-4 py-2 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]";
    else if (theme === 'comic') bgClass = "bg-yellow-400 px-6 py-2 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] transform -skew-x-12";
    else if (theme === 'minecraft') bgClass = "bg-[#c6c6c6] px-4 py-2 border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]";
    else bgClass = "bg-yellow-200 px-3 py-1 rounded-md inline-block";
  }

  const baseClass = cn(
    "font-bold capitalize mb-3 mt-6 tracking-tight transition-all",
    colorClass,
    bgClass
  );
  
  if (level === 1) return <h1 className={cn(baseClass, "text-[1.875em] pb-3", theme === 'modern' && "border-b-2 border-blue-100", theme === 'cyberpunk' && "border-b border-cyan-500/30", theme === 'vintage' && "border-b-4 border-double border-[#d4c5a1]", theme === 'prism' && "text-5xl mb-8", theme === 'god-of-war' && "border-b-2 border-[#8b0000] text-4xl mb-10", theme === 'cuphead' && "text-6xl mb-12 border-b-8 border-black", theme === 'comic' && "text-6xl mb-12 border-b-8 border-black transform -rotate-1", theme === 'minecraft' && "text-5xl mb-12 border-b-8 border-[#373737]")}>{typeof children === 'string' ? <MarkdownContent content={children} isPresentation={isPresentation} /> : children}</h1>;
  if (level === 2) return <h2 className={cn(baseClass, "text-[1.5em]", theme === 'comic' && "text-4xl mb-8 border-b-4 border-black transform rotate-1", theme === 'minecraft' && "text-4xl mb-8 border-b-4 border-[#373737]")}>{typeof children === 'string' ? <MarkdownContent content={children} isPresentation={isPresentation} /> : children}</h2>;
  if (level === 3) return <h3 className={cn(baseClass, "text-[1.25em]", theme === 'comic' && "text-3xl mb-6 transform -rotate-1", theme === 'minecraft' && "text-3xl mb-6")}>{typeof children === 'string' ? <MarkdownContent content={children} isPresentation={isPresentation} /> : children}</h3>;
  return <h4 className={cn(baseClass, "text-[1.125em]", theme === 'comic' && "text-2xl mb-4 transform rotate-1", theme === 'minecraft' && "text-2xl mb-4")}>{typeof children === 'string' ? <MarkdownContent content={children} isPresentation={isPresentation} /> : children}</h4>;
}
