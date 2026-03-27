import React, { useState } from 'react';
import { UploadCloud, Loader2, FileCode } from 'lucide-react';
import { cn } from '../components/DocumentRenderer';

interface Props {
  onMetadataExtracted: (metadata: any) => void;
  theme?: string;
}

export default function HtmlUploader({ onMetadataExtracted, theme = 'modern' }: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      setError('Please upload a valid HTML file.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const text = await file.text();
      
      // Try to find metadata in script tag first
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const scriptTag = doc.getElementById('arcane-notes-metadata');
      
      let metadata: any = null;
      
      if (scriptTag) {
        try {
          metadata = JSON.parse(scriptTag.textContent || '');
        } catch (e) {
          console.warn('Failed to parse metadata from script tag', e);
        }
      }
      
      // Fallback: search for metadata in comments
      if (!metadata) {
        const startMarker = '<!-- ARCANE_NOTES_METADATA_START';
        const endMarker = 'ARCANE_NOTES_METADATA_END -->';
        
        const startIndex = text.indexOf(startMarker);
        const endIndex = text.indexOf(endMarker);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = text.substring(startIndex + startMarker.length, endIndex).trim();
          try {
            metadata = JSON.parse(jsonStr);
          } catch (e) {
            console.warn('Failed to parse metadata from comment', e);
          }
        }
      }

      if (metadata) {
        onMetadataExtracted(metadata);
      } else {
        throw new Error('No Arcane Notes metadata found in this HTML file. Make sure it was exported from this app.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract data from HTML.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-4",
        theme === 'modern' && "bg-blue-100",
        theme === 'professional' && "bg-slate-200",
        theme === 'cyberpunk' && "bg-cyan-950/50 border border-cyan-500/30 rounded-none",
        theme === 'vintage' && "bg-[#d4c5a1] rounded-sm",
        theme === 'terminal' && "bg-green-950/50 border border-green-500/30 rounded-none",
        theme === 'ethereal' && "bg-indigo-100",
        theme === 'prism' && "bg-blue-100",
        theme === 'minecraft' && "bg-[#8b8b8b] border-2 border-[#373737] rounded-none",
        theme === 'undertale' && "bg-black border-2 border-white/20 rounded-none",
        theme === 'god-of-war' && "bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none",
        theme === 'cuphead' && "bg-[#e8e8d0] border-2 border-black rounded-none",
        theme === 'comic' && "bg-yellow-100 border-2 border-black rounded-none"
      )}>
        <FileCode className={cn(
          "w-6 h-6",
          theme === 'modern' && "text-blue-600",
          theme === 'professional' && "text-slate-700",
          theme === 'cyberpunk' && "text-cyan-400",
          theme === 'vintage' && "text-[#8b4513]",
          theme === 'terminal' && "text-green-400",
          theme === 'ethereal' && "text-indigo-600",
          theme === 'prism' && "text-blue-600",
          theme === 'minecraft' && "text-white",
          theme === 'undertale' && "text-white",
          theme === 'god-of-war' && "text-[#ffd700]",
          theme === 'cuphead' && "text-black",
          theme === 'comic' && "text-black"
        )} />
      </div>
      <h3 className={cn(
        "text-lg font-bold mb-2",
        theme === 'modern' && "text-slate-800",
        theme === 'professional' && "text-slate-900",
        theme === 'cyberpunk' && "text-cyan-400",
        theme === 'vintage' && "text-[#4a3728]",
        theme === 'terminal' && "text-green-500",
        theme === 'ethereal' && "text-indigo-900",
        theme === 'prism' && "text-slate-800",
        theme === 'minecraft' && "text-white font-pixel text-sm",
        theme === 'undertale' && "text-white font-retro",
        theme === 'god-of-war' && "text-[#ffd700] font-serif",
        theme === 'cuphead' && "text-black font-black",
        theme === 'comic' && "text-black font-black"
      )}>Import from HTML</h3>
      <p className={cn(
        "text-sm mb-6 max-w-md",
        theme === 'modern' && "text-slate-500",
        theme === 'professional' && "text-slate-600",
        theme === 'cyberpunk' && "text-cyan-600",
        theme === 'vintage' && "text-[#8b4513]/60",
        theme === 'terminal' && "text-green-700",
        theme === 'ethereal' && "text-indigo-400",
        theme === 'prism' && "text-slate-500",
        theme === 'minecraft' && "text-[#373737] font-pixel text-[10px]",
        theme === 'undertale' && "text-white/50 font-retro",
        theme === 'god-of-war' && "text-[#ffd700]/50 font-serif",
        theme === 'cuphead' && "text-black/50 font-black",
        theme === 'comic' && "text-black/50 font-black"
      )}>
        Upload a previously exported Arcane Notes HTML file to restore its content, images, and settings.
      </p>

        <label className="relative cursor-pointer">
          <input 
            type="file" 
            accept=".html,text/html" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isExtracting}
          />
          <div className={cn(
            "flex items-center px-6 py-3 font-medium transition-all shadow-md",
            theme === 'modern' && "rounded-lg text-white",
            theme === 'professional' && "rounded-md text-white",
            theme === 'cyberpunk' && "rounded-none text-black uppercase tracking-widest",
            theme === 'vintage' && "rounded-sm text-[#fdfbf7]",
            theme === 'terminal' && "rounded-none text-black uppercase tracking-widest",
            theme === 'ethereal' && "rounded-xl text-white",
            theme === 'prism' && "rounded-lg text-white",
            theme === 'minecraft' && "rounded-none text-white font-pixel text-[10px] border-2 border-b-4 border-r-4 border-black",
            theme === 'undertale' && "rounded-none text-black font-retro border-2 border-white",
            theme === 'god-of-war' && "rounded-none text-black font-serif uppercase tracking-widest border border-[#ffd700]",
            theme === 'cuphead' && "rounded-none text-[#e8e8d0] font-black uppercase tracking-widest border-2 border-black",
            theme === 'comic' && "rounded-none text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
            isExtracting ? (
              theme === 'modern' ? "bg-blue-400 cursor-not-allowed" :
              theme === 'professional' ? "bg-slate-400 cursor-not-allowed" :
              theme === 'cyberpunk' ? "bg-cyan-700 cursor-not-allowed" :
              theme === 'vintage' ? "bg-[#a67c52] cursor-not-allowed" :
              theme === 'terminal' ? "bg-green-700 cursor-not-allowed" :
              theme === 'ethereal' ? "bg-indigo-400 cursor-not-allowed" :
              theme === 'prism' ? "bg-blue-400 cursor-not-allowed" :
              theme === 'minecraft' ? "bg-[#555] cursor-not-allowed" :
              theme === 'undertale' ? "bg-yellow-600 cursor-not-allowed" :
              theme === 'god-of-war' ? "bg-[#5a0000] cursor-not-allowed" :
              theme === 'cuphead' ? "bg-gray-600 cursor-not-allowed" :
              theme === 'comic' ? "bg-yellow-300 cursor-not-allowed" : "bg-blue-400 cursor-not-allowed"
            ) : (
              theme === 'modern' ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5" :
              theme === 'professional' ? "bg-slate-800 hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5" :
              theme === 'cyberpunk' ? "bg-cyan-400 hover:bg-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.8)]" :
              theme === 'vintage' ? "bg-[#8b4513] hover:bg-[#6b3410]" :
              theme === 'terminal' ? "bg-green-500 hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)]" :
              theme === 'ethereal' ? "bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg hover:-translate-y-0.5" :
              theme === 'prism' ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5" :
              theme === 'minecraft' ? "bg-[#4CAF50] hover:bg-[#45a049] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2" :
              theme === 'undertale' ? "bg-yellow-400 hover:bg-yellow-300" :
              theme === 'god-of-war' ? "bg-[#8b0000] hover:bg-[#a00000] hover:shadow-[0_0_15px_rgba(139,0,0,0.8)]" :
              theme === 'cuphead' ? "bg-black hover:bg-gray-800" :
              theme === 'comic' ? "bg-yellow-400 hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5"
            )
          )}>
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5 mr-2" /> Upload HTML
              </>
            )}
          </div>
        </label>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {error}
          </p>
        )}
    </div>
  );
}
