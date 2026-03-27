import React, { useState } from 'react';
import { UploadCloud, Loader2, FileText, Image } from 'lucide-react';
import { parsePdf } from '../utils/pdfParser';
import { cn } from '../components/DocumentRenderer';

interface Props {
  onPdfParsed?: (parsedData: any[]) => void;
  onImagesExtracted?: (images: any[]) => void;
  mode?: 'full' | 'images';
  theme?: string;
}

export default function PdfUploader({ onPdfParsed, onImagesExtracted, mode = 'full', theme = 'modern' }: Props) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const parsedData = await parsePdf(file);
      
      if (mode === 'images') {
        // Extract only image blocks
        const images = parsedData[0].ITEMS
          .filter((item: any) => item.TYPE === 'IMG')
          .map((item: any) => ({
            url: item.CONTENT,
            alignment: 'center' as const,
            size: 'medium' as const,
            hasBorder: false
          }));
        
        if (onImagesExtracted) {
          onImagesExtracted(images);
        }
      } else {
        if (onPdfParsed) {
          onPdfParsed(parsedData);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to extract ${mode === 'images' ? 'images' : 'content'} from PDF.`);
    } finally {
      setIsExtracting(false);
    }
  };

  const isImagesMode = mode === 'images';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-4",
        isImagesMode ? (
          theme === 'modern' ? "bg-purple-100" :
          theme === 'professional' ? "bg-slate-200" :
          theme === 'cyberpunk' ? "bg-fuchsia-950/50 border border-fuchsia-500/30 rounded-none" :
          theme === 'vintage' ? "bg-[#d4c5a1] rounded-sm" :
          theme === 'terminal' ? "bg-green-950/50 border border-green-500/30 rounded-none" :
          theme === 'ethereal' ? "bg-purple-100" :
          theme === 'prism' ? "bg-purple-100" :
          theme === 'minecraft' ? "bg-[#8b8b8b] border-2 border-[#373737] rounded-none" :
          theme === 'undertale' ? "bg-black border-2 border-white/20 rounded-none" :
          theme === 'god-of-war' ? "bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none" :
          theme === 'cuphead' ? "bg-[#e8e8d0] border-2 border-black rounded-none" :
          theme === 'comic' ? "bg-yellow-100 border-2 border-black rounded-none" : "bg-purple-100"
        ) : (
          theme === 'modern' ? "bg-indigo-100" :
          theme === 'professional' ? "bg-slate-200" :
          theme === 'cyberpunk' ? "bg-indigo-950/50 border border-indigo-500/30 rounded-none" :
          theme === 'vintage' ? "bg-[#d4c5a1] rounded-sm" :
          theme === 'terminal' ? "bg-green-950/50 border border-green-500/30 rounded-none" :
          theme === 'ethereal' ? "bg-indigo-100" :
          theme === 'prism' ? "bg-indigo-100" :
          theme === 'minecraft' ? "bg-[#8b8b8b] border-2 border-[#373737] rounded-none" :
          theme === 'undertale' ? "bg-black border-2 border-white/20 rounded-none" :
          theme === 'god-of-war' ? "bg-[#2a2a2a] border border-[#8b0000]/50 rounded-none" :
          theme === 'cuphead' ? "bg-[#e8e8d0] border-2 border-black rounded-none" :
          theme === 'comic' ? "bg-yellow-100 border-2 border-black rounded-none" : "bg-indigo-100"
        )
      )}>
        {isImagesMode ? (
          <Image className={cn(
            "w-6 h-6",
            theme === 'modern' ? "text-purple-600" :
            theme === 'professional' ? "text-slate-700" :
            theme === 'cyberpunk' ? "text-fuchsia-400" :
            theme === 'vintage' ? "text-[#8b4513]" :
            theme === 'terminal' ? "text-green-400" :
            theme === 'ethereal' ? "text-purple-600" :
            theme === 'prism' ? "text-purple-600" :
            theme === 'minecraft' ? "text-white" :
            theme === 'undertale' ? "text-white" :
            theme === 'god-of-war' ? "text-[#ffd700]" :
            theme === 'cuphead' ? "text-black" :
            theme === 'comic' ? "text-black" : "text-purple-600"
          )} />
        ) : (
          <FileText className={cn(
            "w-6 h-6",
            theme === 'modern' ? "text-indigo-600" :
            theme === 'professional' ? "text-slate-700" :
            theme === 'cyberpunk' ? "text-indigo-400" :
            theme === 'vintage' ? "text-[#8b4513]" :
            theme === 'terminal' ? "text-green-400" :
            theme === 'ethereal' ? "text-indigo-600" :
            theme === 'prism' ? "text-indigo-600" :
            theme === 'minecraft' ? "text-white" :
            theme === 'undertale' ? "text-white" :
            theme === 'god-of-war' ? "text-[#ffd700]" :
            theme === 'cuphead' ? "text-black" :
            theme === 'comic' ? "text-black" : "text-indigo-600"
          )} />
        )}
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
      )}>
        {isImagesMode ? 'Import Photos from PDF' : 'Smart PDF Import'}
      </h3>
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
        {isImagesMode 
          ? 'Upload a PDF to extract all embedded images directly into your note gallery.'
          : 'Upload a PDF to automatically extract text, images, and layout into a structured smart notes format.'}
      </p>

        <label className="relative cursor-pointer">
          <input 
            type="file" 
            accept="application/pdf" 
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
              isImagesMode ? (
                theme === 'modern' ? "bg-purple-400 cursor-not-allowed" :
                theme === 'professional' ? "bg-slate-400 cursor-not-allowed" :
                theme === 'cyberpunk' ? "bg-fuchsia-700 cursor-not-allowed" :
                theme === 'vintage' ? "bg-[#a67c52] cursor-not-allowed" :
                theme === 'terminal' ? "bg-green-700 cursor-not-allowed" :
                theme === 'ethereal' ? "bg-purple-400 cursor-not-allowed" :
                theme === 'prism' ? "bg-purple-400 cursor-not-allowed" :
                theme === 'minecraft' ? "bg-[#555] cursor-not-allowed" :
                theme === 'undertale' ? "bg-yellow-600 cursor-not-allowed" :
                theme === 'god-of-war' ? "bg-[#5a0000] cursor-not-allowed" :
                theme === 'cuphead' ? "bg-gray-600 cursor-not-allowed" :
                theme === 'comic' ? "bg-yellow-300 cursor-not-allowed" : "bg-purple-400 cursor-not-allowed"
              ) : (
                theme === 'modern' ? "bg-indigo-400 cursor-not-allowed" :
                theme === 'professional' ? "bg-slate-400 cursor-not-allowed" :
                theme === 'cyberpunk' ? "bg-indigo-700 cursor-not-allowed" :
                theme === 'vintage' ? "bg-[#a67c52] cursor-not-allowed" :
                theme === 'terminal' ? "bg-green-700 cursor-not-allowed" :
                theme === 'ethereal' ? "bg-indigo-400 cursor-not-allowed" :
                theme === 'prism' ? "bg-indigo-400 cursor-not-allowed" :
                theme === 'minecraft' ? "bg-[#555] cursor-not-allowed" :
                theme === 'undertale' ? "bg-yellow-600 cursor-not-allowed" :
                theme === 'god-of-war' ? "bg-[#5a0000] cursor-not-allowed" :
                theme === 'cuphead' ? "bg-gray-600 cursor-not-allowed" :
                theme === 'comic' ? "bg-yellow-300 cursor-not-allowed" : "bg-indigo-400 cursor-not-allowed"
              )
            ) : (
              isImagesMode ? (
                theme === 'modern' ? "bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'professional' ? "bg-slate-800 hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'cyberpunk' ? "bg-fuchsia-400 hover:bg-fuchsia-300 hover:shadow-[0_0_15px_rgba(232,121,249,0.8)]" :
                theme === 'vintage' ? "bg-[#8b4513] hover:bg-[#6b3410]" :
                theme === 'terminal' ? "bg-green-500 hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)]" :
                theme === 'ethereal' ? "bg-purple-500 hover:bg-purple-600 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'prism' ? "bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'minecraft' ? "bg-[#4CAF50] hover:bg-[#45a049] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2" :
                theme === 'undertale' ? "bg-yellow-400 hover:bg-yellow-300" :
                theme === 'god-of-war' ? "bg-[#8b0000] hover:bg-[#a00000] hover:shadow-[0_0_15px_rgba(139,0,0,0.8)]" :
                theme === 'cuphead' ? "bg-black hover:bg-gray-800" :
                theme === 'comic' ? "bg-yellow-400 hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5"
              ) : (
                theme === 'modern' ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'professional' ? "bg-slate-800 hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'cyberpunk' ? "bg-indigo-400 hover:bg-indigo-300 hover:shadow-[0_0_15px_rgba(129,140,248,0.8)]" :
                theme === 'vintage' ? "bg-[#8b4513] hover:bg-[#6b3410]" :
                theme === 'terminal' ? "bg-green-500 hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)]" :
                theme === 'ethereal' ? "bg-indigo-500 hover:bg-indigo-600 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'prism' ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5" :
                theme === 'minecraft' ? "bg-[#4CAF50] hover:bg-[#45a049] active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2" :
                theme === 'undertale' ? "bg-yellow-400 hover:bg-yellow-300" :
                theme === 'god-of-war' ? "bg-[#8b0000] hover:bg-[#a00000] hover:shadow-[0_0_15px_rgba(139,0,0,0.8)]" :
                theme === 'cuphead' ? "bg-black hover:bg-gray-800" :
                theme === 'comic' ? "bg-yellow-400 hover:bg-yellow-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
              )
            )
          )}>
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isImagesMode ? 'Importing Photos...' : 'Processing PDF...'}
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5 mr-2" /> {isImagesMode ? 'Import Photos' : 'Upload PDF'}
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
