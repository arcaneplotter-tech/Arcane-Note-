export const generatePresentationHTML = (items: any[], theme: string, themeSettings: any = {}) => {
  const itemsJson = JSON.stringify(items).replace(/</g, '\\u003c');
  const themeSettingsJson = JSON.stringify(themeSettings).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/framer-motion@11.0.3/dist/framer-motion.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=VT323&family=Cinzel:wght@400;700;900&family=Bangers&display=swap');
        
        ${themeSettings.customFont ? `
        @font-face {
            font-family: '${themeSettings.customFont.name}';
            src: url('${themeSettings.customFont.data}') format('${themeSettings.customFont.name.endsWith('.woff2') ? 'woff2' : themeSettings.customFont.name.endsWith('.woff') ? 'woff' : 'truetype'}');
            font-weight: normal;
            font-style: normal;
        }
        ` : ''}

        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            font-family: ${themeSettings.customFont ? `'${themeSettings.customFont.name}', sans-serif` : "'Inter', sans-serif"};
            height: 100vh;
            width: 100vw;
        }

        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .slide-container {
            height: 100vh;
            width: 100vw;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }

        .content-area {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            overflow: visible;
            position: relative;
            width: 100%;
        }

        @media (min-width: 640px) {
            .content-area {
                padding: 2rem;
            }
        }

        @media (min-width: 1024px) {
            .content-area {
                padding: 4rem;
            }
        }

        .bottom-bar {
            flex-shrink: 0;
            padding: 1rem 1.5rem 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            z-index: 50;
            background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
            width: 100%;
        }

        @media (min-width: 640px) {
            .bottom-bar {
                padding: 2rem 3rem 3rem;
                gap: 1.5rem;
            }
        }

        .markdown-body p { margin-bottom: 1em; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body strong { font-weight: bold; }
        .markdown-body em { font-style: italic; }
        .markdown-body code { font-family: 'JetBrains Mono', monospace; background: rgba(128,128,128,0.2); padding: 0.2em 0.4em; border-radius: 0.25em; font-size: 0.85em; }
        .markdown-body pre { background: #1e1e1e; padding: 1em; border-radius: 0.5em; overflow-x: auto; margin-bottom: 1em; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .markdown-body pre code { background: transparent; padding: 0; font-size: 0.9em; border-radius: 0; color: #abb2bf; }
        .markdown-body ul { list-style-type: disc; padding-left: 2em; margin-bottom: 1em; }
        .markdown-body ol { list-style-type: decimal; padding-left: 2em; margin-bottom: 1em; }
        .markdown-body li { margin-bottom: 0.25em; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 { font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
        .markdown-body h1 { font-size: 2em; }
        .markdown-body h2 { font-size: 1.5em; }
        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body a { color: #3b82f6; text-decoration: underline; text-underline-offset: 2px; }
        .markdown-body blockquote { border-left: 4px solid rgba(128,128,128,0.4); padding-left: 1em; margin-left: 0; font-style: italic; opacity: 0.9; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef, createContext, useContext, useCallback } = React;

        const Brain = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 5.327 2.7c.347.06.704.09 1.065.09a4.5 4.5 0 0 0 3.611-1.8" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.105 4 4 0 0 1-5.327 2.7A4.5 4.5 0 0 1 11 19.91" /><path d="M9 13a4.5 4.5 0 0 0 3 4" /><path d="M15 13a4.5 4.5 0 0 1-3 4" /><path d="M12 5v14" /></svg>;
        const DocumentContext = createContext({ fullData: null });

        const STOP_WORDS = new Set([
          'the', 'a', 'an', 'is', 'it', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'this', 'that', 'these', 'those', 
          'i', 'you', 'he', 'she', 'we', 'they', 'it', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
          'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
          'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might',
          'who', 'what', 'where', 'when', 'why', 'how', 'which',
          'not', 'no', 'yes', 'so', 'up', 'down', 'out', 'about', 'from', 'into', 'over', 'after', 'before', 'between', 'through', 'during', 'under', 'above', 'below', 'around', 'near', 'far',
          'very', 'too', 'also', 'just', 'only', 'than', 'then', 'already', 'yet', 'still', 'even', 'rather', 'quite', 'almost', 'enough',
          'me', 'him', 'us', 'them', 'whom', 'whose', 'as', 'if', 'while', 'because', 'since', 'though', 'although', 'whether'
        ]);

        const stem = (word) => {
          if (word.length < 3) return word.toLowerCase().replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "");
          return word.toLowerCase()
            .replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "")
            .replace(/(?:ing|ed|es|s)$/, "");
        };

        const getLevenshteinDistance = (a, b) => {
          const matrix = Array.from({ length: a.length + 1 }, (_, i) => 
            Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
          );

          for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
              const cost = a[i - 1] === b[j - 1] ? 0 : 1;
              matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
              );
            }
          }
          return matrix[a.length][b.length];
        };

        const isFuzzyMatch = (word1, word2) => {
          const s1 = stem(word1);
          const s2 = stem(word2);
          if (s1 === s2) return true;
          const maxDist = Math.floor(Math.max(s1.length, s2.length) * 0.3);
          const dist = getLevenshteinDistance(s1, s2);
          return dist <= Math.max(1, maxDist);
        };

        const getCleanWords = (text) => {
          return text.toLowerCase()
            .replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, " ")
            .split(/\\s+/)
            .filter(w => w.length > 0 && !STOP_WORDS.has(w));
        };
        const { motion, AnimatePresence } = window.Motion;

        const items = ${itemsJson};
        const theme = "${theme}";
        const themeSettings = ${themeSettingsJson};

        const cn = (...classes) => classes.filter(Boolean).join(' ');

        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            langPrefix: 'hljs language-',
            breaks: true,
            gfm: true
        });

        const themeColors = {
            modern: { text: 'text-slate-200', accent: 'text-blue-400', bg: 'bg-slate-900/40', border: 'border-white/10' },
            cyberpunk: { text: 'text-cyan-100', accent: 'text-fuchsia-500', bg: 'bg-black/60', border: 'border-cyan-500/30' },
            vintage: { text: 'text-[#4a3728]', accent: 'text-[#8b4513]', bg: 'bg-[#f4ecd8]/40', border: 'border-[#d4a373]/30' },
            terminal: { text: 'text-green-400', accent: 'text-green-500', bg: 'bg-black/80', border: 'border-green-500/50' },
            ethereal: { text: 'text-indigo-900/80', accent: 'text-indigo-400', bg: 'bg-white/40', border: 'border-indigo-100/50' },
            prism: { text: 'text-slate-700', accent: 'text-blue-500', bg: 'bg-white/60', border: 'border-slate-200' },
            'god-of-war': { text: 'text-slate-300', accent: 'text-[#ffd700]', bg: 'bg-black/60', border: 'border-[#8b0000]/50' },
            cuphead: { text: 'text-[#2c1e14]', accent: 'text-black', bg: 'bg-[#f5f5dc]/60', border: 'border-black/20' },
            comic: { text: 'text-black', accent: 'text-blue-600', bg: 'bg-white/60', border: 'border-black/30' }
        };

        const MarkdownContent = ({ content, asBlock, highlightWords: propHighlightWords = [], missingWords: propMissingWords = [] }) => {
            const { highlightWords: contextHighlightWords, missingWords: contextMissingWords } = useContext(DocumentContext);
            const highlightWords = propHighlightWords.length > 0 ? propHighlightWords : (contextHighlightWords || []);
            const missingWords = propMissingWords.length > 0 ? propMissingWords : (contextMissingWords || []);
            
            const containerRef = useRef(null);
            
            let processedContent = content || '';

            // Apply highlighting for blurting mode
            if (highlightWords.length > 0 || missingWords.length > 0) {
                const syntaxRegex = /(\\\[c:[^\\\]]+\\\]([^\\\[]*)\\\[\\\/c\\\])|(\\\[\\\[([^\\\]]+)\\\]\\\])|(\\\[([^\\\]]+)\\\]\\{([^}]+)\\})|(==([^=]+)==)|(\`([^\`]+)\`)|(\\*\\*([^\\*]+)\\*\\*)|(\\*([^\\*]+)\\*)/g;
                const parts = [];
                let lastIndex = 0;
                let match;
                while ((match = syntaxRegex.exec(processedContent)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push({ type: 'text', content: processedContent.substring(lastIndex, match.index) });
                    }
                    let visibleText = match[2] || match[4] || match[6] || match[9] || match[11] || match[13] || match[15];
                    parts.push({ type: 'syntax', content: match[0], visibleText });
                    lastIndex = syntaxRegex.lastIndex;
                }
                if (lastIndex < processedContent.length) {
                    parts.push({ type: 'text', content: processedContent.substring(lastIndex) });
                }

                processedContent = parts.map(part => {
                    if (part.type === 'syntax') {
                        const clean = part.visibleText.toLowerCase().replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "");
                        const isMatch = highlightWords.some(hw => isFuzzyMatch(hw, clean)) || 
                                      part.visibleText.split(/\\s+/).some(vWord => 
                                          highlightWords.some(hw => isFuzzyMatch(hw, vWord.toLowerCase().replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "")))
                                      );
                        const isMissing = !isMatch && (
                                        missingWords.some(mw => isFuzzyMatch(mw, clean)) ||
                                        part.visibleText.split(/\\s+/).some(vWord => 
                                            missingWords.some(mw => isFuzzyMatch(mw, vWord.toLowerCase().replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "")))
                                        )
                                      );

                        if (isMatch) {
                            return \`<span class="bg-yellow-400/20 text-yellow-100 px-2 py-0.5 mx-0.5 rounded font-bold border border-yellow-400/50 shadow-[0_0_15px_rgba(253,224,71,0.6)] transition-all cursor-help inline-block">\${part.content}</span>\`;
                        }
                        if (isMissing) {
                            return \`<span class="bg-red-500/30 text-red-100 px-2 py-0.5 mx-0.5 rounded font-bold border border-red-500/50 transition-all cursor-help inline-block" title="Missing word">\${part.content}</span>\`;
                        }
                        return part.content;
                    } else {
                        const words = part.content.split(/(\\s+)/);
                        return words.map(word => {
                            const clean = word.toLowerCase().replace(/[.,\\\/#!$%\\^&\\*;:{}=\\-_\\\`~()]/g, "");
                            if (!clean) return word;
                            
                            if (highlightWords.some(hw => isFuzzyMatch(hw, clean))) {
                                return \`<span class="bg-yellow-400/20 text-yellow-100 px-2 py-0.5 mx-0.5 rounded font-bold border border-yellow-400/50 shadow-[0_0_15px_rgba(253,224,71,0.6)] transition-all cursor-help inline-block">\${word}</span>\`;
                            }
                            if (missingWords.some(mw => isFuzzyMatch(mw, clean))) {
                                return \`<span class="bg-red-500/30 text-red-100 px-2 py-0.5 mx-0.5 rounded font-bold border border-red-500/50 transition-all cursor-help inline-block" title="Missing word">\${word}</span>\`;
                            }
                            return word;
                        }).join('');
                    }
                }).join('');
            }
            
            // [c:color]text[/c]
            processedContent = processedContent.replace(/\\\[c:([^\\\]]+)\\\]([^\\\[]*)\\\[\\\/c\\\]/g, (match, color, text) => {
                return \`<span style="color: \${color}">\${text}</span>\`;
            });
            
            // ==text==
            processedContent = processedContent.replace(/==([^=]+)==/g, (match, text) => {
                return \`<mark class="bg-yellow-400/30 text-yellow-100 px-2 py-0.5 mx-0.5 rounded font-bold inline-block">\${text}</mark>\`;
            });

            // [term]{title|def|simple|extra}
            processedContent = processedContent.replace(/\\\[([^\\\]]+)\\\]\\{([^}]+)\\}/g, (match, term, data) => {
                const safeData = data.replace(/"/g, '&quot;');
                return \`<button class="explanation-btn font-bold underline decoration-dashed decoration-2 underline-offset-4 cursor-pointer transition-colors relative z-10 text-blue-400 hover:text-blue-300 px-1 py-0.5 mx-0.5 inline-block" data-info="\${safeData}">\${term}</button>\`;
            });

            // [[concept]]
            processedContent = processedContent.replace(/\\\[\\\[([^\\\]]+)\\\]\\\]/g, (match, concept) => {
                return \`<button class="memorylink-btn font-bold underline decoration-wavy decoration-2 underline-offset-4 cursor-pointer transition-colors relative z-10 text-purple-400 hover:text-purple-300 px-1 py-0.5 mx-0.5 inline-block" data-concept="\${concept}">\${concept}</button>\`;
            });

            let html = marked.parse(processedContent);
            
            const colors = themeColors[theme] || themeColors.modern;
            
            // Apply theme-specific styling to strong and em tags
            if (theme === 'prism') {
                html = html.replace(/<strong>/g, '<strong class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">');
            } else if (theme === 'god-of-war') {
                html = html.replace(/<strong>/g, '<strong class="text-[#ffd700] uppercase tracking-wider">');
                html = html.replace(/<em>/g, '<em class="text-[#8b0000]">');
            } else if (theme === 'cuphead') {
                html = html.replace(/<strong>/g, '<strong class="text-black font-black">');
                html = html.replace(/<em>/g, '<em class="text-[#4a3728]">');
            } else if (theme === 'comic') {
                html = html.replace(/<strong>/g, '<strong class="text-black font-black italic uppercase">');
                html = html.replace(/<em>/g, '<em class="text-blue-600 font-bold">');
            } else {
                html = html.replace(/<strong>/g, \`<strong class="\${colors.accent} font-bold">\`);
                html = html.replace(/<em>/g, \`<em class="\${colors.accent} italic opacity-90">\`);
            }
            
            useEffect(() => {
                if (!containerRef.current) return;
                
                const handleExplanationClick = (e) => {
                    e.stopPropagation();
                    const btn = e.currentTarget;
                    const data = btn.getAttribute('data-info');
                    window.dispatchEvent(new CustomEvent('show-explanation', { 
                        detail: { data, rect: btn.getBoundingClientRect() } 
                    }));
                };
                
                const handleMemoryLinkClick = (e) => {
                    e.stopPropagation();
                    const btn = e.currentTarget;
                    const concept = btn.getAttribute('data-concept');
                    window.dispatchEvent(new CustomEvent('show-memorylink', { 
                        detail: { concept, rect: btn.getBoundingClientRect() } 
                    }));
                };

                const expBtns = containerRef.current.querySelectorAll('.explanation-btn');
                expBtns.forEach(btn => btn.addEventListener('click', handleExplanationClick));
                
                const memBtns = containerRef.current.querySelectorAll('.memorylink-btn');
                memBtns.forEach(btn => btn.addEventListener('click', handleMemoryLinkClick));
                
                return () => {
                    expBtns.forEach(btn => btn.removeEventListener('click', handleExplanationClick));
                    memBtns.forEach(btn => btn.removeEventListener('click', handleMemoryLinkClick));
                };
            }, [html]);

            if (asBlock) {
                return <div ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
            }
            const inlineHtml = html.replace(/^<p>/, '').replace(/<\\/p>\\n?$/, '');
            return <span ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: inlineHtml }} />;
        };

        const GlobalPopovers = () => {
            const [explanation, setExplanation] = useState(null);
            const [memoryLink, setMemoryLink] = useState(null);

            useEffect(() => {
                const handleShowExplanation = (e) => {
                    setMemoryLink(null);
                    setExplanation(e.detail);
                };
                const handleShowMemoryLink = (e) => {
                    setExplanation(null);
                    setMemoryLink(e.detail);
                };
                const handleHide = () => {
                    setExplanation(null);
                    setMemoryLink(null);
                };

                window.addEventListener('show-explanation', handleShowExplanation);
                window.addEventListener('show-memorylink', handleShowMemoryLink);
                window.addEventListener('click', handleHide);

                return () => {
                    window.removeEventListener('show-explanation', handleShowExplanation);
                    window.removeEventListener('show-memorylink', handleShowMemoryLink);
                    window.removeEventListener('click', handleHide);
                };
            }, []);

            if (!explanation && !memoryLink) return null;

            if (explanation) {
                const parts = explanation.data.split('|');
                const title = parts[0] || '';
                const def = parts[1] || '';
                const simple = parts[2] || '';
                const extra = parts[3] || '';

                return (
                    <div 
                        className="fixed z-[100000] w-72 p-5 text-left rounded-2xl shadow-xl bg-slate-900 border border-slate-700 text-slate-200"
                        style={{
                            top: Math.min(explanation.rect.bottom + 10, window.innerHeight - 300),
                            left: Math.max(10, Math.min(explanation.rect.left + explanation.rect.width / 2 - 144, window.innerWidth - 300))
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {title && <h4 className="font-bold text-lg mb-2 text-white">{title}</h4>}
                        {def && <p className="text-sm mb-3 opacity-90">{def}</p>}
                        {simple && (
                            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30 mb-3">
                                <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Simple terms</p>
                                <p className="text-sm text-blue-100">{simple}</p>
                            </div>
                        )}
                        {extra && (
                            <div className="text-xs opacity-70 border-t border-slate-700 pt-3 mt-3">
                                <span className="font-bold">Note:</span> {extra}
                            </div>
                        )}
                    </div>
                );
            }

            if (memoryLink) {
                const concept = memoryLink.concept;
                const occurrences = [];
                items.forEach((item, idx) => {
                    const content = String(item.CONTENT || '');
                    const isMention = content.includes(\`[[\${concept}]]\`);
                    const isDefinition = item.TYPE === 'CONCEPT' && content.trim().toLowerCase() === concept.trim().toLowerCase();
                    
                    if (isMention || isDefinition) {
                        const cleanText = content
                            .replace(/\\\[c:[^\\\]]+\\\]([^\\\[]*)\\\[\\\/c\\\]/g, '$1')
                            .replace(/==([^=]+)==/g, '$1')
                            .replace(/\\\[([^\\\]]+)\\\]\\{([^}]+)\\}/g, '$1')
                            .replace(/\\\[\\\[([^\\\]]+)\\\]\\\]/g, '$1')
                            .replace(/[#*\`]/g, '');
                        
                        occurrences.push({
                            slide: idx + 1,
                            text: cleanText.length > 100 ? cleanText.substring(0, 100) + '...' : cleanText,
                            type: isDefinition ? 'Definition' : 'Mention'
                        });
                    }
                });

                return (
                    <div 
                        className="fixed z-[100000] w-80 p-5 text-left rounded-2xl shadow-xl bg-slate-900 border border-slate-700 text-slate-200 max-h-[400px] overflow-y-auto"
                        style={{
                            top: Math.min(memoryLink.rect.bottom + 10, window.innerHeight - 400),
                            left: Math.max(10, Math.min(memoryLink.rect.left + memoryLink.rect.width / 2 - 160, window.innerWidth - 330))
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{concept}</h4>
                                <p className="text-xs text-purple-400">{occurrences.length} references found</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {occurrences.length > 0 ? occurrences.map((occ, i) => (
                                <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => {
                                    window.dispatchEvent(new CustomEvent('go-to-slide', { detail: occ.slide - 1 }));
                                    setMemoryLink(null);
                                }}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-400">Slide {occ.slide}</span>
                                        <span className={\`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full \${occ.type === 'Definition' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}\`}>
                                            {occ.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 line-clamp-2">{occ.text}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400 italic">No other references found.</p>
                            )}
                        </div>
                    </div>
                );
            }

            return null;
        };

        // Icons
        const Presentation = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>;
        const Maximize = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>;
        const Check = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
        const X = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
        const Type = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>;
        const Sparkles = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>;
        const ChevronLeft = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
        const ChevronRight = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
        const Play = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
        const Pause = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
        const AlertTriangle = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>;
        const Lightbulb = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>;
        const ImageIcon = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>;
        const TypeIcon = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" x2="15" y1="20" y2="20"></line><line x1="12" x2="12" y1="4" y2="20"></line></svg>;
        const Volume2 = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>;
        const VolumeX = ({className}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" x2="17" y1="9" y2="15"></line><line x1="17" x2="23" y1="9" y2="15"></line></svg>;

        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}!';

        const TextAnimationContainer = ({ children, mode = 'blur', className = "" }) => {
          const containerRef = useRef(null);
          const timeoutsRef = useRef([]);

          useEffect(() => {
            if (!containerRef.current) return;

            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];

            const container = containerRef.current;
            let wordSpans = Array.from(container.querySelectorAll('.anim-word'));

            if (mode === 'none') {
              wordSpans.forEach(span => {
                span.style.animation = 'none';
                span.style.opacity = '1';
                span.style.filter = 'none';
                span.style.transform = 'none';
                if (span.hasAttribute('data-original')) {
                  span.textContent = span.getAttribute('data-original');
                }
              });
              return;
            }

            if (wordSpans.length === 0) {
              const textNodes = [];
              const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                acceptNode: function(node) {
                  if (!node.nodeValue?.trim() || node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
                    return NodeFilter.FILTER_REJECT;
                  }
                  let parent = node.parentElement;
                  while (parent && parent !== container) {
                    if (parent.classList.contains('no-scramble') || parent.classList.contains('anim-word')) {
                      return NodeFilter.FILTER_REJECT;
                    }
                    parent = parent.parentElement;
                  }
                  return NodeFilter.FILTER_ACCEPT;
                }
              });

              let node;
              while ((node = walk.nextNode())) {
                textNodes.push(node);
              }

              textNodes.forEach(textNode => {
                const text = textNode.nodeValue || '';
                const parts = text.split(/(\\s+)/);
                
                const fragment = document.createDocumentFragment();
                
                parts.forEach(part => {
                  if (part.trim() === '') {
                    fragment.appendChild(document.createTextNode(part));
                  } else {
                    const span = document.createElement('span');
                    span.className = 'anim-word';
                    span.textContent = part;
                    span.setAttribute('data-original', part);
                    span.style.display = 'inline-block';
                    span.style.opacity = '0';
                    wordSpans.push(span);
                    fragment.appendChild(span);
                  }
                });
                
                textNode.parentNode?.replaceChild(fragment, textNode);
              });
            }

            let totalCharsBefore = 0;

            wordSpans.forEach((span, index) => {
              span.style.animation = 'none';
              span.style.opacity = '0';
              span.style.filter = 'none';
              span.style.transform = 'none';
              
              const originalText = span.getAttribute('data-original') || span.textContent || '';
              if (!span.hasAttribute('data-original')) {
                span.setAttribute('data-original', originalText);
              }
              
              void span.offsetWidth;
              
              const delay = index * 0.04;
              
              if (mode === 'blur') {
                span.textContent = originalText;
                span.style.animation = 'animBlur 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ' + delay + 's forwards';
              } else if (mode === 'slide') {
                span.textContent = originalText;
                span.style.animation = 'animSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ' + delay + 's forwards';
              } else if (mode === 'scramble') {
                span.style.opacity = '1';
                span.textContent = originalText.replace(/./g, ' ');
                
                const chars = '!<>-_\\\\/[]{}—=+*^?#________';
                const duration = 500;
                const steps = 12;
                const stepDuration = duration / steps;
                const sequentialDelay = index * (duration / 1000);
                
                const timeout = window.setTimeout(() => {
                  span.classList.add('is-scrambling');
                  let currentStep = 0;
                  const interval = window.setInterval(() => {
                    if (currentStep >= steps) {
                      clearInterval(interval);
                      span.textContent = originalText;
                      span.classList.remove('is-scrambling');
                      return;
                    }
                    
                    let scrambled = '';
                    for (let i = 0; i < originalText.length; i++) {
                      if (originalText[i] === ' ') {
                        scrambled += ' ';
                        continue;
                      }
                      if (currentStep / steps > i / originalText.length) {
                        scrambled += originalText[i];
                      } else {
                        scrambled += chars[Math.floor(Math.random() * chars.length)];
                      }
                    }
                    span.textContent = scrambled;
                    currentStep++;
                  }, stepDuration);
                  timeoutsRef.current.push(interval);
                }, sequentialDelay * 1000);
                timeoutsRef.current.push(timeout);
              } else if (mode === 'typewriter') {
                const typeSpeed = 30;
                const delayMs = totalCharsBefore * typeSpeed;
                
                span.style.opacity = '1';
                span.textContent = '';
                
                const timeout = window.setTimeout(() => {
                  span.classList.add('is-typing');
                  let currentChar = 0;
                  const interval = window.setInterval(() => {
                    if (currentChar >= originalText.length) {
                      clearInterval(interval);
                      span.textContent = originalText;
                      span.classList.remove('is-typing');
                      return;
                    }
                    span.textContent = originalText.substring(0, currentChar + 1);
                    currentChar++;
                  }, typeSpeed);
                  timeoutsRef.current.push(interval);
                }, delayMs);
                timeoutsRef.current.push(timeout);
                
                totalCharsBefore += originalText.length;
              } else if (mode === 'elastic') {
                span.textContent = originalText;
                span.style.animation = 'animElastic 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) ' + delay + 's forwards';
              } else if (mode === 'flash') {
                span.textContent = originalText;
                span.style.animation = 'animFlash 1s cubic-bezier(0.2, 0.8, 0.2, 1) ' + delay + 's forwards';
              } else if (mode === 'rotate') {
                span.textContent = originalText;
                span.style.animation = 'animRotate 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ' + delay + 's forwards';
              } else if (mode === 'glitch') {
                span.textContent = originalText;
                span.style.animation = 'animGlitch 0.6s steps(2, end) ' + delay + 's both';
                span.classList.add('is-glitching');
              } else if (mode === 'wave') {
                span.textContent = originalText;
                span.style.animation = 'animWave 1s cubic-bezier(0.445, 0.05, 0.55, 0.95) ' + delay + 's both';
              } else if (mode === 'neon') {
                span.textContent = originalText;
                span.style.animation = 'animNeon 1s ease-out ' + delay + 's both';
              }
            });

            return () => {
              timeoutsRef.current.forEach(clearTimeout);
            };
          }, [mode, children]);

          return (
            <>
              <style>{\`
                @keyframes animBlur {
                  0% { opacity: 0; filter: blur(20px) brightness(2); transform: scale(1.1) translateY(20px); letter-spacing: 0.2em; }
                  40% { opacity: 0.6; filter: blur(8px) brightness(1.3); transform: scale(1.03) translateY(8px); letter-spacing: 0.05em; }
                  100% { opacity: 1; filter: blur(0px) brightness(1); transform: scale(1) translateY(0); letter-spacing: normal; }
                }
                @keyframes animSlide {
                  0% { opacity: 0; transform: translateY(40px) rotate(6deg) scale(0.8); filter: blur(4px); }
                  100% { opacity: 1; transform: translateY(0) rotate(0) scale(1); filter: blur(0px); }
                }
                @keyframes animRotate {
                  0% { opacity: 0; transform: perspective(400px) rotateX(90deg) translateY(20px); filter: blur(4px); }
                  100% { opacity: 1; transform: perspective(400px) rotateX(0deg) translateY(0); filter: blur(0px); }
                }
                @keyframes animGlitch {
                  0% { opacity: 0; transform: translate(5px, -5px); text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9; }
                  20% { opacity: 1; transform: translate(-5px, 5px); }
                  40% { transform: translate(-2px, -2px); text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
                  60% { transform: translate(2px, 2px); }
                  80% { transform: translate(0); }
                  100% { opacity: 1; transform: translate(0); text-shadow: none; }
                }
                @keyframes animWave {
                  0% { opacity: 0; transform: translateY(20px) rotate(-5deg); }
                  50% { opacity: 0.5; transform: translateY(-10px) rotate(5deg); }
                  100% { opacity: 1; transform: translateY(0) rotate(0); }
                }
                @keyframes animNeon {
                  0% { opacity: 0; filter: brightness(0) blur(5px); text-shadow: 0 0 0 transparent; }
                  50% { opacity: 1; filter: brightness(2) blur(2px); text-shadow: 0 0 20px #fff, 0 0 30px #ff00c1; }
                  100% { opacity: 1; filter: brightness(1) blur(0); text-shadow: 0 0 10px rgba(255, 0, 193, 0.5); }
                }
                @keyframes animElastic {
                  0% { opacity: 0; transform: scale(0.3); }
                  70% { opacity: 1; transform: scale(1.1); }
                  100% { opacity: 1; transform: scale(1); }
                }
                @keyframes animFlash {
                  0% { opacity: 0; filter: brightness(10) blur(10px); transform: scale(1.2); }
                  30% { opacity: 1; filter: brightness(5) blur(4px); transform: scale(1.1); }
                  100% { opacity: 1; filter: brightness(1) blur(0px); transform: scale(1); }
                }
                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0; }
                }
                @keyframes glitch {
                  0% { transform: translate(0); }
                  20% { transform: translate(-2px, 2px); }
                  40% { transform: translate(-2px, -2px); }
                  60% { transform: translate(2px, 2px); }
                  80% { transform: translate(2px, -2px); }
                  100% { transform: translate(0); }
                }
                .is-scrambling {
                  color: #38bdf8 !important;
                  text-shadow: 0 0 15px rgba(56, 189, 248, 0.8), 0 0 30px rgba(56, 189, 248, 0.4);
                  opacity: 1;
                  animation: glitch 0.2s infinite;
                  display: inline-block;
                }
                .is-glitching {
                  display: inline-block;
                  position: relative;
                }
                .is-typing::after {
                  content: '';
                  display: inline-block;
                  width: 2px;
                  height: 1.2em;
                  background-color: #38bdf8;
                  animation: blink 0.8s step-end infinite;
                  box-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
                  margin-left: 2px;
                  vertical-align: middle;
                }
              \`}</style>
              <div ref={containerRef} className={cn("overflow-visible", className)}>
                {children}
              </div>
            </>
          );
        };

        function MCQRenderer({ item, theme }) {
          const [selectedOption, setSelectedOption] = useState(null);
          const [isSubmitted, setIsSubmitted] = useState(false);

          let mcqData = { question: '', options: [], answer: '', explanation: '' };
          try {
            mcqData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
          } catch (e) {
            return <div className="text-red-500 p-4 border border-red-200 rounded-lg">Error parsing MCQ data.</div>;
          }

          const { question, options, answer, explanation } = mcqData;

          const handleSubmit = () => { if (selectedOption) setIsSubmitted(true); };
          const handleReset = () => { setSelectedOption(null); setIsSubmitted(false); };

          const getThemeStyles = () => {
            switch (theme) {
              case 'cyberpunk': return { container: "bg-[#0a0a0f]/80 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]", question: "text-cyan-100", optionBase: "border-slate-800 bg-black/40 text-slate-400 hover:border-cyan-500/50", optionSelected: "border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.3)]", optionCorrect: "border-emerald-400 bg-emerald-950/40 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.3)]", optionIncorrect: "border-red-400 bg-red-950/40 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)]", accent: "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]", label: "text-cyan-400", submitBtn: "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]", feedback: "bg-emerald-950/30 border-emerald-500/50 text-emerald-100" };
              case 'terminal': return { container: "bg-black border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]", question: "text-green-400 font-mono", optionBase: "border-green-900 bg-black text-green-800 hover:border-green-700", optionSelected: "border-green-500 bg-green-950/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]", optionCorrect: "border-green-400 bg-green-900/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]", optionIncorrect: "border-red-500 bg-red-950/40 text-red-500", accent: "bg-green-500 text-black", label: "text-green-500", submitBtn: "bg-green-500 text-black", feedback: "bg-green-950/30 border-green-500 text-green-400" };
              case 'undertale': return { container: "bg-black border-4 border-white", question: "text-white font-retro tracking-wider", optionBase: "border-white bg-black text-white hover:border-yellow-400 hover:text-yellow-400", optionSelected: "border-yellow-400 bg-black text-yellow-400", optionCorrect: "border-green-500 bg-black text-green-500", optionIncorrect: "border-red-500 bg-black text-red-500", accent: "bg-white text-black", label: "text-white", submitBtn: "bg-black text-white border-4 border-white hover:text-yellow-400 hover:border-yellow-400", feedback: "bg-black border-4 border-white text-white" };
              case 'god-of-war': return { container: "bg-[#1a0f0f]/90 border-2 border-[#8b0000] shadow-[0_0_40px_rgba(139,0,0,0.2)]", question: "text-slate-100 font-serif", optionBase: "border-[#4a0000] bg-black/40 text-slate-400 hover:border-[#8b0000]", optionSelected: "border-[#ffd700] bg-[#4a0000]/40 text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]", optionCorrect: "border-emerald-500 bg-emerald-950/40 text-emerald-100", optionIncorrect: "border-red-600 bg-red-950/40 text-red-100", accent: "bg-[#8b0000] text-[#ffd700]", label: "text-[#8b0000]", submitBtn: "bg-[#8b0000] text-[#ffd700] border-2 border-[#ffd700]/30", feedback: "bg-[#2a0000] border-[#8b0000] text-slate-100" };
              case 'cuphead': return { container: "bg-[#f4e4bc] border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]", question: "text-black font-black", optionBase: "bg-white border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 text-black", optionSelected: "bg-yellow-200 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1 text-black", optionCorrect: "bg-emerald-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black", optionIncorrect: "bg-red-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black", accent: "bg-black text-white", label: "text-black", submitBtn: "bg-black text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]", feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black" };
              case 'comic': return { container: "bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]", question: "text-black font-black", optionBase: "bg-white border-black shadow-[3px_3px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 text-black", optionSelected: "bg-yellow-200 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] -translate-x-1 -translate-y-1 text-black", optionCorrect: "bg-emerald-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black", optionIncorrect: "bg-red-300 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] text-black", accent: "bg-yellow-400 text-black border-2 border-black", label: "text-black opacity-60", submitBtn: "bg-blue-500 text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]", feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black" };
              case 'ethereal': return { container: "bg-white/40 backdrop-blur-xl border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)]", question: "text-indigo-900", optionBase: "border-indigo-50 bg-white/50 text-indigo-700 hover:border-indigo-200 hover:bg-white", optionSelected: "border-indigo-400 bg-indigo-50/80 text-indigo-900 shadow-lg shadow-indigo-500/10", optionCorrect: "border-emerald-400 bg-emerald-50/80 text-emerald-900", optionIncorrect: "border-red-400 bg-red-50/80 text-red-900", accent: "bg-indigo-400 text-white", label: "text-indigo-400", submitBtn: "bg-indigo-600 text-white shadow-indigo-500/25", feedback: "bg-white/60 border-indigo-100 text-indigo-900" };
              case 'prism': return { container: "bg-white/90 backdrop-blur-md border-blue-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]", question: "text-slate-900", optionBase: "border-slate-100 bg-white/50 text-slate-600 hover:border-blue-200 hover:bg-white", optionSelected: "border-blue-500 bg-blue-50/50 text-blue-900 shadow-md ring-2 ring-blue-500/20", optionCorrect: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10", optionIncorrect: "border-red-500 bg-red-50 text-red-900", accent: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", label: "text-blue-500", submitBtn: "bg-slate-900 text-white hover:bg-black shadow-black/25", feedback: "bg-white border-slate-200 text-slate-900" };
              case 'minecraft': return { container: "bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]", question: "text-[#373737] font-pixel text-3xl", optionBase: "border-4 border-[#373737] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0]", optionSelected: "border-4 border-white bg-[#373737] text-white", optionCorrect: "border-4 border-[#388e3c] bg-[#4caf50] text-white", optionIncorrect: "border-4 border-[#d32f2f] bg-[#f44336] text-white", accent: "bg-[#8b8b8b] text-white border-2 border-[#373737]", label: "text-[#373737]", submitBtn: "bg-[#8b8b8b] text-white border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]", feedback: "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737]" };
              default: return { container: "bg-white border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]", question: "text-slate-900", optionBase: "border-slate-200 bg-white/50 hover:border-blue-300 hover:bg-white text-slate-700", optionSelected: "border-blue-500 bg-blue-50/50 text-blue-900 shadow-md ring-2 ring-blue-500/20", optionCorrect: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md shadow-emerald-500/10", optionIncorrect: "border-red-500 bg-red-50 text-red-900", accent: "bg-blue-600 text-white", label: "text-blue-600", submitBtn: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25", feedback: "bg-white border-blue-100 text-slate-900" };
            }
          };

          const styles = getThemeStyles();

          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("mcq-container my-6 p-6 sm:p-10 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden max-w-4xl mx-auto", styles.container)}>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className={cn("w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)] rounded-2xl flex items-center justify-center font-black text-[clamp(1.5rem,4vmin,3rem)] shadow-lg", styles.accent)}>?</div>
                  <div className="flex flex-col">
                    <span className={cn("text-[clamp(0.625rem,1.5vmin,1rem)] font-black uppercase tracking-[0.4em] mb-1", styles.label)}>Assessment Module</span>
                    <span className={cn("text-[clamp(0.75rem,2vmin,1.25rem)] font-bold uppercase tracking-widest opacity-40", theme === 'cyberpunk' && "text-cyan-400", theme === 'terminal' && "text-green-500")}>Multiple Choice Question</span>
                  </div>
                </div>
                <h3 className={cn("font-bold text-[clamp(1.5rem,5vmin,4rem)] leading-tight text-balance", styles.question)}><MarkdownContent content={question} /></h3>
              </div>
              <div className="grid grid-cols-1 gap-5 mb-10 mcq-options">
                {options.map((option, i) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === answer;
                  return (
                    <motion.button key={i} whileHover={!isSubmitted ? { scale: 1.02, x: 8 } : {}} whileTap={!isSubmitted ? { scale: 0.98 } : {}} onClick={() => !isSubmitted && setSelectedOption(option)} disabled={isSubmitted} className={cn("mcq-option w-full text-left p-[clamp(1rem,3vmin,2rem)] rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group relative overflow-hidden", !isSubmitted ? (isSelected ? styles.optionSelected : styles.optionBase) : (isCorrect ? styles.optionCorrect : isSelected ? styles.optionIncorrect : "opacity-30 grayscale-[0.5] border-transparent"), theme === 'undertale' && "rounded-none border-4 font-retro", theme === 'minecraft' && "rounded-none border-4")}>
                      <div className="flex items-center gap-5 flex-1">
                        <div className={cn("w-[clamp(2.5rem,6vmin,4rem)] h-[clamp(2.5rem,6vmin,4rem)] rounded-xl flex items-center justify-center font-black text-[clamp(1.125rem,3vmin,2rem)] shrink-0 border-2 transition-all", !isSubmitted ? (isSelected ? "bg-white text-blue-600 border-white" : "bg-slate-100 border-slate-200 text-slate-400 group-hover:bg-blue-100 group-hover:border-blue-200 group-hover:text-blue-500") : (isCorrect ? "bg-white text-emerald-600 border-white" : isSelected ? "bg-white text-red-600 border-white" : "bg-slate-200 border-slate-300 text-slate-400"), theme === 'cyberpunk' && !isSubmitted && isSelected && "bg-cyan-400 text-black border-cyan-400", theme === 'terminal' && !isSubmitted && isSelected && "bg-green-500 text-black border-green-500", theme === 'minecraft' && "rounded-none")}>{String.fromCharCode(65 + i)}</div>
                        <span className="text-[clamp(1.25rem,3vmin,2.5rem)] font-bold leading-tight"><MarkdownContent content={option} /></span>
                      </div>
                      <div className="shrink-0 ml-4">
                        <AnimatePresence mode="wait">
                          {isSubmitted && isCorrect && <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><Check className="w-[clamp(2rem,5vmin,3rem)] h-[clamp(2rem,5vmin,3rem)] text-emerald-500" /></motion.div>}
                          {isSubmitted && isSelected && !isCorrect && <motion.div initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}><X className="w-[clamp(2rem,5vmin,3rem)] h-[clamp(2rem,5vmin,3rem)] text-red-500" /></motion.div>}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-5">
                {!isSubmitted ? (
                  <motion.button whileHover={selectedOption ? { scale: 1.02, y: -4 } : {}} whileTap={selectedOption ? { scale: 0.98 } : {}} onClick={handleSubmit} disabled={!selectedOption} className={cn("w-full py-[clamp(1.5rem,4vmin,3rem)] rounded-2xl font-black text-[clamp(1.25rem,3vmin,2rem)] uppercase tracking-[0.3em] transition-all shadow-xl", !selectedOption ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200" : styles.submitBtn, theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400", theme === 'minecraft' && "rounded-none")}>{selectedOption ? "Confirm Selection" : "Select an Option"}</motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className={cn("p-[clamp(2rem,6vmin,4rem)] rounded-3xl border-2 relative overflow-hidden shadow-inner", styles.feedback, theme === 'comic' && "rounded-none border-4")}>
                      <div className="flex items-start gap-6">
                        <div className={cn("p-[clamp(1rem,3vmin,2rem)] rounded-2xl shrink-0 shadow-lg", selectedOption === answer ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>{selectedOption === answer ? <Check className="w-[clamp(2rem,6vmin,4rem)] h-[clamp(2rem,6vmin,4rem)]" /> : <X className="w-[clamp(2rem,6vmin,4rem)] h-[clamp(2rem,6vmin,4rem)]" />}</div>
                        <div className="flex-1">
                          <h4 className="text-[clamp(1.5rem,4vmin,3rem)] font-black uppercase tracking-widest mb-3">{selectedOption === answer ? "Correct Analysis" : "Incorrect Analysis"}</h4>
                          <div className="text-[clamp(1.25rem,3vmin,2.5rem)] leading-relaxed opacity-90 font-medium"><MarkdownContent content={explanation} /></div>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleReset} className={cn("w-full py-[clamp(1.25rem,3vmin,2.5rem)] rounded-2xl font-bold text-[clamp(1rem,2.5vmin,1.5rem)] uppercase tracking-[0.2em] transition-all border-2", theme === 'modern' && "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300", theme === 'cyberpunk' && "border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-cyan-400", theme === 'terminal' && "border-green-900 text-green-900 hover:text-green-500", theme === 'comic' && "border-4 border-black text-black font-black bg-slate-100 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-none", theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400", theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#8b8b8b] text-white")}>Reset Module</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        }

        function EssayRenderer({ item, theme }) {
          const [answerText, setAnswerText] = useState('');
          const [isSubmitted, setIsSubmitted] = useState(false);

          let essayData = { question: '', answer: '', explanation: '' };
          try {
            essayData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
          } catch (e) {
            return <div className="text-red-500 p-4 border border-red-200 rounded-lg">Error parsing ESSAY data.</div>;
          }

          const { question, answer, explanation } = essayData;

          const handleSubmit = () => { if (answerText.trim()) setIsSubmitted(true); };
          const handleReset = () => { setAnswerText(''); setIsSubmitted(false); };

          const getThemeStyles = () => {
            switch (theme) {
              case 'cyberpunk': return { container: "bg-[#0a0a0f]/80 border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.15)]", question: "text-fuchsia-100", textarea: "bg-black/40 border-slate-800 text-cyan-50 focus:border-fuchsia-500 focus:ring-fuchsia-500/20 placeholder-slate-700", accent: "bg-fuchsia-500 text-black shadow-[0_0_15px_rgba(217,70,239,0.5)]", label: "text-fuchsia-400", submitBtn: "bg-fuchsia-500 text-black shadow-[0_0_20px_rgba(217,70,239,0.4)]", feedback: "bg-fuchsia-950/20 border-fuchsia-500/50 text-fuchsia-100" };
              case 'terminal': return { container: "bg-black border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]", question: "text-green-400 font-mono", textarea: "bg-black border-green-900 text-green-400 focus:border-green-500 focus:ring-green-500/20 placeholder-green-950 font-mono", accent: "bg-green-500 text-black", label: "text-green-500", submitBtn: "bg-green-500 text-black", feedback: "bg-green-950/20 border-green-500 text-green-400" };
              case 'undertale': return { container: "bg-black border-4 border-white", question: "text-white font-retro tracking-wider", textarea: "bg-black border-4 border-white text-white font-retro rounded-none focus:border-yellow-400", accent: "bg-white text-black", label: "text-white", submitBtn: "bg-black text-white border-4 border-white hover:text-yellow-400 hover:border-yellow-400 font-retro", feedback: "bg-black border-4 border-white text-white" };
              case 'god-of-war': return { container: "bg-[#1a0f0f]/90 border-2 border-[#8b0000] shadow-[0_0_40px_rgba(139,0,0,0.2)]", question: "text-slate-100 font-serif", textarea: "bg-black/40 border-[#4a0000] text-slate-100 focus:border-[#8b0000] focus:ring-[#8b0000]/20 placeholder-slate-700 font-serif", accent: "bg-[#8b0000] text-[#ffd700]", label: "text-[#8b0000]", submitBtn: "bg-[#8b0000] text-[#ffd700] border-2 border-[#ffd700]/30", feedback: "bg-[#2a0000] border-[#8b0000] text-slate-100" };
              case 'cuphead': return { container: "bg-[#f4e4bc] border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]", question: "text-black font-black", textarea: "bg-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_rgba(0,0,0,1)] font-bold rounded-none text-black", accent: "bg-black text-white", label: "text-black", submitBtn: "bg-black text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]", feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black rounded-none" };
              case 'comic': return { container: "bg-white border-4 border-black shadow-[12px_12px_0_rgba(0,0,0,1)]", question: "text-black font-black", textarea: "bg-white border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[8px_8px_0_rgba(0,0,0,1)] font-bold rounded-none text-black", accent: "bg-purple-500 text-white border-2 border-black", label: "text-black opacity-60", submitBtn: "bg-purple-500 text-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)]", feedback: "bg-white border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] text-black rounded-none" };
              case 'ethereal': return { container: "bg-white/40 backdrop-blur-xl border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)]", question: "text-indigo-900", textarea: "bg-white/50 border-indigo-50 focus:border-indigo-400 focus:ring-indigo-400/20 text-indigo-800 placeholder-indigo-200", accent: "bg-indigo-400 text-white", label: "text-indigo-400", submitBtn: "bg-indigo-600 text-white shadow-indigo-500/25", feedback: "bg-white/60 border-indigo-100 text-indigo-900" };
              case 'prism': return { container: "bg-white/90 backdrop-blur-md border-purple-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)]", question: "text-slate-900", textarea: "bg-slate-50 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 text-slate-800", accent: "bg-gradient-to-br from-purple-500 to-pink-600 text-white", label: "text-purple-500", submitBtn: "bg-slate-900 text-white hover:bg-black shadow-black/25", feedback: "bg-white border-slate-200 text-slate-900" };
              case 'minecraft': return { container: "bg-[#c6c6c6] border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff]", question: "text-[#373737] font-pixel text-3xl", textarea: "bg-[#8b8b8b] border-4 border-[#373737] text-white font-pixel text-2xl placeholder-[#555] focus:bg-[#a0a0a0]", accent: "bg-[#8b8b8b] text-white border-2 border-[#373737]", label: "text-[#373737]", submitBtn: "bg-[#8b8b8b] text-white border-4 border-[#373737] shadow-[inset_-4px_-4px_0_#555,inset_4px_4px_0_#fff] hover:bg-[#a0a0a0]", feedback: "bg-[#c6c6c6] border-4 border-[#373737] text-[#373737]" };
              default: return { container: "bg-white border-purple-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]", question: "text-slate-900", textarea: "bg-slate-50 border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 text-slate-800", accent: "bg-purple-600 text-white", label: "text-purple-600", submitBtn: "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/25", feedback: "bg-white border-purple-100 text-slate-900" };
            }
          };

          const styles = getThemeStyles();

          return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("essay-container my-6 p-6 sm:p-10 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden max-w-4xl mx-auto", styles.container)}>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className={cn("w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)] rounded-2xl flex items-center justify-center font-black text-[clamp(1.5rem,4vmin,3rem)] shadow-lg", styles.accent)}><Type className="w-[clamp(1.75rem,5vmin,3rem)] h-[clamp(1.75rem,5vmin,3rem)]" /></div>
                  <div className="flex flex-col">
                    <span className={cn("text-[clamp(0.625rem,1.5vmin,1rem)] font-black uppercase tracking-[0.4em] mb-1", styles.label)}>Creative Module</span>
                    <span className={cn("text-[clamp(0.75rem,2vmin,1.25rem)] font-bold uppercase tracking-widest opacity-40", theme === 'cyberpunk' && "text-fuchsia-400", theme === 'terminal' && "text-green-500")}>Essay Question</span>
                  </div>
                </div>
                <h3 className={cn("font-bold text-[clamp(1.5rem,5vmin,4rem)] leading-tight text-balance", styles.question)}><MarkdownContent content={question} /></h3>
              </div>
              <div className="mb-10">
                <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} disabled={isSubmitted} placeholder="Type your detailed response here..." className={cn("essay-textarea w-full min-h-[clamp(150px,30vmin,300px)] p-[clamp(1rem,3vmin,2rem)] rounded-2xl border-2 resize-none transition-all outline-none focus:ring-4 text-[clamp(1.25rem,3vmin,2.5rem)] leading-relaxed", styles.textarea, isSubmitted && "opacity-60 grayscale-[0.5] cursor-not-allowed")} />
              </div>
              <div className="flex flex-col gap-5">
                {!isSubmitted ? (
                  <motion.button whileHover={answerText.trim() ? { scale: 1.02, y: -4 } : {}} whileTap={answerText.trim() ? { scale: 0.98 } : {}} onClick={handleSubmit} disabled={!answerText.trim()} className={cn("w-full py-[clamp(1.5rem,4vmin,3rem)] rounded-2xl font-black text-[clamp(1.25rem,3vmin,2rem)] uppercase tracking-[0.3em] transition-all shadow-xl", !answerText.trim() ? "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200" : styles.submitBtn, theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400", theme === 'minecraft' && "rounded-none")}>{answerText.trim() ? "Submit Response" : "Awaiting Response..."}</motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className={cn("p-[clamp(2rem,6vmin,4rem)] rounded-3xl border-2 relative overflow-hidden shadow-inner", styles.feedback)}>
                      <div className="flex items-start gap-6 mb-8">
                        <div className="p-[clamp(1rem,3vmin,2rem)] bg-purple-500 text-white rounded-2xl shrink-0 shadow-lg"><Sparkles className="w-[clamp(2rem,6vmin,4rem)] h-[clamp(2rem,6vmin,4rem)]" /></div>
                        <div>
                          <h4 className="text-[clamp(1.5rem,4vmin,3rem)] font-black uppercase tracking-widest mb-1">Suggested Analysis</h4>
                          <p className="text-[clamp(1rem,2.5vmin,1.5rem)] opacity-60 font-medium">Compare your response with the module's key points</p>
                        </div>
                      </div>
                      <div className="space-y-8 text-[clamp(1.25rem,3vmin,2.5rem)] leading-relaxed">
                        <div className="p-[clamp(1.5rem,4vmin,3rem)] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                          <h5 className="text-[clamp(0.75rem,2vmin,1.25rem)] font-black uppercase tracking-[0.3em] mb-4 opacity-50">Key Points to Cover:</h5>
                          <div className="font-medium"><MarkdownContent content={answer} /></div>
                        </div>
                        {explanation && (
                          <div className="p-[clamp(1.5rem,4vmin,3rem)] rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                            <h5 className="text-[clamp(0.75rem,2vmin,1.25rem)] font-black uppercase tracking-[0.3em] mb-4 opacity-50">Contextual Insight:</h5>
                            <div className="font-medium"><MarkdownContent content={explanation} /></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={handleReset} className={cn("w-full py-[clamp(1.25rem,3vmin,2.5rem)] rounded-2xl font-bold text-[clamp(1rem,2.5vmin,1.5rem)] uppercase tracking-[0.2em] transition-all border-2", theme === 'modern' && "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300", theme === 'cyberpunk' && "border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-fuchsia-400", theme === 'terminal' && "border-green-900 text-green-900 hover:text-green-500", theme === 'comic' && "border-4 border-black text-black font-black bg-slate-100 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] rounded-none", theme === 'undertale' && "rounded-none border-4 border-white bg-black text-white font-retro hover:text-yellow-400 hover:border-yellow-400", theme === 'minecraft' && "rounded-none border-4 border-[#373737] bg-[#8b8b8b] text-white")}>Revise Response</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        }

        const GlobalBackground = ({ theme, settings }) => {
        const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });

        React.useEffect(() => {
            const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        const videoUrl = settings?.videoBackgroundBase64 || settings?.customVideoUrl;
        if (settings?.videoBackgroundEnabled && videoUrl) {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <video 
                        src={videoUrl} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
            );
        }

        if (theme === 'cyberpunk') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-[#020204]">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020204] via-transparent to-transparent" />
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute h-[2px] bg-cyan-500/30"
                            initial={{ width: 0, x: -100, y: Math.random() * dimensions.height }}
                            animate={{ 
                                width: [0, 200, 0],
                                x: [dimensions.width + 100],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (theme === 'terminal') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-black">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]" />
                    </div>
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-green-500/10 font-mono text-xs whitespace-nowrap"
                            initial={{ y: -100, x: Math.random() * dimensions.width }}
                            animate={{ y: dimensions.height + 100 }}
                            transition={{
                                duration: 10 + Math.random() * 20,
                                repeat: Infinity,
                                delay: Math.random() * 10,
                                ease: "linear"
                            }}
                        >
                            {Math.random().toString(2).substring(2, 12)}
                        </motion.div>
                    ))}
                </div>
            );
        }

        if (theme === 'minecraft') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-[#70b5ff]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#70b5ff] to-[#a0d8ff]" />
                    {/* Clouds */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-white/80"
                            style={{ 
                                width: 100 + Math.random() * 200, 
                                height: 40 + Math.random() * 40,
                                top: 50 + Math.random() * 200 
                            }}
                            animate={{ x: [dimensions.width + 100, -300] }}
                            transition={{
                                duration: 40 + Math.random() * 60,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 40
                            }}
                        />
                    ))}
                    {/* Sun */}
                    <motion.div 
                        className="absolute top-20 right-40 w-24 h-24 bg-[#ffff00] shadow-[0_0_40px_#ffff00]"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            );
        }

        if (theme === 'ethereal') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-[#f8fafc]">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 blur-[100px]" />
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-indigo-200/40"
                            animate={{ 
                                y: [-20, dimensions.height + 20],
                                x: Math.random() * dimensions.width,
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 5 + Math.random() * 10,
                                repeat: Infinity,
                                delay: Math.random() * 10,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (theme === 'prism') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f1f5f9_0%,transparent_100%)]" />
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
                            style={{ 
                                background: \`linear-gradient(\${Math.random() * 360}deg, #3b82f6, #f97316)\`,
                                top: Math.random() * dimensions.height - 250,
                                left: Math.random() * dimensions.width - 250
                            }}
                            animate={{ 
                                rotate: 360,
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                duration: 20 + Math.random() * 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (theme === 'god-of-war') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-black">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 to-black" />
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-orange-500/20 rounded-full"
                            initial={{ y: dimensions.height + 10, x: Math.random() * dimensions.width }}
                            animate={{ 
                                y: -10,
                                x: (Math.random() * dimensions.width) + (Math.random() * 100 - 50),
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                                ease: "easeOut"
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (theme === 'vintage') {
            return (
                <div className="fixed inset-0 z-0 overflow-hidden bg-[#f4ece1]">
                    <div className="absolute inset-0 opacity-40 mix-blend-multiply pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                    <div className="absolute inset-0 bg-gradient-to-inner from-transparent to-[#d4a373]/10" />
                </div>
            );
        }

        return <div className="fixed inset-0 z-0 bg-slate-950" />;
    };

    const OverlayVideo = ({ videos }) => {
        if (!videos || videos.length === 0) return null;
        return (
            <div className="fixed inset-0 z-[10001] pointer-events-none overflow-hidden">
                {videos.filter(v => v.enabled).map(video => {
                    const videoSrc = video.base64 || video.url;
                    if (!videoSrc) return null;
                    const isGif = videoSrc.toLowerCase().endsWith('.gif') || videoSrc.startsWith('data:image/gif');
                    return (
                        <motion.div 
                            key={video.id} 
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: window.innerHeight - video.size - 20, opacity: 1 }}
                            className="absolute" 
                            style={{ 
                                width: video.size, 
                                height: video.size, 
                                left: '50%', 
                                marginLeft: -(video.size / 2)
                            }}
                        >
                            {isGif ? (
                                <img src={videoSrc} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                                <video src={videoSrc} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    const PresentationApp = () => {
            const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
            const [isAutoplay, setIsAutoplay] = useState(false);
            const [textAnimationMode, setTextAnimationMode] = useState('blur');
            const [textScale, setTextScale] = useState(1);
            const [showTextSizeModal, setShowTextSizeModal] = useState(false);
            const [showAnimationMenu, setShowAnimationMenu] = useState(false);
            const [isReading, setIsReading] = useState(false);
            const [currentSpokenId, setCurrentSpokenId] = useState(null);
            const [spokenText, setSpokenText] = useState('');
            const [spokenCharIndex, setSpokenCharIndex] = useState(0);
            const isStoppingRef = useRef(false);

            // Blurting Mode State
            const [isBlurtingMode, setIsBlurtingMode] = useState(false);
            const [blurtInput, setBlurtInput] = useState('');
            const [isBlurtSubmitted, setIsBlurtSubmitted] = useState(false);
            const [blurtResults, setBlurtResults] = useState(null);

            const cleanTextForSpeech = React.useCallback((text) => {
                if (!text) return '';
                let cleaned = text.replace(/[*_~\\\\\\\`#]/g, '');
                cleaned = cleaned.replace(/\\\[(.*?)\\\]\\{.*?\\}/g, '$1');
                cleaned = cleaned.replace(/!\\\[(.*?)\\\]\\(.*?\\)/g, 'Image of $1');
                cleaned = cleaned.replace(/\\\[(.*?)\\\]\\(.*?\\)/g, '$1');
                cleaned = cleaned.replace(/<[^>]*>?/gm, '');
                cleaned = cleaned.replace(/\\s+/g, ' ');
                return cleaned.trim();
            }, []);

            const toggleVoice = React.useCallback(async () => {
                if (isReading) {
                    isStoppingRef.current = true;
                    window.speechSynthesis.cancel();
                    setIsReading(false);
                    setCurrentSpokenId(null);
                    return;
                }

                const slide = items[currentSlideIndex];
                if (!slide) return;

                const chunks = [];
                
                if (slide.TYPE === 'TABLE_BLOCK') {
                    slide.ITEMS?.forEach((item, rIdx) => {
                        const cells = (item.CONTENT || '').split('|');
                        cells.forEach((cell, cIdx) => {
                            let text = cleanTextForSpeech(cell);
                            if (item.TYPE === 'TABLE_HEAD' && cIdx === 0) {
                                text = 'Table Headers: ' + text;
                            }
                            if (text.length > 0) {
                                chunks.push({ text, id: \`table-\${rIdx}-\${cIdx}\` });
                            }
                        });
                    });
                } else if (slide.TYPE === 'LIST_BLOCK') {
                    slide.ITEMS?.forEach((item, idx) => {
                        chunks.push({ text: cleanTextForSpeech(item.CONTENT || ''), id: \`list-\${idx}\` });
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
                
                setCurrentSpokenId(validChunks[0].id);
                
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
            }, [isReading, currentSlideIndex, cleanTextForSpeech]);

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

            const calculateBlurtResults = useCallback(() => {
                const slide = items[currentSlideIndex];
                if (!slide) return;

                let originalText = '';
                if (slide.TYPE === 'LIST_BLOCK') {
                    originalText = slide.ITEMS.map((item) => item.CONTENT).join(' ');
                } else if (slide.TYPE === 'TABLE_BLOCK') {
                    originalText = slide.ITEMS.map((item) => item.CONTENT).join(' ');
                } else {
                    originalText = slide.CONTENT || '';
                }

                const originalWords = getCleanWords(originalText);
                const userWords = getCleanWords(blurtInput);
                
                const correctWords = [];
                const missingWords = [];

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
            }, [currentSlideIndex, blurtInput]);

            const nextSlide = () => {
                if (currentSlideIndex < items.length - 1) {
                    setCurrentSlideIndex(prev => prev + 1);
                } else if (isAutoplay) {
                    setCurrentSlideIndex(0);
                }
            };

            const prevSlide = () => {
                if (currentSlideIndex > 0) {
                    setCurrentSlideIndex(prev => prev - 1);
                }
            };

            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
                    if (e.key === 'ArrowLeft') prevSlide();
                };
                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [currentSlideIndex, isAutoplay]);

            useEffect(() => {
                const handleGoToSlide = (e) => {
                    if (e.detail >= 0 && e.detail < items.length) {
                        setCurrentSlideIndex(e.detail);
                    }
                };
                window.addEventListener('go-to-slide', handleGoToSlide);
                return () => window.removeEventListener('go-to-slide', handleGoToSlide);
            }, [items.length]);

            useEffect(() => {
                let interval;
                if (isAutoplay) {
                    interval = setInterval(nextSlide, 5000);
                }
                return () => clearInterval(interval);
            }, [isAutoplay, currentSlideIndex]);

            if (items.length === 0) return <div className="text-white p-10">No slides found.</div>;

            const currentSlide = items[currentSlideIndex];

            const colors = themeColors[theme] || themeColors.modern;

            const renderSlideContent = (item) => {
                const type = item.TYPE;
                const content = item.CONTENT;

                switch (type) {
                    case 'TITLE':
                        return <motion.h1 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("font-black text-center tracking-tighter leading-[1.2] overflow-visible px-4 py-8 text-balance", "text-[clamp(2rem,8vmin,8rem)]", colors.text)}><MarkdownContent content={content} /></motion.h1>;
                    case 'SUBHEADER':
                        return <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("font-bold text-center overflow-visible px-4 py-4 leading-tight text-balance", "text-[clamp(1.5rem,6vmin,6rem)]", colors.accent)}><MarkdownContent content={content} /></motion.h2>;
                    case 'LIST_BLOCK':
                        return (
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-[clamp(1rem,3vmin,3rem)] w-full max-w-[90vw] md:max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 py-4">
                                {item.ITEMS.map((listItem, idx) => (
                                    <div key={idx} className="flex items-start gap-[clamp(1rem,3vmin,3rem)] group">
                                        <div className={cn("mt-[clamp(0.25rem,1vmin,0.5rem)] shrink-0 w-[clamp(2rem,6vmin,4rem)] h-[clamp(2rem,6vmin,4rem)] rounded-full flex items-center justify-center font-black text-[clamp(1rem,3vmin,2rem)] border backdrop-blur-sm", theme === 'modern' && "bg-blue-500/20 border-blue-500/30 text-blue-400", theme === 'cyberpunk' && "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]", theme === 'terminal' && "bg-green-500/20 border-green-500/30 text-green-400", theme === 'ethereal' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", theme === 'prism' && "bg-blue-500/10 border-blue-500/20 text-blue-500", theme === 'god-of-war' && "bg-[#8b0000]/20 border-[#ffd700]/30 text-[#ffd700]", theme === 'cuphead' && "bg-white border-2 border-black text-black shadow-[2px_2px_0_rgba(0,0,0,1)]", theme === 'comic' && "bg-yellow-400 border-2 border-black text-black shadow-[4px_4px_0_rgba(0,0,0,1)] transform -rotate-3")}>
                                            {item.LIST_TYPE === 'STEP' ? idx + 1 : item.LIST_TYPE === 'CHECKLIST' ? '✓' : '•'}
                                        </div>
                                        <div className={cn("font-medium leading-snug", "text-[clamp(1.25rem,4vmin,4rem)]", colors.text)}>
                                            <MarkdownContent content={listItem.CONTENT} />
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        );
                    case 'TABLE_BLOCK':
                        const tableHeaders = item.ITEMS.filter(i => i.TYPE === 'TABLE_HEAD');
                        const tableRows = item.ITEMS.filter(i => i.TYPE === 'TABLE_ROW');
                        return (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={cn("w-full max-w-6xl max-h-full overflow-auto rounded-2xl sm:rounded-3xl border-2 sm:border-4 shadow-2xl backdrop-blur-xl", colors.bg, colors.border)}>
                                <table className="w-full border-collapse text-left">
                                    {tableHeaders.length > 0 && (
                                        <thead className={cn("sticky top-0 z-10 backdrop-blur-md", theme === 'modern' && "bg-blue-600/20", theme === 'cyberpunk' && "bg-fuchsia-900/40", theme === 'terminal' && "bg-green-900/40", theme === 'ethereal' && "bg-indigo-50/50", theme === 'prism' && "bg-slate-50/80", theme === 'god-of-war' && "bg-[#8b0000]/40", theme === 'cuphead' && "bg-[#fef08a]", theme === 'comic' && "bg-yellow-400")}>
                                            {tableHeaders.map((headerItem, hIdx) => (
                                                <tr key={hIdx}>
                                                    {headerItem.CONTENT.split('|').map((h, idx) => (
                                                        <th key={idx} className={cn("px-[clamp(0.5rem,2vmin,2rem)] py-[clamp(0.5rem,2vmin,2rem)] font-black uppercase tracking-widest border-b-2", "text-[clamp(1rem,3vmin,2.5rem)]", colors.accent, theme === 'modern' && "border-blue-500/30", theme === 'cyberpunk' && "border-fuchsia-500/30", theme === 'terminal' && "border-green-500/30", theme === 'ethereal' && "border-indigo-100", theme === 'prism' && "border-slate-200", theme === 'god-of-war' && "border-[#ffd700]/30", theme === 'cuphead' && "border-black", theme === 'comic' && "border-black")}>
                                                            <MarkdownContent content={h.trim()} />
                                                        </th>
                                                    ))}
                                                </tr>
                                            ))}
                                        </thead>
                                    )}
                                    <tbody className={cn("divide-y", theme === 'modern' && "divide-white/5", theme === 'cyberpunk' && "divide-cyan-500/10", theme === 'terminal' && "divide-green-500/20", theme === 'ethereal' && "divide-indigo-50", theme === 'prism' && "divide-slate-100", theme === 'god-of-war' && "divide-white/10", theme === 'cuphead' && "divide-black/10", theme === 'comic' && "divide-black/20")}>
                                        {tableRows.map((row, rIdx) => {
                                            const cells = row.CONTENT.split('|').map(s => s.trim());
                                            return (
                                                <tr key={rIdx} className="hover:bg-white/5 transition-colors group">
                                                    {cells.map((c, cIdx) => (
                                                        <td key={cIdx} className={cn("px-[clamp(0.5rem,2vmin,2rem)] py-[clamp(0.5rem,2vmin,2rem)] font-medium", "text-[clamp(0.875rem,2.5vmin,2rem)]", colors.text)}>
                                                            <MarkdownContent content={c} />
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
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cn("font-medium flex items-start gap-[clamp(1rem,3vmin,3rem)] max-w-4xl max-h-full overflow-y-auto pr-4", "text-[clamp(1.25rem,4vmin,4rem)]", colors.text)}>
                                <span className={cn("mt-1 shrink-0 text-[clamp(1.5rem,5vmin,5rem)]", colors.accent)}>{type === 'STEP' ? '→' : '•'}</span>
                                <p className="leading-tight"><MarkdownContent content={content} /></p>
                            </motion.div>
                        );
                    case 'WARNING':
                    case 'IMPORTANT':
                        return (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-4 sm:border-8 max-w-4xl text-center max-h-full overflow-y-auto", type === 'WARNING' ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 'bg-red-500/10 border-red-500 text-red-200 shadow-[0_0_50px_rgba(239,68,68,0.2)]')}>
                                <div className="flex justify-center mb-[clamp(0.75rem,2vmin,2rem)]"><AlertTriangle className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" /></div>
                                <h3 className="font-black uppercase tracking-[0.3em] mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1.25rem,4vmin,3rem)]">{type}</h3>
                                <p className="font-bold leading-tight text-[clamp(1.5rem,5vmin,5rem)]"><MarkdownContent content={content} /></p>
                            </motion.div>
                        );
                    case 'TIP':
                    case 'KEY_POINT':
                        return (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border-4 sm:border-8 max-w-4xl text-center max-h-full overflow-y-auto", type === 'TIP' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-200 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-[0_0_50px_rgba(245,158,11,0.2)]')}>
                                <div className="flex justify-center mb-[clamp(0.75rem,2vmin,2rem)]">{type === 'TIP' ? <Lightbulb className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" /> : <Sparkles className="w-[clamp(3rem,8vmin,6rem)] h-[clamp(3rem,8vmin,6rem)]" />}</div>
                                <h3 className="font-black uppercase tracking-[0.3em] mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1.25rem,4vmin,3rem)]">{type.replace('_', ' ')}</h3>
                                <p className="font-bold leading-tight text-[clamp(1.5rem,5vmin,5rem)]"><MarkdownContent content={content} /></p>
                            </motion.div>
                        );
                    case 'DEFINITION':
                        const [term, ...defParts] = content.split(':');
                        return (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center max-w-5xl max-h-full overflow-y-auto px-6">
                                <span className={cn("font-black uppercase tracking-[0.4em] block mb-[clamp(0.75rem,2vmin,2rem)] text-[clamp(1rem,3vmin,2rem)]", colors.accent)}>Definition</span>
                                <h3 className={cn("font-black mb-[clamp(0.75rem,2vmin,2rem)] leading-none tracking-tighter text-[clamp(2.5rem,8vmin,8rem)]", colors.text)}><MarkdownContent content={term} /></h3>
                                <div className={cn("h-1 w-[clamp(4rem,10vmin,8rem)] mx-auto mb-[clamp(0.75rem,2vmin,2rem)] rounded-full", theme === 'modern' ? 'bg-blue-500' : 'bg-current')} />
                                <p className={cn("italic leading-snug text-[clamp(1.25rem,5vmin,5rem)]", colors.text)}><MarkdownContent content={defParts.join(':').trim()} /></p>
                            </motion.div>
                        );
                    case 'QUOTE':
                        return (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("text-center max-w-5xl italic font-serif max-h-full overflow-y-auto px-6 sm:px-10 relative", "text-[clamp(1.5rem,5vmin,5rem)]", colors.text)}>
                                <div className={cn("absolute -top-[clamp(1rem,4vmin,4rem)] -left-[clamp(0.5rem,2vmin,2rem)] font-serif select-none opacity-20 text-[clamp(4rem,15vmin,12rem)]", colors.accent)}>“</div>
                                <p className="relative z-10 leading-relaxed"><MarkdownContent content={content} /></p>
                                <div className={cn("absolute -bottom-[clamp(2rem,8vmin,8rem)] -right-[clamp(0.5rem,2vmin,2rem)] font-serif select-none opacity-20 text-[clamp(4rem,15vmin,12rem)]", colors.accent)}>”</div>
                            </motion.div>
                        );
                    case 'CODE':
                        return (
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("w-full max-w-6xl max-h-full overflow-y-auto rounded-2xl sm:rounded-3xl border-2 sm:border-4 shadow-2xl text-left no-scramble backdrop-blur-md", colors.bg, colors.border)}>
                                <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border-b border-white/10">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
                                    <span className="ml-2 sm:ml-4 text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">Source Code</span>
                                </div>
                                <div className="p-[clamp(0.75rem,2vmin,2rem)] text-[clamp(0.875rem,2.5vmin,2rem)]">
                                    <MarkdownContent content={\`\\\`\\\`\\\`javascript\\n\${content}\\n\\\`\\\`\\\`\`} asBlock />
                                </div>
                            </motion.div>
                        );
                    case 'IMG':
                    case 'IMG_TEXT':
                        return (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-6xl">
                                {type === 'IMG' ? (
                                    <div className="relative group max-h-[clamp(30vh,60vmin,70vh)] flex items-center justify-center">
                                        <img src={content} alt="Presentation" className="max-h-full w-auto rounded-2xl sm:rounded-[2rem] shadow-2xl border-4 sm:border-8 border-white/10 object-contain" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 rounded-2xl sm:rounded-[2rem] ring-1 ring-inset ring-white/20 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className={cn("p-[clamp(1.5rem,4vmin,4rem)] backdrop-blur-md rounded-2xl sm:rounded-[3rem] border-2 sm:border-4 border-dashed text-center w-full max-w-4xl", colors.bg, colors.border)}>
                                        <ImageIcon className="w-[clamp(2rem,6vmin,5rem)] h-[clamp(2rem,6vmin,5rem)] text-slate-600 mx-auto mb-[clamp(0.75rem,2vmin,2rem)]" />
                                        <p className={cn("font-black tracking-tight text-[clamp(1.25rem,4vmin,3rem)]", colors.text)}>Image Search: {content}</p>
                                    </div>
                                )}
                                <div className={cn("px-4 sm:px-6 py-1 sm:py-2 border rounded-full backdrop-blur-sm", theme === 'modern' && "bg-blue-500/10 border-blue-500/20", theme === 'cyberpunk' && "bg-fuchsia-500/10 border-fuchsia-500/20", theme === 'terminal' && "bg-green-500/10 border-green-500/20", theme === 'ethereal' && "bg-indigo-500/10 border-indigo-500/20", theme === 'prism' && "bg-blue-500/5 border-blue-500/10", theme === 'god-of-war' && "bg-[#8b0000]/10 border-[#ffd700]/20", theme === 'cuphead' && "bg-white/10 border-black/20", theme === 'comic' && "bg-yellow-400/10 border-black/20")}>
                                    <p className={cn("text-lg sm:text-xl font-bold uppercase tracking-widest", colors.accent)}>{item.TOPIC}</p>
                                </div>
                            </motion.div>
                        );
                    case 'MCQ':
                        return (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 no-scramble">
                                <div className="origin-top transform py-4 sm:py-8">
                                    <MCQRenderer item={item} theme={theme} isPresentation={true} />
                                </div>
                            </motion.div>
                        );
                    case 'ESSAY':
                        return (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl max-h-full overflow-y-auto px-4 sm:px-6 no-scramble">
                                <div className="origin-top transform py-4 sm:py-8">
                                    <EssayRenderer item={item} theme={theme} isPresentation={true} />
                                </div>
                            </motion.div>
                        );
                    default:
                        return (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("max-w-6xl w-full prose prose-invert overflow-y-auto max-h-full px-[clamp(1rem,4vmin,3rem)] py-[clamp(1rem,3vmin,2rem)] leading-relaxed font-medium", "text-[clamp(1.25rem,4vmin,4rem)]", colors.text)}>
                                <MarkdownContent content={content} asBlock />
                            </motion.div>
                        );
                }
            };

            return (
                <div className={cn("slide-container", colors.bg)}>
                    <div className="flex flex-col h-full w-full">
                        {/* Top Bar */}
                        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 z-20">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg", colors.accent, "text-white")}>
                                    <Presentation className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className={cn("text-lg sm:text-xl font-black tracking-tighter uppercase", colors.text)}>Presentation</h1>
                                    <p className={cn("text-[10px] sm:text-xs font-bold opacity-50 uppercase tracking-[0.2em]", colors.text)}>Slide {currentSlideIndex + 1} of {items.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className="relative">
                                    <button onClick={() => setShowAnimationMenu(!showAnimationMenu)} className={cn("p-2 sm:p-3 rounded-xl transition-all border-2", textAnimationMode !== 'none' ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]" : "bg-white/5 border-white/10 text-white hover:bg-white/10")} title="Text Animation Menu">
                                        <Sparkles className="w-5 h-5 sm:w-6 h-6" />
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
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'blur' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Blur Reveal
                                                            {textAnimationMode === 'blur' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('slide'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'slide' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Slide Up
                                                            {textAnimationMode === 'slide' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('scramble'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'scramble' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Scramble
                                                            {textAnimationMode === 'scramble' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('typewriter'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'typewriter' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Typewriter
                                                            {textAnimationMode === 'typewriter' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('elastic'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'elastic' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Elastic Bounce
                                                            {textAnimationMode === 'elastic' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('flash'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'flash' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Flash Glow
                                                            {textAnimationMode === 'flash' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('rotate'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'rotate' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            3D Rotate
                                                            {textAnimationMode === 'rotate' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('glitch'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'glitch' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Glitch Reveal
                                                            {textAnimationMode === 'glitch' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('wave'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'wave' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Wave Flow
                                                            {textAnimationMode === 'wave' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('neon'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'neon' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
                                                        >
                                                            Neon Pulse
                                                            {textAnimationMode === 'neon' && <Check className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { setTextAnimationMode('none'); setShowAnimationMenu(false); }}
                                                            className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors", textAnimationMode === 'none' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800")}
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
                                    className={cn("p-2 sm:p-3 rounded-xl transition-all border-2", isBlurtingMode ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}
                                    title="Blurting Mode (Active Recall)"
                                >
                                    <Brain className="w-5 h-5 sm:w-6 h-6" />
                                </button>

                                <button onClick={() => setShowTextSizeModal(true)} className="p-2 sm:p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all">
                                    <TypeIcon className="w-5 h-5 sm:w-6 h-6" />
                                </button>
                                <button onClick={toggleVoice} className={cn("p-2 sm:p-3 rounded-xl transition-all border-2", isReading ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-white/5 border-white/10 text-white hover:bg-white/10")} title={isReading ? "Stop Reading" : "Read Slide"}>
                                    {isReading ? <VolumeX className="w-5 h-5 sm:w-6 h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 h-6" />}
                                </button>
                                <button onClick={() => setIsAutoplay(!isAutoplay)} className={cn("p-2 sm:p-3 rounded-xl transition-all border-2", isAutoplay ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-white/5 border-white/10 text-white hover:bg-white/10")}>
                                    {isAutoplay ? <Pause className="w-5 h-5 sm:w-6 h-6" /> : <Play className="w-5 h-5 sm:w-6 h-6" />}
                                </button>
                                <button onClick={() => {
                                    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                                    else document.exitFullscreen();
                                }} className="p-2 sm:p-3 rounded-xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all">
                                    <Maximize className="w-5 h-5 sm:w-6 h-6" />
                                </button>
                                <button onClick={() => window.close()} className="p-2 sm:p-3 rounded-xl bg-red-500/10 border-2 border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all">
                                    <X className="w-5 h-5 sm:w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 relative overflow-visible flex items-center justify-center">
                            <GlobalBackground theme={theme} settings={themeSettings} />
                            <div 
                                style={{ 
                                    transform: \`scale(\${textScale})\`, 
                                    transformOrigin: 'center center',
                                    width: \`\${100 / textScale}%\`,
                                    height: \`\${100 / textScale}%\`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 10
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div 
                                        key={currentSlideIndex} 
                                        initial={{ opacity: 0, x: 50, filter: 'blur(10px)', scale: 0.95 }} 
                                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }} 
                                        exit={{ opacity: 0, x: -50, filter: 'blur(10px)', scale: 0.95 }} 
                                        transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                                        className="content-area w-full h-full flex items-center justify-center"
                                    >
                                        <div className="flex flex-col items-center justify-center w-full h-full gap-4 sm:gap-8 overflow-visible">
                                            <div className="flex-1 w-full flex items-center justify-center overflow-visible">
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
                                                    <TextAnimationContainer key={currentSlideIndex + '-' + textAnimationMode} mode={textAnimationMode} className="w-full h-full flex flex-col items-center justify-center">
                                                        <DocumentContext.Provider value={{ fullData: items, highlightWords: blurtResults?.correctWords, missingWords: blurtResults?.missingWords }}>
                                                            {renderSlideContent(currentSlide)}
                                                        </DocumentContext.Provider>
                                                    </TextAnimationContainer>
                                                )}
                                            </div>
                                            
                                            {currentSlide.attachedImages && currentSlide.attachedImages.length > 0 && (
                                                <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-2 sm:mt-4">
                                                    {currentSlide.attachedImages.map((img, idx) => (
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
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Topic Badge */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-4 sm:top-8 right-4 sm:right-8 z-30">
                                <div className={cn("px-4 sm:px-6 py-2 sm:py-3 rounded-2xl border-2 backdrop-blur-xl shadow-2xl", colors.bg, colors.border)}>
                                    <p className={cn("text-xs sm:text-sm font-black uppercase tracking-[0.3em]", colors.accent)}>{currentSlide.TOPIC || 'General'}</p>
                                </div>
                            </motion.div>
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

                        {/* Bottom Bar */}
                        <div className="bottom-bar">
                            <div className="w-full max-w-7xl mx-auto flex items-center gap-4 sm:gap-8">
                                <button onClick={prevSlide} className="p-3 sm:p-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all group">
                                    <ChevronLeft className="w-6 h-6 sm:w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                                </button>

                                <div className="flex-1 relative h-3 sm:h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <motion.div className={cn("absolute inset-y-0 left-0", colors.accent.replace('text-', 'bg-'))} initial={{ width: 0 }} animate={{ width: (((currentSlideIndex + 1) / items.length) * 100) + '%' }} transition={{ type: "spring", damping: 30, stiffness: 150 }} />
                                </div>

                                <button onClick={nextSlide} className="p-3 sm:p-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all group">
                                    <ChevronRight className="w-6 h-6 sm:w-8 h-8 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="mt-4 sm:mt-6 flex justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-30 text-white">
                                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-white" /> Use Arrow Keys to Navigate</span>
                                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-white" /> Space to Play/Pause</span>
                            </div>
                        </div>
                    </div>
                    <GlobalPopovers />
                    <OverlayVideo videos={themeSettings.overlayVideos} />
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<PresentationApp />);
    </script>
</body>
</html>`;
};
