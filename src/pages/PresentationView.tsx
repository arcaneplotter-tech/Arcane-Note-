import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause,
  Clock,
  Layout,
  X,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Image as ImageIcon,
  Download,
  Type,
  Volume2,
  VolumeX,
  Check,
  Brain,
  RotateCcw
} from 'lucide-react';
import { isFuzzyMatch, getCleanWords } from '../utils/blurtUtils';
import { MarkdownContent, ColorContext, MCQRenderer, EssayRenderer, cn, DocumentContext } from '../components/DocumentRenderer';
import { useTheme } from '../components/ThemeContext';
import { TextAnimationContainer } from '../components/ScrambleDOM';
import { generatePresentationHTML } from '../utils/exportToHTML';

export default function PresentationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('noteId');
  const { theme } = useTheme();

  const [slides, setSlides] = useState<any[]>([]);
  const [imagePlacements, setImagePlacements] = useState<Record<string, any[]>>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplayInterval, setAutoplayInterval] = useState(5000);
  const [textAnimationMode, setTextAnimationMode] = useState<'blur' | 'slide' | 'none' | 'scramble' | 'typewriter' | 'elastic' | 'flash' | 'rotate' | 'glitch' | 'wave' | 'neon'>('blur');
  const [textScale, setTextScale] = useState(1);
  const [showTextSizeModal, setShowTextSizeModal] = useState(false);
  const [showAnimationMenu, setShowAnimationMenu] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [spokenCharIndex, setSpokenCharIndex] = useState(0);
  
  // Blurting Mode State
  const [isBlurtingMode, setIsBlurtingMode] = useState(false);
  const [blurtInput, setBlurtInput] = useState('');
  const [isBlurtSubmitted, setIsBlurtSubmitted] = useState(false);
  const [blurtResults, setBlurtResults] = useState<{ 
    original: string, 
    user: string, 
    missingWords: string[],
    correctWords: string[] 
  } | null>(null);

  const [currentSpokenId, setCurrentSpokenId] = useState<string | null>(null);
  const isStoppingRef = React.useRef(false);

  const cleanTextForSpeech = useCallback((text: string) => {
    if (!text) return '';
    // Remove markdown syntax: **, *, _, ~, `, #
    let cleaned = text.replace(/[*_~`#]/g, '');
    // Replace [Text]{...} with just "Text"
    cleaned = cleaned.replace(/\[(.*?)\]\{.*?\}/g, '$1');
    // Replace ![Alt](url) with "Image of Alt"
    cleaned = cleaned.replace(/!\[(.*?)\]\(.*?\)/g, 'Image of $1');
    // Replace [Text](url) with just "Text"
    cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Remove HTML tags if any
    cleaned = cleaned.replace(/<[^>]*>?/gm, '');
    // Normalize whitespace: replace all whitespace sequences with a single space
    cleaned = cleaned.replace(/\s+/g, ' ');
    return cleaned.trim();
  }, []);

  const toggleVoice = useCallback(async () => {
    if (isReading) {
      isStoppingRef.current = true;
      window.speechSynthesis.cancel();
      setIsReading(false);
      setCurrentSpokenId(null);
      return;
    }

    const slide = slides[currentSlideIndex];
    if (!slide) return;

    // Build an array of text chunks and their corresponding IDs
    const chunks: { text: string, id: string }[] = [];
    
    if (slide.TYPE === 'TABLE_BLOCK') {
      slide.ITEMS?.forEach((item: any, rIdx: number) => {
        const cells = (item.CONTENT || '').split('|');
        cells.forEach((cell, cIdx: number) => {
          let text = cleanTextForSpeech(cell);
          if (item.TYPE === 'TABLE_HEAD' && cIdx === 0) {
            text = 'Table Headers: ' + text;
          }
          if (text.length > 0) {
            chunks.push({ text, id: `table-${rIdx}-${cIdx}` });
          }
        });
      });
    } else if (slide.TYPE === 'LIST_BLOCK') {
      slide.ITEMS?.forEach((item: any, idx: number) => {
        chunks.push({ text: cleanTextForSpeech(item.CONTENT || ''), id: `list-${idx}` });
      });
    } else if (slide.TYPE === 'IMG') {
      chunks.push({ text: 'Image.', id: 'main' });
    } else if (slide.TYPE === 'IMG_TEXT') {
      chunks.push({ text: 'Image Search:', id: 'img-prefix' });
      chunks.push({ text: cleanTextForSpeech(slide.CONTENT || ''), id: 'main' });
    } else if (slide.CONTENT) {
      chunks.push({ text: cleanTextForSpeech(slide.CONTENT), id: 'main' });
    }

    const validChunks = chunks.filter(c => c.text.trim().length > 0);
    if (validChunks.length === 0) return;

    setIsReading(true);
    isStoppingRef.current = false;
    setSpokenCharIndex(0);
    
    // Browser TTS
    setCurrentSpokenId(validChunks[0].id);
    
    // Find best voice
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.name.includes('Natural')) ||
                voices.find(v => v.name.includes('Google US English')) ||
                voices.find(v => v.name.includes('Aria')) ||
                voices.find(v => v.name.includes('Premium')) ||
                voices.find(v => v.lang === 'en-US' && v.name.includes('Female')) ||
                voices.find(v => v.lang === 'en-US') ||
                voices[0];
    
    validChunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        setCurrentSpokenId(chunk.id);
        setSpokenText(chunk.text);
        setSpokenCharIndex(0);
      };
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setSpokenCharIndex(event.charIndex);
        }
      };
      
      if (index === validChunks.length - 1) {
        utterance.onend = () => {
          setIsReading(false);
          setCurrentSpokenId(null);
          setSpokenCharIndex(0);
        };
      }
      
      utterance.onerror = () => {
        setIsReading(false);
        setCurrentSpokenId(null);
        setSpokenCharIndex(0);
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, [isReading, slides, currentSlideIndex, cleanTextForSpeech]);

  // Stop reading when slide changes
  useEffect(() => {
    if (isReading) {
      isStoppingRef.current = true;
      window.speechSynthesis.cancel();
      setIsReading(false);
      setCurrentSpokenId(null);
    }
    // Reset blurt mode on slide change
    setIsBlurtingMode(false);
    setBlurtInput('');
    setIsBlurtSubmitted(false);
    setBlurtResults(null);
  }, [currentSlideIndex]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const savedParsedData = localStorage.getItem('arcane-notes-parsed-data');
    const savedImagePlacements = localStorage.getItem('arcane-notes-image-placements');
    
    if (savedImagePlacements) {
      setImagePlacements(JSON.parse(savedImagePlacements));
    }

    if (savedParsedData) {
      const data = JSON.parse(savedParsedData);
      
      let flattenedData: any[] = [];
      
      // Check if data is grouped (has ITEMS property)
      if (data.length > 0 && data[0].ITEMS) {
        data.forEach((group: any) => {
          group.ITEMS.forEach((item: any) => {
            flattenedData.push({
              ...item,
              TOPIC: group.GROUP || item.GROUP || 'Default Topic'
            });
          });
        });
      } else {
        flattenedData = data.map((item: any) => ({
          ...item,
          TOPIC: item.GROUP || 'Default Topic'
        }));
      }

      // Filter out empty dividers
      const filteredData = flattenedData.filter((item: any) => item.TYPE !== 'DIVIDER' || (item.CONTENT && item.CONTENT.trim() !== ''));
      
      // Group consecutive items that belong together (Tables, Lists)
      const groupedSlides: any[] = [];
      let currentGroup: any = null;

      filteredData.forEach((item) => {
        // Group Tables
        if (item.TYPE === 'TABLE_HEAD' || item.TYPE === 'TABLE_ROW') {
          if (currentGroup && currentGroup.TYPE === 'TABLE_BLOCK') {
            currentGroup.ITEMS.push(item);
          } else {
            currentGroup = {
              TYPE: 'TABLE_BLOCK',
              TOPIC: item.TOPIC,
              ITEMS: [item],
              id: `table-block-${item.id}`
            };
            groupedSlides.push(currentGroup);
          }
          return;
        }

        // Group Bullets/Checklists/Steps
        if (item.TYPE === 'BULLET' || item.TYPE === 'CHECKLIST' || item.TYPE === 'STEP') {
          if (currentGroup && currentGroup.TYPE === 'LIST_BLOCK' && currentGroup.LIST_TYPE === item.TYPE) {
            currentGroup.ITEMS.push(item);
          } else {
            currentGroup = {
              TYPE: 'LIST_BLOCK',
              LIST_TYPE: item.TYPE,
              TOPIC: item.TOPIC,
              ITEMS: [item],
              id: `list-block-${item.id}`
            };
            groupedSlides.push(currentGroup);
          }
          return;
        }

        // Default: New slide for each item
        currentGroup = { ...item };
        groupedSlides.push(currentGroup);
      });

      setSlides(groupedSlides);
    }
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setBlurtResults(null);
    setIsBlurtSubmitted(false);
    setBlurtInput('');
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setBlurtResults(null);
    setIsBlurtSubmitted(false);
    setBlurtInput('');
  }, [slides.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault(); // Prevent scrolling with space
        nextSlide();
      }
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          navigate(-1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isFullscreen, navigate]);

  useEffect(() => {
    let interval: any;
    if (isAutoplay) {
      interval = setInterval(nextSlide, autoplayInterval);
    }
    return () => clearInterval(interval);
  }, [isAutoplay, autoplayInterval, nextSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const calculateBlurtResults = useCallback(() => {
    const slide = slides[currentSlideIndex];
    if (!slide) return;

    let originalText = '';
    if (slide.TYPE === 'LIST_BLOCK') {
      originalText = slide.ITEMS.map((item: any) => item.CONTENT).join(' ');
    } else if (slide.TYPE === 'TABLE_BLOCK') {
      originalText = slide.ITEMS.map((item: any) => item.CONTENT).join(' ');
    } else {
      originalText = slide.CONTENT || '';
    }

    const originalWords = getCleanWords(originalText);
    const userWords = getCleanWords(blurtInput);
    
    const correctWords: string[] = [];
    const missingWords: string[] = [];

    // Unique original words to check
    const uniqueOriginalWords = Array.from(new Set(originalWords));
    
    uniqueOriginalWords.forEach(orig => {
      const matched = userWords.some(user => isFuzzyMatch(orig, user));
      if (matched) {
        correctWords.push(orig);
      } else {
        missingWords.push(orig);
      }
    });
    
    setBlurtResults({
      original: originalText,
      user: blurtInput,
      missingWords,
      correctWords
    });
    setIsBlurtSubmitted(true);
    setIsBlurtingMode(false);
  }, [slides, currentSlideIndex, blurtInput]);

  const { 
    videoBackgroundEnabled, 
    videoBackgroundBase64, 
    customVideoUrl,
    overlayVideos 
  } = useTheme();

  // Inject custom font if selected
  useEffect(() => {
    const savedFonts = localStorage.getItem('arcane-notes-uploaded-fonts');
    const selectedFontName = localStorage.getItem('arcane-notes-selected-font');
    
    if (savedFonts && selectedFontName) {
      try {
        const fonts = JSON.parse(savedFonts);
        const customFont = fonts.find((f: any) => f.name === selectedFontName);
        
        if (customFont) {
          const styleId = 'presentation-custom-font';
          let styleEl = document.getElementById(styleId) as HTMLStyleElement;
          
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
          }
          
          const format = customFont.name.endsWith('.woff2') ? 'woff2' : 
                         customFont.name.endsWith('.woff') ? 'woff' : 'truetype';
                         
          styleEl.innerHTML = `
            @font-face {
              font-family: '${customFont.name}';
              src: url('${customFont.data}') format('${format}');
              font-weight: normal;
              font-style: normal;
            }
            .presentation-view-container {
              font-family: '${customFont.name}', sans-serif !important;
            }
          `;
          
          return () => {
            const el = document.getElementById(styleId);
            if (el) el.remove();
          };
        }
      } catch (e) {
        console.error("Error applying custom font in presentation", e);
      }
    }
  }, []);

  const handleDownloadHTML = () => {
    const slidesWithImages = slides.map(slide => ({
      ...slide,
      attachedImages: imagePlacements[slide.id] || []
    }));
    
    // Retrieve custom font from localStorage if it exists
    const savedFonts = localStorage.getItem('arcane-notes-uploaded-fonts');
    const selectedFontName = localStorage.getItem('arcane-notes-selected-font');
    let customFont = undefined;
    
    if (savedFonts && selectedFontName) {
      try {
        const fonts = JSON.parse(savedFonts);
        customFont = fonts.find((f: any) => f.name === selectedFontName);
      } catch (e) {
        console.error("Error parsing saved fonts for export", e);
      }
    }

    const htmlContent = generatePresentationHTML(slidesWithImages, theme, {
      videoBackgroundEnabled,
      videoBackgroundBase64,
      customVideoUrl,
      overlayVideos,
      customFont
    });
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <Layout className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">No Content Found</h1>
        <p className="text-slate-400 mb-6">Please parse some notes first to view them in presentation mode.</p>
        <button 
          onClick={() => navigate('/parser')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Parser
        </button>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const renderSlideContent = (item: any, isReading: boolean, spokenText: string, spokenCharIndex: number, currentSpokenId: string | null, highlightWords?: string[]) => {
    const type = item.TYPE;
    const content = item.CONTENT;
    const attachedImages = imagePlacements[item.id] || [];

    const themeColors: any = {
      modern: { text: 'text-slate-200', accent: 'text-blue-400', bg: 'bg-slate-900/40', border: 'border-white/10', hex: '#60a5fa', next: '#8b5cf6' },
      cyberpunk: { text: 'text-cyan-100', accent: 'text-fuchsia-500', bg: 'bg-black/60', border: 'border-cyan-500/30', hex: '#d946ef', next: '#06b6d4' },
      vintage: { text: 'text-[#4a3728]', accent: 'text-[#8b4513]', bg: 'bg-[#f4ecd8]/40', border: 'border-[#d4a373]/30', hex: '#8b4513', next: '#d4a373' },
      terminal: { text: 'text-green-400', accent: 'text-green-500', bg: 'bg-black/80', border: 'border-green-500/50', hex: '#22c55e', next: '#16a34a' },
      ethereal: { text: 'text-indigo-900/80', accent: 'text-indigo-400', bg: 'bg-white/40', border: 'border-indigo-100/50', hex: '#818cf8', next: '#c084fc' },
      prism: { text: 'text-slate-700', accent: 'text-blue-500', bg: 'bg-white/60', border: 'border-slate-200', hex: '#3b82f6', next: '#f97316' },
      'god-of-war': { text: 'text-slate-300', accent: 'text-[#ffd700]', bg: 'bg-black/60', border: 'border-[#8b0000]/50', hex: '#ffd700', next: '#8b0000' },
      cuphead: { text: 'text-[#2c1e14]', accent: 'text-black', bg: 'bg-[#f5f5dc]/60', border: 'border-black/20', hex: '#000000', next: '#f5f5dc' },
      comic: { text: 'text-black', accent: 'text-blue-600', bg: 'bg-white/60', border: 'border-black/30', hex: '#2563eb', next: '#facc15' }
    };

    const colors = themeColors[theme] || themeColors.modern;

    const renderMainContent = () => {
      switch (type) {
        case 'TITLE':
          return (
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "font-black text-center tracking-tighter leading-[0.9] max-h-full overflow-y-auto px-4 text-balance",
                "text-[clamp(2rem,8vmin,8rem)]",
                colors.text
              )}
            >
              <MarkdownContent 
                content={content} 
                isReading={isReading && currentSpokenId === 'main'} 
                spokenText={spokenText} 
                spokenCharIndex={spokenCharIndex} 
                highlightWords={highlightWords}
              />
            </motion.h1>
          );
        case 'SUBHEADER':
          return (
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "font-bold text-center max-h-full overflow-y-auto px-4 text-balance",
                "text-[clamp(1.5rem,6vmin,6rem)]",
                colors.accent
              )}
            >
              <MarkdownContent 
                content={content} 
                isReading={isReading && currentSpokenId === 'main'} 
                spokenText={spokenText} 
                spokenCharIndex={spokenCharIndex} 
                highlightWords={highlightWords}
              />
            </motion.h2>
          );
        case 'LIST_BLOCK':
          return (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex flex-col gap-[clamp(1rem,3vmin,3rem)] w-full max-w-[90vw] md:max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 py-4"
            >
              {item.ITEMS.map((listItem: any, idx: number) => (
                <div key={idx} className="flex items-start gap-[clamp(1rem,3vmin,3rem)] group">
                  <div className={cn(
                    "mt-[clamp(0.25rem,1vmin,0.5rem)] shrink-0 w-[clamp(2rem,6vmin,4rem)] h-[clamp(2rem,6vmin,4rem)] rounded-full flex items-center justify-center font-black text-[clamp(1rem,3vmin,2rem)] border backdrop-blur-sm",
                    theme === 'modern' && "bg-blue-500/20 border-blue-500/30 text-blue-400",
                    theme === 'cyberpunk' && "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]",
                    theme === 'terminal' && "bg-green-500/20 border-green-500/30 text-green-400",
                    theme === 'ethereal' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
                    theme === 'prism' && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                    theme === 'god-of-war' && "bg-[#8b0000]/20 border-[#ffd700]/30 text-[#ffd700]",
                    theme === 'cuphead' && "bg-white border-2 border-black text-black shadow-[2px_2px_0_rgba(0,0,0,1)]",
                    theme === 'comic' && "bg-yellow-400 border-2 border-black text-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-3"
                  )}>
                    {item.LIST_TYPE === 'STEP' ? idx + 1 : item.LIST_TYPE === 'CHECKLIST' ? '✓' : '•'}
                  </div>
                  <div className={cn(
                    "font-medium leading-snug",
                    "text-[clamp(1.25rem,4vmin,4rem)]",
                    colors.text
                  )}>
                    <MarkdownContent content={listItem.CONTENT} isReading={isReading && currentSpokenId === `list-${idx}`} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} />
                  </div>
                </div>
              ))}
            </motion.div>
          );
        case 'TABLE_BLOCK':
          const tableHeaders = item.ITEMS.filter((i: any) => i.TYPE === 'TABLE_HEAD');
          const tableRows = item.ITEMS.filter((i: any) => i.TYPE === 'TABLE_ROW');
          
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "w-full max-w-6xl max-h-full overflow-auto rounded-xl sm:rounded-2xl md:rounded-3xl border-2 sm:border-4 shadow-2xl backdrop-blur-xl",
                colors.bg,
                colors.border
              )}
            >

              <table className="w-full border-collapse text-left">
                {tableHeaders.length > 0 && (
                  <thead className={cn(
                    "sticky top-0 z-10 backdrop-blur-md",
                    theme === 'modern' && "bg-blue-600/20",
                    theme === 'cyberpunk' && "bg-fuchsia-900/40",
                    theme === 'terminal' && "bg-green-900/40",
                    theme === 'ethereal' && "bg-indigo-50/50",
                    theme === 'prism' && "bg-slate-50/80",
                    theme === 'god-of-war' && "bg-[#8b0000]/40",
                    theme === 'cuphead' && "bg-[#fef08a]",
                    theme === 'comic' && "bg-yellow-400"
                  )}>
                    {tableHeaders.map((headerItem: any, hIdx: number) => (
                      <tr key={hIdx}>
                        {headerItem.CONTENT.split('|').map((h: string, cIdx: number) => (
                          <th key={cIdx} className={cn(
                            "px-[clamp(0.5rem,2vmin,2rem)] py-[clamp(0.5rem,2vmin,2rem)] font-black uppercase tracking-widest border-b-2",
                            "text-[clamp(1rem,3vmin,2.5rem)]",
                            colors.accent,
                            theme === 'modern' && "border-blue-500/30",
                            theme === 'cyberpunk' && "border-fuchsia-500/30",
                            theme === 'terminal' && "border-green-500/30",
                            theme === 'ethereal' && "border-indigo-100",
                            theme === 'prism' && "border-slate-200",
                            theme === 'god-of-war' && "border-[#ffd700]/30",
                            theme === 'cuphead' && "border-black",
                            theme === 'comic' && "border-black"
                          )}>
                            <MarkdownContent 
                              content={h.trim()} 
                              isReading={isReading && currentSpokenId === `table-${hIdx}-${cIdx}`} 
                              spokenText={spokenText} 
                              spokenCharIndex={spokenCharIndex} 
                              highlightWords={highlightWords}
                            />
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                )}
                <tbody className={cn(
                  "divide-y",
                  theme === 'modern' && "divide-white/5",
                  theme === 'cyberpunk' && "divide-cyan-500/10",
                  theme === 'terminal' && "divide-green-500/20",
                  theme === 'ethereal' && "divide-indigo-50",
                  theme === 'prism' && "divide-slate-100",
                  theme === 'god-of-war' && "divide-white/10",
                  theme === 'cuphead' && "divide-black/10",
                  theme === 'comic' && "divide-black/20"
                )}>
                  {tableRows.map((row: any, rIdx: number) => {
                    const cells = row.CONTENT.split('|').map((s: string) => s.trim());
                    // Find actual row index in item.ITEMS
                    const actualRowIdx = item.ITEMS.indexOf(row);
                    return (
                      <tr key={rIdx} className="hover:bg-white/5 transition-colors group">
                        {cells.map((c: string, cIdx: number) => (
                          <td key={cIdx} className={cn(
                            "px-[clamp(0.5rem,2vmin,2rem)] py-[clamp(0.5rem,2vmin,2rem)] font-medium",
                            "text-[clamp(0.875rem,2.5vmin,2rem)]",
                            colors.text
                          )}>
                            <MarkdownContent 
                              content={c} 
                              isReading={isReading && currentSpokenId === `table-${actualRowIdx}-${cIdx}`} 
                              spokenText={spokenText} 
                              spokenCharIndex={spokenCharIndex} 
                              highlightWords={highlightWords}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          );
        case 'BULLET':
        case 'CHECKLIST':
        case 'STEP':
          return (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                "font-medium flex items-start gap-[clamp(1rem,3vmin,3rem)] max-w-4xl max-h-full overflow-y-auto pr-4",
                "text-[clamp(1.25rem,4vmin,4rem)]",
                colors.text
              )}
            >
              <span className={cn("mt-1 shrink-0 text-[clamp(1.5rem,5vmin,5rem)]", colors.accent)}>
                {type === 'STEP' ? '→' : '•'}
              </span>
              <p className="leading-tight"><MarkdownContent content={content} isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></p>
            </motion.div>
          );
        case 'WARNING':
        case 'IMPORTANT':
          return (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] border-2 sm:border-4 md:border-8 max-w-4xl text-center max-h-full overflow-y-auto",
                type === 'WARNING' ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'bg-red-500/10 border-red-500 text-red-200 shadow-[0_0_50px_rgba(239,68,68,0.2)]'
              )}
            >
              <div className="flex justify-center mb-[clamp(0.75rem,2vmin,2rem)]">
                <AlertTriangle className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" />
              </div>
              <h3 className="font-black uppercase tracking-[0.3em] mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1.25rem,4vmin,3rem)]">
                {type}
              </h3>
              <p className="font-bold leading-tight text-[clamp(1.5rem,5vmin,5rem)]"><MarkdownContent content={content} isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></p>
            </motion.div>
          );
        case 'TIP':
        case 'KEY_POINT':
          return (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] border-2 sm:border-4 md:border-8 max-w-4xl text-center max-h-full overflow-y-auto",
                type === 'TIP' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
              )}
            >
              <div className="flex justify-center mb-[clamp(0.75rem,2vmin,2rem)]">
                {type === 'TIP' ? <Lightbulb className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" /> : <Sparkles className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" />}
              </div>
              <h3 className="font-black uppercase tracking-[0.3em] mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1.25rem,4vmin,3rem)]">
                {type.replace('_', ' ')}
              </h3>
              <p className="font-bold leading-tight text-[clamp(1.5rem,5vmin,5rem)]"><MarkdownContent content={content} isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></p>
            </motion.div>
          );
        case 'DEFINITION':
          const [term, ...defParts] = content.split(':');
          return (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6"
            >

              <span className={cn("font-black uppercase tracking-[0.4em] block mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1rem,3vmin,2rem)]", colors.accent)}>Definition</span>
              <h3 className={cn("font-black mb-[clamp(0.75rem,2vmin,2rem)] leading-none tracking-tighter text-[clamp(2.5rem,8vmin,8rem)]", colors.text)}><MarkdownContent content={term} isReading={false} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></h3>
              <div className={cn("h-1 w-[clamp(4rem,10vmin,8rem)] mx-auto mb-[clamp(0.75rem,2vmin,2rem)] rounded-full", theme === 'modern' ? 'bg-blue-500' : 'bg-current')} />
              <p className={cn("italic leading-snug text-[clamp(1.25rem,5vmin,5rem)]", colors.text)}><MarkdownContent content={defParts.join(':').trim()} isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></p>
            </motion.div>
          );
        case 'QUOTE':
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "text-center max-w-5xl italic font-serif max-h-full overflow-y-auto px-4 sm:px-6 md:px-10 relative",
                "text-[clamp(1.5rem,5vmin,5rem)]",
                colors.text
              )}
            >

              <div className={cn("absolute -top-[clamp(1rem,4vmin,4rem)] -left-[clamp(0.5rem,2vmin,2rem)] font-serif select-none opacity-20 text-[clamp(4rem,15vmin,12rem)]", colors.accent)}>“</div>
              <p className="relative z-10 leading-relaxed"><MarkdownContent content={content} isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} /></p>
              <div className={cn("absolute -bottom-[clamp(2rem,8vmin,8rem)] -right-[clamp(0.5rem,2vmin,2rem)] font-serif select-none opacity-20 text-[clamp(4rem,15vmin,12rem)]", colors.accent)}>”</div>
            </motion.div>
          );
        case 'CODE':
          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "w-full max-w-6xl max-h-full overflow-y-auto rounded-xl sm:rounded-2xl md:rounded-3xl border-2 sm:border-4 shadow-2xl text-left no-scramble backdrop-blur-md",
                colors.bg,
                colors.border
              )}
            >

              <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-white/5 border-b border-white/10">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 sm:ml-4 text-[8px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Source Code</span>
              </div>
              <div className="p-[clamp(0.75rem,2vmin,2rem)] text-[clamp(0.875rem,2.5vmin,2rem)]">
                <MarkdownContent content={`\`\`\`javascript\n${content}\n\`\`\``} asBlock isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} />
              </div>
            </motion.div>
          );
        case 'IMG':
        case 'IMG_TEXT':
          return (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-8 w-full max-w-6xl h-full"
            >
              {type === 'IMG' ? (
                <div className="relative group max-h-[clamp(30vh,60vmin,70vh)] flex items-center justify-center">
                  <img 
                    src={content} 
                    alt="Presentation" 
                    className="max-h-full w-auto rounded-xl sm:rounded-2xl md:rounded-[2rem] shadow-2xl border-2 sm:border-4 md:border-8 border-white/10 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl md:rounded-[2rem] ring-1 ring-inset ring-white/20 pointer-events-none" />
                </div>
              ) : (
                <div className={cn(
                  "p-[clamp(1.5rem,4vmin,4rem)] backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-[3rem] border-2 sm:border-4 border-dashed text-center w-full max-w-4xl",
                  colors.bg,
                  colors.border
                )}>
                  <ImageIcon className="w-[clamp(2rem,6vmin,5rem)] h-[clamp(2rem,6vmin,5rem)] text-slate-600 mx-auto mb-[clamp(0.75rem,2vmin,2rem)]" />
                  <p className={cn("font-black tracking-tight text-[clamp(1.25rem,4vmin,3rem)]", colors.text)}>
                    <span className={cn(
                      "transition-colors duration-200",
                      isReading && currentSpokenId === 'img-prefix' && "bg-yellow-400/30 text-yellow-900 rounded px-1"
                    )}>
                      Image Search: 
                    </span>{" "}
                    <MarkdownContent 
                      content={content} 
                      isReading={isReading && currentSpokenId === 'main'} 
                      spokenText={spokenText} 
                      spokenCharIndex={spokenCharIndex} 
                      highlightWords={highlightWords}
                    />
                  </p>
                </div>
              )}
              <div className={cn(
                "px-3 sm:px-4 md:px-6 py-0.5 sm:py-1 md:py-2 border rounded-full backdrop-blur-sm shrink-0",
                theme === 'modern' && "bg-blue-500/10 border-blue-500/20",
                theme === 'cyberpunk' && "bg-fuchsia-500/10 border-fuchsia-500/20",
                theme === 'terminal' && "bg-green-500/10 border-green-500/20",
                theme === 'ethereal' && "bg-indigo-500/10 border-indigo-500/20",
                theme === 'prism' && "bg-blue-500/5 border-blue-500/10",
                theme === 'god-of-war' && "bg-[#8b0000]/10 border-[#ffd700]/20",
                theme === 'cuphead' && "bg-white/10 border-black/20",
                theme === 'comic' && "bg-yellow-400/10 border-black/20"
              )}>
                <p className={cn("text-sm sm:text-lg md:text-xl font-bold uppercase tracking-widest", colors.accent)}>{item.TOPIC}</p>
              </div>
            </motion.div>
          );
        case 'MCQ':
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 no-scramble"
            >

              <div className="origin-top transform py-4 sm:py-8">
                <MCQRenderer item={item} theme={theme} isPresentation={true} />
              </div>
            </motion.div>
          );
        case 'ESSAY':
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 no-scramble"
            >

              <div className="origin-top transform py-4 sm:py-8">
                <EssayRenderer item={item} theme={theme} isPresentation={true} />
              </div>
            </motion.div>
          );
        default:
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "max-w-6xl w-full prose prose-invert overflow-y-auto max-h-full px-[clamp(1rem,4vmin,3rem)] py-[clamp(1rem,3vmin,2rem)] leading-relaxed font-medium",
                "text-[clamp(1.25rem,4vmin,4rem)]",
                colors.text
              )}
            >

              <MarkdownContent content={content} asBlock isReading={isReading && currentSpokenId === 'main'} spokenText={spokenText} spokenCharIndex={spokenCharIndex} highlightWords={highlightWords} />
            </motion.div>
          );
      }
    };

    return (
      <ColorContext.Provider value={{ theme, groupColor: colors.hex, nextColor: colors.next }}>
        <div className="flex flex-col items-center justify-center w-full h-full gap-4 sm:gap-8">
          <div className="w-full flex justify-center">
            {renderMainContent()}
          </div>
          
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
              {attachedImages.map((img: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="relative group"
                >
                  <img 
                    src={img.url} 
                    alt="Attached" 
                    className="h-16 sm:h-24 md:h-32 rounded-lg sm:rounded-xl shadow-lg border-2 border-white/20"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ColorContext.Provider>
    );
  };


  return (
    <div className={`presentation-view-container fixed inset-0 z-[10000] flex flex-col overflow-hidden transition-colors duration-700 ${
      theme === 'cyberpunk' ? 'bg-[#020204]' : 
      theme === 'vintage' ? 'bg-[#f4ece1]' : 
      theme === 'terminal' ? 'bg-black' : 
      'bg-slate-950'
    }`}>
      {/* Top Bar */}
      <div className="shrink-0 p-4 sm:p-6 flex items-center justify-between z-50 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-lg leading-none">Presentation View</h3>
            <p className="text-white/50 text-[10px] sm:text-xs font-mono mt-1 uppercase tracking-widest">
              Slide {currentSlideIndex + 1} of {slides.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={handleDownloadHTML}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            title="Download Presentation HTML"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span className="hidden md:inline">Export HTML</span>
          </button>
          
          <button 
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
              isAutoplay ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {isAutoplay ? <Pause className="w-3.5 h-3.5 sm:w-4 h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 h-4" />}
            <span className="hidden sm:inline">{isAutoplay ? 'Autoplay On' : 'Autoplay'}</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowAnimationMenu(!showAnimationMenu)}
              className={`p-2 sm:p-3 rounded-full transition-all active:scale-90 ${textAnimationMode !== 'none' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
              title="Text Animation Menu"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <AnimatePresence>
              {showAnimationMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[10000]" 
                    onClick={() => setShowAnimationMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[10001]"
                  >
                    <div className="p-2 flex flex-col gap-1">
                      <button
                        onClick={() => { setTextAnimationMode('blur'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'blur' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Blur Reveal
                        {textAnimationMode === 'blur' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('slide'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'slide' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Slide Up
                        {textAnimationMode === 'slide' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('scramble'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'scramble' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Scramble
                        {textAnimationMode === 'scramble' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('typewriter'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'typewriter' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Typewriter
                        {textAnimationMode === 'typewriter' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('elastic'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'elastic' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Elastic Bounce
                        {textAnimationMode === 'elastic' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('flash'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'flash' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Flash Glow
                        {textAnimationMode === 'flash' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('rotate'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'rotate' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        3D Rotate
                        {textAnimationMode === 'rotate' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('glitch'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'glitch' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Glitch Reveal
                        {textAnimationMode === 'glitch' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('wave'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'wave' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Wave Flow
                        {textAnimationMode === 'wave' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('neon'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'neon' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        Neon Pulse
                        {textAnimationMode === 'neon' && <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setTextAnimationMode('none'); setShowAnimationMenu(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${textAnimationMode === 'none' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        None
                        {textAnimationMode === 'none' && <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => {
              if (!isBlurtingMode) {
                setBlurtInput('');
                setIsBlurtSubmitted(false);
                setBlurtResults(null);
              }
              setIsBlurtingMode(!isBlurtingMode);
            }}
            className={`p-2 sm:p-3 rounded-full transition-all active:scale-90 ${isBlurtingMode ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title="Blurting Mode (Active Recall)"
          >
            <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={() => setShowTextSizeModal(true)}
            className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
            title="Adjust Text Size"
          >
            <Type className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={toggleVoice}
            className={`p-2 sm:p-3 rounded-full transition-all active:scale-90 ${isReading ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={isReading ? "Stop Reading" : "Read Slide"}
          >
            {isReading ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden relative">
        <div 
          style={{ 
            transform: `scale(${textScale})`, 
            transformOrigin: 'center center',
            width: `${100 / textScale}%`,
            height: `${100 / textScale}%`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlideIndex}
              initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full flex flex-col items-center justify-center text-white"
            >
              <TextAnimationContainer key={currentSlideIndex + '-' + textAnimationMode} mode={textAnimationMode} className="w-full h-full flex flex-col items-center justify-center">
                {/* Topic Badge */}
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-4 sm:mb-6 md:mb-8 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shrink-0"
                >
                  {currentSlide.TOPIC}
                </motion.div>

                <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative">
                  {isBlurtingMode && !isBlurtSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-4xl flex flex-col gap-6"
                    >
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-purple-400 uppercase tracking-widest">Blurting Mode</h2>
                        <p className="text-slate-400">Write everything you remember about this slide.</p>
                      </div>
                      <textarea
                        value={blurtInput}
                        onChange={(e) => setBlurtInput(e.target.value)}
                        placeholder="Start typing here..."
                        className="w-full h-64 bg-white/5 border-2 border-purple-500/30 rounded-3xl p-8 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        autoFocus
                      />
                      <button
                        onClick={calculateBlurtResults}
                        disabled={!blurtInput.trim()}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-xl font-bold transition-all shadow-xl shadow-purple-900/20 active:scale-95"
                      >
                        Check My Memory
                      </button>
                    </motion.div>
                  ) : (
                    <>
                    <DocumentContext.Provider value={{ fullData: slides, highlightWords: blurtResults?.correctWords, missingWords: blurtResults?.missingWords }}>
                      {renderSlideContent(currentSlide, isReading, spokenText, spokenCharIndex, currentSpokenId, blurtResults?.correctWords)}
                    </DocumentContext.Provider>
                    </>
                  )}
                </div>
              </TextAnimationContainer>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Text Size Modal */}
      <AnimatePresence>
        {showTextSizeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowTextSizeModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Adjust Text Size</h3>
                <button onClick={() => setShowTextSizeModal(false)} className="text-white/50 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-white/50 text-sm">A</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    value={textScale}
                    onChange={(e) => setTextScale(parseFloat(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                
                <div className="flex justify-between text-white/50 text-xs font-mono">
                  <span>50%</span>
                  <span>{Math.round(textScale * 100)}%</span>
                  <span>300%</span>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setTextScale(1)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="shrink-0 p-4 sm:p-8 flex flex-col gap-4 sm:gap-6 z-50 bg-gradient-to-t from-black/50 to-transparent">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={prevSlide}
              className="p-3 sm:p-4 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl text-white transition-all active:scale-90 group"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={nextSlide}
              className="p-3 sm:p-4 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl text-white transition-all active:scale-90 group"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-white/30 font-mono text-[10px] uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">SPACE</kbd>
              <span>Next</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">← / →</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white/5 rounded border border-white/10">ESC</kbd>
              <span>Exit</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
