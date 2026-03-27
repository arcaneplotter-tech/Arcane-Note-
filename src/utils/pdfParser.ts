import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsedBlock {
  type: string;
  content: string;
  y: number;
}

function multiplyMatrix(m1: number[], m2: number[]) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}

export async function parsePdf(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const allLines: any[] = [];
  const fontSizeCounts: Record<number, number> = {};

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    const textContent = await page.getTextContent();
    const ops = await page.getOperatorList();
    
    const pageBlocks: any[] = [];

    // 1. Extract Text
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim() !== '') {
        const transform = item.transform;
        const fontSize = Math.round(Math.abs(transform[3]) * 10) / 10;
        const x = transform[4];
        const y = transform[5];
        const fontName = item.fontName || '';
        const isBold = fontName.toLowerCase().includes('bold');
        const isItalic = fontName.toLowerCase().includes('italic') || fontName.toLowerCase().includes('oblique');
        
        fontSizeCounts[fontSize] = (fontSizeCounts[fontSize] || 0) + item.str.length;

        pageBlocks.push({
          type: 'text',
          content: item.str,
          x: x,
          y: y,
          width: item.width || 0,
          height: item.height || fontSize,
          fontSize,
          fontName,
          isBold,
          isItalic,
          pageNum
        });
      }
    }

    // 2. Extract Images
    let currentTransform = [1, 0, 0, 1, 0, 0];
    const transformStack: number[][] = [];
    
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];
      
      if (fn === pdfjsLib.OPS.save) {
        transformStack.push([...currentTransform]);
      } else if (fn === pdfjsLib.OPS.restore) {
        if (transformStack.length > 0) {
          currentTransform = transformStack.pop()!;
        }
      } else if (fn === pdfjsLib.OPS.transform) {
        currentTransform = multiplyMatrix(currentTransform, args);
      } else if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        // @ts-ignore
        fn === pdfjsLib.OPS.paintJpegXObject ||
        // @ts-ignore
        fn === pdfjsLib.OPS.paintInlineImageXObject
      ) {
        const objId = args[0];
        try {
          const imgObj = await page.objs.get(objId);
          if (!imgObj) continue;

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = imgObj.width;
          canvas.height = imgObj.height;

          let imageUrl = '';
          if (imgObj.data && imgObj.data.length > 0) {
            const imgData = ctx.createImageData(imgObj.width, imgObj.height);
            if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
              for (let j = 0, k = 0; j < imgObj.data.length; j += 3, k += 4) {
                imgData.data[k] = imgObj.data[j];
                imgData.data[k + 1] = imgObj.data[j + 1];
                imgData.data[k + 2] = imgObj.data[j + 2];
                imgData.data[k + 3] = 255;
              }
            } else if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
              imgData.data.set(imgObj.data);
            } else if (imgObj.data.length === imgObj.width * imgObj.height) {
              for (let j = 0, k = 0; j < imgObj.data.length; j += 1, k += 4) {
                const val = imgObj.data[j];
                imgData.data[k] = val;
                imgData.data[k + 1] = val;
                imgData.data[k + 2] = val;
                imgData.data[k + 3] = 255;
              }
            } else {
              if (imgObj.data.length === imgData.data.length) {
                imgData.data.set(imgObj.data);
              } else {
                continue;
              }
            }
            ctx.putImageData(imgData, 0, 0);
            imageUrl = canvas.toDataURL('image/jpeg', 0.8);
          } else if (imgObj.bitmap) {
            ctx.drawImage(imgObj.bitmap, 0, 0);
            imageUrl = canvas.toDataURL('image/jpeg', 0.8);
          } else if (imgObj instanceof HTMLImageElement || imgObj instanceof HTMLCanvasElement || imgObj instanceof ImageBitmap) {
            ctx.drawImage(imgObj, 0, 0);
            imageUrl = canvas.toDataURL('image/jpeg', 0.8);
          }

          if (imageUrl && imgObj.width >= 50 && imgObj.height >= 50) {
            pageBlocks.push({
              type: 'image',
              content: imageUrl,
              x: currentTransform[4],
              y: currentTransform[5],
              pageNum
            });
          }
        } catch (e) {
          console.warn("Could not extract image", e);
        }
      }
    }

    // Sort blocks by Y descending (PDF coordinates start from bottom), then X ascending
    pageBlocks.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 5) {
        return b.y - a.y;
      }
      return (a as any).x - (b as any).x;
    });

    // Group text blocks that are on the same line (similar Y)
    let currentLine: any = null;

    for (const block of pageBlocks) {
      if (block.type === 'image') {
        if (currentLine) {
          allLines.push(currentLine);
          currentLine = null;
        }
        allLines.push(block);
      } else {
        if (!currentLine) {
          currentLine = { ...block, content: block.content.trim() };
        } else {
          // If Y is within 5 units, consider it same line
          if (Math.abs(currentLine.y - block.y) < 5) {
            const gap = block.x - (currentLine.x + currentLine.width);
            let separator = gap > currentLine.fontSize * 1.5 ? '    ' : ' ';
            currentLine.content += separator + block.content.trim();
            currentLine.width = (block.x + block.width) - currentLine.x;
            currentLine.fontSize = Math.max(currentLine.fontSize, block.fontSize!);
            currentLine.isBold = currentLine.isBold || block.isBold;
            currentLine.isItalic = currentLine.isItalic || block.isItalic;
          } else {
            allLines.push(currentLine);
            currentLine = { ...block, content: block.content.trim() };
          }
        }
      }
    }
    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  // Calculate global stats
  let bodyFontSize = 12;
  let maxCount = 0;
  for (const [sizeStr, count] of Object.entries(fontSizeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bodyFontSize = parseFloat(sizeStr);
    }
  }

  // Filter out headers/footers (repeating text at top/bottom of pages, or page numbers)
  const filteredLines = allLines.filter(line => {
    if (line.type === 'image') return true;
    const isPageNumber = line.content.match(/^(\d+|Page \d+( of \d+)?|\d+ \/ \d+|-\s*\d+\s*-)$/i);
    if (isPageNumber && line.content.length < 15) return false;
    return true;
  });

  // Group lines into paragraphs
  const paragraphs: any[] = [];
  let currentParagraph: any = null;

  for (const line of filteredLines) {
    if (line.type === 'image') {
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
        currentParagraph = null;
      }
      paragraphs.push(line);
    } else {
      if (!currentParagraph) {
        currentParagraph = { ...line };
      } else {
        // Determine if we should merge line into currentParagraph
        const isSamePage = currentParagraph.pageNum === line.pageNum;
        const isSimilarFontSize = Math.abs(currentParagraph.fontSize - line.fontSize) <= 1;
        const verticalDistance = currentParagraph.y - line.y; // Y goes down as we go down the page
        const isReasonableLineSpacing = isSamePage && verticalDistance > 0 && verticalDistance < (currentParagraph.fontSize * 3);
        
        const isBullet = line.content.match(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]/) || line.content.match(/^\d+\.\s/);
        const isHeading = line.fontSize > bodyFontSize + 1 || line.isBold;
        const isCode = line.content.match(/^(const|let|var|function|class|import|export|if|for|while|return|public|private|static)\b/) || line.content.includes('=>') || line.fontName.toLowerCase().includes('mono');
        const hasLargeGaps = line.content.includes('    ');
        const isShortLine = currentParagraph.content.length < 40 && !currentParagraph.content.endsWith('.') && !currentParagraph.content.endsWith(':');

        if (isSamePage && isSimilarFontSize && isReasonableLineSpacing && !isBullet && !isHeading && !isCode && !hasLargeGaps && !isShortLine) {
          if (currentParagraph.content.endsWith('-')) {
            currentParagraph.content = currentParagraph.content.slice(0, -1) + line.content;
          } else {
            currentParagraph.content += ' ' + line.content;
          }
          currentParagraph.y = line.y;
        } else {
          paragraphs.push(currentParagraph);
          currentParagraph = { ...line };
        }
      }
    }
  }
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  // Classify paragraphs
  const processedBlocks: any[] = [];
  for (const block of paragraphs) {
    if (block.type === 'image') {
      processedBlocks.push({ TYPE: 'IMG', CONTENT: block.content });
    } else {
      let type = 'EXPLANATION';
      let content = block.content;

      const isAllCaps = content === content.toUpperCase() && content.length > 3 && content.match(/[A-Z]/);
      const isShort = content.length < 150;
      const isBold = block.isBold;
      const isItalic = block.isItalic;
      const hasLargeGaps = content.includes('    ') || content.includes('\t');
      const pipeCount = (content.match(/\|/g) || []).length;

      if (block.fontSize >= bodyFontSize * 1.5) {
        type = 'TITLE';
      } else if (block.fontSize >= bodyFontSize * 1.15 || (isBold && isShort && !content.endsWith('.'))) {
        type = 'SUBHEADER';
      } else if (isAllCaps && isShort && !content.endsWith('.')) {
        type = 'SUBHEADER';
      } else if (content.match(/^(warning|caution|attention|danger|alert):/i)) {
        type = 'WARNING';
        content = content.replace(/^(warning|caution|attention|danger|alert):\s*/i, '');
      } else if (content.match(/^(important|critical|essential|must-know):/i)) {
        type = 'IMPORTANT';
        content = content.replace(/^(important|critical|essential|must-know):\s*/i, '');
      } else if (content.match(/^(tip|hint|pro tip|clinical pearl|pearl):/i)) {
        type = 'TIP';
        content = content.replace(/^(tip|hint|pro tip|clinical pearl|pearl):\s*/i, '');
      } else if (content.match(/^(note|callout|sidebar|remark):/i)) {
        type = 'CALLOUT';
        content = content.replace(/^(note|callout|sidebar|remark):\s*/i, '');
      } else if (content.match(/^(example|e\.g\.|for example|scenario|case study):/i)) {
        type = 'EXAMPLE';
        content = content.replace(/^(example|e\.g\.|for example|scenario|case study):\s*/i, '');
      } else if (content.match(/^(summary|conclusion|wrap-up|in short):/i)) {
        type = 'SUMMARY';
        content = content.replace(/^(summary|conclusion|wrap-up|in short):\s*/i, '');
      } else if (content.match(/^(key point|takeaway|main point|core idea):/i)) {
        type = 'KEY_POINT';
        content = content.replace(/^(key point|takeaway|main point|core idea):\s*/i, '');
      } else if (content.match(/^(step\s*\d+|phase\s*\d+|action\s*\d+):/i) || content.match(/^\d+\.\s/)) {
        type = 'STEP';
      } else if (content.match(/^(mnemonic|memory trick|acronym):/i)) {
        type = 'MNEMONIC';
        content = content.replace(/^(mnemonic|memory trick|acronym):\s*/i, '');
      } else if (content.match(/^['"].*['"]$/) || content.match(/^(quote|quotation|citation):/i) || (isItalic && isShort)) {
        type = 'QUOTE';
        content = content.replace(/^(quote|quotation|citation):\s*/i, '').replace(/^['"]|['"]$/g, '');
      } else if (content.match(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]/) || content.match(/^[a-z]\)\s/i)) {
        type = 'BULLET';
        content = content.replace(/^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*/, '').replace(/^[a-z]\)\s*/i, '');
      } else if (content.match(/^([A-Z][A-Za-z0-9\s-]{1,40})[:\-\u2014]\s+(.+)$/)) {
        type = 'DEFINITION';
      } else if (content.match(/^(\d{1,4}(?:s|'s)?(?:\s*-\s*\d{1,4}(?:s|'s)?)?)\s*[-|:]\s*(.+)$/)) {
        type = 'TIMELINE';
        content = content.replace(/^(\d{1,4}(?:s|'s)?(?:\s*-\s*\d{1,4}(?:s|'s)?)?)\s*[-|:]\s*/, '$1 | ');
      } else if (isBold && isShort && content.length > 5) {
        type = 'CONCEPT';
      } else if (block.fontName.toLowerCase().includes('mono') || content.match(/^(const|let|var|function|class|import|export|if|for|while|return|public|private|static)\b/) || (content.includes('{') && content.includes('}')) || content.includes('=>')) {
        type = 'CODE';
      } else if (content.match(/^(formula|equation|math):/i)) {
        type = 'FORMULA';
        content = content.replace(/^(formula|equation|math):\s*/i, '');
      } else if (content.match(/^[A-Za-z0-9\s\+\-\*\/\=\(\)\^\_\.\,]+$/) && content.includes('=') && content.length < 80 && content.match(/[0-9]/)) {
        type = 'FORMULA';
      } else if (pipeCount >= 2 || hasLargeGaps) {
        type = 'TABLE_ROW';
        if (hasLargeGaps && pipeCount < 2) {
          content = content.replace(/\s{3,}/g, ' | ');
        }
      }

      processedBlocks.push({ TYPE: type, CONTENT: content });
    }
  }

  // Final Pass: Merge consecutive blocks of the same type and detect TABLE_HEAD
  const mergedBlocks: any[] = [];
  let currentMerged: any = null;

  for (let i = 0; i < processedBlocks.length; i++) {
    const block = processedBlocks[i];
    
    // Detect TABLE_HEAD
    if (block.TYPE === 'TABLE_ROW' && (!currentMerged || currentMerged.TYPE !== 'TABLE_ROW' && currentMerged.TYPE !== 'TABLE_HEAD')) {
      block.TYPE = 'TABLE_HEAD';
    }

    if (!currentMerged) {
      currentMerged = { ...block };
    } else {
      const canMerge = (
        (block.TYPE === 'CODE' && currentMerged.TYPE === 'CODE') ||
        (block.TYPE === 'EXPLANATION' && currentMerged.TYPE === 'EXPLANATION' && !block.CONTENT.match(/^[A-Z]/))
      );

      if (canMerge) {
        if (block.TYPE === 'CODE') {
          currentMerged.CONTENT += '\n' + block.CONTENT;
        } else {
          currentMerged.CONTENT += ' ' + block.CONTENT;
        }
      } else {
        mergedBlocks.push(currentMerged);
        currentMerged = { ...block };
      }
    }
  }
  if (currentMerged) {
    mergedBlocks.push(currentMerged);
  }

  return [{
    id: 'parsed-pdf',
    GROUP: 'Extracted Document',
    ITEMS: mergedBlocks
  }];
}
