import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArabicShaper } from 'arabic-persian-reshaper';

let amiriFontBase64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const loadArabicFont = async (doc: jsPDF) => {
  try {
    if (!amiriFontBase64) {
      const response = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf');
      if (!response.ok) throw new Error("Failed to fetch font");
      const buffer = await response.arrayBuffer();
      amiriFontBase64 = arrayBufferToBase64(buffer);
    }

    if (amiriFontBase64) {
      doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'bold');
    }
  } catch (e) {
    console.error("Could not load Arabic font", e);
  }
};

interface PlacedImage {
  url: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  alignment: 'left' | 'center' | 'right';
  width?: number;
  hasBorder?: boolean;
  caption?: string;
}

export interface CustomFont {
  name: string;
  data: string;
  fileName: string;
}

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

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

const namedColors: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  gray: '#64748b',
  black: '#000000',
  white: '#ffffff',
};

let currentFontName = 'helvetica';

function colorToRgb(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  const hex = namedColors[color.toLowerCase()];
  if (hex) {
    return hexToRgb(hex);
  }
  return [0, 0, 0];
}

const drawVectorIcon = (doc: jsPDF, type: string, x: number, y: number, size: number, color: [number, number, number]) => {
  doc.setDrawColor(...color);
  doc.setFillColor(...color);
  doc.setLineWidth(0.3);

  let normalizedType = type.toUpperCase();
  if (normalizedType.startsWith('AR_')) {
    normalizedType = normalizedType.substring(3);
  }

  switch (normalizedType) {
    case 'TIP':
    case 'LIGHTBULB':
      doc.circle(x + size / 2, y + size * 0.4, size * 0.3, 'S');
      doc.rect(x + size * 0.35, y + size * 0.7, size * 0.3, size * 0.15, 'S');
      doc.line(x + size * 0.4, y + size * 0.9, x + size * 0.6, y + size * 0.9);
      break;
    case 'WARNING':
    case 'ALERT':
      doc.line(x + size / 2, y + size * 0.1, x + size * 0.1, y + size * 0.9);
      doc.line(x + size * 0.1, y + size * 0.9, x + size * 0.9, y + size * 0.9);
      doc.line(x + size * 0.9, y + size * 0.9, x + size / 2, y + size * 0.1);
      doc.line(x + size / 2, y + size * 0.4, x + size / 2, y + size * 0.7);
      doc.circle(x + size / 2, y + size * 0.8, 0.3, 'F');
      break;
    case 'IMPORTANT':
    case 'STAR':
      const cx = x + size / 2;
      const cy = y + size / 2;
      const r = size / 2;
      const points = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r / 2;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
      }
      for (let i = 0; i < 10; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 10];
        doc.line(p1[0], p1[1], p2[0], p2[1]);
      }
      break;
    case 'INFO':
      doc.circle(x + size / 2, y + size / 2, size * 0.45, 'S');
      doc.line(x + size / 2, y + size * 0.4, x + size / 2, y + size * 0.75);
      doc.circle(x + size / 2, y + size * 0.25, 0.3, 'F');
      break;
    case 'DEFINITION':
    case 'BOOK':
      doc.rect(x + size * 0.15, y + size * 0.2, size * 0.7, size * 0.6, 'S');
      doc.line(x + size / 2, y + size * 0.2, x + size / 2, y + size * 0.8);
      doc.line(x + size * 0.25, y + size * 0.35, x + size * 0.45, y + size * 0.35);
      doc.line(x + size * 0.55, y + size * 0.35, x + size * 0.75, y + size * 0.35);
      break;
    case 'STEP':
    case 'ARROW':
      doc.line(x + size * 0.1, y + size / 2, x + size * 0.9, y + size / 2);
      doc.line(x + size * 0.6, y + size * 0.2, x + size * 0.9, y + size / 2);
      doc.line(x + size * 0.6, y + size * 0.8, x + size * 0.9, y + size / 2);
      break;
    case 'MCQ':
    case 'QUESTION':
      doc.circle(x + size / 2, y + size / 2, size * 0.45, 'S');
      doc.line(x + size * 0.4, y + size * 0.3, x + size * 0.6, y + size * 0.3);
      doc.line(x + size * 0.6, y + size * 0.3, x + size * 0.6, y + size * 0.5);
      doc.line(x + size * 0.6, y + size * 0.5, x + size / 2, y + size * 0.5);
      doc.line(x + size / 2, y + size * 0.5, x + size / 2, y + size * 0.7);
      doc.circle(x + size / 2, y + size * 0.8, 0.3, 'F');
      break;
    case 'ESSAY':
    case 'PEN':
      doc.line(x + size * 0.2, y + size * 0.8, x + size * 0.8, y + size * 0.2);
      doc.line(x + size * 0.7, y + size * 0.1, x + size * 0.9, y + size * 0.3);
      doc.rect(x + size * 0.1, y + size * 0.7, size * 0.2, size * 0.2, 'S');
      break;
    case 'CALLOUT':
    case 'QUOTE':
      doc.rect(x + size * 0.2, y + size * 0.3, size * 0.2, size * 0.2, 'F');
      doc.rect(x + size * 0.6, y + size * 0.3, size * 0.2, size * 0.2, 'F');
      doc.line(x + size * 0.2, y + size * 0.5, x + size * 0.1, y + size * 0.7);
      doc.line(x + size * 0.6, y + size * 0.5, x + size * 0.5, y + size * 0.7);
      break;
    case 'FORMULA':
    case 'MATH':
      doc.setLineWidth(size * 0.08);
      doc.line(x + size * 0.2, y + size * 0.2, x + size * 0.8, y + size * 0.2);
      doc.line(x + size * 0.8, y + size * 0.2, x + size * 0.4, y + size * 0.5);
      doc.line(x + size * 0.4, y + size * 0.5, x + size * 0.8, y + size * 0.8);
      doc.line(x + size * 0.8, y + size * 0.8, x + size * 0.2, y + size * 0.8);
      break;
    case 'CODE':
      doc.setLineWidth(size * 0.08);
      doc.line(x + size * 0.3, y + size * 0.3, x + size * 0.1, y + size * 0.5);
      doc.line(x + size * 0.1, y + size * 0.5, x + size * 0.3, y + size * 0.7);
      doc.line(x + size * 0.7, y + size * 0.3, x + size * 0.9, y + size * 0.5);
      doc.line(x + size * 0.9, y + size * 0.5, x + size * 0.7, y + size * 0.7);
      doc.line(x + size * 0.6, y + size * 0.2, x + size * 0.4, y + size * 0.8);
      break;
    case 'CHECK':
      doc.setLineWidth(size * 0.1);
      doc.line(x + size * 0.2, y + size * 0.5, x + size * 0.45, y + size * 0.75);
      doc.line(x + size * 0.45, y + size * 0.75, x + size * 0.85, y + size * 0.25);
      break;
    case 'BULLET':
      doc.circle(x + size / 2, y + size / 2, size * 0.2, 'F');
      break;
    case 'SUMMARY':
    case 'CLIPBOARD':
      // List lines
      doc.setLineWidth(0.4);
      doc.line(x + size * 0.15, y + size * 0.3, x + size * 0.85, y + size * 0.3);
      doc.line(x + size * 0.15, y + size * 0.55, x + size * 0.65, y + size * 0.55);
      doc.line(x + size * 0.15, y + size * 0.8, x + size * 0.45, y + size * 0.8);
      // Checkmark
      doc.setLineWidth(0.6);
      doc.line(x + size * 0.6, y + size * 0.8, x + size * 0.7, y + size * 0.9);
      doc.line(x + size * 0.7, y + size * 0.9, x + size * 0.9, y + size * 0.6);
      break;
    default:
      doc.circle(x + size / 2, y + size / 2, 0.5, 'F');
  }
};

interface TextSegment {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isHighlight: boolean;
  isMemoryLink?: boolean;
  color?: string;
}

function stripMemoryLinks(text: string): string {
  return text.replace(/\[\[(.*?)\]\]/g, '$1');
}

function parseRichText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentText = '';
  let isBold = false;
  let isItalic = false;
  let isHighlight = false;
  let colorStack: string[] = [];

  let i = 0;
  while (i < text.length) {
    if (text.startsWith('**', i) || text.startsWith('__', i)) {
      if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
      currentText = '';
      isBold = !isBold;
      i += 2;
    } else if (text.startsWith('*', i) || text.startsWith('_', i)) {
      if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
      currentText = '';
      isItalic = !isItalic;
      i += 1;
    } else if (text.startsWith('==', i)) {
      if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
      currentText = '';
      isHighlight = !isHighlight;
      i += 2;
    } else if (text.startsWith('[c:', i)) {
      const closeBracket = text.indexOf(']', i);
      if (closeBracket !== -1) {
        if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
        currentText = '';
        const color = text.substring(i + 3, closeBracket);
        colorStack.push(color);
        i = closeBracket + 1;
      } else {
        currentText += text[i];
        i++;
      }
    } else if (text.startsWith('[/c]', i)) {
      if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
      currentText = '';
      if (colorStack.length > 0) colorStack.pop();
      i += 4;
    } else if (text.startsWith('[[', i)) {
      const closeBracket = text.indexOf(']]', i);
      if (closeBracket !== -1) {
        if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
        currentText = '';
        const concept = text.substring(i + 2, closeBracket);
        segments.push({ text: concept, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1], isMemoryLink: true });
        i = closeBracket + 2;
      } else {
        currentText += text[i];
        i++;
      }
    } else if (text.startsWith('[', i)) {
      const closeBracket = text.indexOf(']', i);
      const openBrace = text.indexOf('{', closeBracket);
      const closeBrace = text.indexOf('}', openBrace);
      
      if (closeBracket !== -1 && openBrace === closeBracket + 1 && closeBrace !== -1) {
        if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
        currentText = '';
        const term = text.substring(i + 1, closeBracket);
        // Render the term as bold
        segments.push({ text: term, isBold: true, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
        i = closeBrace + 1;
      } else {
        currentText += text[i];
        i++;
      }
    } else {
      currentText += text[i];
      i++;
    }
  }
  if (currentText) segments.push({ text: currentText, isBold, isItalic, isHighlight, color: colorStack[colorStack.length - 1] });
  return segments;
}

type SubWord = { text: string, renderText: string, isBold: boolean, isItalic: boolean, isHighlight: boolean, isMemoryLink?: boolean, color?: string, width: number, dir: 'RTL'|'LTR'|'NEUTRAL' };
type Word = { text: string, width: number, subWords: SubWord[] };

const isRTLChar = (char: string) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(char);
const isLTRChar = (char: string) => /[a-zA-Z0-9]/.test(char);

const getDir = (text: string) => {
  if (isRTLChar(text[0])) return 'RTL';
  if (isLTRChar(text[0])) return 'LTR';
  return 'NEUTRAL';
};

function renderSubWord(doc: jsPDF, word: SubWord, x: number, y: number, fontHeight: number, themeFont: string, fontSize: number, groupColor: string, defaultTextColor: [number, number, number], theme: string, customFont?: CustomFont) {
  let style = 'normal';
  if (word.isBold && word.isItalic) style = 'bolditalic';
  else if (word.isBold) style = 'bold';
  else if (word.isItalic) style = 'italic';

  let fontToUse = themeFont;
  if (word.dir === 'RTL') {
    const fontList = doc.getFontList();
    if (fontList['Amiri']) {
      fontToUse = 'Amiri';
    } else if (customFont) {
      fontToUse = customFont.name;
    }
  }

  const currentStyle = (fontToUse === 'helvetica' || fontToUse === 'times' || fontToUse === 'courier') ? style : 'normal';

  doc.setFont(fontToUse, currentStyle);
  doc.setFontSize(fontSize);

  if (word.isMemoryLink) {
    const memoryLinkColor = groupColor || (theme === 'cyberpunk' ? '#22d3ee' : (theme === 'terminal' ? '#22c55e' : (theme === 'god-of-war' ? '#ffd700' : (theme === 'undertale' ? '#ffff00' : (theme === 'cuphead' || theme === 'comic' ? '#2563eb' : '#2563eb')))));
    doc.setTextColor(...hexToRgb(memoryLinkColor));
  } else if (word.color) {
    doc.setTextColor(...colorToRgb(word.color));
  } else if (word.isBold || word.isItalic) {
    doc.setTextColor(...hexToRgb(getShade(groupColor, -0.2)));
  } else {
    doc.setTextColor(...defaultTextColor);
  }

  if (word.isHighlight) {
    let highlightColor: [number, number, number] = hexToRgb(getShade(groupColor, 0.8));
    if (theme === 'cyberpunk') highlightColor = [250, 204, 21];
    if (theme === 'vintage') highlightColor = [244, 236, 216];
    if (theme === 'terminal') highlightColor = [0, 64, 0];
    if (theme === 'ethereal') highlightColor = [238, 242, 255];
    if (theme === 'prism') highlightColor = [245, 243, 255];
    if (theme === 'god-of-war') highlightColor = [139, 0, 0];
    if (theme === 'cuphead' || theme === 'comic') highlightColor = [255, 255, 0];
    
    doc.setFillColor(...highlightColor);
    doc.rect(x, y - fontHeight * 0.8, word.width, fontHeight * 1.1, 'F');
  }

  doc.text(word.renderText, x, y);
}

function drawRichText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number = 1.4,
  align: 'left' | 'center' | 'right' = 'left',
  groupColor: string = '#3b82f6',
  baseStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal',
  defaultTextColor: [number, number, number] = [15, 23, 42],
  theme: string = 'modern',
  customFont?: CustomFont
): number {
  const segments = parseRichText(text);
  const words: Word[] = [];

  // Theme-specific font selection
  let themeFont = currentFontName;
  if (theme === 'cyberpunk' && currentFontName === 'helvetica') themeFont = 'courier';
  if (theme === 'vintage' && currentFontName === 'helvetica') themeFont = 'times';
  if (theme === 'terminal' && currentFontName === 'helvetica') themeFont = 'courier';
  if (theme === 'ethereal' && currentFontName === 'helvetica') themeFont = 'times';
  if (theme === 'prism' && currentFontName === 'helvetica') themeFont = 'helvetica';
  if (theme === 'minecraft' && currentFontName === 'helvetica') themeFont = 'courier';
  if (theme === 'undertale' && currentFontName === 'helvetica') themeFont = 'courier';
  if (theme === 'god-of-war' && currentFontName === 'helvetica') themeFont = 'times';
  if ((theme === 'cuphead' || theme === 'comic') && currentFontName === 'helvetica') themeFont = 'helvetica';

  // Split segments into words while preserving styles
  segments.forEach(seg => {
    const segWords = seg.text.split(/(\s+)/);
    segWords.forEach(wordText => {
      if (wordText === '') return;
      
      let style = baseStyle;
      const bold = seg.isBold || baseStyle.includes('bold');
      const italic = seg.isItalic || baseStyle.includes('italic');
      
      if (bold && italic) style = 'bolditalic';
      else if (bold) style = 'bold';
      else if (italic) style = 'italic';
      else style = 'normal';
      
      const currentStyle = (themeFont === 'helvetica' || themeFont === 'times' || themeFont === 'courier') ? style : 'normal';

      const subWords: SubWord[] = [];
      
      if (/^\s+$/.test(wordText)) {
        doc.setFont(themeFont, currentStyle);
        doc.setFontSize(fontSize);
        subWords.push({
          text: wordText,
          renderText: wordText,
          isBold: bold, isItalic: italic, isHighlight: seg.isHighlight, isMemoryLink: seg.isMemoryLink, color: seg.color,
          width: doc.getTextWidth(wordText),
          dir: 'NEUTRAL'
        });
      } else {
        const subs = wordText.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+|[a-zA-Z0-9]+|[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+/g) || [wordText];
        subs.forEach(sub => {
          const dir = getDir(sub);
          let renderText = sub;
          let fontToUse = themeFont;
          
          if (dir === 'RTL') {
            renderText = ArabicShaper.convertArabic(sub);
            const fontList = doc.getFontList();
            if (fontList['Amiri']) {
              fontToUse = 'Amiri';
            } else if (customFont) {
              fontToUse = customFont.name;
            }
          }
          
          doc.setFont(fontToUse, currentStyle);
          doc.setFontSize(fontSize);
          
          subWords.push({
            text: sub,
            renderText,
            isBold: bold, isItalic: italic, isHighlight: seg.isHighlight, isMemoryLink: seg.isMemoryLink, color: seg.color,
            width: doc.getTextWidth(renderText),
            dir
          });
        });
      }

      const wordWidth = subWords.reduce((sum, sw) => sum + sw.width, 0);
      words.push({ text: wordText, width: wordWidth, subWords });
    });
  });

  // Wrap words into lines
  const lines: typeof words[] = [];
  let currentLine: typeof words = [];
  let currentLineWidth = 0;

  words.forEach(word => {
    if (word.text === '\n') {
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
      return;
    }

    if (currentLineWidth + word.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentLineWidth = 0;
    }

    // Skip leading spaces on new lines
    if (currentLine.length === 0 && /^\s+$/.test(word.text)) return;

    currentLine.push(word);
    currentLineWidth += word.width;
  });
  if (currentLine.length > 0) lines.push(currentLine);

  // Render lines
  let currentY = y;
  const fontHeight = (fontSize * 0.3527); // mm
  
  // Determine base direction from the first non-neutral character
  let contentBaseDir: 'RTL' | 'LTR' = 'LTR';
  let foundDir = false;
  for (const word of words) {
    for (const sub of word.subWords) {
      if (sub.dir !== 'NEUTRAL') {
        contentBaseDir = sub.dir;
        foundDir = true;
        break;
      }
    }
    if (foundDir) break;
  }
  
  const baseDir = align === 'right' ? 'RTL' : contentBaseDir;

  lines.forEach(line => {
    let currentX = x;
    const lineWidth = line.reduce((sum, w) => sum + w.width, 0);

    if (align === 'center') {
      currentX = x + (maxWidth - lineWidth) / 2;
    } else if (align === 'right') {
      currentX = x + (maxWidth - lineWidth);
    }

    const flatSubWords = line.flatMap(w => w.subWords);
    
    const dirs = flatSubWords.map(sw => sw.dir);
    for (let i = 0; i < dirs.length; i++) {
      if (dirs[i] === 'NEUTRAL') {
        let prev = baseDir;
        for (let j = i - 1; j >= 0; j--) {
          if (dirs[j] !== 'NEUTRAL') { prev = dirs[j] as 'RTL' | 'LTR'; break; }
        }
        let next = baseDir;
        for (let j = i + 1; j < dirs.length; j++) {
          if (dirs[j] !== 'NEUTRAL') { next = dirs[j] as 'RTL' | 'LTR'; break; }
        }
        if (prev === next) {
          dirs[i] = prev;
        } else {
          dirs[i] = baseDir;
        }
      }
    }

    const segments: { dir: string, subWords: SubWord[] }[] = [];
    if (flatSubWords.length > 0) {
      let currentSeg = { dir: dirs[0], subWords: [flatSubWords[0]] };
      for (let i = 1; i < flatSubWords.length; i++) {
        if (dirs[i] === currentSeg.dir) {
          currentSeg.subWords.push(flatSubWords[i]);
        } else {
          segments.push(currentSeg);
          currentSeg = { dir: dirs[i], subWords: [flatSubWords[i]] };
        }
      }
      segments.push(currentSeg);
    }

    if (baseDir === 'RTL') {
      let tempX = currentX + lineWidth;
      segments.forEach(seg => {
        if (seg.dir === 'RTL') {
          seg.subWords.forEach(word => {
            tempX -= word.width;
            renderSubWord(doc, word, tempX, currentY, fontHeight, themeFont, fontSize, groupColor, defaultTextColor, theme, customFont);
          });
        } else {
          const totalWidth = seg.subWords.reduce((sum, w) => sum + w.width, 0);
          tempX -= totalWidth;
          let ltrX = tempX;
          seg.subWords.forEach(word => {
            renderSubWord(doc, word, ltrX, currentY, fontHeight, themeFont, fontSize, groupColor, defaultTextColor, theme, customFont);
            ltrX += word.width;
          });
        }
      });
    } else {
      let tempX = currentX;
      segments.forEach(seg => {
        if (seg.dir === 'LTR') {
          seg.subWords.forEach(word => {
            renderSubWord(doc, word, tempX, currentY, fontHeight, themeFont, fontSize, groupColor, defaultTextColor, theme, customFont);
            tempX += word.width;
          });
        } else {
          const totalWidth = seg.subWords.reduce((sum, w) => sum + w.width, 0);
          let rtlX = tempX + totalWidth;
          seg.subWords.forEach(word => {
            rtlX -= word.width;
            renderSubWord(doc, word, rtlX, currentY, fontHeight, themeFont, fontSize, groupColor, defaultTextColor, theme, customFont);
          });
          tempX += totalWidth;
        }
      });
    }

    currentY += fontHeight * lineHeight;
  });

  return currentY - y;
}

