import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Book, Code2, Archive, FileText, RefreshCw, X, Brain } from 'lucide-react';
import { fetchReadyNotes, getCachedReadyNotes, cacheReadyNotes, type ReadyNote } from '../utils/googleSheets';
import { cn } from '../components/DocumentRenderer';
import { useTheme, type Theme } from '../components/ThemeContext';

const CHARS = '!<>-_\\/[]{}—=+*^?#________';

const ScrambleText = ({ texts }: { texts: string[] }) => {
  const [text, setText] = useState(texts[0]);

  useEffect(() => {
    let currentTextIndex = 0;
    let isCancelled = false;
    let frameRequest: number;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      if (isCancelled) return;
      
      const from = texts[currentTextIndex];
      const to = texts[(currentTextIndex + 1) % texts.length];
      const length = Math.max(from.length, to.length);
      
      let frame = 0;
      const maxFrames = 40;

      const step = () => {
        if (isCancelled) return;
        frame++;
        let result = '';
        for (let i = 0; i < length; i++) {
          const resolveFrame = (i / length) * (maxFrames * 0.5) + (maxFrames * 0.5);
          if (frame >= resolveFrame) {
            result += to[i] || '';
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setText(result);

        if (frame < maxFrames) {
          frameRequest = requestAnimationFrame(step);
        } else {
          currentTextIndex = (currentTextIndex + 1) % texts.length;
          timeout = setTimeout(animate, 3000);
        }
      };

      frameRequest = requestAnimationFrame(step);
    };

    timeout = setTimeout(animate, 3000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      cancelAnimationFrame(frameRequest);
    };
  }, [texts]);

  return <>{text}</>;
};

export default function Home() {
  const { theme } = useTheme();
  const [isReadyNotesOpen, setIsReadyNotesOpen] = useState(false);
  const [readyNotes, setReadyNotes] = useState<ReadyNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cached = getCachedReadyNotes();
    if (cached) setReadyNotes(cached);
  }, []);

  const handleFetchNotes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const notes = await fetchReadyNotes();
      setReadyNotes(notes);
      cacheReadyNotes(notes);
    } catch (err) {
      setError('Failed to fetch notes. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNote = (note: ReadyNote) => {
    localStorage.setItem('arcane-notes-input', note.content);
    // Clear previous parsed data to force re-generation
    localStorage.removeItem('arcane-notes-parsed-data');
    localStorage.removeItem('arcane-notes-current-note-id');
    navigate('/parser');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-500",
      theme === 'modern' && "text-slate-900",
      theme === 'professional' && "text-slate-900",
      theme === 'cyberpunk' && "text-cyan-400",
      theme === 'vintage' && "text-[#4a3728]",
      theme === 'terminal' && "text-green-500 font-mono",
      theme === 'ethereal' && "text-indigo-900",
      theme === 'prism' && "text-slate-900",
      theme === 'minecraft' && "text-white",
      theme === 'undertale' && "text-white font-retro",
      theme === 'god-of-war' && "text-[#e0e0e0]",
      theme === 'cuphead' && "text-black",
      theme === 'comic' && "text-black",
      theme === 'realistic' && "text-slate-900"
    )}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl text-center relative z-10"
      >
        <h1 className={cn(
          "text-7xl md:text-9xl font-black tracking-tighter mb-12 leading-none transition-all duration-500",
          theme === 'modern' && "bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500",
          theme === 'professional' && "text-slate-900 font-serif",
          theme === 'cyberpunk' && "text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] uppercase italic",
          theme === 'vintage' && "text-[#5c4b37] font-serif italic",
          theme === 'terminal' && "text-green-500 [text-shadow:0_0_10px_rgba(34,197,94,0.8)]",
          theme === 'ethereal' && "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600",
          theme === 'prism' && "text-slate-900 drop-shadow-xl",
          theme === 'minecraft' && "text-white [text-shadow:4px_4px_0_#373737] uppercase",
          theme === 'undertale' && "text-white [text-shadow:4px_4px_0_#000] uppercase tracking-[0.2em]",
          theme === 'god-of-war' && "text-[#8b0000] [text-shadow:2px_2px_10px_rgba(0,0,0,0.8)] uppercase font-serif tracking-widest",
          theme === 'cuphead' && "text-black uppercase font-black tracking-normal [text-shadow:4px_4px_0_#f4e4bc,8px_8px_0_#000]",
          theme === 'comic' && "text-black uppercase font-black italic tracking-tighter [text-shadow:4px_4px_0_#fff,8px_8px_0_#000]",
          theme === 'realistic' && "bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-500"
        )}>
          Arcane Notes
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
            <Link 
              to="/parser" 
              className={cn(
                "group relative inline-flex items-center justify-center px-12 py-6 transition-all duration-300 w-full sm:w-auto overflow-hidden active:scale-95",
                theme === 'modern' && "bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] hover:-translate-y-1",
                theme === 'professional' && "bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-lg",
                theme === 'cyberpunk' && "bg-black border-2 border-cyan-500 text-cyan-500 rounded-none shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500 hover:text-black",
                theme === 'vintage' && "bg-[#5c4b37] text-[#fdfbf7] rounded-xl hover:bg-[#8b7355] shadow-md",
                theme === 'terminal' && "bg-black border-2 border-green-500 text-green-500 rounded-none hover:bg-green-500 hover:text-black",
                theme === 'ethereal' && "bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-xl hover:shadow-indigo-500/40",
                theme === 'prism' && "bg-slate-900 text-white rounded-2xl shadow-2xl hover:bg-slate-800",
                theme === 'minecraft' && "bg-[#545454] text-white rounded-none border-b-8 border-r-8 border-[#1e1e1e] hover:bg-[#373737] active:border-b-4 active:border-r-4",
                theme === 'undertale' && "bg-black border-4 border-white text-white rounded-none hover:bg-white hover:text-black",
                theme === 'god-of-war' && "bg-[#8b0000] text-white rounded-lg border-2 border-black hover:bg-[#a00000] shadow-2xl",
                theme === 'cuphead' && "bg-black text-white rounded-none border-4 border-black hover:bg-white hover:text-black shadow-[8px_8px_0_#f4e4bc]",
                theme === 'comic' && "bg-black text-white rounded-none border-4 border-black hover:bg-white hover:text-black shadow-[8px_8px_0_#fff]",
                theme === 'realistic' && "bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-[0_10px_30px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_10px_40px_-10px_rgba(37,99,235,0.8)] hover:-translate-y-1"
              )}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className={cn(
                "text-4xl md:text-5xl font-black tracking-tight",
                theme === 'terminal' && "font-mono",
                theme === 'undertale' && "font-retro"
              )}>
                Start
              </span>
              <ArrowRight className="ml-4 w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-2 transition-transform" />
            </Link>

            <a 
              href="https://arcaneexams.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group relative inline-flex items-center justify-center px-12 py-6 transition-all duration-300 w-full sm:w-auto overflow-hidden active:scale-95",
                theme === 'modern' && "bg-gradient-to-br from-rose-600 to-red-700 rounded-2xl shadow-[0_10px_30px_-10px_rgba(225,29,72,0.6)] hover:shadow-[0_10px_40px_-10px_rgba(225,29,72,0.8)] hover:-translate-y-1",
                theme === 'professional' && "bg-slate-100 text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-200 shadow-md",
                theme === 'cyberpunk' && "bg-black border-2 border-pink-500 text-pink-500 rounded-none shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:bg-pink-500 hover:text-black",
                theme === 'vintage' && "bg-[#8b7355] text-[#fdfbf7] rounded-xl hover:bg-[#5c4b37] shadow-md",
                theme === 'terminal' && "bg-black border-2 border-amber-500 text-amber-500 rounded-none hover:bg-amber-500 hover:text-black",
                theme === 'ethereal' && "bg-white/40 backdrop-blur-md border border-white/60 text-indigo-900 rounded-full shadow-lg hover:bg-white/60",
                theme === 'prism' && "bg-white border-2 border-slate-200 text-slate-900 rounded-2xl shadow-xl hover:bg-slate-50",
                theme === 'minecraft' && "bg-[#373737] text-white rounded-none border-b-8 border-r-8 border-[#1e1e1e] hover:bg-[#1e1e1e] active:border-b-4 active:border-r-4",
                theme === 'undertale' && "bg-black border-4 border-white text-white rounded-none hover:bg-white hover:text-black",
                theme === 'god-of-war' && "bg-black text-[#8b0000] rounded-lg border-2 border-[#8b0000] hover:bg-[#1a1a1a] shadow-2xl",
                theme === 'cuphead' && "bg-white text-black rounded-none border-4 border-black hover:bg-black hover:text-white shadow-[8px_8px_0_#f4e4bc]",
                theme === 'comic' && "bg-white text-black rounded-none border-4 border-black hover:bg-black hover:text-white shadow-[8px_8px_0_#fff]",
                theme === 'realistic' && "bg-gradient-to-br from-rose-600 to-red-700 rounded-2xl shadow-[0_10px_30px_-10px_rgba(225,29,72,0.6)] hover:shadow-[0_10px_40px_-10px_rgba(225,29,72,0.8)] hover:-translate-y-1"
              )}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className={cn(
                "text-4xl md:text-5xl font-black tracking-tight",
                theme === 'terminal' && "font-mono",
                theme === 'undertale' && "font-retro"
              )}>
                Test
              </span>
              <ArrowRight className="ml-4 w-8 h-8 md:w-10 md:h-10 group-hover:translate-x-2 transition-transform" />
            </a>
            
            <Link 
              to="/saved" 
              className={cn(
                "flex items-center gap-2 font-bold transition-all px-4 py-2 rounded-lg",
                theme === 'modern' && "text-slate-500 hover:text-blue-600 hover:bg-blue-50",
                theme === 'professional' && "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                theme === 'cyberpunk' && "text-cyan-900 hover:text-cyan-400 hover:bg-cyan-900/20",
                theme === 'vintage' && "text-[#8b7355] hover:text-[#5c4b37] hover:bg-[#f4ecd8]",
                theme === 'terminal' && "text-green-900 hover:text-green-500 hover:bg-green-900/20",
                theme === 'ethereal' && "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50",
                theme === 'prism' && "text-slate-500 hover:text-blue-600 hover:bg-blue-50",
                theme === 'minecraft' && "text-slate-400 hover:text-white hover:bg-white/10",
                theme === 'undertale' && "text-white/60 hover:text-white hover:bg-white/10",
                theme === 'god-of-war' && "text-[#8b0000]/60 hover:text-[#8b0000] hover:bg-[#8b0000]/10",
                theme === 'cuphead' && "text-black/60 hover:text-black hover:bg-black/5",
                theme === 'comic' && "text-black/60 hover:text-black hover:bg-black/5",
                theme === 'realistic' && "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
              )}
            >
              <Archive className="w-5 h-5" />
              Saved Notes
            </Link>

            <button 
              onClick={() => {
                setIsReadyNotesOpen(true);
                if (readyNotes.length === 0) handleFetchNotes();
              }}
              className={cn(
                "flex items-center gap-2 font-bold transition-all px-4 py-2 rounded-lg",
                theme === 'modern' && "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50",
                theme === 'professional' && "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50",
                theme === 'cyberpunk' && "text-cyan-900 hover:text-cyan-400 hover:bg-cyan-900/20",
                theme === 'vintage' && "text-[#8b7355] hover:text-[#5c4b37] hover:bg-[#f4ecd8]",
                theme === 'terminal' && "text-green-900 hover:text-green-500 hover:bg-green-900/20",
                theme === 'ethereal' && "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50",
                theme === 'prism' && "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50",
                theme === 'minecraft' && "text-slate-400 hover:text-white hover:bg-white/10",
                theme === 'undertale' && "text-white/60 hover:text-white hover:bg-white/10",
                theme === 'god-of-war' && "text-[#8b0000]/60 hover:text-[#8b0000] hover:bg-[#8b0000]/10",
                theme === 'cuphead' && "text-black/60 hover:text-black hover:bg-black/5",
                theme === 'comic' && "text-black/60 hover:text-black hover:bg-black/5",
                theme === 'realistic' && "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
              )}
            >
              <FileText className="w-5 h-5" />
              Ready Notes
            </button>
          </div>
          
          <div className={cn(
            "flex items-center gap-4 px-6 py-4 transition-all h-fit",
            theme === 'modern' && "bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md",
            theme === 'professional' && "bg-white border border-slate-300 rounded-xl shadow-sm hover:shadow-md",
            theme === 'cyberpunk' && "bg-black/60 border-2 border-cyan-900/50 rounded-none shadow-[0_0_15px_rgba(6,182,212,0.1)]",
            theme === 'vintage' && "bg-[#fdfbf7] border-2 border-[#d4c5a1] rounded-xl shadow-md",
            theme === 'terminal' && "bg-black border-2 border-green-900/50 rounded-none",
            theme === 'ethereal' && "bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl shadow-lg",
            theme === 'prism' && "bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md",
            theme === 'minecraft' && "bg-[#313131] border-4 border-[#1e1e1e] rounded-none",
            theme === 'undertale' && "bg-black border-4 border-white rounded-none",
            theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30 rounded-lg shadow-2xl",
            theme === 'cuphead' && "bg-[#f4e4bc] border-4 border-black rounded-none shadow-[8px_8px_0_#000]",
            theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[8px_8px_0_#000]",
            theme === 'realistic' && "bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border transition-colors",
              theme === 'modern' && "bg-slate-50 border-slate-100",
              theme === 'professional' && "bg-slate-50 border-slate-200",
              theme === 'cyberpunk' && "bg-cyan-900/20 border-cyan-900/50",
              theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1]",
              theme === 'terminal' && "bg-green-900/20 border-green-900/50",
              theme === 'ethereal' && "bg-white/60 border-white/80",
              theme === 'prism' && "bg-slate-50 border-slate-100",
              theme === 'minecraft' && "bg-[#545454] border-[#1e1e1e] rounded-none",
              theme === 'undertale' && "bg-white/10 border-white/20 rounded-none",
              theme === 'god-of-war' && "bg-[#8b0000]/10 border-[#8b0000]/30 rounded-none",
              theme === 'cuphead' && "bg-white border-2 border-black rounded-none",
              theme === 'comic' && "bg-white border-2 border-black rounded-none",
              theme === 'realistic' && "bg-slate-50 border-slate-100"
            )}>
              <Code2 className={cn(
                "w-6 h-6 transition-colors",
                theme === 'cyberpunk' && "text-cyan-400",
                theme === 'terminal' && "text-green-500",
                theme === 'minecraft' && "text-white",
                theme === 'undertale' && "text-white",
                theme === 'god-of-war' && "text-[#8b0000]",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black",
                theme === 'realistic' && "text-slate-700"
              )} />
            </div>
            <div className="text-left min-w-[140px]">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-wider transition-colors",
                theme === 'cyberpunk' && "text-cyan-900",
                theme === 'terminal' && "text-green-900",
                theme === 'minecraft' && "text-slate-400",
                theme === 'undertale' && "text-white/40",
                theme === 'god-of-war' && "text-[#8b0000]/40",
                theme === 'cuphead' && "text-black/40",
                theme === 'comic' && "text-black/40",
                theme === 'realistic' && "text-slate-400"
              )}>Designed By</p>
              <p className={cn(
                "text-sm font-black tracking-tight uppercase transition-colors",
                theme === 'cyberpunk' && "text-cyan-400",
                theme === 'terminal' && "text-green-500",
                theme === 'minecraft' && "text-white",
                theme === 'undertale' && "text-white",
                theme === 'god-of-war' && "text-[#e0e0e0]",
                theme === 'cuphead' && "text-black",
                theme === 'comic' && "text-black",
                theme === 'realistic' && "text-slate-800"
              )}>
                <ScrambleText texts={['AHMED FAYED', 'ARCANE PLOTTER']} />
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ready Notes Modal */}
      <AnimatePresence>
        {isReadyNotesOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReadyNotesOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all duration-500",
                theme === 'modern' && "bg-white rounded-[2.5rem]",
                theme === 'professional' && "bg-white rounded-xl border border-slate-200",
                theme === 'cyberpunk' && "bg-black border-2 border-cyan-500 rounded-none shadow-[0_0_30px_rgba(6,182,212,0.2)]",
                theme === 'vintage' && "bg-[#fdfbf7] border-2 border-[#d4c5a1] rounded-3xl",
                theme === 'terminal' && "bg-black border-2 border-green-500 rounded-none",
                theme === 'ethereal' && "bg-white/90 backdrop-blur-xl border border-white/60 rounded-[3rem]",
                theme === 'prism' && "bg-white rounded-[2.5rem] border-none",
                theme === 'minecraft' && "bg-[#c6c6c6] border-8 border-[#373737] rounded-none",
                theme === 'undertale' && "bg-black border-4 border-white rounded-none",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-2 border-[#8b0000]/30 rounded-lg",
                theme === 'cuphead' && "bg-[#f4e4bc] border-4 border-black rounded-none shadow-[12px_12px_0_rgba(0,0,0,1)]",
                theme === 'comic' && "bg-white border-4 border-black rounded-none shadow-[12px_12px_0_rgba(0,0,0,1)]",
                theme === 'realistic' && "bg-white rounded-[2.5rem]"
              )}
            >
              <div className={cn(
                "p-8 border-b flex items-center justify-between transition-colors duration-500",
                theme === 'modern' && "bg-slate-50/50 border-slate-100",
                theme === 'professional' && "bg-slate-50 border-slate-200",
                theme === 'cyberpunk' && "bg-cyan-900/20 border-cyan-900/50",
                theme === 'vintage' && "bg-[#f4ecd8] border-[#d4c5a1]",
                theme === 'terminal' && "bg-green-900/20 border-green-900/50",
                theme === 'ethereal' && "bg-indigo-50/30 border-indigo-100/50",
                theme === 'prism' && "bg-slate-50/50 border-slate-100",
                theme === 'minecraft' && "bg-[#545454] border-[#1e1e1e]",
                theme === 'undertale' && "bg-black border-b-4 border-white",
                theme === 'god-of-war' && "bg-[#1a1a1a] border-b-2 border-[#8b0000]/30",
                theme === 'cuphead' && "bg-white border-b-4 border-black",
                theme === 'comic' && "bg-white border-b-4 border-black",
                theme === 'realistic' && "bg-slate-50/50 border-slate-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors",
                    theme === 'modern' && "bg-emerald-100 text-emerald-600",
                    theme === 'professional' && "bg-emerald-100 text-emerald-700",
                    theme === 'cyberpunk' && "bg-cyan-900/40 text-cyan-400",
                    theme === 'vintage' && "bg-[#d4c5a1] text-[#5c4b37]",
                    theme === 'terminal' && "bg-green-900/40 text-green-500",
                    theme === 'ethereal' && "bg-indigo-100 text-indigo-600",
                    theme === 'prism' && "bg-emerald-100 text-emerald-600",
                    theme === 'minecraft' && "bg-[#373737] text-white rounded-none",
                    theme === 'undertale' && "bg-white/10 text-white rounded-none",
                    theme === 'god-of-war' && "bg-[#8b0000]/20 text-[#8b0000]",
                    theme === 'cuphead' && "bg-black text-white rounded-none",
                    theme === 'comic' && "bg-black text-white rounded-none",
                    theme === 'realistic' && "bg-emerald-100 text-emerald-600"
                  )}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn(
                      "text-2xl font-black tracking-tight transition-colors",
                      theme === 'cyberpunk' && "text-cyan-400",
                      theme === 'terminal' && "text-green-500",
                      theme === 'undertale' && "text-white",
                      theme === 'god-of-war' && "text-[#e0e0e0]",
                      theme === 'cuphead' && "text-black",
                      theme === 'comic' && "text-black",
                      theme === 'realistic' && "text-slate-900"
                    )}>Ready Notes</h2>
                    <p className={cn(
                      "text-sm font-medium transition-colors",
                      theme === 'cyberpunk' && "text-cyan-900",
                      theme === 'terminal' && "text-green-900",
                      theme === 'undertale' && "text-white/40",
                      theme === 'god-of-war' && "text-[#8b0000]/40",
                      theme === 'cuphead' && "text-black/40",
                      theme === 'comic' && "text-black/40",
                      theme === 'realistic' && "text-slate-500"
                    )}>Pre-formatted notes from Google Sheets</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFetchNotes}
                    disabled={isLoading}
                    className={cn(
                      "p-3 rounded-2xl transition-all",
                      theme === 'modern' && "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
                      theme === 'professional' && "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50",
                      theme === 'cyberpunk' && "text-cyan-900 hover:text-cyan-400 hover:bg-cyan-900/20",
                      theme === 'vintage' && "text-[#8b7355] hover:text-[#5c4b37] hover:bg-[#f4ecd8]",
                      theme === 'terminal' && "text-green-900 hover:text-green-500 hover:bg-green-900/20",
                      theme === 'ethereal' && "text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50",
                      theme === 'prism' && "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
                      theme === 'minecraft' && "text-slate-400 hover:text-white hover:bg-white/10 rounded-none",
                      theme === 'undertale' && "text-white/40 hover:text-white hover:bg-white/10 rounded-none",
                      theme === 'god-of-war' && "text-[#8b0000]/40 hover:text-[#8b0000] hover:bg-[#8b0000]/10",
                      theme === 'cuphead' && "text-black/40 hover:text-black hover:bg-black/5 rounded-none",
                      theme === 'comic' && "text-black/40 hover:text-black hover:bg-black/5 rounded-none",
                      theme === 'realistic' && "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
                      isLoading && "animate-spin"
                    )}
                  >
                    <RefreshCw className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setIsReadyNotesOpen(false)}
                    className={cn(
                      "p-3 rounded-2xl transition-all",
                      theme === 'modern' && "text-slate-400 hover:text-rose-600 hover:bg-rose-50",
                      theme === 'professional' && "text-slate-400 hover:text-rose-700 hover:bg-rose-50",
                      theme === 'cyberpunk' && "text-cyan-900 hover:text-pink-500 hover:bg-pink-900/20",
                      theme === 'vintage' && "text-[#8b7355] hover:text-rose-700 hover:bg-rose-50",
                      theme === 'terminal' && "text-green-900 hover:text-red-500 hover:bg-red-900/20",
                      theme === 'ethereal' && "text-indigo-300 hover:text-rose-600 hover:bg-rose-50",
                      theme === 'prism' && "text-slate-400 hover:text-rose-600 hover:bg-rose-50",
                      theme === 'minecraft' && "text-slate-400 hover:text-white hover:bg-white/10 rounded-none",
                      theme === 'undertale' && "text-white/40 hover:text-white hover:bg-white/10 rounded-none",
                      theme === 'god-of-war' && "text-[#8b0000]/40 hover:text-[#8b0000] hover:bg-[#8b0000]/10",
                      theme === 'cuphead' && "text-black/40 hover:text-black hover:bg-black/5 rounded-none",
                      theme === 'comic' && "text-black/40 hover:text-black hover:bg-black/5 rounded-none",
                      theme === 'realistic' && "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    )}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className={cn(
                      "w-12 h-12 border-4 rounded-full animate-spin",
                      theme === 'cyberpunk' && "border-cyan-900 border-t-cyan-400",
                      theme === 'terminal' && "border-green-900 border-t-green-500",
                      theme === 'undertale' && "border-white/20 border-t-white",
                      theme === 'god-of-war' && "border-[#8b0000]/20 border-t-[#8b0000]",
                      "border-emerald-100 border-t-emerald-600"
                    )} />
                    <p className={cn(
                      "font-bold animate-pulse",
                      theme === 'cyberpunk' && "text-cyan-400",
                      theme === 'terminal' && "text-green-500",
                      theme === 'undertale' && "text-white",
                      theme === 'god-of-war' && "text-[#8b0000]",
                      "text-slate-500"
                    )}>Fetching notes...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-20">
                    <div className={cn(
                      "inline-flex p-4 rounded-3xl mb-4",
                      theme === 'cyberpunk' && "bg-pink-900/20 text-pink-500",
                      theme === 'terminal' && "bg-red-900/20 text-red-500",
                      "bg-rose-50 text-rose-600"
                    )}>
                      <X className="w-8 h-8" />
                    </div>
                    <p className={cn(
                      "font-bold text-lg mb-2",
                      theme === 'cyberpunk' && "text-cyan-400",
                      theme === 'terminal' && "text-green-500",
                      theme === 'undertale' && "text-white",
                      "text-slate-900"
                    )}>{error}</p>
                    <button 
                      onClick={handleFetchNotes}
                      className={cn(
                        "font-bold hover:underline",
                        theme === 'cyberpunk' && "text-cyan-400",
                        theme === 'terminal' && "text-green-500",
                        theme === 'undertale' && "text-yellow-400",
                        "text-emerald-600"
                      )}
                    >
                      Try again
                    </button>
                  </div>
                ) : readyNotes.length === 0 ? (
                  <div className="text-center py-20">
                    <div className={cn(
                      "inline-flex p-4 rounded-3xl mb-4",
                      theme === 'cyberpunk' && "bg-cyan-900/20 text-cyan-400",
                      theme === 'terminal' && "bg-green-900/20 text-green-500",
                      "bg-slate-50 text-slate-400"
                    )}>
                      <Brain className="w-8 h-8" />
                    </div>
                    <p className={cn(
                      "font-bold text-lg",
                      theme === 'cyberpunk' && "text-cyan-400",
                      theme === 'terminal' && "text-green-500",
                      theme === 'undertale' && "text-white",
                      "text-slate-900"
                    )}>No notes found.</p>
                    <p className={cn(
                      "text-slate-500",
                      theme === 'cyberpunk' && "text-cyan-900",
                      theme === 'terminal' && "text-green-900",
                      theme === 'undertale' && "text-white/40"
                    )}>The sheet might be empty or inaccessible.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readyNotes.map((note, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSelectNote(note)}
                        className={cn(
                          "group flex flex-col items-start p-6 transition-all text-left",
                          theme === 'modern' && "bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-3xl",
                          theme === 'professional' && "bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl",
                          theme === 'cyberpunk' && "bg-black/40 hover:bg-cyan-900/20 border border-cyan-900/50 hover:border-cyan-500 rounded-none",
                          theme === 'vintage' && "bg-[#f4ecd8]/40 hover:bg-[#f4ecd8] border border-[#d4c5a1] hover:border-[#8b7355] rounded-2xl",
                          theme === 'terminal' && "bg-black hover:bg-green-900/10 border border-green-900/50 hover:border-green-500 rounded-none",
                          theme === 'ethereal' && "bg-white/40 hover:bg-white/60 border border-indigo-50 hover:border-indigo-200 rounded-3xl",
                          theme === 'prism' && "bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-3xl",
                          theme === 'minecraft' && "bg-[#545454] hover:bg-[#373737] border-4 border-[#1e1e1e] rounded-none",
                          theme === 'undertale' && "bg-black hover:bg-white/10 border-4 border-white rounded-none",
                          theme === 'god-of-war' && "bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#8b0000]/20 hover:border-[#8b0000]/50 rounded-lg",
                          theme === 'cuphead' && "bg-white hover:bg-[#f4e4bc] border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
                          theme === 'comic' && "bg-white hover:bg-yellow-50 border-4 border-black rounded-none shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)]",
                          theme === 'realistic' && "bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-3xl"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-3">
                          <h3 className={cn(
                            "text-lg font-black tracking-tight transition-colors",
                            theme === 'cyberpunk' && "text-cyan-400 group-hover:text-cyan-300",
                            theme === 'terminal' && "text-green-500 group-hover:text-green-400",
                            theme === 'undertale' && "text-white group-hover:text-yellow-400",
                            theme === 'god-of-war' && "text-[#e0e0e0] group-hover:text-[#8b0000]",
                            theme === 'cuphead' && "text-black",
                            theme === 'comic' && "text-black",
                            "text-slate-900 group-hover:text-emerald-700"
                          )}>
                            {note.name}
                          </h3>
                          <div className={cn(
                            "p-2 transition-colors",
                            theme === 'modern' && "bg-white rounded-xl text-slate-400 group-hover:text-emerald-500 shadow-sm",
                            theme === 'professional' && "bg-white rounded-lg text-slate-400 group-hover:text-slate-900 shadow-sm",
                            theme === 'cyberpunk' && "bg-cyan-900/40 rounded-none text-cyan-900 group-hover:text-cyan-400",
                            theme === 'vintage' && "bg-[#fdfbf7] rounded-xl text-[#d4c5a1] group-hover:text-[#8b7355]",
                            theme === 'terminal' && "bg-green-900/40 rounded-none text-green-900 group-hover:text-green-500",
                            theme === 'ethereal' && "bg-white rounded-xl text-indigo-300 group-hover:text-indigo-600 shadow-sm",
                            theme === 'prism' && "bg-white rounded-xl text-slate-400 group-hover:text-emerald-500 shadow-sm",
                            theme === 'minecraft' && "bg-[#1e1e1e] rounded-none text-slate-400 group-hover:text-white",
                            theme === 'undertale' && "bg-white/10 rounded-none text-white/40 group-hover:text-white",
                            theme === 'god-of-war' && "bg-black rounded-none text-[#8b0000]/40 group-hover:text-[#8b0000]",
                            theme === 'cuphead' && "bg-black rounded-none text-white",
                            theme === 'comic' && "bg-black rounded-none text-white",
                            "bg-white rounded-xl text-slate-400 group-hover:text-emerald-500 shadow-sm"
                          )}>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm line-clamp-2 font-medium transition-colors",
                          theme === 'cyberpunk' && "text-cyan-900 group-hover:text-cyan-700",
                          theme === 'terminal' && "text-green-900 group-hover:text-green-700",
                          theme === 'undertale' && "text-white/40 group-hover:text-white/60",
                          theme === 'god-of-war' && "text-[#8b0000]/40 group-hover:text-[#8b0000]/60",
                          theme === 'cuphead' && "text-black/60",
                          theme === 'comic' && "text-black/60",
                          "text-slate-500"
                        )}>
                          {note.content.substring(0, 100)}...
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute top-[15%] left-[15%] opacity-40 hidden lg:block transition-colors duration-500",
          theme === 'cyberpunk' && "text-cyan-400 opacity-20",
          theme === 'terminal' && "text-green-500 opacity-20",
          theme === 'minecraft' && "text-white opacity-20",
          theme === 'undertale' && "text-white opacity-20",
          theme === 'god-of-war' && "text-[#8b0000] opacity-20",
          theme === 'cuphead' && "text-black opacity-20",
          theme === 'comic' && "text-black opacity-20",
          "text-blue-300"
        )}
      >
        <Book className="w-16 h-16" />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className={cn(
          "absolute bottom-[20%] right-[15%] opacity-40 hidden lg:block transition-colors duration-500",
          theme === 'cyberpunk' && "text-pink-500 opacity-20",
          theme === 'terminal' && "text-amber-500 opacity-20",
          theme === 'minecraft' && "text-white opacity-20",
          theme === 'undertale' && "text-white opacity-20",
          theme === 'god-of-war' && "text-[#8b0000] opacity-20",
          theme === 'cuphead' && "text-black opacity-20",
          theme === 'comic' && "text-black opacity-20",
          "text-purple-300"
        )}
      >
        <Sparkles className="w-20 h-20" />
      </motion.div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-multiply" />
    </div>
  );
}