const loadImage = (url: string): Promise<{ data: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      // Use JPEG with 0.8 quality to reduce file size significantly compared to PNG
      resolve({
        data: canvas.toDataURL('image/jpeg', 0.8),
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const generatePDF = async (
  parsedData: any[],
  imagePlacements: Record<string, PlacedImage[]>,
  selectedColors: string[],
  baseTextSize: number,
  customFont?: CustomFont,
  theme: string = 'modern'
) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4'
  });

  await loadArabicFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 25;

  let docTitle = "Document";
  if (parsedData.length > 0 && parsedData[0].ITEMS && parsedData[0].ITEMS.length > 0) {
    const firstItem = parsedData[0].ITEMS[0];
    if (String(firstItem.TYPE).toUpperCase() === 'TITLE') {
      docTitle = stripMemoryLinks(firstItem.CONTENT);
    }
  }

  // Theme-specific settings
  const themeSettings = {
    modern: {
      bg: [252, 252, 252] as [number, number, number],
      text: [15, 23, 42] as [number, number, number],
      accent: [59, 130, 246] as [number, number, number],
      font: 'helvetica'
    },
    cyberpunk: {
      bg: [5, 5, 10] as [number, number, number],
      text: [0, 255, 255] as [number, number, number],
      accent: [168, 85, 247] as [number, number, number],
      font: 'courier'
    },
    vintage: {
      bg: [253, 251, 247] as [number, number, number],
      text: [74, 55, 40] as [number, number, number],
      accent: [212, 197, 161] as [number, number, number],
      font: 'times'
    },
    terminal: {
      bg: [0, 0, 0] as [number, number, number],
      text: [34, 197, 94] as [number, number, number],
      accent: [34, 197, 94] as [number, number, number],
      font: 'courier'
    },
    ethereal: {
      bg: [250, 248, 255] as [number, number, number],
      text: [49, 46, 129] as [number, number, number],
      accent: [99, 102, 241] as [number, number, number],
      font: 'times'
    },
    prism: {
      bg: [248, 250, 255] as [number, number, number],
      text: [15, 23, 42] as [number, number, number],
      accent: [99, 102, 241] as [number, number, number],
      font: 'helvetica'
    },
    minecraft: {
      bg: [198, 198, 198] as [number, number, number],
      text: [55, 55, 55] as [number, number, number],
      accent: [85, 85, 85] as [number, number, number],
      font: 'courier'
    },
    undertale: {
      bg: [0, 0, 0] as [number, number, number],
      text: [255, 255, 255] as [number, number, number],
      accent: [255, 0, 0] as [number, number, number],
      font: 'courier'
    },
    'god-of-war': {
      bg: [15, 15, 15] as [number, number, number],
      text: [203, 213, 225] as [number, number, number],
      accent: [139, 0, 0] as [number, number, number],
      font: 'times'
    },
    cuphead: {
      bg: [245, 245, 220] as [number, number, number],
      text: [0, 0, 0] as [number, number, number],
      accent: [0, 0, 0] as [number, number, number],
      font: 'helvetica'
    },
    comic: {
      bg: [255, 255, 255] as [number, number, number],
      text: [0, 0, 0] as [number, number, number],
      accent: [255, 204, 0] as [number, number, number], // Yellow accent
      font: 'helvetica'
    }
  };

  const currentTheme = themeSettings[theme as keyof typeof themeSettings] || themeSettings.modern;
  const pageBgColor = currentTheme.bg;
  const defaultTextColor = currentTheme.text;

  const drawPageBorder = () => {
    // Fill background color
    doc.setFillColor(...pageBgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Subtle background elements for all pages (kept very minimal for "plain" look)
    if (theme === 'cyberpunk') {
      // Very subtle grid
      doc.setDrawColor(0, 255, 255);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 0.02 })); } catch (e) {}
      doc.setLineWidth(0.05);
      for (let i = 0; i < pageWidth; i += 40) doc.line(i, 0, i, pageHeight);
      for (let i = 0; i < pageHeight; i += 40) doc.line(0, i, pageWidth, i);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    } else if (theme === 'terminal') {
      // Very faint scanlines
      doc.setDrawColor(34, 197, 94);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 0.01 })); } catch (e) {}
      doc.setLineWidth(0.03);
      for (let i = 0; i < pageHeight; i += 2) doc.line(0, i, pageWidth, i);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    } else if (theme === 'vintage') {
      // Subtle texture/noise
      doc.setDrawColor(139, 69, 19);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 0.02 })); } catch (e) {}
      doc.setLineWidth(0.05);
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * pageWidth;
        const y = Math.random() * pageHeight;
        doc.line(x, y, x + 0.5, y + 0.5);
      }
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    } else if (theme === 'undertale') {
      // Faint "stars"
      doc.setFillColor(255, 255, 255);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 0.05 })); } catch (e) {}
      for (let i = 0; i < 15; i++) {
        doc.rect(Math.random() * pageWidth, Math.random() * pageHeight, 0.5, 0.5, 'F');
      }
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    } else if (theme === 'god-of-war') {
      // Subtle Greek key pattern on edges
      doc.setDrawColor(139, 0, 0);
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 0.03 })); } catch (e) {}
      doc.setLineWidth(0.2);
      for (let i = 10; i < pageHeight - 10; i += 20) {
        doc.line(5, i, 8, i);
        doc.line(pageWidth - 8, i, pageWidth - 5, i);
      }
      try { (doc as any).setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    }

    if (theme === 'vintage') {
      doc.setDrawColor(93, 64, 55);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setLineWidth(0.2);
      doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    } else if (theme === 'cyberpunk') {
      doc.setDrawColor(0, 255, 255);
      doc.setLineWidth(0.2);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      // Corner accents
      doc.line(5, 15, 5, 5); doc.line(5, 5, 15, 5);
      doc.line(pageWidth - 15, 5, pageWidth - 5, 5); doc.line(pageWidth - 5, 5, pageWidth - 5, 15);
      doc.line(5, pageHeight - 15, 5, pageHeight - 5); doc.line(5, pageHeight - 5, 15, pageHeight - 5);
      doc.line(pageWidth - 15, pageHeight - 5, pageWidth - 5, pageHeight - 5); doc.line(pageWidth - 5, pageHeight - 5, pageWidth - 5, pageHeight - 15);
      
      // Decorative bits
      doc.setLineWidth(0.1);
      doc.line(10, 8, pageWidth - 10, 8);
      doc.line(10, pageHeight - 8, pageWidth - 10, pageHeight - 8);
    } else if (theme === 'terminal') {
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      // Scanline effect on border
      for (let i = 5; i < pageHeight - 5; i += 2) {
        doc.line(5, i, 7, i);
        doc.line(pageWidth - 7, i, pageWidth - 5, i);
      }
    } else if (theme === 'god-of-war') {
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setDrawColor(255, 215, 0);
      doc.setLineWidth(0.3);
      doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    } else if (theme === 'prism') {
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(5, 5, pageWidth - 5, 5);
      doc.setDrawColor(236, 72, 153);
      doc.line(5, pageHeight - 5, pageWidth - 5, pageHeight - 5);
    } else if (theme === 'minecraft') {
      doc.setDrawColor(55, 55, 55);
      doc.setLineWidth(2);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setDrawColor(198, 198, 198);
      doc.setLineWidth(1);
      doc.rect(6, 6, pageWidth - 12, pageHeight - 12);
    } else if (theme === 'undertale') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
    } else if (theme === 'cuphead' || theme === 'comic') {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(2);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setLineWidth(0.5);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    } else if (theme === 'comic') {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(3);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      // Inner border
      doc.setLineWidth(1);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
      // Halftone effect dots in corners
      doc.setFillColor(0, 0, 0);
      doc.circle(10, 10, 1, 'F');
      doc.circle(pageWidth - 10, 10, 1, 'F');
      doc.circle(10, pageHeight - 10, 1, 'F');
      doc.circle(pageWidth - 10, pageHeight - 10, 1, 'F');
    } else {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    }
  };

  const originalAddPage = doc.addPage.bind(doc);
  doc.addPage = (...args: any[]) => {
    const res = originalAddPage(...args);
    drawPageBorder();
    return res;
  };

  drawPageBorder();

  currentFontName = customFont ? customFont.name : 'helvetica';
  const toc: { title: string, page: number }[] = [];

  // Check for cover page
  let hasCoverPage = false;
  if (parsedData.length > 0 && parsedData[0].ITEMS && parsedData[0].ITEMS.length > 0) {
    const firstItem = parsedData[0].ITEMS[0];
    if (String(firstItem.TYPE).toUpperCase() === 'TITLE') {
      hasCoverPage = true;
    }
  }

  if (hasCoverPage) {
    const firstGroup = parsedData[0];
    const firstItem = firstGroup.ITEMS[0];
    
    // Render cover page
    // Theme-specific background
    if (theme === 'cyberpunk') {
      doc.setFillColor(10, 10, 15);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Add some neon lines
      doc.setDrawColor(0, 255, 255, 0.3);
      doc.setLineWidth(0.1);
      for (let i = 0; i < pageHeight; i += 20) {
        doc.line(0, i, pageWidth, i);
      }
      // Glitch effect squares
      doc.setFillColor(168, 85, 247, 0.1);
      for (let i = 0; i < 10; i++) {
        doc.rect(Math.random() * pageWidth, Math.random() * pageHeight, 20, 2, 'F');
      }
    } else if (theme === 'terminal') {
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Matrix-like dots
      doc.setFillColor(34, 197, 94, 0.2);
      for (let i = 0; i < 100; i++) {
        doc.circle(Math.random() * pageWidth, Math.random() * pageHeight, 0.5, 'F');
      }
    } else if (theme === 'vintage') {
      doc.setFillColor(253, 251, 247);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Subtle paper texture effect
      doc.setDrawColor(212, 197, 161, 0.2);
      for (let i = 0; i < 50; i++) {
        doc.line(Math.random() * pageWidth, Math.random() * pageHeight, Math.random() * pageWidth, Math.random() * pageHeight);
      }
    } else if (theme === 'god-of-war') {
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Blood splatter effect
      doc.setFillColor(139, 0, 0, 0.1);
      for (let i = 0; i < 15; i++) {
        doc.circle(Math.random() * pageWidth, Math.random() * pageHeight, Math.random() * 10, 'F');
      }
    } else if (theme === 'modern' || theme === 'prism') {
      doc.setFillColor(250, 250, 250); // Slightly off-white for a premium feel
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Modern geometric accents
      doc.setFillColor(59, 130, 246, 0.05);
      doc.circle(pageWidth, 0, 150, 'F');
      
      if (theme === 'prism') {
        doc.setFillColor(236, 72, 153, 0.05);
        doc.circle(0, pageHeight, 200, 'F');
      }
      
      // Professional left accent bar
      doc.setFillColor(theme === 'prism' ? 99 : 59, theme === 'prism' ? 102 : 130, theme === 'prism' ? 241 : 246);
      doc.rect(0, 0, 8, pageHeight, 'F');
    } else if (theme === 'comic') {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      // Comic style burst effect
      doc.setFillColor(255, 204, 0); // Yellow burst
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * Math.PI / 180;
        const x1 = pageWidth / 2 + Math.cos(angle) * 50;
        const y1 = pageHeight / 2 + Math.sin(angle) * 50;
        const x2 = pageWidth / 2 + Math.cos(angle - 0.2) * 200;
        const y2 = pageHeight / 2 + Math.sin(angle - 0.2) * 200;
        const x3 = pageWidth / 2 + Math.cos(angle + 0.2) * 200;
        const y3 = pageHeight / 2 + Math.sin(angle + 0.2) * 200;
        doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
      }
    }

    drawPageBorder();

    const titleFontSize = baseTextSize + 28; // Larger title
    doc.setFontSize(titleFontSize);
    
    let titleColor: [number, number, number] = [15, 23, 42];
    if (theme === 'cyberpunk') titleColor = [0, 255, 255];
    if (theme === 'vintage') titleColor = [74, 55, 40];
    if (theme === 'prism') titleColor = [79, 70, 229];
    if (theme === 'minecraft') titleColor = [55, 55, 55];
    if (theme === 'undertale') titleColor = [255, 255, 255];
    if (theme === 'god-of-war') titleColor = [255, 215, 0];
    if (theme === 'cuphead' || theme === 'comic') titleColor = [0, 0, 0];
    
    doc.setTextColor(...titleColor);
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
    
    // Center Title with better vertical alignment
    const titleLines = doc.splitTextToSize(docTitle, contentWidth - 20);
    const titleY = pageHeight * 0.4;
    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
    
    // Subtitle if any
    let subtitleY = titleY + (titleLines.length * (titleFontSize * 0.3527)) + 10;
    if (firstGroup.ITEMS.length > 1 && String(firstGroup.ITEMS[1].TYPE).toUpperCase() === 'SUBHEADER') {
      doc.setFontSize(baseTextSize + 6);
      doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      try { doc.setGState(new (doc as any).GState({ opacity: 0.8 })); } catch (e) {}
      doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'normal');
      const subLines = doc.splitTextToSize(stripMemoryLinks(firstGroup.ITEMS[1].CONTENT), contentWidth - 20);
      doc.text(subLines, pageWidth / 2, subtitleY, { align: 'center' });
      subtitleY += (subLines.length * ((baseTextSize + 6) * 0.3527)) + 10;
      try { doc.setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
    }
    
    // Add a thematic graphic or line
    doc.setDrawColor(...titleColor);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, subtitleY + 10, pageWidth / 2 + 40, subtitleY + 10);

    // Footer on cover page (Professional "Prepared by" text)
    doc.setFontSize(11);
    doc.setTextColor(...titleColor);
    try { doc.setGState(new (doc as any).GState({ opacity: 0.6 })); } catch (e) {}
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
    doc.text("Prepared by Arcane Notes", pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
    try { doc.setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}

    doc.addPage();
    yPos = margin;
  }

  if (customFont) {
    try {
      const base64 = customFont.data.split(',')[1];
      doc.addFileToVFS(customFont.fileName, base64);
      doc.addFont(customFont.fileName, customFont.name, 'normal');
      doc.setFont(customFont.name);
    } catch (e) {
      console.error('Error adding custom font to PDF:', e);
      currentFontName = 'helvetica';
    }
  }

  // Find document title for filename
  docTitle = 'Arcane Notes';
  for (const group of parsedData) {
    const titleItem = group.ITEMS.find((item: any) => String(item.TYPE).toUpperCase() === 'TITLE');
    if (titleItem) {
      docTitle = String(titleItem.CONTENT).replace(/[\\/:*?"<>|]/g, '').substring(0, 50);
      break;
    }
  }

  doc.setProperties({
    title: docTitle,
    subject: 'Generated by Arcane Notes',
    creator: 'Arcane Notes'
  });

  let floatingArea: { x: number, y: number, w: number, h: number, side: 'left' | 'right' } | null = null;

  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      floatingArea = null;
      
      // Re-apply background on new page
      if (theme !== 'modern') {
        doc.setFillColor(...currentTheme.bg);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
      }
    }
  };

  // Initial background
  if (theme !== 'modern') {
    doc.setFillColor(...currentTheme.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  const defaultColors = [
    '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#f43f5e', '#06b6d4'
  ];
  const colorsToUse = selectedColors.length > 0 ? selectedColors : defaultColors;

  const renderImages = async (path: string, groupColor: string = '#3b82f6') => {
    const images = imagePlacements[path];
    if (!images || images.length === 0) return;

    for (const img of images) {
      try {
        const { data, width, height } = await loadImage(img.url);
        const aspectRatio = height / width;
        
        // Natural size at 96 DPI
        const naturalWidthMm = (width / 96) * 25.4;
        
        // Use the width percentage directly (e.g., 100 means 100% of content width)
        const targetWidthPercent = img.width || 100;
        let targetWidthMm = (contentWidth * targetWidthPercent) / 100;
        
        // Ensure it doesn't exceed content width
        targetWidthMm = Math.min(targetWidthMm, contentWidth);
        const targetHeightMm = targetWidthMm * aspectRatio;

        let totalHeightMm = targetHeightMm;
        let captionHeightMm = 0;
        let captionLines: string[] = [];

        if (img.hasBorder) {
          totalHeightMm += 2; // 1mm border top and bottom
        }

        if (img.caption) {
          const strippedCaption = stripMemoryLinks(img.caption);
          const tempDoc = new jsPDF();
          captionHeightMm = drawRichText(tempDoc, strippedCaption, 0, 0, targetWidthMm, 9, 1.2, 'center', groupColor, 'italic', [71, 85, 105], theme, customFont);
          totalHeightMm += captionHeightMm + 2;
        }

        const isFloating = (img.alignment === 'left' || img.alignment === 'right') && targetWidthPercent <= 65;

        // If floating area is active, and we are not floating on the opposite side,
        // we should push yPos down to avoid overlap.
        if (floatingArea) {
          // If we are not floating, or we are floating on the same side, we must move down
          if (!isFloating || floatingArea.side === img.alignment) {
            yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
            floatingArea = null;
          }
        }

        checkPageBreak(totalHeightMm + 5);

        let xOffset = margin;
        if (img.alignment === 'center') {
          xOffset = margin + (contentWidth - targetWidthMm) / 2;
        } else if (img.alignment === 'right') {
          xOffset = margin + (contentWidth - targetWidthMm);
        }

        let currentY = yPos;

        // Border
        if (img.hasBorder) {
          doc.setDrawColor(30, 41, 59); // slate-800
          doc.setLineWidth(1);
          doc.rect(xOffset - 1, currentY - 1, targetWidthMm + 2, targetHeightMm + 2);
        }

        doc.addImage(data, 'JPEG', xOffset, currentY, targetWidthMm, targetHeightMm, undefined, 'FAST');
        
        // Caption
        if (img.caption) {
          if (img.hasBorder) {
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(xOffset - 1, currentY + targetHeightMm + 1, targetWidthMm + 2, captionHeightMm + 2, 'F');
            
            // Draw outer border for caption area
            doc.setDrawColor(30, 41, 59); // slate-800
            doc.setLineWidth(1);
            doc.rect(xOffset - 1, currentY + targetHeightMm + 1, targetWidthMm + 2, captionHeightMm + 2);
          }
          
          drawRichText(doc, stripMemoryLinks(img.caption), xOffset, currentY + targetHeightMm + (img.hasBorder ? 3 : 2), targetWidthMm, 9, 1.2, 'center', groupColor, 'italic', [71, 85, 105], theme, customFont);
        }

        if (isFloating) {
          floatingArea = {
            x: xOffset,
            y: yPos,
            w: targetWidthMm,
            h: totalHeightMm,
            side: img.alignment as 'left' | 'right'
          };
          // Don't increment yPos yet, let text wrap
        } else {
          yPos += totalHeightMm + 5;
          floatingArea = null;
        }
      } catch (e) {
        console.error('Failed to load image for PDF:', img.url, e);
      }
    }
  };

  let lastType = '';

  const renderItem = async (item: any, path: string, groupColor: string) => {
    await renderImages(`${path}.before`, groupColor);

    const type = String(item.TYPE).toUpperCase();
    const content = String(item.CONTENT);
    const scale = baseTextSize / 16; // Keep for any other uses if needed

    let currentX = margin;
    let currentMaxWidth = contentWidth;

    if (floatingArea) {
      if (floatingArea.side === 'left') {
        currentX = margin + floatingArea.w + 5;
        currentMaxWidth = contentWidth - floatingArea.w - 5;
      } else {
        currentX = margin;
        currentMaxWidth = contentWidth - floatingArea.w - 5;
      }
    }

    // Adjust spacing based on previous type relationship
    if (lastType) {
      const isBullet = type === 'BULLET' || type === 'AR_BULLET' || type === 'LIST' || type === 'AR_LIST';
      const wasBullet = lastType === 'BULLET' || lastType === 'AR_BULLET' || lastType === 'LIST' || lastType === 'AR_LIST';
      const isHeading = type.includes('HEADING') || type === 'TITLE' || type === 'SUBHEADER' || type === 'AR_TITLE';
      const isBox = ['MCQ', 'AR_MCQ', 'ESSAY', 'AR_ESSAY', 'TIP', 'AR_TIP', 'WARNING', 'AR_WARNING', 'IMPORTANT', 'AR_IMPORTANT', 'DEFINITION', 'AR_DEFINITION', 'CODE', 'AR_CODE', 'EXPLANATION', 'AR_EXPLANATION', 'FORMULA', 'AR_FORMULA', 'AR_SIMPLIFY'].includes(type);
      const wasBox = ['MCQ', 'AR_MCQ', 'ESSAY', 'AR_ESSAY', 'TIP', 'AR_TIP', 'WARNING', 'AR_WARNING', 'IMPORTANT', 'AR_IMPORTANT', 'DEFINITION', 'AR_DEFINITION', 'CODE', 'AR_CODE', 'EXPLANATION', 'AR_EXPLANATION', 'FORMULA', 'AR_FORMULA', 'AR_SIMPLIFY'].includes(lastType);

      if (isHeading) {
        yPos += 12;
      } else if (isBullet && wasBullet) {
        yPos += 1.5; // Reduced spacing between consecutive bullets
      } else if (isBullet && !wasBullet) {
        yPos += 6; // Spacing before starting a bullet list
      } else if (!isBullet && wasBullet) {
        yPos += 8; // Spacing after a bullet list ends
      } else if (isBox && wasBox && type === lastType) {
        yPos += 4; // Reduced spacing between identical consecutive boxes
      } else if (isBox) {
        yPos += 8; // Normal spacing for boxes
      } else {
        yPos += 5; // Default spacing
      }
    }

    switch (type) {
      case 'HEADING_1':
      case 'HEADING 1':
      case 'H1':
      case 'AR_TITLE':
      case 'TITLE': {
        // Force page break for major sections if we are past the first quarter of the page
        if (yPos > margin + (pageHeight / 4) && type !== 'TITLE' && type !== 'AR_TITLE') {
           checkPageBreak(pageHeight); // Force new page
        }
        
        const fontSize = baseTextSize + 14;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'center';
        let titleColor = hexToRgb(getShade(groupColor, -0.4));
        if (theme === 'cyberpunk') titleColor = [255, 255, 255];
        if (theme === 'vintage') titleColor = [44, 30, 20];
        if (theme === 'terminal') titleColor = [34, 197, 94];
        if (theme === 'ethereal') titleColor = [49, 46, 129];
        if (theme === 'prism') titleColor = [79, 70, 229];
        if (theme === 'minecraft') titleColor = [55, 55, 55];
        if (theme === 'undertale') titleColor = [250, 204, 21]; // yellow-400
        if (theme === 'god-of-war') titleColor = [255, 215, 0]; // gold
        if (theme === 'cuphead' || theme === 'comic') titleColor = [0, 0, 0]; // black

        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, isAr ? content : content.toUpperCase(), 0, 0, currentMaxWidth - (theme === 'cyberpunk' || theme === 'terminal' || theme === 'god-of-war' ? 10 : 0), fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
        
        checkPageBreak(height + 15);
        
        // If floating, check if we fit next to the image
        if (floatingArea && height > floatingArea.h) {
          yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
          floatingArea = null;
          currentX = margin;
          currentMaxWidth = contentWidth;
        }

        if (theme === 'cyberpunk') {
          doc.setFillColor(168, 85, 247, 0.1); // purple-900/10
          doc.rect(currentX, yPos, currentMaxWidth, height + 4, 'F');
          doc.setFillColor(...hexToRgb(groupColor || '#a855f7'));
          if (!isAr) {
            doc.rect(currentX, yPos, 2, height + 4, 'F');
          } else {
            doc.rect(currentX + currentMaxWidth - 2, yPos, 2, height + 4, 'F');
          }
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 2 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 8;
        } else if (theme === 'terminal') {
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, height + 4, 'D');
          if (!isAr) {
            drawRichText(doc, isAr ? content : `> ${content.toUpperCase()} <`, currentX, yPos + 2 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          } else {
            drawRichText(doc, content, currentX, yPos + 2 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          }
          yPos += height + 10;
        } else if (theme === 'god-of-war') {
          doc.setFillColor(139, 0, 0, 0.1); // darkred
          doc.rect(currentX, yPos, currentMaxWidth, height + 4, 'F');
          doc.setDrawColor(139, 0, 0);
          doc.setLineWidth(1);
          doc.rect(currentX, yPos, currentMaxWidth, height + 4, 'D');
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 2 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 10;
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setFillColor(255, 255, 255);
          doc.rect(currentX, yPos, currentMaxWidth, height + 8, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.5);
          doc.rect(currentX, yPos, currentMaxWidth, height + 8, 'D');
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 4 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 14;
        } else if (theme === 'ethereal') {
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'normal', titleColor, theme, customFont);
          yPos += height + 4;
          doc.setDrawColor(99, 102, 241, 0.2);
          doc.setLineWidth(0.1);
          doc.line(margin + contentWidth * 0.2, yPos, margin + contentWidth * 0.8, yPos);
          yPos += 10;
        } else if (theme === 'vintage') {
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 2;
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.5);
          doc.line(margin, yPos, margin + contentWidth, yPos);
          doc.line(margin, yPos + 1.5, margin + contentWidth, yPos + 1.5);
          yPos += 10;
        } else if (theme === 'prism') {
          // Prism title centralized with soft background
          doc.setFillColor(248, 250, 252); // slate-50
          doc.roundedRect(currentX, yPos, currentMaxWidth, height + 8, 4, 4, 'F');
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.1);
          doc.roundedRect(currentX, yPos, currentMaxWidth, height + 8, 4, 4, 'D');
          
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 4 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 14;
        } else if (theme === 'minecraft') {
          doc.setFillColor(198, 198, 198); // #c6c6c6
          doc.rect(currentX, yPos, currentMaxWidth, height + 16, 'F');
          doc.setDrawColor(55, 55, 55); // #373737
          doc.setLineWidth(1.5);
          doc.rect(currentX, yPos, currentMaxWidth, height + 16, 'D');
          
          // Minecraft inner shadows
          doc.setDrawColor(255, 255, 255);
          doc.line(currentX + 1, yPos + 1, currentX + currentMaxWidth - 1, yPos + 1);
          doc.line(currentX + 1, yPos + 1, currentX + 1, yPos + height + 15);
          doc.setDrawColor(85, 85, 85);
          doc.line(currentX + 1, yPos + height + 15, currentX + currentMaxWidth - 1, yPos + height + 15);
          doc.line(currentX + currentMaxWidth - 1, yPos + 1, currentX + currentMaxWidth - 1, yPos + height + 15);
          
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 8 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 28;
        } else if (theme === 'undertale') {
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 20;
        } else if (theme === 'god-of-war') {
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', [255, 215, 0], theme, customFont);
          yPos += height + 2;
          doc.setDrawColor(139, 0, 0); // Dark red underline
          doc.setLineWidth(1.5);
          doc.line(margin + contentWidth * 0.1, yPos, margin + contentWidth * 0.9, yPos);
          yPos += 10;
        } else if (theme === 'cuphead' || theme === 'comic') {
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', [0, 0, 0], theme, customFont);
          yPos += height + 2;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(2);
          doc.line(margin + contentWidth * 0.2, yPos, margin + contentWidth * 0.8, yPos);
          doc.setLineWidth(0.5);
          doc.line(margin + contentWidth * 0.2, yPos + 2, margin + contentWidth * 0.8, yPos + 2);
          yPos += 10;
        } else {
          // Modern theme title
          doc.setFillColor(...hexToRgb(getShade(groupColor, 0.95)));
          doc.roundedRect(currentX, yPos, currentMaxWidth, height + 6, 3, 3, 'F');
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + 3 + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', titleColor, theme, customFont);
          yPos += height + 12;
        }
        break;
      }
      case 'AR_HEADING_2':
      case 'AR_SUBHEADER':
      case 'HEADING_2':
      case 'HEADING 2':
      case 'H2':
      case 'SUBHEADER': {
        const fontSize = baseTextSize + 8;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        let subColor = hexToRgb(getShade(groupColor, -0.2));
        if (theme === 'cyberpunk') subColor = [6, 182, 212]; // cyan-400
        if (theme === 'vintage') subColor = [74, 55, 40]; // #4a3728
        if (theme === 'terminal') subColor = [245, 158, 11]; // amber-500
        if (theme === 'ethereal') subColor = [49, 46, 129]; // indigo-900
        if (theme === 'prism') subColor = [79, 70, 229];
        if (theme === 'minecraft') subColor = [55, 55, 55];
        if (theme === 'undertale') subColor = [255, 255, 255];
        if (theme === 'god-of-war') subColor = [255, 215, 0];
        if (theme === 'cuphead' || theme === 'comic') subColor = [0, 0, 0];

        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - 10, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        
        checkPageBreak(height + 5);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        if (theme === 'modern') {
          doc.setFillColor(...hexToRgb(getShade(groupColor, 0.9)));
          if (!isAr) {
            doc.roundedRect(currentX, yPos, 3, height, 1.5, 1.5, 'F');
            drawRichText(doc, content, currentX + 6, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          } else {
            doc.roundedRect(currentX + currentMaxWidth - 3, yPos, 3, height, 1.5, 1.5, 'F');
            drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          }
        } else if (theme === 'terminal') {
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.3);
          if (!isAr) {
            doc.line(currentX, yPos + height + 1, currentX + 30, yPos + height + 1);
          } else {
            doc.line(currentX + currentMaxWidth - 30, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          }
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'god-of-war') {
          doc.setDrawColor(139, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, 'center', groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'ethereal') {
          drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'cyberpunk') {
          doc.setDrawColor(6, 182, 212, 0.3);
          doc.setLineWidth(0.2);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          
          doc.setFillColor(...hexToRgb(groupColor || '#22d3ee'));
          if (!isAr) {
            doc.rect(currentX, yPos + 1, 3, 3, 'F');
            drawRichText(doc, content, currentX + 6, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          } else {
            doc.rect(currentX + currentMaxWidth - 3, yPos + 1, 3, 3, 'F');
            drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          }
        } else if (theme === 'vintage') {
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.2);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'prism') {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.2);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          
          // Prism accent dot
          doc.setFillColor(79, 70, 229); // indigo-600
          if (!isAr) {
            doc.circle(currentX + 1.5, yPos + (fontSize * 0.3527) * 0.35, 1, 'F');
            drawRichText(doc, content, currentX + 6, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          } else {
            doc.circle(currentX + currentMaxWidth - 1.5, yPos + (fontSize * 0.3527) * 0.35, 1, 'F');
            drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
          }
        } else if (theme === 'minecraft') {
          doc.setDrawColor(55, 55, 55);
          doc.setLineWidth(1);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        } else if (theme === 'undertale') {
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.5);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          
          // Undertale star icon
          doc.setTextColor(255, 0, 0);
          doc.setFont('courier', 'bold');
          if (!isAr) {
            doc.text('*', currentX, yPos + (fontSize * 0.3527) * 0.7);
            drawRichText(doc, isAr ? content : content.toUpperCase(), currentX + 6, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.4, align, groupColor, 'bold', subColor, theme, customFont);
          } else {
            doc.text('*', currentX + currentMaxWidth - 3, yPos + (fontSize * 0.3527) * 0.7);
            drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.4, align, groupColor, 'bold', subColor, theme, customFont);
          }
        } else if (theme === 'god-of-war') {
          doc.setDrawColor(139, 0, 0);
          doc.setLineWidth(1);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.4, align, groupColor, 'bold', [255, 215, 0], theme, customFont);
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.5);
          doc.line(currentX, yPos + height + 1, currentX + currentMaxWidth, yPos + height + 1);
          doc.setLineWidth(0.5);
          doc.line(currentX, yPos + height + 3, currentX + currentMaxWidth, yPos + height + 3);
          drawRichText(doc, isAr ? content : content.toUpperCase(), currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.4, 'center', groupColor, 'bold', [0, 0, 0], theme, customFont);
        } else {
          doc.setFillColor(...hexToRgb(getShade(groupColor, 0.9)));
          if (!isAr) {
            doc.roundedRect(currentX, yPos, 3, height, 1.5, 1.5, 'F');
            drawRichText(doc, content, currentX + 6, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.4, align, groupColor, 'bold', subColor, theme, customFont);
          } else {
            doc.roundedRect(currentX + currentMaxWidth - 3, yPos, 3, height, 1.5, 1.5, 'F');
            drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - 6, fontSize, 1.4, align, groupColor, 'bold', subColor, theme, customFont);
          }
        }
        
        yPos += height + 12;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_HEADING_3':
      case 'HEADING_3':
      case 'HEADING 3':
      case 'H3': {
        const fontSize = baseTextSize + 4;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        let subColor = hexToRgb(getShade(groupColor, -0.1));
        if (theme === 'cyberpunk') subColor = [6, 182, 212];
        if (theme === 'vintage') subColor = [74, 55, 40];
        if (theme === 'terminal') subColor = [245, 158, 11];
        if (theme === 'ethereal') subColor = [49, 46, 129];
        if (theme === 'prism') subColor = [79, 70, 229];
        if (theme === 'minecraft') subColor = [55, 55, 55];
        if (theme === 'undertale') subColor = [255, 255, 255];
        if (theme === 'god-of-war') subColor = [255, 215, 0];
        if (theme === 'cuphead' || theme === 'comic') subColor = [0, 0, 0];

        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        
        checkPageBreak(height + 5);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, align, groupColor, 'bold', subColor, theme, customFont);
        yPos += height + 4;
        break;
      }
      case 'AR_LIST':
      case 'LIST':
      case 'AR_BULLET':
      case 'BULLET': {
        const fontSize = baseTextSize - 2;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        doc.setFontSize(fontSize);
        doc.setTextColor(...currentTheme.text);
        
        const tempDoc = new jsPDF();
        const padding = 5; // Indentation for bullet
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - padding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        const iconSize = 2.5;
        const iconColor = currentTheme.accent;
        
        if (!isAr) {
          drawVectorIcon(doc, 'BULLET', currentX + 1, yPos + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, iconColor);
          drawRichText(doc, content, currentX + padding + 4, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - padding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        } else {
          drawVectorIcon(doc, 'BULLET', currentX + currentMaxWidth - iconSize - 1, yPos + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, iconColor);
          drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - padding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        }
        
        yPos += height + 1;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'WARNING':
      case 'TIP':
      case 'IMPORTANT':
      case 'AR_WARNING':
      case 'AR_TIP':
      case 'AR_IMPORTANT': {
        const fontSize = baseTextSize - 1;
        doc.setFontSize(fontSize);
        const padding = 5;
        
        let bgColor = getShade(groupColor, 0.92);
        let borderColor = groupColor;
        let textColor: [number, number, number] = hexToRgb(getShade(groupColor, -0.6));

        if (type === 'TIP' || type === 'AR_TIP') {
          if (theme === 'cyberpunk') {
            bgColor = '#062016'; // emerald-950/20
            borderColor = '#10b981';
            textColor = [167, 243, 208]; // emerald-200
          } else if (theme === 'terminal') {
            bgColor = '#000000';
            borderColor = '#22c55e';
            textColor = [34, 197, 94];
          } else if (theme === 'ethereal') {
            bgColor = '#ecfdf5';
            borderColor = '#10b981';
            textColor = [6, 78, 59];
          } else if (theme === 'vintage') {
            bgColor = '#f0f9f0';
            borderColor = '#8fb38f';
            textColor = [45, 74, 45];
          } else if (theme === 'prism') {
            bgColor = '#ffffff';
            borderColor = '#e2e8f0';
            textColor = [5, 150, 105];
          } else if (theme === 'minecraft') {
            bgColor = '#c6c6c6';
            borderColor = '#373737';
            textColor = [55, 55, 55];
          } else if (theme === 'undertale') {
            bgColor = '#000000';
            borderColor = '#ffffff';
            textColor = [255, 255, 255];
          } else if (theme === 'god-of-war') {
            bgColor = '#1a1a1a';
            borderColor = '#ffd700';
            textColor = [255, 215, 0];
          } else if (theme === 'cuphead' || theme === 'comic') {
            bgColor = '#f5f5dc';
            borderColor = '#000000';
            textColor = [0, 0, 0];
          } else {
            bgColor = groupColor ? getShade(groupColor, 0.92) : '#f0fdf4';
            borderColor = groupColor || '#22c55e';
          }
        } else if (type === 'IMPORTANT' || type === 'AR_IMPORTANT') {
          if (theme === 'cyberpunk') {
            bgColor = '#2d0a0a'; // red-950/30
            borderColor = '#ef4444';
            textColor = [254, 202, 202]; // red-200
          } else if (theme === 'terminal') {
            bgColor = '#ef4444';
            borderColor = '#000000';
            textColor = [0, 0, 0];
          } else if (theme === 'ethereal') {
            bgColor = '#eef2ff';
            borderColor = '#6366f1';
            textColor = [49, 46, 129];
          } else if (theme === 'vintage') {
            bgColor = '#fff5f5';
            borderColor = '#c0392b';
            textColor = [192, 57, 43];
          } else if (theme === 'prism') {
            bgColor = '#ffffff';
            borderColor = '#e2e8f0';
            textColor = [79, 70, 229];
          } else if (theme === 'minecraft') {
            bgColor = '#c6c6c6';
            borderColor = '#373737';
            textColor = [55, 55, 55];
          } else if (theme === 'undertale') {
            bgColor = '#000000';
            borderColor = '#ffffff';
            textColor = [255, 255, 255];
          } else if (theme === 'god-of-war') {
            bgColor = '#1a1a1a';
            borderColor = '#8b0000';
            textColor = [203, 213, 225];
          } else if (theme === 'cuphead' || theme === 'comic') {
            bgColor = '#f5f5dc';
            borderColor = '#000000';
            textColor = [0, 0, 0];
          } else {
            bgColor = groupColor ? getShade(groupColor, 0.92) : '#fef2f2';
            borderColor = groupColor || '#ef4444';
          }
        } else { // WARNING
          if (theme === 'cyberpunk') {
            bgColor = '#2d0a0a';
            borderColor = '#ef4444';
            textColor = [254, 202, 202];
          } else if (theme === 'terminal') {
            bgColor = '#000000';
            borderColor = '#ef4444';
            textColor = [239, 68, 68];
          } else if (theme === 'ethereal') {
            bgColor = '#fff1f2';
            borderColor = '#f43f5e';
            textColor = [136, 19, 55];
          } else if (theme === 'vintage') {
            bgColor = '#fff9f0';
            borderColor = '#d4a373';
            textColor = [93, 64, 55];
          } else if (theme === 'prism') {
            bgColor = '#ffffff';
            borderColor = '#e2e8f0';
            textColor = [220, 38, 38];
          } else if (theme === 'minecraft') {
            bgColor = '#c6c6c6';
            borderColor = '#373737';
            textColor = [55, 55, 55];
          } else if (theme === 'undertale') {
            bgColor = '#000000';
            borderColor = '#ffffff';
            textColor = [255, 255, 255];
          } else if (theme === 'god-of-war') {
            bgColor = '#1a1a1a';
            borderColor = '#ffd700';
            textColor = [255, 215, 0];
          } else if (theme === 'cuphead' || theme === 'comic') {
            bgColor = '#f5f5dc';
            borderColor = '#000000';
            textColor = [0, 0, 0];
          } else {
            bgColor = groupColor ? getShade(groupColor, 0.92) : '#fffbeb';
            borderColor = groupColor || '#facc15';
          }
        }

        const isArInfo = type.startsWith('AR_');
        const align = isArInfo ? 'right' : 'left';
        const tempDoc = new jsPDF();
        
        // Ensure tempDoc has the same font settings for accurate height calculation
        if (customFont) {
          try {
            const base64 = customFont.data.split(',')[1];
            tempDoc.addFileToVFS(customFont.fileName, base64);
            tempDoc.addFont(customFont.fileName, customFont.name, 'normal');
            tempDoc.setFont(customFont.name);
          } catch (e) {}
        }

        const infoPadding = 8; // Slightly reduced padding for a tighter look
        const iconSize = 5;
        const textHeight = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (infoPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        const height = textHeight + (infoPadding * 2) + 4; // Added extra buffer for fitting
        
        checkPageBreak(height + 5);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern' || theme === 'prism') {
          // Subtle shadow for modern/prism
          doc.setFillColor(0, 0, 0, 0.02);
          doc.roundedRect(currentX + 0.5, yPos + 0.5, currentMaxWidth, height, 1.5, 1.5, 'F');
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 1.5, 1.5, 'F');
        } else if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.rect(currentX, yPos, currentMaxWidth, height, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          if (type === 'TIP' || type === 'AR_TIP') {
            doc.setLineDashPattern([2, 2], 0);
            doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'S');
            doc.setLineDashPattern([], 0);
          } else if (type === 'WARNING' || type === 'AR_WARNING') {
            doc.rect(currentX, yPos, currentMaxWidth, height, 'S');
            doc.rect(currentX - 1, yPos - 1, currentMaxWidth + 2, height + 2, 'S');
          } else {
            doc.rect(currentX, yPos, currentMaxWidth, height, 'S');
            doc.setFillColor(0, 0, 0);
            doc.rect(currentX + currentMaxWidth, yPos + 2, 2, height, 'F');
            doc.rect(currentX + 2, yPos + height, currentMaxWidth, 2, 'F');
          }
        } else {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'F');
          
          if (type === 'WARNING' || type === 'AR_WARNING') {
            doc.setDrawColor(...hexToRgb(borderColor));
            doc.setLineWidth(0.5);
            doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'S');
          } else if (type === 'TIP' || type === 'AR_TIP') {
            doc.setDrawColor(...hexToRgb(borderColor));
            doc.setLineWidth(0.3);
            doc.setLineDashPattern([1, 1], 0);
            doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'S');
            doc.setLineDashPattern([], 0);
          }
        }

        // Type Badge for Info boxes - Make it more subtle like the user's image
        doc.setFontSize(fontSize - 4.5);
        if (theme === 'modern' || theme === 'prism' || theme === 'ethereal') {
          doc.setTextColor(150, 150, 150); // Subtle gray
        } else {
          doc.setTextColor(...hexToRgb(borderColor));
        }
        doc.setFont('helvetica', 'bold');
        const badgeText = isArInfo ? (type === 'AR_TIP' ? 'نصيحة' : (type === 'AR_WARNING' ? 'تحذير' : 'هام')) : type.toUpperCase();
        const badgeWidth = doc.getTextWidth(badgeText);
        
        if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isArInfo ? currentX + 2 : currentX + currentMaxWidth - badgeWidth - 6, yPos - 3, badgeWidth + 4, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(badgeText, isArInfo ? currentX + 4 : currentX + currentMaxWidth - badgeWidth - 4, yPos + 1.5);
        } else {
          doc.text(badgeText, isArInfo ? currentX + 6 : currentX + currentMaxWidth - badgeWidth - 6, yPos + 5);
        }
        doc.setFontSize(fontSize);

        if (theme !== 'comic') {
          doc.setFillColor(...hexToRgb(borderColor));
          if (type === 'IMPORTANT' || type === 'AR_IMPORTANT') {
            doc.rect(currentX, yPos, 2.5, height, 'F');
          } else {
            doc.rect(currentX, yPos, 1.8, height, 'F');
          }
        }
        
        if (!isArInfo) {
          drawVectorIcon(doc, type, currentX + infoPadding, yPos + infoPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + infoPadding + iconSize + 4, yPos + infoPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (infoPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, type, currentX + currentMaxWidth - infoPadding - iconSize, yPos + infoPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + infoPadding, yPos + infoPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (infoPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        }
        
        if (theme === 'cyberpunk') {
          doc.rect(currentX + currentMaxWidth - 1.5, yPos, 1.5, height, 'F');
        } else if (theme === 'prism') {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'D');
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.1);
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'D');
          
          // Prism accent
          let accentColor: [number, number, number] = [99, 102, 241];
          if (type === 'TIP') accentColor = [16, 185, 129];
          else if (type === 'WARNING') accentColor = [239, 68, 68];
          
          doc.setFillColor(...accentColor);
          doc.rect(currentX, yPos + 2, 1.5, height - 4, 'F');
        }
        
        yPos += height + 5;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'DEFINITION':
      case 'AR_DEFINITION': {
        const fontSize = baseTextSize - 1;
        const colonIndex = content.indexOf(':');
        const term = colonIndex !== -1 ? content.substring(0, colonIndex).trim() : content;
        const definition = colonIndex !== -1 ? content.substring(colonIndex + 1).trim() : '';
        
        const richContent = colonIndex !== -1 ? `**${term}:** ${definition}` : `**${term}**`;
        
        let bgColor = getShade(groupColor, 0.98);
        let borderColor = getShade(groupColor, 0.85);
        let textColor = currentTheme.text;

        if (theme === 'cyberpunk') {
          bgColor = '#0a0a0f';
          borderColor = '#06b6d4';
          textColor = [6, 182, 212];
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          textColor = [34, 197, 94];
        } else if (theme === 'ethereal') {
          bgColor = '#f5f3ff';
          borderColor = '#6366f1';
          textColor = [49, 46, 129];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          textColor = [74, 55, 40];
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          borderColor = '#e2e8f0';
          textColor = [15, 23, 42];
        } else if (theme === 'minecraft') {
          bgColor = '#c6c6c6';
          borderColor = '#373737';
          textColor = [55, 55, 55];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          borderColor = '#ffffff';
          textColor = [255, 255, 255];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          textColor = [203, 213, 225];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          textColor = [0, 0, 0];
        }

        const isArDef = type === 'AR_DEFINITION';
        const align = isArDef ? 'right' : 'left';
        
        const defPadding = 8;
        const iconSize = 5;
        const tempDoc = new jsPDF();
        
        if (customFont) {
          try {
            const base64 = customFont.data.split(',')[1];
            tempDoc.addFileToVFS(customFont.fileName, base64);
            tempDoc.addFont(customFont.fileName, customFont.name, 'normal');
            tempDoc.setFont(customFont.name);
          } catch (e) {}
        }

        const height = drawRichText(tempDoc, richContent, 0, 0, currentMaxWidth - (defPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        const boxHeight = height + (defPadding * 2) + 4;
        
        checkPageBreak(boxHeight + 4);

        if (floatingArea && yPos + boxHeight > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        doc.setDrawColor(...hexToRgb(borderColor));
        
        if (theme === 'modern' || theme === 'prism') {
          // Subtle shadow for modern/prism
          doc.setFillColor(0, 0, 0, 0.03);
          doc.roundedRect(currentX + 1, yPos + 1, currentMaxWidth, boxHeight, 2, 2, 'F');
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 2, 2, 'FD');
          
          if (theme === 'prism') {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.1);
            doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 3, 3, 'D');
            
            // Prism gradient bar
            doc.setFillColor(99, 102, 241); // indigo-500
            doc.rect(isArDef ? currentX + currentMaxWidth - 1.5 : currentX, yPos + 2, 1.5, boxHeight - 4, 'F');
          }
        } else if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX - 2, yPos + 2, 2, boxHeight, 'F');
          doc.rect(currentX, yPos + boxHeight, currentMaxWidth, 2, 'F');
        } else if (theme === 'cyberpunk') {
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'FD');
          doc.setFillColor(6, 182, 212);
          doc.rect(isArDef ? currentX + currentMaxWidth - 2 : currentX, yPos, 2, boxHeight, 'F');
        } else if (theme === 'vintage') {
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'FD');
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.1);
          doc.rect(currentX + 1, yPos + 1, currentMaxWidth - 2, boxHeight - 2, 'D');
        } else if (theme === 'minecraft') {
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'FD');
          doc.setDrawColor(85, 85, 85);
          doc.setLineWidth(0.5);
          doc.line(currentX + 1, yPos + boxHeight - 0.5, currentX + currentMaxWidth - 1, yPos + boxHeight - 0.5);
          doc.line(currentX + currentMaxWidth - 0.5, yPos + 1, currentX + currentMaxWidth - 0.5, yPos + boxHeight - 1);
        } else if (theme === 'undertale') {
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'FD');
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'D');
        } else {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 3, 3, 'F');
          doc.setDrawColor(...hexToRgb(borderColor));
          doc.setLineWidth(0.5);
          doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 3, 3, 'S');
          doc.setFillColor(...hexToRgb(borderColor));
          doc.roundedRect(isArDef ? currentX + currentMaxWidth - 2.5 : currentX, yPos, 2.5, boxHeight, 1, 1, 'F');
        }

        // Type Badge for Definition
        doc.setFontSize(fontSize - 4.5);
        if (theme === 'modern' || theme === 'prism' || theme === 'ethereal') {
          doc.setTextColor(150, 150, 150);
        } else {
          doc.setTextColor(...hexToRgb(borderColor));
        }
        doc.setFont('helvetica', 'bold');
        const badgeText = isArDef ? 'تعريف' : (type.startsWith('AR_') ? type.substring(3).toUpperCase() : type.toUpperCase());
        const badgeWidth = doc.getTextWidth(badgeText);
        
        if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isArDef ? currentX + 2 : currentX + currentMaxWidth - badgeWidth - 6, yPos - 3, badgeWidth + 4, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(badgeText, isArDef ? currentX + 4 : currentX + currentMaxWidth - badgeWidth - 4, yPos + 1.5);
        } else {
          doc.text(badgeText, isArDef ? currentX + 6 : currentX + currentMaxWidth - badgeWidth - 6, yPos + 5);
        }
        doc.setFontSize(fontSize);
        
        const fontHeight = fontSize * 0.3527;
        const yOffset = (boxHeight - height) / 2 + fontHeight * 0.7;
        
        if (!isArDef) {
          drawVectorIcon(doc, 'DEFINITION', currentX + defPadding, yPos + (boxHeight - iconSize) / 2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, richContent, currentX + defPadding + iconSize + 4, yPos + yOffset, currentMaxWidth - (defPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'DEFINITION', currentX + currentMaxWidth - defPadding - iconSize, yPos + (boxHeight - iconSize) / 2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, richContent, currentX + defPadding, yPos + yOffset, currentMaxWidth - (defPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        }
        
        yPos += boxHeight + 4;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_CODE':
      case 'CODE': {
        const fontSize = baseTextSize - 2;
        const isArCode = type === 'AR_CODE';
        const align = isArCode ? 'right' : 'left';
        doc.setFontSize(fontSize);
        
        let fontName = 'courier';
        let textColor: [number, number, number] = hexToRgb(getShade(groupColor, 0.9));
        let bgColor = getShade(groupColor, -0.6);

        if (theme === 'cyberpunk') {
          textColor = [6, 182, 212];
          bgColor = '#000000';
        } else if (theme === 'terminal') {
          textColor = [34, 197, 94];
          bgColor = '#000000';
        } else if (theme === 'ethereal') {
          textColor = [49, 46, 129];
          bgColor = '#f8fafc';
          fontName = 'times';
        } else if (theme === 'vintage') {
          textColor = [74, 55, 40];
          bgColor = '#f4f1ea';
          fontName = 'times';
        } else if (theme === 'prism') {
          textColor = [71, 85, 105];
          bgColor = '#f8fafc';
          fontName = 'courier';
        } else if (theme === 'minecraft') {
          textColor = [255, 255, 255];
          bgColor = '#373737';
          fontName = 'courier';
        } else if (theme === 'undertale') {
          textColor = [255, 255, 255];
          bgColor = '#000000';
          fontName = 'courier';
        } else if (theme === 'god-of-war') {
          textColor = [203, 213, 225];
          bgColor = '#1a1a1a';
          fontName = 'times';
        } else if (theme === 'cuphead' || theme === 'comic') {
          textColor = [0, 0, 0];
          bgColor = '#ffffff';
          fontName = 'helvetica';
        }

        doc.setFont(fontName, 'normal');
        const strippedContent = stripMemoryLinks(content.replace(/\[([^\]]+)\]\{([^}]+)\}/g, '$1'));
        const codePadding = 10;
        const lines = doc.splitTextToSize(isArCode ? ArabicShaper.convertArabic(strippedContent) : strippedContent, currentMaxWidth - (codePadding * 2));
        const height = lines.length * (fontSize * 0.3527) * 1.4 + (codePadding * 2);
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern') {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 2, 2, 'F');
        } else {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'F');
        }
        
        if (theme === 'cyberpunk') {
          doc.setDrawColor(6, 182, 212, 0.5);
          doc.setLineWidth(0.2);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
        } else if (theme === 'vintage') {
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.1);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
        } else if (theme === 'prism') {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.1);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
        } else if (theme === 'minecraft') {
          doc.setDrawColor(85, 85, 85);
          doc.setLineWidth(1);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
        } else if (theme === 'undertale') {
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(1);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
        }

        doc.setTextColor(...textColor);
        const iconSize = 4;
        if (isArCode) {
          drawVectorIcon(doc, 'CODE', currentX + 4, yPos + codePadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, textColor);
          doc.text(lines, currentX + currentMaxWidth - codePadding, yPos + codePadding + (fontSize * 0.3527) * 0.7, { lineHeightFactor: 1.4, align: 'right' });
        } else {
          drawVectorIcon(doc, 'CODE', currentX + currentMaxWidth - iconSize - 4, yPos + codePadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, textColor);
          doc.text(lines, currentX + codePadding, yPos + codePadding + (fontSize * 0.3527) * 0.7, { lineHeightFactor: 1.4 });
        }
        yPos += height + 4;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_QUOTE':
      case 'QUOTE': {
        const fontSize = baseTextSize - 1;
        const isAr = type === 'AR_QUOTE';
        const align = isAr ? 'right' : 'left';
        doc.setFontSize(fontSize);
        
        let bgColor = getShade(groupColor, 0.95);
        let barColor = hexToRgb(groupColor);
        let textColor: [number, number, number] = [71, 85, 105];

        if (theme === 'cyberpunk') {
          bgColor = '#1a0a1e'; // purple-900/10
          barColor = [168, 85, 247];
          textColor = [232, 121, 249]; // purple-200
        } else if (theme === 'terminal') {
          bgColor = '#22c55e';
          barColor = [0, 0, 0];
          textColor = [0, 0, 0];
        } else if (theme === 'ethereal') {
          bgColor = '#ffffff';
          barColor = [99, 102, 241];
          textColor = [49, 46, 129];
        } else if (theme === 'minecraft') {
          bgColor = '#c6c6c6';
          barColor = [55, 55, 55];
          textColor = [55, 55, 55];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          barColor = [255, 255, 255];
          textColor = [255, 255, 255];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          barColor = [139, 0, 0];
          textColor = [203, 213, 225];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          barColor = [0, 0, 0];
          textColor = [0, 0, 0];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          barColor = [139, 69, 19];
          textColor = [93, 64, 55];
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          barColor = [168, 85, 247]; // purple-500
          textColor = [71, 85, 105];
        } else if (theme === 'modern') {
          bgColor = groupColor ? getShade(groupColor, 0.98) : '#f8fafc';
          barColor = hexToRgb(groupColor ? getShade(groupColor, 0.9) : '#e2e8f0');
        }

        const iconSize = 6;
        const tempDoc = new jsPDF();
        const quotePadding = 10;
        const textHeight = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (quotePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'italic', textColor, theme, customFont);
        const height = textHeight + (quotePadding * 2);
        
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern') {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 2, 2, 'F');
        } else if (theme === 'comic') {
          doc.rect(currentX, yPos, currentMaxWidth, height, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX + 2, yPos + height, currentMaxWidth, 2, 'F');
          doc.rect(currentX + currentMaxWidth, yPos + 2, 2, height, 'F');
        } else {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'F');
        }
        
        if (theme !== 'comic') {
          doc.setFillColor(...barColor);
          doc.rect(isAr ? currentX + currentMaxWidth - 3 : currentX + 2, yPos, 1, height, 'F');
        }
        
        if (theme === 'vintage') {
          doc.setDrawColor(139, 69, 19);
          doc.setLineWidth(0.2);
          doc.line(currentX, yPos, currentX + currentMaxWidth, yPos);
          doc.line(currentX, yPos + height, currentX + currentMaxWidth, yPos + height);
          doc.line(isAr ? currentX : currentX + currentMaxWidth, yPos, isAr ? currentX : currentX + currentMaxWidth, yPos + height);
        }

        if (!isAr) {
          drawVectorIcon(doc, 'QUOTE', currentX + quotePadding, yPos + quotePadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : barColor);
          drawRichText(doc, content, currentX + quotePadding + iconSize + 4, yPos + quotePadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (quotePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'italic', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'QUOTE', currentX + currentMaxWidth - quotePadding - iconSize, yPos + quotePadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : barColor);
          drawRichText(doc, content, currentX + quotePadding, yPos + quotePadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (quotePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'italic', textColor, theme, customFont);
        }
        yPos += height + 4;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_CHECKLIST':
      case 'CHECKLIST': {
        const fontSize = baseTextSize;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        doc.setFontSize(fontSize);
        doc.setTextColor(...currentTheme.text);
        
        const tempDoc = new jsPDF();
        const checklistPadding = 5; // Indentation for checklist
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - checklistPadding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        
        checkPageBreak(height + 2);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        const iconSize = 4;
        const iconColor = currentTheme.accent;
        
        if (!isAr) {
          doc.setDrawColor(...iconColor);
          doc.setLineWidth(0.3);
          doc.roundedRect(currentX - 1, yPos, iconSize + 2, iconSize + 2, 0.5, 0.5, 'S');
          drawVectorIcon(doc, 'CHECK', currentX, yPos + 1, iconSize, iconColor);
          drawRichText(doc, content, currentX + checklistPadding + 4, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - checklistPadding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        } else {
          doc.setDrawColor(...iconColor);
          doc.setLineWidth(0.3);
          doc.roundedRect(currentX + currentMaxWidth - iconSize - 1, yPos, iconSize + 2, iconSize + 2, 0.5, 0.5, 'S');
          drawVectorIcon(doc, 'CHECK', currentX + currentMaxWidth - iconSize, yPos + 1, iconSize, iconColor);
          drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - checklistPadding - 4, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        }
        
        yPos += height + 2;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'EXAMPLE':
      case 'AR_EXAMPLE': {
        const fontSize = baseTextSize - 1;
        doc.setFontSize(fontSize);
        const examplePadding = 10;
        
        let bgColor = getShade(groupColor, 0.98);
        let barColor: [number, number, number] = hexToRgb(groupColor);
        let textColor: [number, number, number] = [71, 85, 105];
        let labelColor: [number, number, number] = hexToRgb(getShade(groupColor, -0.4));

        if (theme === 'cyberpunk') {
          bgColor = '#061a10'; // emerald-950/10
          barColor = [16, 185, 129];
          textColor = [209, 250, 229]; // emerald-50
          labelColor = [52, 211, 153]; // emerald-400
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          barColor = [245, 158, 11];
          textColor = [245, 158, 11];
          labelColor = [245, 158, 11];
        } else if (theme === 'ethereal') {
          bgColor = '#fffbeb';
          barColor = [251, 191, 36];
          textColor = [120, 53, 15];
          labelColor = [180, 83, 9];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          barColor = [212, 197, 161];
          textColor = [93, 64, 55];
          labelColor = [139, 69, 19];
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          barColor = [99, 102, 241];
          textColor = [71, 85, 105];
          labelColor = [79, 70, 229];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          barColor = [255, 215, 0];
          textColor = [203, 213, 225];
          labelColor = [255, 215, 0];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          barColor = [0, 0, 0];
          textColor = [0, 0, 0];
          labelColor = [0, 0, 0];
        } else if (theme === 'modern') {
          bgColor = groupColor ? getShade(groupColor, 0.98) : '#f8fafc';
          barColor = hexToRgb(groupColor ? getShade(groupColor, 0.9) : '#e2e8f0');
        }

        const isArEx = type === 'AR_EXAMPLE';
        const align = isArEx ? 'right' : 'left';
        
        const iconSize = 6;
        const tempDoc = new jsPDF();
        const textHeight = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (examplePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme);
        const height = textHeight + (examplePadding * 2) + 5;
        
        checkPageBreak(height + 5);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern') {
          doc.setDrawColor(...barColor);
          doc.setLineWidth(0.1);
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 2, 2, 'FD');
        } else if (theme === 'comic') {
          doc.rect(currentX, yPos, currentMaxWidth, height, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX + 2, yPos + height, currentMaxWidth, 2, 'F');
          doc.rect(currentX + currentMaxWidth, yPos + 2, 2, height, 'F');
        } else {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 3, 3, 'F');
          doc.setFillColor(...barColor);
          doc.roundedRect(isArEx ? currentX + currentMaxWidth - 1.5 : currentX, yPos, 1.5, height, 1, 1, 'F');
        }
        
        if (theme === 'vintage') {
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.2);
          doc.setLineDashPattern([2, 2], 0);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'D');
          doc.setLineDashPattern([], 0);
        }

        doc.setFontSize(8);
        doc.setTextColor(...labelColor);
        
        const labelText = isArEx ? 'مثال' : 'EXAMPLE';
        if (isArEx) {
          const fontList = doc.getFontList();
          if (fontList['Amiri']) {
            doc.setFont('Amiri', 'bold');
          } else if (customFont) {
            doc.setFont(customFont.name, 'bold');
          }
        } else {
          doc.setFont(theme === 'vintage' ? 'times' : (theme === 'cyberpunk' ? 'courier' : 'helvetica'), 'bold');
        }
        
        const labelWidth = doc.getTextWidth(isArEx ? ArabicShaper.convertArabic('مثال') : 'EXAMPLE');
        
        if (theme === 'comic') {
          doc.setFillColor(...barColor);
          doc.rect(isArEx ? currentX + currentMaxWidth - examplePadding - 5 - labelWidth - 2 : currentX + examplePadding + iconSize + 2, yPos + 1, labelWidth + 4, 5, 'F');
          doc.setTextColor(255, 255, 255);
          drawRichText(doc, labelText, isArEx ? currentX + currentMaxWidth - examplePadding - 5 - labelWidth : currentX + examplePadding + iconSize + 4, yPos + 4, labelWidth + 5, 8, 1.2, isArEx ? 'right' : 'left', groupColor, 'bold', [255,255,255], theme, customFont);
        } else {
          drawRichText(doc, labelText, isArEx ? currentX + currentMaxWidth - examplePadding - 5 - labelWidth : currentX + examplePadding + iconSize + 4, yPos + 4, labelWidth + 5, 8, 1.2, isArEx ? 'right' : 'left', groupColor, 'bold', labelColor as [number, number, number], theme, customFont);
        }
        
        if (!isArEx) {
          drawVectorIcon(doc, 'TIP', currentX + examplePadding, yPos + 4 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : labelColor as [number, number, number]);
          drawRichText(doc, content, currentX + examplePadding + iconSize + 4, yPos + examplePadding + 7, currentMaxWidth - (examplePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'TIP', currentX + currentMaxWidth - examplePadding - iconSize, yPos + 4 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : labelColor as [number, number, number]);
          drawRichText(doc, content, currentX + examplePadding, yPos + examplePadding + 7, currentMaxWidth - (examplePadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        }
        yPos += height + 5;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_FORMULA':
      case 'FORMULA': {
        const fontSize = baseTextSize + 2;
        const isAr = type === 'AR_FORMULA';
        const align = isAr ? 'right' : 'center';
        doc.setFontSize(fontSize);
        const formulaPadding = 10;
        
        let bgColor = getShade(groupColor, 0.98);
        let borderColor = groupColor;
        let textColor: [number, number, number] = [30, 41, 59];

        if (theme === 'cyberpunk') {
          bgColor = '#0a0a0f';
          borderColor = '#06b6d4';
          textColor = [6, 182, 212];
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          textColor = [34, 197, 94];
        } else if (theme === 'ethereal') {
          bgColor = '#f5f3ff';
          borderColor = '#6366f1';
          textColor = [49, 46, 129];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          textColor = [74, 55, 40];
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          borderColor = '#e2e8f0';
          textColor = [15, 23, 42];
        } else if (theme === 'minecraft') {
          bgColor = '#c6c6c6';
          borderColor = '#373737';
          textColor = [55, 55, 55];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          borderColor = '#ffffff';
          textColor = [255, 255, 255];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          textColor = [255, 215, 0];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          textColor = [0, 0, 0];
        } else if (theme === 'modern') {
          bgColor = groupColor ? getShade(groupColor, 0.96) : '#eff6ff';
          borderColor = groupColor ? getShade(groupColor, 0.9) : '#dbeafe';
        }

        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - 20 - (formulaPadding * 2), fontSize, 1.4, align, groupColor, 'normal', textColor, theme, customFont);
        const boxHeight = height + (formulaPadding * 2);
        
        checkPageBreak(boxHeight + 6);

        if (floatingArea && yPos + boxHeight > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        doc.setDrawColor(...hexToRgb(borderColor));
        
        if (theme === 'modern' || theme === 'prism') {
          // Subtle shadow
          doc.setFillColor(0, 0, 0, 0.03);
          doc.roundedRect(currentX + 11, yPos + 1, currentMaxWidth - 20, boxHeight, 2, 2, 'F');
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX + 10, yPos, currentMaxWidth - 20, boxHeight, 2, 2, 'FD');
        } else if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.rect(currentX + 10, yPos, currentMaxWidth - 20, boxHeight, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX + 10, yPos, currentMaxWidth - 20, boxHeight, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX + 12, yPos + boxHeight, currentMaxWidth - 20, 2, 'F');
          doc.rect(currentX + 10 + currentMaxWidth - 20, yPos + 2, 2, boxHeight, 'F');
        } else {
          doc.roundedRect(currentX + 10, yPos, currentMaxWidth - 20, boxHeight, 3, 3, 'FD');
        }

        if (theme === 'prism') {
          doc.setDrawColor(79, 70, 229);
          doc.setLineWidth(0.5);
          doc.line(currentX + 15, yPos, currentX + currentMaxWidth - 15, yPos);
          doc.line(currentX + 15, yPos + boxHeight, currentX + currentMaxWidth - 15, yPos + boxHeight);
        }

        const iconSize = 6;
        if (!isAr) {
          drawVectorIcon(doc, 'FORMULA', currentX + 10 + formulaPadding, yPos + formulaPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + 10 + formulaPadding + iconSize + 4, yPos + formulaPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - 20 - (formulaPadding * 2) - iconSize - 4, fontSize, 1.4, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'FORMULA', currentX + currentMaxWidth - 10 - formulaPadding - iconSize, yPos + formulaPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + 10 + formulaPadding, yPos + formulaPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - 20 - (formulaPadding * 2) - iconSize - 4, fontSize, 1.4, align, groupColor, 'normal', textColor, theme, customFont);
        }
        
        yPos += boxHeight + 6;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        lastType = type;
        break;
      }
      case 'EXPLANATION':
      case 'AR_EXPLANATION':
      case 'AR_SIMPLIFY': {
        const fontSize = baseTextSize;
        const textColor = currentTheme.text;
        
        let themeFont = currentFontName;
        if (theme === 'cyberpunk' && currentFontName === 'helvetica') themeFont = 'courier';
        if (theme === 'vintage' && currentFontName === 'helvetica') themeFont = 'times';
        if (theme === 'terminal' && currentFontName === 'helvetica') themeFont = 'courier';
        if (theme === 'ethereal' && currentFontName === 'helvetica') themeFont = 'times';
        if (theme === 'prism' && currentFontName === 'helvetica') themeFont = 'helvetica';
        if (theme === 'minecraft' && currentFontName === 'helvetica') themeFont = 'courier';
        if (theme === 'undertale' && currentFontName === 'helvetica') themeFont = 'courier';
        if (theme === 'god-of-war' && currentFontName === 'helvetica') themeFont = 'times';
        if ((theme === 'cuphead' || theme === 'comic') && currentFontName === 'helvetica') themeFont = 'helvetica';

        const isArExp = type === 'AR_EXPLANATION' || type === 'AR_SIMPLIFY';
        const align = isArExp ? 'right' : 'left';
        const tempDoc = new jsPDF();
        
        const expPadding = 6;
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - expPadding, fontSize, 1.5, align, groupColor, 'normal', textColor, theme);
        
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        // Draw subtle border
        doc.setDrawColor(...hexToRgb(getShade(groupColor, 0.7)));
        doc.setLineWidth(0.5);
        if (isArExp) {
          doc.line(currentX + currentMaxWidth, yPos, currentX + currentMaxWidth, yPos + height);
        } else {
          doc.line(currentX, yPos, currentX, yPos + height);
        }

        drawRichText(doc, content, isArExp ? currentX : currentX + expPadding, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - expPadding, fontSize, 1.5, align, groupColor, 'normal', textColor, theme);
        yPos += height + 6;

        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_CALLOUT':
      case 'CALLOUT': {
        const fontSize = baseTextSize - 1;
        const isAr = type === 'AR_CALLOUT';
        const align = isAr ? 'right' : 'left';
        doc.setFontSize(fontSize);
        const calloutPadding = 10; // Increased padding for premium feel
        
        let bgColor = getShade(groupColor, 0.95);
        let borderColor = getShade(groupColor, 0.8);
        let textColor: [number, number, number] = [30, 41, 59];
        let labelColor: [number, number, number] = hexToRgb(groupColor);

        if (theme === 'cyberpunk') {
          bgColor = '#1a0a2e'; // purple-950/20
          borderColor = '#a855f7';
          textColor = [243, 232, 255]; // purple-100
          labelColor = [168, 85, 247];
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          textColor = [34, 197, 94];
          labelColor = [34, 197, 94];
        } else if (theme === 'ethereal') {
          bgColor = '#f5f3ff';
          borderColor = '#6366f1';
          textColor = [49, 46, 129];
          labelColor = [99, 102, 241];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          textColor = [74, 55, 40];
          labelColor = [93, 64, 55];
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          borderColor = '#e2e8f0';
          textColor = [15, 23, 42];
          labelColor = [99, 102, 241];
        } else if (theme === 'minecraft') {
          bgColor = '#c6c6c6';
          borderColor = '#373737';
          textColor = [55, 55, 55];
          labelColor = [85, 85, 85];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          borderColor = '#ffffff';
          textColor = [255, 255, 255];
          labelColor = [255, 255, 255];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          textColor = [203, 213, 225];
          labelColor = [255, 215, 0];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          textColor = [0, 0, 0];
          labelColor = [0, 0, 0];
        } else if (theme === 'modern') {
          bgColor = groupColor ? getShade(groupColor, 0.92) : '#faf5ff';
          borderColor = groupColor || '#a855f7';
        }

        const iconSize = 6;
        const tempDoc = new jsPDF();
        const textHeight = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (calloutPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme);
        const height = textHeight + (calloutPadding * 2) + 7;
        
        checkPageBreak(height + 5);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern') {
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, 2, 2, 'F');
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isAr ? currentX + currentMaxWidth - 1.5 : currentX, yPos, 1.5, height, 'F');
        } else if (theme === 'comic') {
          doc.rect(currentX, yPos, currentMaxWidth, height, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, height, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX + 2, yPos + height, currentMaxWidth, 2, 'F');
          doc.rect(currentX + currentMaxWidth, yPos + 2, 2, height, 'F');
        } else {
          doc.setDrawColor(...hexToRgb(borderColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, height, theme === 'ethereal' ? 2 : 3, theme === 'ethereal' ? 2 : 3, 'FD');
        }
        
        if (theme === 'cyberpunk') {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isAr ? currentX : currentX + currentMaxWidth - 1.5, yPos, 1.5, height, 'F');
        } else if (theme === 'prism') {
          // Prism vertical gradient simulation
          doc.setFillColor(99, 102, 241); // indigo
          doc.rect(isAr ? currentX + currentMaxWidth - 1.5 : currentX, yPos, 1.5, height / 3, 'F');
          doc.setFillColor(168, 85, 247); // purple
          doc.rect(isAr ? currentX + currentMaxWidth - 1.5 : currentX, yPos + height / 3, 1.5, height / 3, 'F');
          doc.setFillColor(236, 72, 153); // pink
          doc.rect(isAr ? currentX + currentMaxWidth - 1.5 : currentX, yPos + (2 * height) / 3, 1.5, height / 3, 'F');
        }

        doc.setFontSize(8);
        doc.setTextColor(...labelColor);
        doc.setFont(theme === 'vintage' ? 'times' : (theme === 'cyberpunk' ? 'courier' : 'helvetica'), 'bold');
        
        const label = isAr ? 'ملاحظة' : 'NOTE';
        const labelWidth = doc.getTextWidth(isAr ? ArabicShaper.convertArabic('ملاحظة') : 'NOTE');
        
        if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isAr ? currentX + currentMaxWidth - calloutPadding - 5 - labelWidth - 2 : currentX + calloutPadding + iconSize + 2, yPos + 1, labelWidth + 4, 5, 'F');
          doc.setTextColor(255, 255, 255);
          drawRichText(doc, label, isAr ? currentX + currentMaxWidth - calloutPadding - 5 - labelWidth : currentX + calloutPadding + iconSize + 4, yPos + 4, labelWidth + 5, 8, 1.2, isAr ? 'right' : 'left', groupColor, 'bold', [255,255,255], theme, customFont);
        } else {
          if (!isAr) {
            doc.text(label, currentX + calloutPadding + iconSize + 4, yPos + calloutPadding);
          } else {
            doc.text(label, currentX + currentMaxWidth - calloutPadding - iconSize - 4 - labelWidth, yPos + calloutPadding);
          }
        }
        
        if (!isAr) {
          drawVectorIcon(doc, 'CALLOUT', currentX + calloutPadding, yPos + (theme === 'comic' ? 4 : calloutPadding) - iconSize/2 - 1, iconSize, theme === 'comic' ? [0,0,0] : labelColor);
          drawRichText(doc, content, currentX + calloutPadding + iconSize + 4, yPos + calloutPadding + 7, currentMaxWidth - (calloutPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'CALLOUT', currentX + currentMaxWidth - calloutPadding - iconSize, yPos + (theme === 'comic' ? 4 : calloutPadding) - iconSize/2 - 1, iconSize, theme === 'comic' ? [0,0,0] : labelColor);
          drawRichText(doc, content, currentX + calloutPadding, yPos + calloutPadding + 7, currentMaxWidth - (calloutPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        }
        yPos += height + 5;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'CONCEPT':
      case 'MNEMONIC':
      case 'KEY_POINT':
      case 'AR_KEY_POINT':
      case 'AR_CONCEPT':
      case 'AR_MNEMONIC':
      case 'AR_SUMMARY':
      case 'SUMMARY': {
        const fontSize = baseTextSize;
        doc.setFontSize(fontSize);
        const kpPadding = 10;
        
        let bgColor = getShade(groupColor, 0.92);
        let borderColor = groupColor;
        let textColor: [number, number, number] = [30, 41, 59];

        if (type === 'CONCEPT' || type === 'AR_CONCEPT') {
          bgColor = groupColor ? getShade(groupColor, 0.92) : '#f0f9ff';
          borderColor = groupColor || '#3b82f6';
        } else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') {
          bgColor = groupColor ? getShade(groupColor, 0.92) : '#eef2ff';
          borderColor = groupColor || '#6366f1';
        } else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') {
          bgColor = groupColor ? getShade(groupColor, 0.92) : '#fffbeb';
          borderColor = groupColor || '#f59e0b';
        } else if (type === 'SUMMARY' || type === 'AR_SUMMARY') {
          bgColor = groupColor ? getShade(groupColor, 0.92) : '#f8fafc';
          borderColor = groupColor || '#64748b';
        }

        if (theme === 'cyberpunk') {
          textColor = [255, 255, 255];
          if (type === 'CONCEPT' || type === 'AR_CONCEPT') {
            bgColor = '#082f49'; // cyan-950
            borderColor = '#06b6d4';
            textColor = [164, 245, 255];
          } else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') {
            bgColor = '#1e1b4b'; // indigo-950
            borderColor = '#6366f1';
            textColor = [224, 231, 255];
          } else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') {
            bgColor = '#451a03'; // amber-950
            borderColor = '#f59e0b';
            textColor = [254, 243, 199];
          } else if (type === 'SUMMARY' || type === 'AR_SUMMARY') {
            bgColor = '#0f172a'; // slate-900
            borderColor = '#64748b';
            textColor = [241, 245, 249];
          }
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          textColor = [34, 197, 94];
        } else if (theme === 'ethereal') {
          textColor = [49, 46, 129];
          if (type === 'CONCEPT' || type === 'AR_CONCEPT') {
            bgColor = '#f0f9ff';
            borderColor = '#0ea5e9';
          } else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') {
            bgColor = '#eef2ff';
            borderColor = '#6366f1';
          } else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') {
            bgColor = '#fffbeb';
            borderColor = '#f59e0b';
          } else if (type === 'SUMMARY' || type === 'AR_SUMMARY') {
            bgColor = '#f8fafc';
            borderColor = '#64748b';
          }
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          textColor = [74, 55, 40];
          
          if (type === 'CONCEPT' || type === 'AR_CONCEPT') bgColor = '#f0f7ff';
          else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') bgColor = '#f5f3ff';
          else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') bgColor = '#fffbeb';
          else if (type === 'SUMMARY' || type === 'AR_SUMMARY') bgColor = '#f8fafc';
        } else if (theme === 'prism') {
          bgColor = '#ffffff';
          borderColor = '#e2e8f0';
          textColor = [15, 23, 42];
          
          if (type === 'CONCEPT' || type === 'AR_CONCEPT') borderColor = '#0ea5e9';
          else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') borderColor = '#6366f1';
          else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') borderColor = '#f59e0b';
          else if (type === 'SUMMARY' || type === 'AR_SUMMARY') borderColor = '#64748b';
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          textColor = [203, 213, 225];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          textColor = [0, 0, 0];
        }

        const isArKp = type.startsWith('AR_');
        const align = isArKp ? 'right' : 'left';
        
        const iconSize = 6;
        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (kpPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        const boxHeight = height + (kpPadding * 2);
        
        checkPageBreak(boxHeight + 5);

        if (floatingArea && yPos + boxHeight > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        doc.setFillColor(...hexToRgb(bgColor));
        if (theme === 'modern' || theme === 'prism') {
          // Subtle shadow for modern/prism
          doc.setFillColor(0, 0, 0, 0.03);
          doc.roundedRect(currentX + 1, yPos + 1, currentMaxWidth, boxHeight, 2, 2, 'F');
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 2, 2, 'F');
        } else if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(currentX, yPos, currentMaxWidth, boxHeight, 'S');
          doc.setFillColor(0, 0, 0);
          doc.rect(currentX + currentMaxWidth, yPos + 2, 2, boxHeight, 'F');
          doc.rect(currentX + 2, yPos + boxHeight, currentMaxWidth, 2, 'F');
        } else {
          doc.setFillColor(...hexToRgb(bgColor));
          doc.roundedRect(currentX, yPos, currentMaxWidth, boxHeight, 3, 3, 'F');
          
          doc.setDrawColor(...hexToRgb(borderColor));
          if (type === 'CONCEPT' || type === 'AR_CONCEPT') {
            doc.setLineWidth(1);
            doc.line(currentX + 3, yPos, currentX + currentMaxWidth - 3, yPos);
          } else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') {
            doc.setLineWidth(0.5);
            doc.line(currentX, yPos + 3, currentX, yPos + boxHeight - 3);
            doc.line(currentX + currentMaxWidth, yPos + 3, currentX + currentMaxWidth, yPos + boxHeight - 3);
          } else if (type === 'SUMMARY' || type === 'AR_SUMMARY') {
            doc.setLineWidth(1);
            doc.line(currentX + 3, yPos + boxHeight, currentX + currentMaxWidth - 3, yPos + boxHeight);
          }
        }

        if (theme === 'prism') {
          // Prism vertical gradient simulation
          doc.setFillColor(99, 102, 241); // indigo
          doc.rect(isArKp ? currentX + currentMaxWidth - 1.5 : currentX, yPos, 1.5, boxHeight / 3, 'F');
          doc.setFillColor(168, 85, 247); // purple
          doc.rect(isArKp ? currentX + currentMaxWidth - 1.5 : currentX, yPos + boxHeight / 3, 1.5, boxHeight / 3, 'F');
          doc.setFillColor(236, 72, 153); // pink
          doc.rect(isArKp ? currentX + currentMaxWidth - 1.5 : currentX, yPos + (2 * boxHeight) / 3, 1.5, boxHeight / 3, 'F');
        } else if (theme !== 'comic' && (type === 'KEY_POINT' || type === 'AR_KEY_POINT')) {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isArKp ? currentX + currentMaxWidth - 1.5 : currentX, yPos, 1.5, boxHeight, 'F');
        }

        // Type Badge
        doc.setFontSize(fontSize - 4);
        doc.setTextColor(...hexToRgb(borderColor));
        doc.setFont('helvetica', 'bold');
        const badgeText = type.startsWith('AR_') ? (type === 'AR_CONCEPT' ? 'مفهوم' : (type === 'AR_MNEMONIC' ? 'تذكير' : (type === 'AR_KEY_POINT' ? 'نقطة_رئيسية' : 'ملخص'))) : type.toUpperCase();
        const badgeWidth = doc.getTextWidth(badgeText);
        
        if (theme === 'comic') {
          doc.setFillColor(...hexToRgb(borderColor));
          doc.rect(isArKp ? currentX + 2 : currentX + currentMaxWidth - badgeWidth - 6, yPos - 3, badgeWidth + 4, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(badgeText, isArKp ? currentX + 4 : currentX + currentMaxWidth - badgeWidth - 4, yPos + 1.5);
        } else {
          doc.text(badgeText, isArKp ? currentX + 4 : currentX + currentMaxWidth - badgeWidth - 4, yPos + 4);
        }
        doc.setFontSize(fontSize);
        
        let kpIcon = 'INFO';
        if (type === 'CONCEPT' || type === 'AR_CONCEPT') kpIcon = 'TIP';
        else if (type === 'MNEMONIC' || type === 'AR_MNEMONIC') kpIcon = 'IMPORTANT';
        else if (type === 'KEY_POINT' || type === 'AR_KEY_POINT') kpIcon = 'IMPORTANT';
        else if (type === 'SUMMARY' || type === 'AR_SUMMARY') kpIcon = 'SUMMARY';

        if (!isArKp) {
          drawVectorIcon(doc, kpIcon, currentX + kpPadding, yPos + kpPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + kpPadding + iconSize + 4, yPos + kpPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (kpPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        } else {
          drawVectorIcon(doc, kpIcon, currentX + currentMaxWidth - kpPadding - iconSize, yPos + kpPadding + (fontSize * 0.3527) * 0.7 - iconSize/2, iconSize, theme === 'comic' ? [0,0,0] : hexToRgb(borderColor));
          drawRichText(doc, content, currentX + kpPadding, yPos + kpPadding + (fontSize * 0.3527) * 0.7, currentMaxWidth - (kpPadding * 2) - iconSize - 4, fontSize, 1.2, align, groupColor, 'normal', textColor, theme, customFont);
        }
        yPos += boxHeight + 5;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_STEP':
      case 'STEP': {
        const fontSize = baseTextSize;
        const isAr = type === 'AR_STEP';
        const align = isAr ? 'right' : 'left';
        doc.setFontSize(fontSize);
        doc.setTextColor(...currentTheme.text);
        
        const tempDoc = new jsPDF();
        const stepPadding = 8;
        const iconBoxSize = 6;
        const textXOffset = iconBoxSize + 4;
        
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - textXOffset, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        const iconColor = hexToRgb(groupColor || '#3b82f6');
        const iconY = yPos + (fontSize * 0.3527) * 0.7 - iconBoxSize/2;
        
        if (theme === 'cyberpunk') {
          doc.setFillColor(...iconColor);
          doc.rect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 'F');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [0, 0, 0]);
        } else if (theme === 'terminal') {
          doc.setFillColor(0, 0, 0);
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(0.5);
          doc.rect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 'FD');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [34, 197, 94]);
        } else if (theme === 'ethereal') {
          doc.setFillColor(238, 242, 255);
          doc.circle(isAr ? currentX + currentMaxWidth - iconBoxSize/2 : currentX + iconBoxSize/2, iconY + iconBoxSize/2, iconBoxSize/2, 'F');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize/2 - 1.5 : currentX + iconBoxSize/2 - 1.5, iconY + iconBoxSize/2 - 1.5, 3, [99, 102, 241]);
        } else if (theme === 'vintage') {
          doc.setDrawColor(139, 69, 19);
          doc.setLineWidth(0.5);
          doc.line(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY + iconBoxSize, isAr ? currentX + currentMaxWidth : currentX + iconBoxSize, iconY + iconBoxSize);
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [139, 69, 19]);
        } else if (theme === 'prism') {
          doc.setFillColor(168, 85, 247);
          doc.roundedRect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 1.5, 1.5, 'F');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [255, 255, 255]);
        } else if (theme === 'god-of-war') {
          doc.setFillColor(26, 26, 26);
          doc.setDrawColor(255, 215, 0);
          doc.setLineWidth(0.5);
          doc.rect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 'FD');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [255, 215, 0]);
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1);
          doc.rect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 'FD');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, [0, 0, 0]);
        } else if (theme === 'modern') {
          doc.setFillColor(...hexToRgb(groupColor ? getShade(groupColor, 0.9) : '#f1f5f9'));
          doc.roundedRect(isAr ? currentX + currentMaxWidth - iconBoxSize : currentX, iconY, iconBoxSize, iconBoxSize, 1.5, 1.5, 'F');
          drawVectorIcon(doc, 'STEP', isAr ? currentX + currentMaxWidth - iconBoxSize + 1 : currentX + 1, iconY + 1, 4, hexToRgb(groupColor ? getShade(groupColor, 0.4) : '#475569'));
        } else {
          doc.setFillColor(...iconColor);
          doc.circle(isAr ? currentX + currentMaxWidth - iconBoxSize/2 : currentX + iconBoxSize/2, iconY + iconBoxSize/2, 2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text('>', isAr ? currentX + currentMaxWidth - iconBoxSize/2 - 0.8 : currentX + iconBoxSize/2 - 0.8, iconY + iconBoxSize/2 + 0.8);
        }
        
        if (!isAr) {
          drawRichText(doc, content, currentX + textXOffset, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - textXOffset, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        } else {
          drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth - textXOffset, fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        }
        yPos += height + 4;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'AR_TIMELINE':
      case 'TIMELINE': {
        const fontSize = baseTextSize;
        const isAr = type === 'AR_TIMELINE';
        const align = isAr ? 'right' : 'left';
        const timeAlign = isAr ? 'left' : 'right';
        const pipeIndex = content.indexOf('|');
        const time = pipeIndex !== -1 ? content.substring(0, pipeIndex).trim() : 'Date';
        const event = pipeIndex !== -1 ? content.substring(pipeIndex + 1).trim() : content;
        
        const leftColWidth = 35;
        const rightColWidth = currentMaxWidth - leftColWidth - 5;
        let timeColor = hexToRgb(getShade(groupColor, -0.2));
        if (theme === 'cyberpunk') timeColor = [168, 85, 247]; // purple-500
        if (theme === 'terminal') timeColor = [34, 197, 94];
        if (theme === 'ethereal') timeColor = [99, 102, 241];
        if (theme === 'vintage') timeColor = [139, 69, 19]; // #8b4513
        if (theme === 'prism') timeColor = [79, 70, 229];
        
        const tempDoc = new jsPDF();
        const tlPadding = 10; // Increased padding for premium feel
        const eventHeight = drawRichText(tempDoc, event, 0, 0, rightColWidth - (tlPadding * 2), fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        const timeHeight = drawRichText(tempDoc, time, 0, 0, leftColWidth - 2, fontSize, 1.2, timeAlign, groupColor, 'bold', timeColor, theme, customFont);
        const height = Math.max(eventHeight + (tlPadding * 2), timeHeight, 10);
        
        checkPageBreak(height + 4);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }
        
        // Draw vertical line
        let lineColor = hexToRgb(getShade(groupColor, 0.8));
        if (theme === 'cyberpunk') lineColor = [168, 85, 247]; // purple-500
        if (theme === 'terminal') lineColor = [21, 128, 61]; // green-700
        if (theme === 'ethereal') lineColor = [224, 231, 255]; // indigo-100
        if (theme === 'vintage') lineColor = [212, 197, 161];
        if (theme === 'prism') lineColor = [226, 232, 240];
        if (theme === 'god-of-war') lineColor = [139, 0, 0];
        if (theme === 'cuphead' || theme === 'comic') lineColor = [0, 0, 0];
        
        doc.setDrawColor(...lineColor);
        doc.setLineWidth(0.5);
        const lineX = isAr ? currentX + currentMaxWidth - leftColWidth : currentX + leftColWidth;
        doc.line(lineX, yPos, lineX, yPos + height + 4);
        
        // Draw dot
        doc.setFillColor(...hexToRgb(groupColor || (theme === 'cyberpunk' ? '#a855f7' : (theme === 'terminal' ? '#22c55e' : (theme === 'ethereal' ? '#6366f1' : '#8b4513')))));
        if (theme === 'cyberpunk') {
          doc.rect(lineX - 1.5, yPos + 4, 3, 3, 'F');
          doc.setDrawColor(168, 85, 247);
          doc.setLineWidth(0.2);
          doc.rect(lineX - 1.5, yPos + 4, 3, 3, 'D');
        } else if (theme === 'terminal') {
          doc.rect(lineX - 1.5, yPos + 4, 3, 3, 'F');
          doc.setDrawColor(34, 197, 94);
          doc.setLineWidth(0.2);
          doc.rect(lineX - 1.5, yPos + 4, 3, 3, 'D');
        } else if (theme === 'ethereal') {
          doc.circle(lineX, yPos + 5.5, 2, 'F');
          doc.setDrawColor(199, 210, 254);
          doc.setLineWidth(0.1);
          doc.circle(lineX, yPos + 5.5, 2, 'D');
        } else if (theme === 'vintage') {
          doc.rect(lineX - 1, yPos + 4.5, 2, 2, 'F');
        } else if (theme === 'prism') {
          doc.setFillColor(168, 85, 247);
          doc.roundedRect(lineX - 1.5, yPos + 4, 3, 3, 1, 1, 'F');
        } else if (theme === 'god-of-war') {
          doc.setFillColor(255, 215, 0);
          doc.rect(lineX - 1.5, yPos + 4, 3, 3, 'F');
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setFillColor(255, 255, 255);
          doc.circle(lineX, yPos + 5.5, 2, 'F');
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1);
          doc.circle(lineX, yPos + 5.5, 2, 'D');
        } else if (theme === 'modern') {
          doc.setFillColor(255, 255, 255);
          doc.circle(lineX, yPos + 5.5, 2, 'F');
          doc.setDrawColor(...hexToRgb(groupColor ? getShade(groupColor, 0.4) : '#cbd5e1'));
          doc.setLineWidth(0.6);
          doc.circle(lineX, yPos + 5.5, 2, 'D');
        } else {
          doc.circle(lineX, yPos + 5.5, 1.5, 'F');
        }
        
        if (!isAr) {
          drawRichText(doc, time, currentX, yPos + 5 + (fontSize * 0.3527) * 0.7, leftColWidth - 4, fontSize, 1.2, timeAlign, groupColor, 'bold', timeColor, theme, customFont);
        } else {
          drawRichText(doc, time, currentX + currentMaxWidth - leftColWidth + 4, yPos + 5 + (fontSize * 0.3527) * 0.7, leftColWidth - 4, fontSize, 1.2, timeAlign, groupColor, 'bold', timeColor, theme, customFont);
        }
        
        // Draw event box for themes
        if (theme !== 'modern') {
          let boxBg: [number, number, number] = theme === 'cyberpunk' ? [24, 10, 30] : (theme === 'terminal' ? [0, 0, 0] : (theme === 'ethereal' ? [255, 255, 255] : (theme === 'god-of-war' ? [26, 26, 26] : (theme === 'cuphead' || theme === 'comic' ? [245, 245, 220] : (theme === 'undertale' ? [0, 0, 0] : [253, 251, 247])))));
          doc.setFillColor(...boxBg);
          const boxX = isAr ? currentX : currentX + leftColWidth + 3;
          if (theme === 'vintage') {
            doc.setDrawColor(212, 197, 161);
            doc.setLineWidth(0.1);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'FD');
          } else if (theme === 'terminal') {
            doc.setDrawColor(21, 128, 61);
            doc.setLineWidth(0.1);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'FD');
          } else if (theme === 'ethereal') {
            doc.setDrawColor(238, 242, 255);
            doc.setLineWidth(0.1);
            doc.roundedRect(boxX, yPos + 1, rightColWidth + 2, height, 2, 2, 'FD');
          } else if (theme === 'prism') {
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.1);
            doc.roundedRect(boxX, yPos + 1, rightColWidth + 2, height, 3, 3, 'FD');
          } else if (theme === 'undertale') {
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.5);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'FD');
          } else if (theme === 'god-of-war') {
            doc.setDrawColor(255, 215, 0);
            doc.setLineWidth(0.5);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'FD');
          } else if (theme === 'comic') {
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'F');
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'S');
            doc.setFillColor(0, 0, 0);
            doc.rect(boxX + 2, yPos + 1 + height, rightColWidth + 2, 2, 'F');
            doc.rect(boxX + rightColWidth + 2, yPos + 1 + 2, 2, height, 'F');
          } else if (theme === 'cuphead') {
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1.5);
            doc.rect(boxX, yPos + 1, rightColWidth + 2, height, 'FD');
          } else {
            doc.roundedRect(boxX, yPos + 1, rightColWidth + 2, height, 3, 3, 'F');
          }
        }

        if (!isAr) {
          drawRichText(doc, event, currentX + leftColWidth + 5 + tlPadding, yPos + tlPadding + 5 + (fontSize * 0.3527) * 0.7, rightColWidth - (tlPadding * 2), fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        } else {
          drawRichText(doc, event, currentX + tlPadding, yPos + tlPadding + 5 + (fontSize * 0.3527) * 0.7, rightColWidth - (tlPadding * 2), fontSize, 1.2, align, groupColor, 'normal', currentTheme.text, theme, customFont);
        }
        
        yPos += height + 4;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
        break;
      }
      case 'DIVIDER': {
        checkPageBreak(10);
        if (floatingArea) {
          yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
          floatingArea = null;
        }
        
        if (theme === 'cyberpunk') {
          doc.setDrawColor(6, 182, 212, 0.5);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos + 4.5, margin + contentWidth, yPos + 4.5);
          doc.setDrawColor(6, 182, 212);
          doc.setLineWidth(0.5);
          doc.line(margin, yPos + 5, margin + contentWidth, yPos + 5);
          doc.setDrawColor(6, 182, 212, 0.5);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos + 5.5, margin + contentWidth, yPos + 5.5);
        } else if (theme === 'terminal') {
          doc.setDrawColor(34, 197, 94, 0.3);
          doc.setLineWidth(0.1);
          doc.setLineDashPattern([1, 1], 0);
          doc.line(margin, yPos + 5, margin + contentWidth, yPos + 5);
          doc.setLineDashPattern([], 0);
        } else if (theme === 'ethereal') {
          doc.setDrawColor(99, 102, 241, 0.1);
          doc.setLineWidth(0.1);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(margin + 20, yPos + 5, margin + contentWidth - 20, yPos + 5);
          doc.setLineDashPattern([], 0);
        } else if (theme === 'vintage') {
          doc.setDrawColor(212, 197, 161);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos + 4.5, margin + contentWidth, yPos + 4.5);
          doc.line(margin, yPos + 5.5, margin + contentWidth, yPos + 5.5);
        } else if (theme === 'prism') {
          // Prism divider with dots
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.1);
          doc.line(margin + 10, yPos + 5, margin + contentWidth - 10, yPos + 5);
          doc.setFillColor(99, 102, 241);
          doc.circle(margin + 5, yPos + 5, 0.5, 'F');
          doc.setFillColor(236, 72, 153);
          doc.circle(margin + contentWidth - 5, yPos + 5, 0.5, 'F');
        } else if (theme === 'god-of-war') {
          doc.setDrawColor(139, 0, 0);
          doc.setLineWidth(1);
          doc.line(margin + 10, yPos + 5, margin + contentWidth - 10, yPos + 5);
          doc.setFillColor(255, 215, 0);
          doc.rect(margin + contentWidth / 2 - 2, yPos + 3, 4, 4, 'F');
        } else if (theme === 'cuphead' || theme === 'comic') {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.5);
          doc.line(margin + 10, yPos + 4, margin + contentWidth - 10, yPos + 4);
          doc.setLineWidth(0.5);
          doc.line(margin + 10, yPos + 6, margin + contentWidth - 10, yPos + 6);
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.5);
          doc.setLineDashPattern([2, 2], 0);
          doc.line(margin, yPos + 5, margin + contentWidth, yPos + 5);
          doc.setLineDashPattern([], 0);
        }
        yPos += 10;
        lastType = type;
        break;
      }
      case 'MCQ':
      case 'AR_MCQ': {
        const questionFontSize = baseTextSize + 2;
        const optionFontSize = baseTextSize;
        
        let parsedData = { question: '', options: [], answer: '', explanation: '' };
        try {
          parsedData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
        } catch (e) {
          console.error("Error parsing MCQ data", e);
        }

        const questionText = parsedData.question || '';
        const options = parsedData.options || [];
        const answerText = parsedData.answer || '';
        const explanationText = parsedData.explanation || '';

        // Theme-based Colors
        let bgColor = getShade(groupColor, 0.96);
        let borderColor = getShade(groupColor, 0.8);
        let answerColor: [number, number, number] = [30, 126, 52]; // default green
        let qTextColor: [number, number, number] = [15, 23, 42];
        let optionTextColor: [number, number, number] = [71, 85, 105];
        let correctHighlightColor: [number, number, number] = [212, 237, 218];

        if (theme === 'cyberpunk') {
          bgColor = '#1a0a2e';
          borderColor = '#a855f7';
          qTextColor = [243, 232, 255];
          optionTextColor = [216, 180, 254];
          answerColor = [168, 85, 247];
          correctHighlightColor = [59, 7, 100];
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          qTextColor = [34, 197, 94];
          optionTextColor = [21, 128, 61];
          answerColor = [34, 197, 94];
          correctHighlightColor = [5, 46, 22];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          qTextColor = [74, 55, 40];
          optionTextColor = [93, 64, 55];
          answerColor = [62, 39, 35];
          correctHighlightColor = [245, 245, 220];
        } else if (theme === 'ethereal') {
          bgColor = '#f5f3ff';
          borderColor = '#6366f1';
          qTextColor = [49, 46, 129];
          optionTextColor = [79, 70, 229];
          answerColor = [67, 56, 202];
          correctHighlightColor = [224, 231, 255];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          qTextColor = [203, 213, 225];
          optionTextColor = [148, 163, 184];
          answerColor = [255, 215, 0];
          correctHighlightColor = [45, 45, 45];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          borderColor = '#ffffff';
          qTextColor = [255, 255, 255];
          optionTextColor = [200, 200, 200];
          answerColor = [250, 204, 21]; // yellow
          correctHighlightColor = [30, 30, 30];
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          qTextColor = [0, 0, 0];
          optionTextColor = [50, 50, 50];
          answerColor = [0, 0, 0];
          correctHighlightColor = [210, 210, 180];
        }

        const tempDoc = new jsPDF();
        
        if (customFont) {
          try {
            const base64 = customFont.data.split(',')[1];
            tempDoc.addFileToVFS(customFont.fileName, base64);
            tempDoc.addFont(customFont.fileName, customFont.name, 'normal');
            tempDoc.setFont(customFont.name);
          } catch (e) {}
        }

        const mcqPadding = 8; 
        const mcqSpacing = 6;  
        
        // Calculate heights
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        const iconSize = 5;
        const qHeight = drawRichText(tempDoc, questionText, 0, 0, currentMaxWidth - (mcqPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        const optionHeights: number[] = [];
        let optionsHeight = 0;
        options.forEach((opt: string) => {
          const isCorrect = opt === answerText;
          const h = drawRichText(tempDoc, opt, 0, 0, currentMaxWidth - (mcqPadding * 2) - 5, optionFontSize, 1.4, align, groupColor, isCorrect ? 'bold' : 'normal', isCorrect ? answerColor : optionTextColor, theme, customFont);
          optionHeights.push(h);
          optionsHeight += h + 2;
        });
        
        let explanationHeight = 0;
        if (explanationText) {
          const expString = `Explanation:\n${explanationText}`;
          explanationHeight = drawRichText(tempDoc, expString, 0, 0, currentMaxWidth - (mcqPadding * 2), optionFontSize - 1, 1.4, align, groupColor, 'italic', optionTextColor, theme, customFont);
        }

        const totalHeight = mcqPadding + qHeight + mcqSpacing + optionsHeight + (explanationHeight ? mcqSpacing + explanationHeight : 0) + mcqPadding + 4;

        checkPageBreak(totalHeight + 5);

        if (floatingArea && yPos + totalHeight > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        // Draw Box
        doc.setFillColor(...hexToRgb(bgColor));
        doc.setDrawColor(...hexToRgb(borderColor));
        doc.setLineWidth(0.3);
        
        const radius = (theme === 'ethereal' || theme === 'modern') ? 2 : 3;
        doc.roundedRect(currentX, yPos, currentMaxWidth, totalHeight, radius, radius, 'FD');

        // Type Badge
        doc.setFontSize(baseTextSize - 4);
        doc.setTextColor(...hexToRgb(borderColor));
        doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
        const badgeText = isAr ? "اختبار" : "MCQ";
        const badgeWidth = doc.getTextWidth(badgeText);
        doc.text(badgeText, currentX + currentMaxWidth - badgeWidth - 4, yPos + 4);
        doc.setFontSize(baseTextSize);

        let currentInnerY = yPos + mcqPadding;

        // Draw Question
        if (!isAr) {
          drawVectorIcon(doc, 'MCQ', currentX + mcqPadding, currentInnerY + (questionFontSize * 0.3527) * 0.7 - iconSize/2, iconSize, hexToRgb(borderColor));
          drawRichText(doc, questionText, currentX + mcqPadding + iconSize + 4, currentInnerY + (questionFontSize * 0.3527) * 0.7, currentMaxWidth - (mcqPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'MCQ', currentX + currentMaxWidth - mcqPadding - iconSize, currentInnerY + (questionFontSize * 0.3527) * 0.7 - iconSize/2, iconSize, hexToRgb(borderColor));
          drawRichText(doc, questionText, currentX + mcqPadding, currentInnerY + (questionFontSize * 0.3527) * 0.7, currentMaxWidth - (mcqPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        }
        currentInnerY += qHeight + mcqSpacing;

        // Draw Options
        options.forEach((opt: string, idx: number) => {
          const isCorrect = opt === answerText;
          
          if (isCorrect) {
             // Highlight background for correct answer
             doc.setFillColor(...(Array.isArray(correctHighlightColor) ? correctHighlightColor : hexToRgb(correctHighlightColor as any)));
             doc.rect(currentX + mcqPadding - 1, currentInnerY - 1, currentMaxWidth - (mcqPadding * 2) + 2, optionHeights[idx] + 2, 'F');
             
             // Underline
             doc.setDrawColor(...(Array.isArray(answerColor) ? answerColor : hexToRgb(answerColor as any)));
             doc.setLineWidth(0.3);
             doc.line(currentX + mcqPadding, currentInnerY + optionHeights[idx], currentX + currentMaxWidth - mcqPadding, currentInnerY + optionHeights[idx]);
          }

          const iconType = isCorrect ? 'CHECK' : 'BULLET';
          const iconColor = isCorrect ? answerColor : optionTextColor;
          
          if (!isAr) {
            drawVectorIcon(doc, iconType, currentX + mcqPadding, currentInnerY + (optionFontSize * 0.3527) * 0.7 - 2, 3, Array.isArray(iconColor) ? iconColor : hexToRgb(iconColor as any));
            drawRichText(doc, opt, currentX + mcqPadding + 5, currentInnerY + (optionFontSize * 0.3527) * 0.7, currentMaxWidth - (mcqPadding * 2) - 5, optionFontSize, 1.4, align, groupColor, isCorrect ? 'bold' : 'normal', isCorrect ? answerColor : optionTextColor, theme, customFont);
          } else {
            drawVectorIcon(doc, iconType, currentX + currentMaxWidth - mcqPadding - 3, currentInnerY + (optionFontSize * 0.3527) * 0.7 - 2, 3, Array.isArray(iconColor) ? iconColor : hexToRgb(iconColor as any));
            drawRichText(doc, opt, currentX + mcqPadding, currentInnerY + (optionFontSize * 0.3527) * 0.7, currentMaxWidth - (mcqPadding * 2) - 5, optionFontSize, 1.4, align, groupColor, isCorrect ? 'bold' : 'normal', isCorrect ? answerColor : optionTextColor, theme, customFont);
          }
          currentInnerY += optionHeights[idx] + 2;
        });
        
        if (explanationText) {
          currentInnerY += mcqSpacing - 2;
          doc.setDrawColor(...hexToRgb(borderColor));
          doc.setLineWidth(0.1);
          doc.line(currentX + mcqPadding, currentInnerY, currentX + currentMaxWidth - mcqPadding, currentInnerY);
          currentInnerY += 3;
          
          const expString = isAr ? `شرح:\n${explanationText}` : `Explanation:\n${explanationText}`;
          drawRichText(doc, expString, currentX + mcqPadding, currentInnerY + (optionFontSize * 0.3527) * 0.7, currentMaxWidth - (mcqPadding * 2), optionFontSize - 1, 1.4, align, groupColor, 'italic', optionTextColor, theme, customFont);
          currentInnerY += explanationHeight + mcqSpacing;
        }

        yPos += totalHeight + 8;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;

        lastType = type;
        break;
      }
      case 'ESSAY':
      case 'AR_ESSAY': {
        const questionFontSize = baseTextSize + 2;
        const answerFontSize = baseTextSize;
        
        let parsedData = { question: '', answer: '', explanation: '' };
        try {
          parsedData = typeof item.CONTENT === 'string' ? JSON.parse(item.CONTENT) : item.CONTENT;
        } catch (e) {
          console.error("Error parsing ESSAY data", e);
        }

        const questionText = parsedData.question || '';
        const answerText = parsedData.answer || '';
        const explanationText = parsedData.explanation || '';

        // Theme-based Colors
        let bgColor = getShade(groupColor, 0.96);
        let borderColor = getShade(groupColor, 0.8);
        let answerColor: [number, number, number] = [30, 126, 52];
        let qTextColor: [number, number, number] = [15, 23, 42];

        if (theme === 'cyberpunk') {
          bgColor = '#1a0a2e';
          borderColor = '#a855f7';
          qTextColor = [243, 232, 255];
          answerColor = [168, 85, 247];
        } else if (theme === 'terminal') {
          bgColor = '#000000';
          borderColor = '#22c55e';
          qTextColor = [34, 197, 94];
          answerColor = [34, 197, 94];
        } else if (theme === 'vintage') {
          bgColor = '#fdfbf7';
          borderColor = '#d4c5a1';
          qTextColor = [74, 55, 40];
          answerColor = [62, 39, 35];
        } else if (theme === 'ethereal') {
          bgColor = '#f5f3ff';
          borderColor = '#6366f1';
          qTextColor = [49, 46, 129];
          answerColor = [67, 56, 202];
        } else if (theme === 'god-of-war') {
          bgColor = '#1a1a1a';
          borderColor = '#ffd700';
          qTextColor = [203, 213, 225];
          answerColor = [255, 215, 0];
        } else if (theme === 'undertale') {
          bgColor = '#000000';
          borderColor = '#ffffff';
          qTextColor = [255, 255, 255];
          answerColor = [250, 204, 21]; // yellow
        } else if (theme === 'cuphead' || theme === 'comic') {
          bgColor = '#f5f5dc';
          borderColor = '#000000';
          qTextColor = [0, 0, 0];
          answerColor = [0, 0, 0];
        }

        const tempDoc = new jsPDF();

        if (customFont) {
          try {
            const base64 = customFont.data.split(',')[1];
            tempDoc.addFileToVFS(customFont.fileName, base64);
            tempDoc.addFont(customFont.fileName, customFont.name, 'normal');
            tempDoc.setFont(customFont.name);
          } catch (e) {}
        }

        const essayPadding = 8; 
        const essaySpacing = 6;  
        
        // Calculate heights
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        const iconSize = 5;
        const qHeight = drawRichText(tempDoc, questionText, 0, 0, currentMaxWidth - (essayPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        
        const answerString = isAr ? `الإجابة:\n${answerText}` : `Answer:\n${answerText}`;
        const aHeight = drawRichText(tempDoc, answerString, 0, 0, currentMaxWidth - (essayPadding * 2), answerFontSize, 1.4, align, groupColor, 'normal', answerColor, theme, customFont);
        
        let explanationHeight = 0;
        let optionTextColor: [number, number, number] = [71, 85, 105];
        if (theme === 'cyberpunk') optionTextColor = [243, 232, 255];
        if (theme === 'terminal') optionTextColor = [34, 197, 94];
        if (theme === 'vintage') optionTextColor = [74, 55, 40];
        if (theme === 'ethereal') optionTextColor = [49, 46, 129];
        if (theme === 'god-of-war') optionTextColor = [203, 213, 225];
        if (theme === 'cuphead' || theme === 'comic') optionTextColor = [0, 0, 0];
        if (theme === 'undertale') optionTextColor = [255, 255, 255];
        if (theme === 'minecraft') optionTextColor = [55, 55, 55];
        if (theme === 'prism') optionTextColor = [15, 23, 42];

        if (explanationText) {
          const expString = isAr ? `شرح:\n${explanationText}` : `Explanation:\n${explanationText}`;
          explanationHeight = drawRichText(tempDoc, expString, 0, 0, currentMaxWidth - (essayPadding * 2), answerFontSize - 1, 1.4, align, groupColor, 'italic', optionTextColor, theme, customFont);
        }

        const totalHeight = essayPadding + qHeight + essaySpacing + aHeight + (explanationHeight ? essaySpacing + explanationHeight : 0) + essayPadding + 4;

        checkPageBreak(totalHeight + 5);

        if (floatingArea && yPos + totalHeight > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        // Draw Box
        doc.setFillColor(...hexToRgb(bgColor));
        doc.setDrawColor(...hexToRgb(borderColor));
        doc.setLineWidth(0.3);
        
        const radius = (theme === 'ethereal' || theme === 'modern') ? 2 : 3;
        doc.roundedRect(currentX, yPos, currentMaxWidth, totalHeight, radius, radius, 'FD');

        // Type Badge
        doc.setFontSize(baseTextSize - 4);
        doc.setTextColor(...hexToRgb(borderColor));
        doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
        const badgeText = isAr ? "مقالة" : "ESSAY";
        const badgeWidth = doc.getTextWidth(badgeText);
        doc.text(badgeText, currentX + currentMaxWidth - badgeWidth - 4, yPos + 4);
        doc.setFontSize(baseTextSize);

        let currentInnerY = yPos + essayPadding;

        // Draw Question
        if (!isAr) {
          drawVectorIcon(doc, 'ESSAY', currentX + essayPadding, currentInnerY + (questionFontSize * 0.3527) * 0.7 - iconSize/2, iconSize, hexToRgb(borderColor));
          drawRichText(doc, questionText, currentX + essayPadding + iconSize + 4, currentInnerY + (questionFontSize * 0.3527) * 0.7, currentMaxWidth - (essayPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        } else {
          drawVectorIcon(doc, 'ESSAY', currentX + currentMaxWidth - essayPadding - iconSize, currentInnerY + (questionFontSize * 0.3527) * 0.7 - iconSize/2, iconSize, hexToRgb(borderColor));
          drawRichText(doc, questionText, currentX + essayPadding, currentInnerY + (questionFontSize * 0.3527) * 0.7, currentMaxWidth - (essayPadding * 2) - iconSize - 4, questionFontSize, 1.4, align, groupColor, 'bold', qTextColor, theme, customFont);
        }
        currentInnerY += qHeight + essaySpacing;

        // Draw Answer
        drawRichText(doc, answerString, currentX + essayPadding, currentInnerY + (answerFontSize * 0.3527) * 0.7, currentMaxWidth - (essayPadding * 2), answerFontSize, 1.4, align, groupColor, 'normal', answerColor, theme, customFont);
        currentInnerY += aHeight + essaySpacing;
        
        if (explanationText) {
          currentInnerY -= 2;
          doc.setDrawColor(...hexToRgb(borderColor));
          doc.setLineWidth(0.1);
          doc.line(currentX + essayPadding, currentInnerY, currentX + currentMaxWidth - essayPadding, currentInnerY);
          currentInnerY += 3;
          
          const expString = isAr ? `شرح:\n${explanationText}` : `Explanation:\n${explanationText}`;
          drawRichText(doc, expString, currentX + essayPadding, currentInnerY + (answerFontSize * 0.3527) * 0.7, currentMaxWidth - (essayPadding * 2), answerFontSize - 1, 1.4, align, groupColor, 'italic', optionTextColor, theme, customFont);
        }

        yPos += totalHeight + 8;
        if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;

        lastType = type;
        break;
      }
      case 'IMG':
      case 'IMG_TEXT':
      case 'IMG TEXT':
      case 'AR_IMG':
      case 'AR_IMG_TEXT': {
        const isAr = type.startsWith('AR_');
        const imageUrl = (type === 'IMG_TEXT' || type === 'IMG TEXT' || type === 'AR_IMG_TEXT') ? (item.fetchedImages?.[item.currentImageIndex || 0]) : content;
        
        if (imageUrl) {
          try {
            const { data, width, height } = await loadImage(imageUrl);
            
            const imgPadding = 6;
            const targetWidthMm = currentMaxWidth - (imgPadding * 2);
            const targetHeightMm = (height / width) * targetWidthMm;

            let textHeight = 0;
            const fontSize = baseTextSize - 2;
            const textColor = currentTheme.text;
            
            if ((type === 'IMG_TEXT' || type === 'IMG TEXT' || type === 'AR_IMG_TEXT') && content) {
               const tempDoc = new jsPDF();
               textHeight = drawRichText(tempDoc, content, 0, 0, currentMaxWidth - (imgPadding * 2), fontSize, 1.2, isAr ? 'right' : 'center', groupColor, 'normal', textColor, theme, customFont);
            }

            const totalHeight = imgPadding + targetHeightMm + (textHeight ? 4 + textHeight : 0) + imgPadding;

            checkPageBreak(totalHeight + 10);
            
            if (floatingArea && yPos + totalHeight > floatingArea.y + floatingArea.h + 5) {
               yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
               floatingArea = null;
               currentX = margin;
               currentMaxWidth = contentWidth;
            }

            // Draw Card Background
            let bgColor = '#f8fafc';
            let borderColor = '#cbd5e1';
            if (theme === 'dark') {
              bgColor = '#1e293b';
              borderColor = '#334155';
            } else if (theme === 'cyberpunk') {
              bgColor = '#0f172a';
              borderColor = '#06b6d4';
            } else if (theme === 'terminal') {
              bgColor = '#000000';
              borderColor = '#22c55e';
            } else if (theme === 'vintage') {
              bgColor = '#fef3c7';
              borderColor = '#d97706';
            } else if (theme === 'ethereal') {
              bgColor = '#f5f3ff';
              borderColor = '#c4b5fd';
            } else if (theme === 'god-of-war') {
              bgColor = '#450a0a';
              borderColor = '#facc15';
            } else if (theme === 'minecraft') {
              bgColor = '#78716c';
              borderColor = '#44403c';
            } else if (theme === 'undertale') {
              bgColor = '#000000';
              borderColor = '#ffffff';
            } else if (theme === 'cuphead' || theme === 'comic') {
              bgColor = '#fefce8';
              borderColor = '#000000';
            } else if (theme === 'prism') {
              bgColor = '#ffffff';
              borderColor = '#e2e8f0';
            }

            doc.setFillColor(...hexToRgb(bgColor));
            doc.setDrawColor(...hexToRgb(borderColor));
            doc.setLineWidth(0.3);
            
            const radius = (theme === 'ethereal' || theme === 'modern' || theme === 'default' || !theme) ? 3 : 0;
            doc.roundedRect(currentX, yPos, currentMaxWidth, totalHeight, radius, radius, 'FD');

            let currentY = yPos + imgPadding;
            let xOffset = currentX + imgPadding;

            // Border around image based on theme
            if (theme === 'vintage') {
              doc.setDrawColor(139, 69, 19);
              doc.setLineWidth(1);
              doc.rect(xOffset - 1, currentY - 1, targetWidthMm + 2, targetHeightMm + 2);
            } else if (theme === 'cyberpunk') {
              doc.setDrawColor(6, 182, 212);
              doc.setLineWidth(0.5);
              doc.rect(xOffset - 1, currentY - 1, targetWidthMm + 2, targetHeightMm + 2);
            } else if (theme === 'terminal') {
              doc.setDrawColor(34, 197, 94);
              doc.setLineWidth(0.5);
              doc.rect(xOffset - 1, currentY - 1, targetWidthMm + 2, targetHeightMm + 2);
            } else if (theme === 'minecraft') {
              doc.setDrawColor(55, 55, 55);
              doc.setLineWidth(2);
              doc.rect(xOffset - 2, currentY - 2, targetWidthMm + 4, targetHeightMm + 4);
            } else if (theme === 'undertale') {
              doc.setDrawColor(255, 255, 255);
              doc.setLineWidth(1);
              doc.rect(xOffset - 1, currentY - 1, targetWidthMm + 2, targetHeightMm + 2);
            } else if (theme === 'god-of-war') {
              doc.setDrawColor(255, 215, 0);
              doc.setLineWidth(1.5);
              doc.rect(xOffset - 1.5, currentY - 1.5, targetWidthMm + 3, targetHeightMm + 3);
            } else if (theme === 'cuphead' || theme === 'comic') {
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(2);
              doc.rect(xOffset - 2, currentY - 2, targetWidthMm + 4, targetHeightMm + 4);
            }

            doc.addImage(data, 'JPEG', xOffset, currentY, targetWidthMm, targetHeightMm, undefined, 'FAST');
            
            currentY += targetHeightMm + 4;
            
            if ((type === 'IMG_TEXT' || type === 'IMG TEXT' || type === 'AR_IMG_TEXT') && content) {
               drawRichText(doc, content, currentX + imgPadding, currentY + (fontSize * 0.3527) * 0.7, currentMaxWidth - (imgPadding * 2), fontSize, 1.2, isAr ? 'right' : 'center', groupColor, 'normal', textColor, theme, customFont);
            }

            yPos += totalHeight + 8;
            
            if (floatingArea && yPos > floatingArea.y + floatingArea.h) floatingArea = null;
          } catch (e) {
            console.error(`Failed to load image for ${type}:`, imageUrl, e);
          }
        } else if ((type === 'IMG_TEXT' || type === 'IMG TEXT' || type === 'AR_IMG_TEXT') && content) {
           const fontSize = baseTextSize - 2;
           const textColor = currentTheme.text;
           const renderedHeight = drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.2, isAr ? 'right' : 'center', groupColor, 'normal', textColor, theme, customFont);
           yPos += renderedHeight + 5;
        }

        lastType = type;
        break;
      }
      default: {
        const fontSize = baseTextSize;
        const textColor = currentTheme.text;
        const isAr = type.startsWith('AR_');
        const align = isAr ? 'right' : 'left';
        
        const tempDoc = new jsPDF();
        const height = drawRichText(tempDoc, content, 0, 0, currentMaxWidth, fontSize, 1.5, align, groupColor, 'normal', textColor, theme, customFont);
        
        checkPageBreak(height + 2);

        if (floatingArea && yPos + height > floatingArea.y + floatingArea.h + 5) {
           yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
           floatingArea = null;
           currentX = margin;
           currentMaxWidth = contentWidth;
        }

        const renderedHeight = drawRichText(doc, content, currentX, yPos + (fontSize * 0.3527) * 0.7, currentMaxWidth, fontSize, 1.5, align, groupColor, 'normal', textColor, theme, customFont);
        yPos += renderedHeight + 4;
      }
    }

    lastType = type;
    await renderImages(path);
  };

  for (let i = 0; i < parsedData.length; i++) {
    const group = parsedData[i];
    const groupColor = colorsToUse[i % colorsToUse.length];
    const path = group.id || `root.${i}`;

    // Track TOC
    if (group.GROUP) {
      toc.push({ title: group.GROUP, page: (doc as any).internal.getNumberOfPages() });
    }

    await renderImages(`${path}.before`);
    await renderImages(`${path}.start`);

    // Group Separator if not at top
    if (yPos > margin + 20) {
      doc.setDrawColor(...hexToRgb(getShade(groupColor, 0.2)));
      doc.setLineWidth(0.1);
      if (theme === 'vintage') {
        doc.line(margin + 20, yPos - 10, pageWidth - margin - 20, yPos - 10);
        doc.circle(pageWidth / 2, yPos - 10, 1, 'S');
      } else if (theme === 'cyberpunk') {
        doc.setDrawColor(168, 85, 247);
        doc.line(margin, yPos - 10, margin + 30, yPos - 10);
        doc.line(pageWidth - margin - 30, yPos - 10, pageWidth - margin, yPos - 10);
      } else {
        doc.line(margin + 40, yPos - 10, pageWidth - margin - 40, yPos - 10);
      }
    }

    // Group Title
    const titleFontSize = baseTextSize + 10;
    doc.setFontSize(titleFontSize);
    
    let groupTitleColor = hexToRgb(getShade(groupColor, -0.2));
    if (theme === 'cyberpunk') groupTitleColor = [168, 85, 247];
    if (theme === 'vintage') groupTitleColor = [74, 55, 40];
    if (theme === 'prism') groupTitleColor = [79, 70, 229];
    if (theme === 'ethereal') groupTitleColor = [99, 102, 241];
    if (theme === 'minecraft') groupTitleColor = [55, 55, 55];
    if (theme === 'undertale') groupTitleColor = [255, 255, 255];
    if (theme === 'god-of-war') groupTitleColor = [255, 215, 0];
    if (theme === 'cuphead' || theme === 'comic') groupTitleColor = [0, 0, 0];
    
    doc.setTextColor(...groupTitleColor);
    doc.setFont(theme === 'cyberpunk' ? 'courier' : (theme === 'vintage' ? 'times' : 'helvetica'), 'bold');
    checkPageBreak(15);
    
    if (theme === 'cyberpunk') {
      doc.setFillColor(168, 85, 247, 0.1);
      doc.rect(margin, yPos + 2, contentWidth, 10, 'F');
      doc.setDrawColor(168, 85, 247);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 2, margin + contentWidth, yPos + 2);
      doc.line(margin, yPos + 12, margin + contentWidth, yPos + 12);
      drawRichText(doc, group.GROUP.toUpperCase(), margin, yPos + 9, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', groupTitleColor as [number, number, number], theme, customFont);
    } else if (theme === 'minecraft') {
      doc.setFillColor(198, 198, 198);
      doc.rect(margin, yPos + 2, contentWidth, 10, 'F');
      doc.setDrawColor(55, 55, 55);
      doc.setLineWidth(1);
      doc.rect(margin, yPos + 2, contentWidth, 10, 'D');
      drawRichText(doc, group.GROUP.toUpperCase(), margin, yPos + 9, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', groupTitleColor as [number, number, number], theme, customFont);
    } else if (theme === 'undertale') {
      doc.setTextColor(255, 0, 0);
      const groupText = group.GROUP.toUpperCase();
      
      const isAr = getDir(groupText) === 'RTL';
      let renderText = groupText;
      if (isAr) {
        renderText = ArabicShaper.convertArabic(groupText);
        const fontList = doc.getFontList();
        if (fontList['Amiri']) {
          doc.setFont('Amiri', 'bold');
        } else if (customFont) {
          doc.setFont(customFont.name, 'bold');
        }
      } else {
        doc.setFont('courier', 'bold');
      }
      
      const groupWidth = doc.getTextWidth(renderText);
      const startX = margin + (contentWidth - groupWidth) / 2;
      doc.text('*', startX - 8, yPos + 10);
      
      // Reset font
      doc.setFont('courier', 'bold');
      doc.setTextColor(255, 255, 255);
      drawRichText(doc, groupText, margin, yPos + 10, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', [255, 255, 255], theme, customFont);
    } else if (theme === 'vintage') {
      drawRichText(doc, group.GROUP, margin, yPos + 10, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', groupTitleColor as [number, number, number], theme, customFont);
      doc.setDrawColor(212, 197, 161);
      doc.setLineWidth(0.2);
      doc.line(margin + (contentWidth / 4), yPos + 12, margin + (contentWidth * 3 / 4), yPos + 12);
    } else if (theme === 'god-of-war') {
      drawRichText(doc, group.GROUP.toUpperCase(), margin, yPos + 10, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', [255, 215, 0], theme, customFont);
      doc.setDrawColor(139, 0, 0);
      doc.setLineWidth(1);
      doc.line(margin + (contentWidth / 4), yPos + 14, margin + (contentWidth * 3 / 4), yPos + 14);
    } else if (theme === 'cuphead' || theme === 'comic') {
      drawRichText(doc, group.GROUP.toUpperCase(), margin, yPos + 10, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', [0, 0, 0], theme, customFont);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.line(margin + (contentWidth / 4), yPos + 14, margin + (contentWidth * 3 / 4), yPos + 14);
      doc.setLineWidth(0.5);
      doc.line(margin + (contentWidth / 4), yPos + 16, margin + (contentWidth * 3 / 4), yPos + 16);
    } else {
      drawRichText(doc, group.GROUP, margin, yPos + 10, contentWidth, titleFontSize, 1.2, 'center', groupColor, 'bold', groupTitleColor as [number, number, number], theme, customFont);
    }
    
    yPos += 15;

    for (let j = 0; j < group.ITEMS.length; j++) {
      try {
        const item = group.ITEMS[j];
        const type = String(item.TYPE).toUpperCase();
        const itemPath = item.id || `${path}.ITEMS.${j}`;
        
        // Skip cover page items in the main loop
        if (hasCoverPage && i === 0) {
          if (j === 0) continue; // Skip TITLE
          if (j === 1 && group.ITEMS.length > 1 && String(group.ITEMS[1].TYPE).toUpperCase() === 'SUBHEADER') continue; // Skip SUBHEADER if it was on cover
        }
        
        if (type === 'TABLE_HEAD' || type === 'TABLE_ROW' || type === 'AR_TABLE_HEAD' || type === 'AR_TABLE_ROW') {
          // Clear floating area before table
          if (floatingArea) {
            yPos = Math.max(yPos, floatingArea.y + floatingArea.h + 5);
            floatingArea = null;
          }

          const tableRows: string[][] = [];
          let head: string[] | null = null;
          let isArTable = false;
          
          // Collect all consecutive table items
          let k = j;
          while (k < group.ITEMS.length) {
            const nextItem = group.ITEMS[k];
            const nextType = String(nextItem.TYPE).toUpperCase();
            const nextItemPath = nextItem.id || `${path}.ITEMS.${k}`;
            
            if (nextType !== 'TABLE_HEAD' && nextType !== 'TABLE_ROW' && nextType !== 'AR_TABLE_HEAD' && nextType !== 'AR_TABLE_ROW') break;
            if (nextType.startsWith('AR_')) isArTable = true;

            // Check for images around this specific table item
            const beforeImages = imagePlacements[`${nextItemPath}.before`];
            const afterImages = imagePlacements[nextItemPath];

            // If there are images, we might need to break the table block to render them
            if (k > j && (beforeImages?.length || afterImages?.length)) {
              break; 
            }

            // Render images before the row
            await renderImages(`${nextItemPath}.before`);

            const nextContent = stripMemoryLinks(String(nextItem.CONTENT)
              .replace(/\[([^\]]+)\]\{([^}]+)\}/g, '$1')
              .replace(/\[c:[^\]]*\](.*?)\[\/c\]/g, '$1')
              .replace(/==/g, '')
              .replace(/\*\*/g, '')
              .replace(/__/g, '')
              .replace(/\*/g, '')
              .replace(/_/g, ''));
            
            if (nextType === 'TABLE_HEAD' || nextType === 'AR_TABLE_HEAD') {
              let content = nextContent;
              if (nextType.startsWith('AR_')) {
                content = ArabicShaper.convertArabic(content);
              }
              head = content.split('|').map(s => s.trim());
            } else if (nextType === 'TABLE_ROW' || nextType === 'AR_TABLE_ROW') {
              let content = nextContent;
              if (nextType.startsWith('AR_')) {
                content = ArabicShaper.convertArabic(content);
              }
              tableRows.push(content.split('|').map(s => s.trim()));
            }
            
            k++;

            // Render images after the row
            await renderImages(nextItemPath, groupColor);

            // If this row had "after" images, we must break the table to ensure they appear correctly
            if (afterImages?.length) {
              break;
            }
          }
          
          // Render table
          if (head || tableRows.length > 0) {
            // Enhanced Table Redesign
            let tableStyles: any = { 
              fontSize: baseTextSize - 2,
              font: theme === 'cyberpunk' ? 'courier' : (theme === 'terminal' ? 'courier' : (theme === 'ethereal' ? 'times' : (theme === 'vintage' ? 'times' : (theme === 'minecraft' || theme === 'undertale' ? 'courier' : 'helvetica')))),
              cellPadding: 4,
              lineColor: [226, 232, 240],
              lineWidth: 0.1,
              valign: 'middle',
              halign: isArTable ? 'right' : 'left'
            };

            if (isArTable) {
              const fontList = doc.getFontList();
              if (fontList['Amiri']) {
                tableStyles.font = 'Amiri';
              } else if (customFont) {
                tableStyles.font = customFont.name;
              }
            }

            let headStyles: any = { 
              fillColor: hexToRgb(groupColor), 
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              cellPadding: 5
            };
            let bodyStyles: any = { 
              textColor: [30, 41, 59],
              fillColor: [255, 255, 255]
            };
            let alternateRowStyles: any = { 
              fillColor: hexToRgb(getShade(groupColor, 0.98)) 
            };

            if (theme === 'cyberpunk') {
              headStyles = { fillColor: [88, 28, 135], textColor: [34, 211, 238] };
              bodyStyles = { textColor: [34, 211, 238], fillColor: [10, 10, 20] };
              alternateRowStyles = { fillColor: [15, 15, 30] };
              tableStyles.lineColor = [34, 211, 238];
            } else if (theme === 'terminal') {
              headStyles = { fillColor: [0, 0, 0], textColor: [34, 197, 94], lineWidth: 0.1, lineColor: [34, 197, 94] };
              bodyStyles = { textColor: [34, 197, 94], fillColor: [0, 0, 0], lineWidth: 0.1, lineColor: [34, 197, 94] };
              alternateRowStyles = { fillColor: [0, 0, 0] };
              tableStyles.lineColor = [34, 197, 94];
            } else if (theme === 'ethereal') {
              headStyles = { fillColor: hexToRgb(getShade(groupColor, 0.9)), textColor: hexToRgb(getShade(groupColor, -0.4)) };
              bodyStyles = { textColor: [30, 41, 59], fillColor: [255, 255, 255] };
              alternateRowStyles = { fillColor: [249, 250, 251] };
              tableStyles.lineWidth = 0;
            } else if (theme === 'vintage') {
              headStyles = { fillColor: [74, 55, 40], textColor: [255, 255, 255] };
              bodyStyles = { textColor: [74, 55, 40], fillColor: [253, 251, 247] };
              alternateRowStyles = { fillColor: [245, 240, 230] };
              tableStyles.lineColor = [212, 197, 161];
            } else if (theme === 'prism') {
              headStyles = { fillColor: [79, 70, 229], textColor: [255, 255, 255] };
              bodyStyles = { textColor: [15, 23, 42], fillColor: [255, 255, 255] };
              alternateRowStyles = { fillColor: [248, 250, 252] };
              tableStyles.lineWidth = 0;
            } else if (theme === 'modern') {
              headStyles = { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold' };
              bodyStyles = { textColor: [15, 23, 42], fillColor: [255, 255, 255] };
              alternateRowStyles = { fillColor: [255, 255, 255] };
              tableStyles.lineWidth = 0;
            } else if (theme === 'minecraft') {
              headStyles = { fillColor: [55, 55, 55], textColor: [255, 255, 255] };
              bodyStyles = { textColor: [55, 55, 55], fillColor: [198, 198, 198] };
              alternateRowStyles = { fillColor: [180, 180, 180] };
              tableStyles.lineColor = [85, 85, 85];
            } else if (theme === 'undertale') {
              headStyles = { fillColor: [0, 0, 0], textColor: [255, 255, 255], lineWidth: 0.2, lineColor: [255, 255, 255] };
              bodyStyles = { textColor: [255, 255, 255], fillColor: [0, 0, 0], lineWidth: 0.2, lineColor: [255, 255, 255] };
              alternateRowStyles = { fillColor: [0, 0, 0] };
              tableStyles.lineColor = [255, 255, 255];
            } else if (theme === 'god-of-war') {
              headStyles = { fillColor: [139, 0, 0], textColor: [255, 215, 0], lineWidth: 0.5, lineColor: [255, 215, 0] };
              bodyStyles = { textColor: [203, 213, 225], fillColor: [26, 26, 26], lineWidth: 0.5, lineColor: [255, 215, 0] };
              alternateRowStyles = { fillColor: [26, 26, 26] };
              tableStyles.lineColor = [255, 215, 0];
            } else if (theme === 'cuphead' || theme === 'comic') {
              headStyles = { fillColor: [245, 245, 220], textColor: [0, 0, 0], lineWidth: 1, lineColor: [0, 0, 0] };
              bodyStyles = { textColor: [0, 0, 0], fillColor: [255, 255, 255], lineWidth: 1, lineColor: [0, 0, 0] };
              alternateRowStyles = { fillColor: [255, 255, 255] };
              tableStyles.lineColor = [0, 0, 0];
            }

            autoTable(doc, {
              startY: yPos,
              head: head ? [head] : undefined,
              body: tableRows,
              margin: { left: margin, right: margin },
              styles: tableStyles,
              headStyles,
              bodyStyles,
              alternateRowStyles,
              columnStyles: {
                0: { cellPadding: { left: (theme === 'modern' || !theme || theme === 'prism' || theme === 'ethereal') ? 8 : 4, right: 4, top: 4, bottom: 4 } }
              },
              didDrawCell: (data) => {
                // Draw a vertical accent bar on the left of the first column for modern/prism/ethereal themes
                if (data.column.index === 0 && data.section === 'body' && (theme === 'modern' || !theme || theme === 'prism' || theme === 'ethereal')) {
                  doc.setFillColor(...hexToRgb(groupColor));
                  doc.rect(data.cell.x, data.cell.y, 1.5, data.cell.height, 'F');
                }
                
                // Draw horizontal lines for themes with lineWidth 0
                if (tableStyles.lineWidth === 0 && data.section === 'body') {
                  doc.setDrawColor(226, 232, 240);
                  doc.setLineWidth(0.1);
                  doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                }
              },
              didDrawPage: (data) => {
                yPos = data.cursor?.y || yPos;
              }
            });
            
            yPos = (doc as any).lastAutoTable.finalY + 5;
          }
          
          j = k - 1; // Skip the items we just processed
        } else {
          await renderItem(item, itemPath, groupColor);
        }
      } catch (e) {
        console.error(`Error rendering item at index ${j}:`, e);
      }
    }

    await renderImages(`${path}.end`, groupColor);
    yPos += 20; // Space between groups
  }

  await renderImages("root.end", colorsToUse[0]);

  // Add Table of Contents if multiple groups
  if (toc.length > 1) {
    const tocHeaderHeight = 25;
    const tocItemHeight = 12;
    const totalTocHeight = tocHeaderHeight + (toc.length * tocItemHeight);
    const tocPagesCount = Math.ceil(totalTocHeight / (pageHeight - (margin * 2)));
    
    const tocPosition = hasCoverPage ? 2 : 1;
    
    for (let p = 0; p < tocPagesCount; p++) {
      doc.insertPage(tocPosition + p);
      doc.setPage(tocPosition + p);
      drawPageBorder();
    }
    
    doc.setPage(tocPosition);
    let tocY = margin + 10;
    
    // TOC Header with background
    let headerBg: [number, number, number] = [241, 245, 249];
    let headerText: [number, number, number] = [15, 23, 42];
    
    if (theme === 'cyberpunk') { headerBg = [5, 5, 10]; headerText = [0, 255, 255]; }
    if (theme === 'terminal') { headerBg = [0, 0, 0]; headerText = [34, 197, 94]; }
    if (theme === 'vintage') { headerBg = [253, 251, 247]; headerText = [74, 55, 40]; }
    if (theme === 'god-of-war') { headerBg = [15, 15, 15]; headerText = [255, 215, 0]; }
    if (theme === 'minecraft') { headerBg = [198, 198, 198]; headerText = [55, 55, 55]; }
    if (theme === 'undertale') { headerBg = [0, 0, 0]; headerText = [255, 255, 255]; }
    if (theme === 'ethereal') { headerBg = [250, 248, 255]; headerText = [49, 46, 129]; }
    if (theme === 'prism') { headerBg = [248, 250, 255]; headerText = [15, 23, 42]; }
    
    doc.setFillColor(...headerBg);
    doc.rect(margin, tocY - 5, contentWidth, 15, 'F');
    
    doc.setFontSize(baseTextSize + 10);
    doc.setTextColor(...headerText);
    
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
    doc.text("Table of Contents", pageWidth / 2, tocY + 5, { align: 'center' });
    tocY += 25;
    
    doc.setFontSize(baseTextSize);
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'normal');
    
    toc.forEach((item, idx) => {
      if (tocY > pageHeight - margin - 15) {
        const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.setPage(currentPage + 1);
        tocY = margin + 10;
        doc.setFontSize(baseTextSize);
      }

      const actualPageNum = item.page + tocPagesCount; 
      
      const title = item.title;
      doc.setTextColor(...headerText);
      doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
      doc.text(title, margin, tocY);
      
      // Dots
      const titleWidth = doc.getTextWidth(title);
      const pageNumStr = actualPageNum.toString();
      const pageNumWidth = doc.getTextWidth(pageNumStr);
      
      const dotsX = margin + titleWidth + 4;
      const dotsEnd = pageWidth - margin - pageNumWidth - 8;
      
      doc.setTextColor(148, 163, 184); // slate-400 for dots
      if (theme === 'cyberpunk') doc.setTextColor(0, 255, 255, 0.5);
      if (theme === 'terminal') doc.setTextColor(34, 197, 94, 0.5);
      if (theme === 'vintage') doc.setTextColor(212, 197, 161, 0.5);
      if (theme === 'god-of-war') doc.setTextColor(255, 215, 0, 0.5);
      
      doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'normal');
      
      if (dotsEnd > dotsX) {
        let dots = "";
        while (doc.getTextWidth(dots + ".") < (dotsEnd - dotsX)) {
          dots += ".";
        }
        doc.text(dots, dotsX, tocY);
      }
      
      // Page Number Box
      if (theme === 'modern' || theme === 'prism') {
        doc.setFillColor(...headerBg);
        doc.roundedRect(pageWidth - margin - pageNumWidth - 4, tocY - 4, pageNumWidth + 4, 6, 1, 1, 'F');
      }
      
      doc.setTextColor(...headerText);
      doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'bold');
      doc.text(pageNumStr, pageWidth - margin - 2, tocY, { align: 'right' });
      tocY += 12;
    });
  }

  // Add page numbers and header/footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  const now = new Date().toLocaleDateString();
  for (let i = 1; i <= pageCount; i++) {
    if (hasCoverPage && i === 1) continue; // No header/footer on cover page
    
    doc.setPage(i);
    
    let pageNumColor: [number, number, number] = [148, 163, 184];
    if (theme === 'cyberpunk') pageNumColor = [0, 255, 255];
    if (theme === 'terminal') pageNumColor = [34, 197, 94];
    if (theme === 'vintage') pageNumColor = [93, 64, 55];
    if (theme === 'prism') pageNumColor = [99, 102, 241];
    if (theme === 'minecraft') pageNumColor = [55, 55, 55];
    if (theme === 'undertale') pageNumColor = [255, 255, 255];
    if (theme === 'god-of-war') pageNumColor = [255, 215, 0];
    if (theme === 'cuphead' || theme === 'comic') pageNumColor = [0, 0, 0];
    
    doc.setTextColor(...pageNumColor);
    doc.setFont(theme === 'cyberpunk' || theme === 'terminal' || theme === 'minecraft' || theme === 'undertale' ? 'courier' : (theme === 'vintage' || theme === 'god-of-war' ? 'times' : 'helvetica'), 'normal');
    
    // --- Header ---
    doc.setFontSize(8);
    try { doc.setGState(new (doc as any).GState({ opacity: 0.6 })); } catch (e) {}
    
    // Document Title (Top Left)
    doc.text(docTitle.toUpperCase(), margin, 12);
    
    // Date (Top Right)
    doc.text(now, pageWidth - margin, 12, { align: 'right' });
    
    // Subtle line below header
    doc.setDrawColor(...pageNumColor);
    doc.setLineWidth(0.1);
    doc.line(margin, 14, pageWidth - margin, 14);
    
    // --- Footer ---
    doc.setFontSize(9);
    
    // Center: Page number
    const displayPageNum = hasCoverPage ? i - 1 : i;
    const displayTotalPages = hasCoverPage ? pageCount - 1 : pageCount;
    doc.text(`Page ${displayPageNum} of ${displayTotalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Subtle line above footer
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    try { doc.setGState(new (doc as any).GState({ opacity: 1.0 })); } catch (e) {}
  }

  doc.save(`${docTitle}.pdf`);
};
