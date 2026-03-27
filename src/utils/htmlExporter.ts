/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlacedImage } from '../components/DocumentRenderer';
import { CustomFont } from './pdfGenerator';

export async function exportToHTML(
  parsedData: any,
  imagePlacements: Record<string, PlacedImage[]>,
  selectedColors: string[],
  textSize: number,
  customFont?: CustomFont,
  theme: 'realistic' | 'modern' | 'cyberpunk' | 'vintage' | 'terminal' | 'ethereal' | 'prism' | 'minecraft' | 'undertale' | 'god-of-war' | 'cuphead' | 'comic' | 'professional' | 'custom' = 'modern',
  videoBackgroundEnabled: boolean = false,
  customVideoUrl: string = '',
  videoBackgroundBase64: string = '',
  overlayVideos: any[] = [],
  action: 'download' | 'print' = 'download'
) {
  // Get the current document preview element
  const previewElement = document.querySelector('.document-preview');
  if (!previewElement) {
    throw new Error('Preview element not found');
  }

  // Clone the element to avoid modifying the live DOM
  const clone = previewElement.cloneNode(true) as HTMLElement;

  // Remove any drag handles or UI elements that shouldn't be in the export
  const uiElements = clone.querySelectorAll('.drag-handle, .settings-hint, .resize-handle, button:not(.explanation-btn):not(.mcq-option):not(.mcq-submit-btn):not(.mcq-reset-btn):not(.essay-submit-btn):not(.essay-reset-btn)');
  uiElements.forEach(el => el.remove());

  // Get all styles
  let styles = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        styles += rule.cssText + '\n';
      }
    } catch (e) {
      // Skip cross-origin stylesheets that we can't access
      console.warn('Could not access stylesheet:', sheet.href);
    }
  }

  // Add custom font if present
  let fontFace = '';
  if (customFont) {
    fontFace = `
      @font-face {
        font-family: '${customFont.name}';
        src: url('${customFont.data}');
      }
      body, .document-preview {
        font-family: '${customFont.name}', sans-serif !important;
      }
      * {
        font-family: inherit;
      }
    `;
  }

  const metadata = {
    parsedData,
    imagePlacements,
    selectedColors,
    textSize,
    customFont,
    theme,
    videoBackgroundEnabled,
    customVideoUrl,
    videoBackgroundBase64,
    overlayVideos,
    version: '1.0',
    exportedAt: new Date().toISOString()
  };

    const themeBg = (() => {
      // Video background takes precedence if enabled
      if (videoBackgroundEnabled) {
        const videoSrc = videoBackgroundBase64 || customVideoUrl || (theme === 'minecraft' ? 'https://videotourl.com/videos/1774375839537-54f7385d-7c6e-4155-9af5-fd19b3b978eb.webm' : '');
        
        if (videoSrc) {
          return `
            <div class="video-bg-container">
                <video
                    autoplay
                    loop
                    muted
                    playsinline
                    class="bg-video-element"
                    src="${videoSrc}"
                ></video>
                ${theme === 'minecraft' ? '<div class="mc-vignette"></div>' : ''}
            </div>
          `;
        }
      }

      if (theme === 'minecraft') {
        return `
        <div class="minecraft-bg-static">
            <div class="mc-sky"></div>
            <div class="mc-cycle">
                <div class="mc-sun"></div>
                <div class="mc-moon"></div>
            </div>
            <div class="mc-stars"></div>
            <div class="mc-clouds layer-1"></div>
            <div class="mc-clouds layer-2"></div>
            <div class="mc-clouds layer-3"></div>
            <div class="mc-particles"></div>
            <div class="mc-floor">
                <div class="mc-grass"></div>
                <div class="mc-dirt"></div>
            </div>
        </div>
      `;
      }

      if (theme === 'cyberpunk') {
        return `
        <div class="theme-bg cyberpunk-bg">
          <div class="cyber-perspective-container">
            <div class="cyber-grid-floor"></div>
          </div>
          <div class="cyber-streams">
            ${[...Array(15)].map((_, i) => `<div class="stream" style="left: ${Math.random() * 100}%; animation-delay: ${Math.random() * 5}s; height: ${100 + Math.random() * 200}px"></div>`).join('')}
          </div>
          <div class="cyber-circuits">
            ${[...Array(8)].map((_, i) => `<div class="circuit-node node-${i}" style="top: ${20 + (i * 15) % 60}%; left: ${10 + (i * 25) % 80}%"></div>`).join('')}
          </div>
          <div class="cyber-glitch-overlay"></div>
          <div class="cyber-scan-beam"></div>
        </div>
      `;
      }

      if (theme === 'terminal') {
        return `
        <div class="theme-bg terminal-bg">
          <div class="terminal-crt-overlay"></div>
          <div class="terminal-flicker"></div>
          <div class="terminal-matrix"></div>
          <div class="terminal-scanline-move"></div>
          <div class="terminal-cursor"></div>
        </div>
      `;
      }

      if (theme === 'ethereal') {
        return `
        <div class="theme-bg ethereal-bg">
          <div class="ethereal-aurora aurora-1"></div>
          <div class="ethereal-aurora aurora-2"></div>
          <div class="ethereal-aurora aurora-3"></div>
          <div class="ethereal-beams"></div>
          <div class="ethereal-sparkles"></div>
        </div>
      `;
      }

      if (theme === 'prism') {
        return `
        <div class="theme-bg prism-bg">
          <div class="prism-rays-container">
            ${[...Array(12)].map((_, i) => `<div class="ray ray-${i}" style="transform: rotate(${i * 30}deg)"></div>`).join('')}
          </div>
          <div class="prism-crystals">
            ${[...Array(15)].map((_, i) => `<div class="crystal crystal-${i % 4}" style="top: ${Math.random() * 100}%; left: ${Math.random() * 100}%; animation-delay: ${Math.random() * -20}s"></div>`).join('')}
          </div>
          <div class="prism-focal-point"></div>
        </div>
      `;
      }

      if (theme === 'vintage') {
        return `
        <div class="theme-bg vintage-bg">
          <div class="vintage-paper"></div>
          <div class="vintage-vignette"></div>
          <div class="vintage-scratches"></div>
          <div class="vintage-dust"></div>
          <div class="vintage-sepia"></div>
        </div>
      `;
      }

      if (theme === 'undertale') {
        return `
        <div class="theme-bg undertale-bg">
          <div class="undertale-stars-container"></div>
          <div class="undertale-save-point"></div>
          <div class="undertale-battle-box"></div>
          <div class="undertale-soul"></div>
        </div>
      `;
      }

      if (theme === 'god-of-war') {
        return `
        <div class="theme-bg gow-bg">
          <div class="gow-mist mist-1"></div>
          <div class="gow-mist mist-2"></div>
          <div class="gow-embers"></div>
          <div class="gow-runic"></div>
          <div class="gow-snow-container"></div>
          <div class="gow-vignette-overlay"></div>
        </div>
      `;
      }

      if (theme === 'cuphead') {
        return `
        <div class="theme-bg cuphead-bg">
          <div class="cuphead-jitter-container">
            <div class="cuphead-grain-overlay"></div>
            <div class="cuphead-scratches"></div>
            <div class="cuphead-splatters"></div>
          </div>
          <div class="cuphead-border"></div>
          <div class="cuphead-vignette-overlay"></div>
        </div>
      `;
      }

      if (theme === 'comic') {
        return `
        <div class="theme-bg comic-bg">
          <div class="comic-halftone"></div>
          <div class="comic-action-lines"></div>
          <div class="comic-shapes">
            <div class="comic-shape shape-red"></div>
            <div class="comic-shape shape-blue"></div>
            <div class="comic-shape shape-white"></div>
          </div>
          <div class="comic-bubble"></div>
        </div>
      `;
      }

      // Default / Modern
      return `
      <div class="theme-bg modern-bg">
        <div class="modern-blueprint"></div>
        <div class="modern-schematics">
          <div class="schematic sch-1"></div>
          <div class="schematic sch-2"></div>
          <div class="schematic sch-3"></div>
        </div>
        <div class="modern-modules">
          ${[...Array(8)].map((_, i) => `
            <div class="module" style="top: ${Math.random() * 100}%; left: ${Math.random() * 100}%; width: ${100 + Math.random() * 150}px; height: ${80 + Math.random() * 100}px; animation-delay: ${Math.random() * -15}s">
              <div class="mod-header"></div>
              <div class="mod-body">
                <div class="mod-line"></div>
                <div class="mod-line"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="modern-points">
          ${[...Array(30)].map((_, i) => `<div class="point" style="top: ${Math.floor(Math.random() * 10) * 10}%; left: ${Math.floor(Math.random() * 10) * 10}%"></div>`).join('')}
        </div>
      </div>
    `;
    })();

    const overlayVideoHtml = (() => {
      const enabledVideos = overlayVideos.filter(v => v.enabled && (v.url || v.base64));
      if (enabledVideos.length === 0) return '';

      return `
        <div id="overlay-video-move-indicator" class="overlay-video-move-indicator hidden"></div>
        <div id="overlay-video-container" class="overlay-video-container">
          ${enabledVideos.map((video, idx) => {
            const videoSrc = video.base64 || video.url;
            const isGif = videoSrc.toLowerCase().endsWith('.gif') || videoSrc.startsWith('data:image/gif');
            return `
              <div class="overlay-video-draggable" data-overlay-id="${idx}" style="width: ${video.size}px; height: ${video.size}px; left: 50%; margin-left: -${video.size/2}px;">
                ${isGif ? `
                  <img
                    src="${videoSrc}"
                    class="overlay-video-element"
                    alt="Overlay GIF"
                    referrerpolicy="no-referrer"
                  />
                ` : `
                  <video
                    autoplay
                    loop
                    muted
                    playsinline
                    class="overlay-video-element"
                    src="${videoSrc}"
                  ></video>
                `}
              </div>
            `;
          }).join('')}
        </div>
      `;
    })();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arcane Notes Export</title>
    <!-- ARCANE_NOTES_METADATA_START
    ${JSON.stringify(metadata)}
    ARCANE_NOTES_METADATA_END -->
    <script id="arcane-notes-metadata" type="application/json">
        ${JSON.stringify(metadata)}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
    <style>
        ${fontFace}
        :root {
            --accent-color: ${selectedColors[0] || '#3b82f6'};
        }
        body {
            margin: 0;
            padding: 0;
            background-color: ${theme === 'cyberpunk' ? '#0a0a0f' : (theme === 'terminal' ? '#000000' : (theme === 'ethereal' ? '#f5f7ff' : (theme === 'vintage' ? '#fdfbf7' : (theme === 'prism' ? '#fdfdfd' : (theme === 'minecraft' ? '#4a90e2' : (theme === 'undertale' ? '#000000' : (theme === 'custom' ? 'transparent' : '#f8f9fa')))))))};
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* Theme Backgrounds Base */
        .theme-bg {
            position: fixed;
            inset: 0;
            z-index: -1;
            overflow: hidden;
            pointer-events: none;
        }

        .video-bg-container {
            position: fixed;
            inset: 0;
            z-index: -1;
            overflow: hidden;
            background: #000;
        }

        .overlay-video-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            pointer-events: none;
        }
        .overlay-video-draggable {
            position: absolute;
            width: 200px;
            height: 200px;
            left: 50%;
            margin-left: -100px;
            top: 0;
            pointer-events: auto;
            cursor: grab;
        }
        .overlay-video-draggable:active {
            cursor: grabbing;
        }
        .overlay-video-element {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .bg-video-element {
            position: absolute;
            top: 50%;
            left: 50%;
            min-width: 100%;
            min-height: 100%;
            width: auto;
            height: auto;
            transform: translate(-50%, -50%);
            object-fit: cover;
        }

        .overlay-video-move-indicator {
            position: fixed;
            inset: 0;
            background: rgba(59, 130, 246, 0.1);
            z-index: 9998;
            pointer-events: none;
            border: 4px solid rgba(59, 130, 246, 0.3);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .5; }
        }
        .overlay-video-draggable.moving {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
            outline: 2px solid #3b82f6;
            border-radius: 8px;
        }
        .hidden { display: none !important; }
        @media (min-width: 640px) {
            .sm-hidden { display: none !important; }
        }

        /* Modern Background */
        .modern-bg { background: #f8fafc; }
        .modern-blueprint {
            position: absolute;
            inset: 0;
            opacity: 0.05;
            background-image: linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px);
            background-size: 100px 100px;
        }
        .modern-schematics {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.1;
        }
        .schematic {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border: 1px solid #64748b;
            animation: schematicRotate 60s infinite linear;
        }
        .sch-1 { width: 400px; height: 400px; }
        .sch-2 { width: 600px; height: 600px; border-radius: 50%; animation-direction: reverse; }
        .sch-3 { width: 800px; height: 800px; }
        .schematic::before, .schematic::after {
            content: '';
            position: absolute;
            background: #64748b;
        }
        .schematic::before { top: 0; left: 50%; width: 1px; height: 100%; }
        .schematic::after { left: 0; top: 50%; width: 100%; height: 1px; }

        .modern-modules .module {
            position: absolute;
            background: rgba(255, 255, 255, 0.5);
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            opacity: 0.1;
            animation: moduleFloat 15s infinite ease-in-out;
        }
        .mod-header { height: 12px; border-bottom: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.5); }
        .mod-body { padding: 4px; }
        .mod-line { height: 2px; background: #e2e8f0; margin-bottom: 4px; width: 80%; }

        .modern-points .point {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #60a5fa;
            border-radius: 50%;
            opacity: 0.2;
            animation: pointPulse 3s infinite;
        }

        /* Cyberpunk Background */
        .cyberpunk-bg { background: #020204; }
        .cyber-perspective-container {
            position: absolute;
            inset: 0;
            perspective: 1000px;
            opacity: 0.2;
        }
        .cyber-grid-floor {
            position: absolute;
            inset: -50% 0;
            background-image: linear-gradient(to bottom, transparent, #06b6d4 1px), linear-gradient(to right, transparent, #06b6d4 1px);
            background-size: 60px 60px;
            transform: rotateX(60deg) scale(2);
            transform-origin: bottom;
            animation: gridMove 10s infinite linear;
        }
        .cyber-streams .stream {
            position: absolute;
            width: 2px;
            background: #d946ef;
            box-shadow: 0 0 15px #d946ef;
            animation: streamFall 5s infinite linear;
        }
        .circuit-node {
            position: absolute;
            width: 150px;
            height: 150px;
            border-top: 2px solid #22d3ee;
            border-left: 2px solid #22d3ee;
            opacity: 0.1;
            clip-path: polygon(0 0, 100% 0, 100% 20%, 20% 20%, 20% 100%, 0 100%);
            animation: circuitPulse 4s infinite;
        }
        .cyber-glitch-overlay {
            position: absolute;
            inset: 0;
            background: transparent;
            animation: glitchFlash 10s infinite;
            pointer-events: none;
            z-index: 10;
        }
        .cyber-scan-beam {
            position: absolute;
            inset-x: 0;
            height: 100px;
            background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.1), transparent);
            animation: scanBeamMove 8s infinite linear;
        }

        /* Terminal Background */
        .terminal-bg { background: #000; }
        .terminal-crt-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
            background-size: 100% 4px;
            opacity: 0.15;
            z-index: 2;
        }
        .terminal-flicker {
            position: absolute;
            inset: 0;
            background: rgba(34, 197, 94, 0.05);
            animation: crtFlicker 0.1s infinite;
            z-index: 1;
        }
        .terminal-matrix {
            position: absolute;
            inset: 0;
            opacity: 0.3;
            overflow: hidden;
        }
        .terminal-scanline-move {
            position: absolute;
            inset-x: 0;
            height: 100px;
            background: rgba(34, 197, 94, 0.05);
            filter: blur(20px);
            animation: terminalScanline 10s infinite linear;
        }
        .terminal-cursor {
            position: absolute;
            bottom: 32px;
            right: 32px;
            width: 16px;
            height: 32px;
            background: rgba(34, 197, 94, 0.4);
            animation: cursorBlink 0.8s infinite;
        }

        /* Ethereal Background */
        .ethereal-bg { background: #f0f4ff; }
        .ethereal-aurora {
            position: absolute;
            inset: 0;
            filter: blur(120px);
            opacity: 0.2;
            animation: auroraAnim 20s infinite ease-in-out;
        }
        .aurora-1 { background: #93c5fd; transform: rotate(45deg); }
        .aurora-2 { background: #c084fc; transform: rotate(-45deg); animation-delay: -5s; }
        .aurora-3 { background: #a5f3fc; transform: rotate(90deg); animation-delay: -10s; }
        .ethereal-beams {
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.1) 100px, rgba(255,255,255,0.1) 200px);
            mask-image: radial-gradient(circle at top, black, transparent 70%);
        }

        /* Prism Background */
        .prism-bg { background: #fff; }
        .prism-rays-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
        }
        .ray {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200%;
            height: 40px;
            margin-top: -20px;
            origin-left: left;
            opacity: 0.1;
            animation: raySpin 40s infinite linear;
        }
        .ray-0 { background: linear-gradient(90deg, rgba(255,0,0,0.1), transparent); }
        .ray-1 { background: linear-gradient(90deg, rgba(255,127,0,0.1), transparent); }
        .ray-2 { background: linear-gradient(90deg, rgba(255,255,0,0.1), transparent); }
        .ray-3 { background: linear-gradient(90deg, rgba(0,255,0,0.1), transparent); }
        .ray-4 { background: linear-gradient(90deg, rgba(0,0,255,0.1), transparent); }
        .ray-5 { background: linear-gradient(90deg, rgba(75,0,130,0.1), transparent); }
        .ray-6 { background: linear-gradient(90deg, rgba(139,0,255,0.1), transparent); }
        .ray-7 { background: linear-gradient(90deg, rgba(255,0,0,0.1), transparent); }
        .ray-8 { background: linear-gradient(90deg, rgba(255,127,0,0.1), transparent); }
        .ray-9 { background: linear-gradient(90deg, rgba(255,255,0,0.1), transparent); }
        .ray-10 { background: linear-gradient(90deg, rgba(0,255,0,0.1), transparent); }
        .ray-11 { background: linear-gradient(90deg, rgba(0,0,255,0.1), transparent); }

        .prism-crystals .crystal {
            position: absolute;
            width: 120px;
            height: 120px;
            border: 1px solid rgba(255,255,255,0.4);
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            animation: crystalFloat 20s infinite ease-in-out;
        }
        .crystal-0 { background: rgba(255,0,0,0.05); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
        .crystal-1 { background: rgba(0,255,0,0.05); clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
        .crystal-2 { background: rgba(0,0,255,0.05); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
        .crystal-3 { background: rgba(255,255,255,0.1); clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }

        .prism-focal-point {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 500px;
            background: #ecfeff;
            border-radius: 50%;
            filter: blur(150px);
            opacity: 0.2;
            animation: focalPulse 10s infinite;
        }
        @keyframes raySpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes crystalFloat {
            0%, 100% { transform: translate(0, 0) rotate(0deg) scale(0.8); }
            50% { transform: translate(100px, -100px) rotate(180deg) scale(1.2); }
        }
        @keyframes focalPulse {
            0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1.2); }
        }

        /* Vintage Background */
        .vintage-bg { background: #f4ece1; }
        .vintage-paper {
            position: absolute;
            inset: 0;
            background: url('https://www.transparenttextures.com/patterns/paper-fibers.png');
            opacity: 0.05;
            mix-blend-mode: multiply;
        }
        .vintage-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle, transparent, rgba(74, 55, 40, 0.4));
            animation: vignettePulse 4s infinite ease-in-out;
        }
        .vintage-scratches {
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(90deg, transparent, transparent 200px, rgba(0,0,0,0.05) 200px, rgba(0,0,0,0.05) 201px);
            animation: scratchMove 0.1s infinite;
        }

        /* Undertale Background */
        .undertale-bg { background: #000; }
        .undertale-stars-container {
            position: absolute;
            inset: 0;
            background-image: 
                radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: starsTwinkle 4s infinite;
        }
        .undertale-save-point {
            position: absolute;
            bottom: 80px;
            left: 80px;
            width: 20px;
            height: 20px;
            background: #facc15;
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
            animation: savePointTwinkle 1.5s infinite;
        }
        .undertale-soul {
            position: absolute;
            bottom: 48px;
            left: 48px;
            width: 24px;
            height: 24px;
            background: #ef4444;
            clip-path: path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z");
            animation: soulPulse 1s infinite ease-in-out;
        }

        /* God of War Background */
        .gow-bg { background: #0c0d12; }
        .gow-mist {
            position: absolute;
            inset: 0;
            background: linear-gradient(transparent, rgba(30, 41, 59, 0.2));
            filter: blur(60px);
            animation: mistMove 15s infinite ease-in-out;
        }
        .gow-embers {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at bottom, rgba(249, 115, 22, 0.1), transparent 70%);
        }
        .gow-runic {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            height: 600px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
            filter: blur(150px);
            animation: runicPulse 5s infinite ease-in-out;
        }

        /* Cuphead Background */
        .cuphead-bg { background: #dccfb9; }
        .cuphead-jitter-container {
            position: absolute;
            inset: -10px;
            animation: filmJitter 0.15s infinite;
        }
        .cuphead-grain-overlay {
            position: absolute;
            inset: 0;
            background: url('https://www.transparenttextures.com/patterns/stardust.png');
            opacity: 0.12;
        }
        .cuphead-border {
            position: absolute;
            inset: 0;
            border: 30px solid rgba(0,0,0,0.1);
            pointer-events: none;
        }

        /* Comic Background */
        .comic-bg { background: #ffde00; }
        .comic-halftone {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(#000 15%, transparent 15%);
            background-size: 20px 20px;
            opacity: 0.15;
            animation: halftoneShift 10s infinite linear;
        }
        .comic-action-lines {
            position: absolute;
            inset: 0;
            background: repeating-conic-gradient(from 0deg, transparent 0deg 15deg, rgba(0,0,0,0.05) 15deg 30deg);
        }
        .comic-shape {
            position: absolute;
            width: 250px;
            height: 250px;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.2);
            animation: comicShapeFloat 10s infinite ease-in-out;
        }
        .shape-red { top: 10%; right: 10%; background: #ef4444; transform: rotate(12deg); }
        .shape-blue { bottom: 10%; left: 10%; background: #3b82f6; transform: rotate(-12deg); animation-delay: -5s; }
        .shape-white { top: 40%; left: 20%; background: #fff; border-radius: 50%; animation-delay: -3s; }

        /* Minecraft Background Styles */
        .minecraft-bg-static {
            position: fixed;
            inset: 0;
            z-index: -1;
            background: #4a90e2;
            overflow: hidden;
        }
        .mc-sky {
            position: absolute;
            inset: 0;
            animation: mcSkyCycle 120s infinite linear;
        }
        .mc-cycle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150%;
            height: 150%;
            transform: translate(-50%, -50%);
            animation: mcRotate 120s infinite linear;
        }
        .mc-sun {
            position: absolute;
            top: 0;
            left: 50%;
            width: 120px;
            height: 120px;
            background: #fffb00;
            transform: translateX(-50%);
            box-shadow: 0 0 40px #fffb00;
        }
        .mc-moon {
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 100px;
            height: 100px;
            background: #eee;
            transform: translateX(-50%);
            opacity: 0.6;
        }
        .mc-clouds {
            position: absolute;
            width: 256px;
            height: 64px;
            background: rgba(255,255,255,0.3);
            box-shadow: 16px 16px 0 rgba(255,255,255,0.1);
        }
        .mc-clouds.layer-1 { top: 15%; animation: mcCloudMove 60s infinite linear; }
        .mc-clouds.layer-2 { top: 25%; animation: mcCloudMove 90s infinite linear; animation-delay: -20s; opacity: 0.3; }
        .mc-clouds.layer-3 { top: 35%; animation: mcCloudMove 120s infinite linear; animation-delay: -40s; opacity: 0.2; }

        .mc-floor {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 160px;
        }
        .mc-grass {
            height: 24px;
            background: #4caf50;
            background-image: linear-gradient(90deg, #4caf50 50%, #388e3c 50%);
            background-size: 64px 100%;
        }
        .mc-dirt {
            flex: 1;
            height: 100%;
            background: #795548;
            background-image: radial-gradient(#5d4037 20%, transparent 20%), radial-gradient(#5d4037 20%, transparent 20%);
            background-position: 0 0, 32px 32px;
            background-size: 64px 64px;
        }

        /* Keyframes */
        @keyframes schematicRotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes moduleFloat {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0.05; }
            50% { transform: translateY(-50px) translateX(20px); opacity: 0.15; }
        }
        @keyframes pointPulse {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes gridMove {
            0% { transform: rotateX(60deg) scale(2) translateY(0); }
            100% { transform: rotateX(60deg) scale(2) translateY(60px); }
        }
        @keyframes streamFall {
            0% { transform: translateY(-200px); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(1200px); opacity: 0; }
        }
        @keyframes circuitPulse {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.2; }
        }
        @keyframes glitchFlash {
            0%, 90%, 100% { opacity: 0; transform: translateX(0); }
            92% { opacity: 0.1; background: #ff00ff; transform: translateX(10px); }
            94% { opacity: 0.05; background: #00ffff; transform: translateX(-10px); }
            96% { opacity: 0.1; background: #ff00ff; transform: translateX(5px); }
        }
        @keyframes scanBeamMove {
            from { transform: translateY(-100%); }
            to { transform: translateY(1000%); }
        }
        @keyframes crtFlicker {
            0% { opacity: 0.95; }
            20% { opacity: 1; }
            40% { opacity: 0.98; }
            60% { opacity: 1; }
            80% { opacity: 0.96; }
            100% { opacity: 1; }
        }
        @keyframes terminalScanline {
            from { transform: translateY(-100%); }
            to { transform: translateY(200%); }
        }
        @keyframes cursorBlink {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.4; }
        }
        @keyframes auroraAnim {
            0%, 100% { transform: translate(-20%, -10%) rotate(0deg) scale(1); }
            50% { transform: translate(20%, 10%) rotate(10deg) scale(1.2); }
        }
        @keyframes prismRainbow {
            from { background-position: 0% 0%; }
            to { background-position: 200% 0%; }
        }
        @keyframes shardRotate {
            from { transform: rotate(0deg) translate(0, 0); }
            to { transform: rotate(360deg) translate(50px, 50px); }
        }
        @keyframes vignettePulse {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.25; }
        }
        @keyframes scratchMove {
            from { transform: translateX(0); }
            to { transform: translateX(100%); }
        }
        @keyframes starsTwinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.8; }
        }
        @keyframes savePointTwinkle {
            0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1) rotate(90deg); opacity: 1; }
        }
        @keyframes soulPulse {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px #ef4444); }
            50% { transform: scale(1.1); filter: drop-shadow(0 0 15px #ef4444); }
        }
        @keyframes mistMove {
            0%, 100% { transform: translateX(-10%); opacity: 0.1; }
            50% { transform: translateX(10%); opacity: 0.2; }
        }
        @keyframes runicPulse {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.15; }
        }
        @keyframes filmJitter {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(-1px, 0.5px); }
            40% { transform: translate(1px, -0.5px); }
            60% { transform: translate(-0.5px, 1px); }
            80% { transform: translate(0.5px, -1px); }
        }
        @keyframes halftoneShift {
            from { background-position: 0 0; }
            to { background-position: 40px 40px; }
        }
        @keyframes comicShapeFloat {
            0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
            50% { transform: translate(30px, 20px) rotate(5deg) scale(1.05); }
        }
        @keyframes mcSkyCycle {
            0%, 100% { background: #4a90e2; }
            50% { background: #1a237e; }
        }
        @keyframes mcRotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes mcCloudMove {
            from { transform: translateX(-400px); }
            to { transform: translateX(2400px); }
        }

        .export-container {
            width: 100%;
            max-width: 100%;
            padding: 32px;
            box-sizing: border-box;
            margin-top: 60px; /* Space for toolbar */
        }
        .document-preview {
            font-size: ${textSize}px;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            background: ${theme === 'cyberpunk' ? '#0a0a0f' : (theme === 'terminal' ? '#000000' : (theme === 'ethereal' ? '#ffffff' : (theme === 'vintage' ? '#fdfbf7' : (theme === 'prism' ? '#fdfdfd' : (theme === 'minecraft' ? '#c6c6c6' : (theme === 'undertale' ? '#000000' : (theme === 'comic' ? '#ffffff' : (theme === 'custom' ? 'transparent' : '#ffffff'))))))))};
            color: ${theme === 'cyberpunk' || theme === 'terminal' || theme === 'undertale' || theme === 'god-of-war' ? '#ffffff' : '#1a1a1a'};
            padding: 64px;
            box-shadow: ${theme === 'custom' ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'};
            border-radius: ${theme === 'custom' ? '0' : '8px'};
            position: relative;
            min-height: 80vh;
        }

        /* Feedback Styles */
        .mcq-feedback-box, .essay-feedback {
            transition: all 0.3s ease;
        }
        .mcq-feedback > div, .essay-feedback > div {
            opacity: 1 !important;
            transform: none !important;
        }
        .mcq-feedback-title, .essay-feedback-title {
            margin-top: 0;
        }
        .font-retro {
            font-family: 'Courier New', Courier, monospace !important;
        }
        .font-black {
            font-weight: 900 !important;
        }
        .font-pixel {
            font-family: 'Courier New', Courier, monospace !important;
        }
        
        /* Dynamic Toolbar */
        .dynamic-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .toolbar-btn {
            padding: 8px 16px;
            border-radius: 9999px;
            border: 1px solid rgba(0,0,0,0.1);
            background: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toolbar-btn.active {
            background: var(--accent-color);
            color: white;
            border-color: var(--accent-color);
        }
        .toolbar-btn:hover:not(.active) {
            background: #f3f4f6;
        }

        /* Edit Mode Styles */
        .edit-mode .document-preview > div > div {
            cursor: grab;
            position: relative;
        }
        .edit-mode .document-preview > div > div:active {
            cursor: grabbing;
        }
        .edit-mode .document-preview > div > div::after {
            content: '⋮⋮';
            position: absolute;
            left: -25px;
            top: 50%;
            transform: translateY(-50%);
            opacity: 0;
            transition: opacity 0.2s;
            color: #94a3b8;
            font-size: 20px;
        }
        .edit-mode .document-preview > div > div:hover::after {
            opacity: 1;
        }

        /* Image Handles */
        .image-wrapper {
            position: relative;
            display: inline-block;
            max-width: 100%;
        }
        .edit-mode .image-wrapper {
            outline: 2px dashed transparent;
            transition: outline 0.2s;
        }
        .edit-mode .image-wrapper:hover {
            outline-color: var(--accent-color);
        }
        .resize-handle {
            position: absolute;
            width: 12px;
            height: 12px;
            background: var(--accent-color);
            border: 2px solid white;
            border-radius: 50%;
            bottom: -6px;
            right: -6px;
            cursor: nwse-resize;
            display: none;
            z-index: 10;
        }
        .edit-mode .resize-handle {
            display: block;
        }
        .image-toolbar {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 4px;
            display: none;
            gap: 4px;
            z-index: 20;
            border: 1px solid #e2e8f0;
        }
        .edit-mode .image-wrapper:hover .image-toolbar {
            display: flex;
        }
        .img-btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            color: #64748b;
        }
        .img-btn:hover {
            background: #f1f5f9;
            color: var(--accent-color);
        }

        /* Image Settings Modal */
        .image-settings-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .image-settings-modal {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            padding: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            font-family: sans-serif;
        }
        .image-settings-modal h3 {
            margin-top: 0;
            margin-bottom: 16px;
            color: #0f172a;
        }
        .image-settings-modal label {
            display: block;
            font-size: 11px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            margin-top: 16px;
        }
        .image-settings-modal input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 14px;
        }
        .image-settings-modal .btn-group {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 8px;
            gap: 4px;
        }
        .image-settings-modal .btn-group button {
            flex: 1;
            padding: 8px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
        }
        .image-settings-modal .btn-group button.active {
            background: white;
            color: #2563eb;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .image-settings-modal .slider-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .image-settings-modal input[type="range"] {
            flex: 1;
        }
        .image-settings-modal .close-btn {
            margin-top: 24px;
            width: 100%;
            padding: 10px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
        }
        .image-settings-modal .close-btn:hover {
            background: #1d4ed8;
        }

        #fullscreen-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
            font-family: sans-serif;
            transition: opacity 0.5s;
        }
        #fullscreen-overlay h1 {
            font-size: 32px;
            margin-bottom: 16px;
        }
        #fullscreen-overlay p {
            font-size: 19px;
            opacity: 0.8;
        }
        
        /* Text Resize Floating Bar */
        .text-resize-bar {
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 32px;
            display: none;
            align-items: center;
            padding: 8px;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 10002;
            transition: opacity 0.2s;
            user-select: none;
            touch-action: none;
        }
        .edit-mode .text-resize-bar {
            display: flex;
        }
        .text-resize-bar:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .text-resize-bar .resize-handle {
            cursor: grab;
            padding: 4px;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .text-resize-bar .resize-handle:active {
            cursor: grabbing;
        }
        .text-resize-bar .resize-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #334155;
            transition: background 0.2s;
        }
        .text-resize-bar .resize-btn:hover {
            background: rgba(0,0,0,0.05);
        }
        .text-resize-bar .resize-display {
            font-size: 14px;
            font-weight: 600;
            color: #334155;
            min-width: 48px;
            text-align: center;
        }

        @media print {
            #fullscreen-overlay, .dynamic-toolbar, .image-toolbar, .resize-handle, .zoom-controls, .text-resize-bar { display: none !important; }
            body { background: white; margin-top: 0; }
            .export-container { padding: 0; margin-top: 0; }
            .document-preview { box-shadow: none; padding: 0; max-width: 100%; transform: none !important; margin: 0 !important; }
        }
        
        ${styles}
    </style>
</head>
<body>
    ${themeBg}
    ${overlayVideoHtml}
    <div id="fullscreen-overlay">
        <h1>Arcane Notes</h1>
        <p>Click anywhere to enter full screen mode</p>
    </div>

    <div class="dynamic-toolbar">
        <button id="toggle-edit" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Mode
        </button>
        <button id="toggle-overlay-move" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="move-icon"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="check-icon hidden"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Move Overlays
        </button>
        <button id="reset-btn" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            Reset
        </button>
        <button id="print-btn" class="toolbar-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save PDF
        </button>
        <div class="zoom-controls" style="display: flex; align-items: center; gap: 8px; border-left: 1px solid rgba(0,0,0,0.1); padding-left: 16px; margin-left: 8px;">
            <button id="zoom-out-btn" class="toolbar-btn" style="padding: 8px;" title="Zoom Out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
            <span id="zoom-level" style="font-size: 14px; font-weight: 600; min-width: 48px; text-align: center;">100%</span>
            <button id="zoom-in-btn" class="toolbar-btn" style="padding: 8px;" title="Zoom In">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
        </div>
    </div>

    <div class="export-container">
        <div class="document-preview">
            ${clone.innerHTML}
        </div>
    </div>

    <div id="text-resize-bar" class="text-resize-bar">
        <div class="resize-handle" title="Drag to move">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
        </div>
        <button id="btn-text-decrease" class="resize-btn" title="Decrease text size">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path></svg>
        </button>
        <span id="text-size-display" class="resize-display">100%</span>
        <button id="btn-text-increase" class="resize-btn" title="Increase text size">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
        </button>
    </div>

    <script>
        // Fullscreen Overlay
        const overlay = document.getElementById('fullscreen-overlay');
        overlay.addEventListener('click', () => {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('Fullscreen request failed', err);
                });
            }
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }, { once: true });

        // State
        let isEditMode = false;
        const storageKey = 'arcane-notes-layout-' + (document.getElementById('arcane-notes-metadata')?.textContent?.substring(0, 100).length || 'default');

        const preview = document.querySelector('.document-preview');
        const toggleEditBtn = document.getElementById('toggle-edit');
        const toggleOverlayMoveBtn = document.getElementById('toggle-overlay-move');
        const resetBtn = document.getElementById('reset-btn');
        const printBtn = document.getElementById('print-btn');

        // Wrap images for resizing
        const images = preview.querySelectorAll('img');
        images.forEach((img, idx) => {
            let wrapper = img.closest('[class*="group/img-container"]');
            
            if (!wrapper) {
                if (img.parentElement.classList.contains('image-wrapper')) return;
                
                wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper group/img-container';
                wrapper.id = 'img-wrapper-' + idx;
                
                const parent = img.parentElement;
                if (parent.classList.contains('text-center')) wrapper.style.margin = '0 auto';
                if (parent.classList.contains('text-right')) wrapper.style.marginLeft = 'auto';
                
                wrapper.style.width = img.style.width || '100%';
                img.style.width = '100%';
                
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            } else {
                wrapper.id = 'img-wrapper-' + idx;
                wrapper.classList.add('image-wrapper');
            }
            
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            wrapper.appendChild(handle);

            const toolbar = document.createElement('div');
            toolbar.className = 'image-toolbar';
            toolbar.innerHTML = \`
                <button class="img-btn" data-align="left" title="Align Left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
                </button>
                <button class="img-btn" data-align="center" title="Align Center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
                </button>
                <button class="img-btn" data-align="right" title="Align Right">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                </button>
            \`;
            wrapper.appendChild(toolbar);

            toolbar.querySelectorAll('.img-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const align = btn.dataset.align;
                    
                    wrapper.classList.remove('justify-start', 'justify-center', 'justify-end', 'flex', 'w-full', 'mb-4', 'my-4');
                    wrapper.style.float = '';
                    wrapper.style.marginRight = '';
                    wrapper.style.marginLeft = '';
                    wrapper.style.marginBottom = '';
                    
                    if (align === 'center') {
                        wrapper.classList.add('my-4', 'flex', 'w-full', 'justify-center');
                    } else {
                        wrapper.classList.add('mb-4');
                        wrapper.style.float = align;
                        if (align === 'left') wrapper.style.marginRight = '1.5rem';
                        if (align === 'right') wrapper.style.marginLeft = '1.5rem';
                        wrapper.style.marginBottom = '1rem';
                    }
                    saveLayout();
                });
            });

            wrapper.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                openImageSettings(wrapper, img);
            });
        });

        // Assign IDs to bricks for persistence
        const bricks = document.querySelectorAll('.document-preview > div > div');
        bricks.forEach((brick, idx) => {
            if (!brick.id) brick.id = 'brick-' + idx;
        });

        function openImageSettings(wrapper, img) {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'image-settings-modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'image-settings-modal';
            
            // Get current values
            const currentWidth = parseInt(wrapper.style.width) || 100;
            const hasBorder = img.parentElement.classList.contains('border-4');
            
            // Find caption
            let captionDiv = img.parentElement.querySelector('.italic');
            const currentCaption = captionDiv ? captionDiv.textContent.trim() : '';
            
            // Find alignment
            let currentAlign = 'center';
            if (wrapper.style.float === 'left') currentAlign = 'left';
            else if (wrapper.style.float === 'right') currentAlign = 'right';
            else if (wrapper.classList.contains('justify-start')) currentAlign = 'left';
            else if (wrapper.classList.contains('justify-end')) currentAlign = 'right';

            modal.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Image Properties</h3>
                    <button class="close-icon-btn" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #94a3b8;">&times;</button>
                </div>
                
                <label>Caption (Optional)</label>
                <input type="text" id="img-caption-input" value="\${currentCaption}" placeholder="Enter a caption...">
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label>Alignment</label>
                        <div class="btn-group" id="img-align-group">
                            <button data-align="left" class="\${currentAlign === 'left' ? 'active' : ''}">Left</button>
                            <button data-align="center" class="\${currentAlign === 'center' ? 'active' : ''}">Center</button>
                            <button data-align="right" class="\${currentAlign === 'right' ? 'active' : ''}">Right</button>
                        </div>
                    </div>
                    <div>
                        <label>Border Style</label>
                        <div class="btn-group" id="img-border-group">
                            <button data-border="none" class="\${!hasBorder ? 'active' : ''}">None</button>
                            <button data-border="solid" class="\${hasBorder ? 'active' : ''}">Solid</button>
                        </div>
                    </div>
                </div>
                
                <label>Width (<span id="img-width-val">\${currentWidth}</span>%)</label>
                <div class="slider-container">
                    <span style="font-size: 12px; font-weight: bold; color: #94a3b8;">10%</span>
                    <input type="range" id="img-width-slider" min="10" max="100" value="\${currentWidth}">
                    <span style="font-size: 12px; font-weight: bold; color: #94a3b8;">100%</span>
                </div>
                
                <button class="close-btn">Done</button>
            \`;
            
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
            
            // Event Listeners
            modal.querySelector('.close-icon-btn').addEventListener('click', () => modalOverlay.remove());
            modal.querySelector('.close-btn').addEventListener('click', () => modalOverlay.remove());
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) modalOverlay.remove();
            });
            
            // Caption
            const captionInput = modal.querySelector('#img-caption-input');
            captionInput.addEventListener('input', (e) => {
                const newText = e.target.value;
                if (newText) {
                    if (!captionDiv) {
                        captionDiv = document.createElement('div');
                        captionDiv.className = 'p-2 text-center text-sm text-slate-600 italic bg-slate-50/80 backdrop-blur-sm border-t border-slate-100';
                        img.parentElement.appendChild(captionDiv);
                    }
                    captionDiv.textContent = newText;
                } else {
                    if (captionDiv) {
                        captionDiv.remove();
                        captionDiv = null;
                    }
                }
                saveLayout();
            });
            
            // Alignment
            modal.querySelectorAll('#img-align-group button').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('#img-align-group button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const align = btn.dataset.align;
                    
                    wrapper.classList.remove('justify-start', 'justify-center', 'justify-end', 'flex', 'w-full', 'mb-4', 'my-4');
                    wrapper.style.float = '';
                    wrapper.style.marginRight = '';
                    wrapper.style.marginLeft = '';
                    wrapper.style.marginBottom = '';
                    
                    if (align === 'center') {
                        wrapper.classList.add('my-4', 'flex', 'w-full', 'justify-center');
                    } else {
                        wrapper.classList.add('mb-4');
                        wrapper.style.float = align;
                        if (align === 'left') wrapper.style.marginRight = '1.5rem';
                        if (align === 'right') wrapper.style.marginLeft = '1.5rem';
                        wrapper.style.marginBottom = '1rem';
                    }
                    saveLayout();
                });
            });
            
            // Border
            modal.querySelectorAll('#img-border-group button').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.querySelectorAll('#img-border-group button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const border = btn.dataset.border;
                    
                    if (border === 'solid') {
                        img.parentElement.classList.add('border-4', 'border-slate-800', 'p-1', 'bg-white', 'shadow-lg');
                        img.classList.remove('shadow-md', 'border', 'border-slate-200');
                    } else {
                        img.parentElement.classList.remove('border-4', 'border-slate-800', 'p-1', 'bg-white', 'shadow-lg');
                        img.classList.add('shadow-md', 'border', 'border-slate-200');
                    }
                    saveLayout();
                });
            });
            
            // Width
            const widthSlider = modal.querySelector('#img-width-slider');
            const widthVal = modal.querySelector('#img-width-val');
            widthSlider.addEventListener('input', (e) => {
                const w = e.target.value;
                widthVal.textContent = w;
                wrapper.style.width = w + '%';
                saveLayout();
            });
        }

        function saveLayout() {
            const layout = {
                bricks: {},
                images: {},
                overlays: {},
                textSize: document.getElementById('text-size-display')?.textContent?.replace('%', '') || 100
            };
            
            document.querySelectorAll('.document-preview > div > div').forEach(brick => {
                layout.bricks[brick.id] = {
                    x: brick.getAttribute('data-x'),
                    y: brick.getAttribute('data-y')
                };
            });
            
            document.querySelectorAll('.image-wrapper').forEach(wrapper => {
                const img = wrapper.querySelector('img');
                if (!img) return;
                
                const captionDiv = img.parentElement.querySelector('.italic');
                
                let align = 'center';
                if (wrapper.style.float === 'left') align = 'left';
                else if (wrapper.style.float === 'right') align = 'right';
                else if (wrapper.classList.contains('justify-start')) align = 'left';
                else if (wrapper.classList.contains('justify-end')) align = 'right';
                
                layout.images[wrapper.id] = {
                    width: wrapper.style.width,
                    height: wrapper.style.height,
                    margin: wrapper.style.margin,
                    marginLeft: wrapper.style.marginLeft,
                    marginRight: wrapper.style.marginRight,
                    marginBottom: wrapper.style.marginBottom,
                    float: wrapper.style.float,
                    x: wrapper.getAttribute('data-x'),
                    y: wrapper.getAttribute('data-y'),
                    caption: captionDiv ? captionDiv.textContent : '',
                    hasBorder: img.parentElement.classList.contains('border-4'),
                    align: align
                };
            });

            document.querySelectorAll('.overlay-video-draggable').forEach((draggable) => {
                const id = draggable.getAttribute('data-overlay-id');
                layout.overlays[id] = {
                    x: draggable.getAttribute('data-x'),
                    y: draggable.getAttribute('data-y'),
                    size: draggable.style.width,
                    removed: draggable.getAttribute('data-removed') === 'true'
                };
            });
            
            localStorage.setItem(storageKey, JSON.stringify(layout));
        }

        function loadLayout() {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return;
            
            const layout = JSON.parse(saved);
            
            Object.keys(layout.bricks).forEach(id => {
                const el = document.getElementById(id);
                if (el && layout.bricks[id].x) {
                    el.style.transform = \`translate(\${layout.bricks[id].x}px, \${layout.bricks[id].y}px)\`;
                    el.setAttribute('data-x', layout.bricks[id].x);
                    el.setAttribute('data-y', layout.bricks[id].y);
                }
            });
            
            Object.keys(layout.images).forEach(id => {
                const wrapper = document.getElementById(id);
                if (wrapper) {
                    const imgData = layout.images[id];
                    if (imgData.width) wrapper.style.width = imgData.width;
                    if (imgData.height) wrapper.style.height = imgData.height;
                    if (imgData.margin) wrapper.style.margin = imgData.margin;
                    if (imgData.marginLeft) wrapper.style.marginLeft = imgData.marginLeft;
                    if (imgData.marginRight) wrapper.style.marginRight = imgData.marginRight;
                    if (imgData.marginBottom) wrapper.style.marginBottom = imgData.marginBottom;
                    if (imgData.float) wrapper.style.float = imgData.float;
                    
                    if (imgData.x) {
                        wrapper.style.transform = \`translate(\${imgData.x}px, \${imgData.y}px)\`;
                        wrapper.setAttribute('data-x', imgData.x);
                        wrapper.setAttribute('data-y', imgData.y);
                    }
                    
                    const img = wrapper.querySelector('img');
                    if (img) {
                        if (imgData.hasBorder !== undefined) {
                            if (imgData.hasBorder) {
                                img.parentElement.classList.add('border-4', 'border-slate-800', 'p-1', 'bg-white', 'shadow-lg');
                                img.classList.remove('shadow-md', 'border', 'border-slate-200');
                            } else {
                                img.parentElement.classList.remove('border-4', 'border-slate-800', 'p-1', 'bg-white', 'shadow-lg');
                                img.classList.add('shadow-md', 'border', 'border-slate-200');
                            }
                        }
                        
                        if (imgData.align) {
                            wrapper.classList.remove('justify-start', 'justify-center', 'justify-end', 'flex', 'w-full', 'mb-4', 'my-4');
                            if (imgData.align === 'center') {
                                wrapper.classList.add('my-4', 'flex', 'w-full', 'justify-center');
                            } else {
                                wrapper.classList.add('mb-4');
                            }
                        }
                        
                        if (imgData.caption !== undefined) {
                            let captionDiv = img.parentElement.querySelector('.italic');
                            
                            if (imgData.caption) {
                                if (!captionDiv) {
                                    captionDiv = document.createElement('div');
                                    captionDiv.className = 'p-2 text-center text-sm text-slate-600 italic bg-slate-50/80 backdrop-blur-sm border-t border-slate-100';
                                    img.parentElement.appendChild(captionDiv);
                                }
                                captionDiv.textContent = imgData.caption;
                            } else if (captionDiv) {
                                captionDiv.remove();
                            }
                        }
                    }
                }
            });

            if (layout.overlays) {
                Object.keys(layout.overlays).forEach(id => {
                    const el = document.querySelector(\`.overlay-video-draggable[data-overlay-id="\${id}"]\`);
                    if (el) {
                        const data = layout.overlays[id];
                        if (data.removed) {
                            el.style.display = 'none';
                            el.setAttribute('data-removed', 'true');
                        }
                        if (data.size) {
                            el.style.width = data.size;
                            el.style.height = data.size;
                            if (data.x === undefined || data.x === 0 || data.x === '0') {
                                const s = parseInt(data.size);
                                el.style.marginLeft = -(s / 2) + 'px';
                            }
                        }
                        if (data.x !== undefined && data.y !== undefined) {
                            el.style.transform = \`translate(\${data.x}px, \${data.y}px)\`;
                            el.setAttribute('data-x', data.x);
                            el.setAttribute('data-y', data.y);
                        }
                    }
                });
            }
        }

        // Initialize Interact.js
        function initInteractions() {
            interact('.document-preview > div > div').draggable({
                enabled: isEditMode,
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = \`translate(\${x}px, \${y}px)\`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end() {
                        saveLayout();
                    }
                }
            });

            interact('.image-wrapper').resizable({
                enabled: isEditMode,
                edges: { right: true, bottom: true, bottomRight: '.resize-handle' },
                modifiers: [
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 },
                        max: { width: 1200, height: 2000 }
                    })
                ],
                listeners: {
                    move(event) {
                        let { x, y } = event.target.dataset;
                        x = (parseFloat(x) || 0) + event.deltaRect.left;
                        y = (parseFloat(y) || 0) + event.deltaRect.top;

                        Object.assign(event.target.style, {
                            width: \`\${event.rect.width}px\`,
                            height: \`\${event.rect.height}px\`,
                            transform: \`translate(\${x}px, \${y}px)\`
                        });

                        Object.assign(event.target.dataset, { x, y });
                    },
                    end() {
                        saveLayout();
                    }
                }
            }).draggable({
                enabled: isEditMode,
                listeners: {
                    move(event) {
                        const target = event.target;
                        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                        target.style.transform = \`translate(\${x}px, \${y}px)\`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end() {
                        saveLayout();
                    }
                }
            });
        }

        toggleEditBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            document.body.classList.toggle('edit-mode', isEditMode);
            toggleEditBtn.classList.toggle('active', isEditMode);
            
            interact('.document-preview > div > div').draggable({ enabled: isEditMode });
            interact('.image-wrapper').resizable({ enabled: isEditMode }).draggable({ enabled: isEditMode });
        });

        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all layout changes?')) {
                localStorage.removeItem(storageKey);
                window.location.reload();
            }
        });

        printBtn.addEventListener('click', () => {
            window.print();
        });

        // Zoom functionality
        let currentZoom = 1;
        const minZoom = 0.2;
        const maxZoom = 5;
        const zoomStep = 0.1;

        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomLevelDisplay = document.getElementById('zoom-level');

        function applyZoom() {
            zoomLevelDisplay.textContent = Math.round(currentZoom * 100) + '%';
            
            preview.style.transform = \`scale(\${currentZoom})\`;
            
            const containerWidth = document.querySelector('.export-container').offsetWidth;
            const scaledWidth = preview.offsetWidth * currentZoom;
            
            if (scaledWidth > containerWidth) {
                preview.style.transformOrigin = 'top left';
                preview.style.marginLeft = '0';
                preview.style.marginRight = \`\${scaledWidth - preview.offsetWidth}px\`;
            } else {
                preview.style.transformOrigin = 'top center';
                preview.style.marginLeft = 'auto';
                preview.style.marginRight = 'auto';
            }
            
            const scaledHeight = preview.offsetHeight * currentZoom;
            preview.style.marginBottom = \`\${scaledHeight - preview.offsetHeight}px\`;
        }

        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
            applyZoom();
        });

        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(minZoom, currentZoom - zoomStep);
            applyZoom();
        });

        document.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const zoomMultiplier = e.deltaY > 0 ? 0.9 : 1.1;
                currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomMultiplier));
                applyZoom();
            }
        }, { passive: false });

        // Initialize Explanation Popovers
        function initExplanations() {
            const wrappers = document.querySelectorAll('.explanation-wrapper');
            wrappers.forEach(wrapper => {
                const btn = wrapper.querySelector('.explanation-btn');
                const popover = wrapper.querySelector('.explanation-popover');
                
                if (btn && popover) {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isHidden = popover.classList.contains('hidden');
                        // Close all others
                        document.querySelectorAll('.explanation-popover').forEach(p => p.classList.add('hidden'));
                        if (isHidden) {
                            popover.classList.remove('hidden');
                        }
                    });
                }
            });
            
            // Close popovers when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.explanation-wrapper')) {
                    document.querySelectorAll('.explanation-popover').forEach(p => p.classList.add('hidden'));
                }
            });
        }

        // Initialize Memory Links
        function initMemoryLinks() {
            const memoryLinks = document.querySelectorAll('[data-memory-link]');
            if (memoryLinks.length === 0) return;
            
            // Parse metadata to get fullData
            let fullData = [];
            let theme = 'modern';
            try {
                const metadataEl = document.getElementById('arcane-notes-metadata');
                if (metadataEl) {
                    const metadata = JSON.parse(metadataEl.textContent);
                    fullData = metadata.parsedData || [];
                    theme = metadata.theme || 'modern';
                }
            } catch (e) {
                console.error('Failed to parse metadata for memory links', e);
            }

            // Create a single popover container
            const popoverContainer = document.createElement('div');
            popoverContainer.className = 'memory-link-popover hidden theme-' + theme;
            document.body.appendChild(popoverContainer);

            // Add styles for the popover
            const style = document.createElement('style');
            style.textContent = \`
                .memory-link-popover {
                    position: fixed;
                    z-index: 9999;
                    width: 320px;
                    max-height: 400px;
                    overflow-y: auto;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    transition: all 0.3s;
                    font-family: sans-serif;
                }
                .memory-link-popover.hidden {
                    display: none;
                }
                .memory-link-popover.theme-cyberpunk {
                    background: black;
                    border: 1px solid #06b6d4;
                    border-radius: 0;
                    box-shadow: 0 0 30px rgba(6,182,212,0.3);
                    color: white;
                }
                .memory-link-popover.theme-terminal {
                    background: black;
                    border: 1px solid #22c55e;
                    border-radius: 0;
                    box-shadow: 0 0 20px rgba(34,197,94,0.2);
                    color: #22c55e;
                }
                .memory-link-popover.theme-vintage {
                    background: #fdfbf7;
                    border: 1px solid #d4c5a1;
                    border-radius: 2px;
                }
                .memory-link-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .memory-link-title {
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .theme-modern .memory-link-title { color: #0f172a; }
                .theme-cyberpunk .memory-link-title { color: #22d3ee; }
                .theme-terminal .memory-link-title { color: #22c55e; }
                .memory-link-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 8px;
                    color: #94a3b8;
                }
                .memory-link-close:hover {
                    background: rgba(0,0,0,0.05);
                }
                .theme-cyberpunk .memory-link-close:hover { background: rgba(6,182,212,0.2); }
                .theme-terminal .memory-link-close:hover { background: rgba(34,197,94,0.2); }
                .memory-link-item {
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    background: #f8fafc;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .theme-cyberpunk .memory-link-item {
                    background: rgba(8, 145, 178, 0.2);
                    border-color: rgba(6, 182, 212, 0.3);
                }
                .theme-terminal .memory-link-item {
                    background: rgba(21, 128, 61, 0.2);
                    border-color: rgba(34, 197, 94, 0.3);
                }
                .theme-vintage .memory-link-item {
                    background: #fff;
                    border-color: #e5e7eb;
                }
                .memory-link-item:hover {
                    border-color: #bfdbfe;
                    background: #eff6ff;
                }
                .theme-cyberpunk .memory-link-item:hover {
                    background: rgba(8, 145, 178, 0.4);
                    border-color: #22d3ee;
                }
                .theme-terminal .memory-link-item:hover {
                    background: rgba(21, 128, 61, 0.4);
                    border-color: #4ade80;
                }
                .memory-link-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }
                .memory-link-group {
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: #dbeafe;
                    color: #1d4ed8;
                }
                .theme-cyberpunk .memory-link-group { background: rgba(6,182,212,0.2); color: #22d3ee; }
                .theme-terminal .memory-link-group { background: rgba(34,197,94,0.2); color: #4ade80; }
                .memory-link-type {
                    font-size: 10px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: 500;
                }
                .memory-link-text {
                    font-size: 12px;
                    line-height: 1.6;
                    color: #475569;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .theme-cyberpunk .memory-link-text { color: rgba(207, 250, 254, 0.8); }
                .theme-terminal .memory-link-text { color: rgba(134, 239, 172, 0.8); }
                .memory-link-empty {
                    font-size: 14px;
                    color: #64748b;
                    font-style: italic;
                }
            \`;
            document.head.appendChild(style);

            function getOccurrences(concept) {
                const results = [];
                if (!Array.isArray(fullData)) return results;

                fullData.forEach((group, groupIdx) => {
                    if (group.GROUP && Array.isArray(group.ITEMS)) {
                        const groupName = group.GROUP || 'Untitled Group';
                        group.ITEMS.forEach((item, itemIdx) => {
                            const content = String(item.CONTENT || '');
                            const isMention = content.includes('[[' + concept + ']]');
                            const isDefinition = item.TYPE === 'CONCEPT' && content.trim().toLowerCase() === concept.trim().toLowerCase();
                            
                            if (isMention || isDefinition) {
                                const cleanText = content
                                    .replace(/\\[\\[([^\\]]+)\\]\\]/g, '$1')
                                    .replace(/\\[([^\\]]+)\\]\\{([^}]+)\\}/g, '$1');
                                
                                results.push({
                                    group: groupName,
                                    text: cleanText,
                                    type: item.TYPE,
                                    path: item.id || 'root.' + groupIdx + '.' + itemIdx
                                });
                            }
                        });
                    } else {
                        const content = String(group.CONTENT || '');
                        const isMention = content.includes('[[' + concept + ']]');
                        const isDefinition = group.TYPE === 'CONCEPT' && content.trim().toLowerCase() === concept.trim().toLowerCase();
                        
                        if (isMention || isDefinition) {
                            const cleanText = content
                                .replace(/\\[\\[([^\\]]+)\\]\\]/g, '$1')
                                .replace(/\\[([^\\]]+)\\]\\{([^}]+)\\}/g, '$1');
                            
                            results.push({
                                group: 'General',
                                text: cleanText,
                                type: group.TYPE || 'ITEM',
                                path: group.id || 'root.' + groupIdx
                            });
                        }
                    }
                });
                return results;
            }

            function handleNavigate(path) {
                popoverContainer.classList.add('hidden');
                setTimeout(() => {
                    const sanitizedPath = path.replace(/\\s+/g, '_');
                    const elementId = 'doc-item-' + sanitizedPath;
                    const element = document.getElementById(elementId);
                    
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Add highlight
                        const originalOutline = element.style.outline;
                        const originalOutlineOffset = element.style.outlineOffset;
                        const originalTransition = element.style.transition;
                        
                        element.style.transition = 'all 0.5s';
                        element.style.outline = '4px solid rgba(59, 130, 246, 0.5)';
                        element.style.outlineOffset = '4px';
                        
                        setTimeout(() => {
                            element.style.outline = originalOutline;
                            element.style.outlineOffset = originalOutlineOffset;
                            setTimeout(() => {
                                element.style.transition = originalTransition;
                            }, 500);
                        }, 2000);
                    }
                }, 100);
            }

            memoryLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const concept = link.getAttribute('data-memory-link');
                    if (!concept) return;

                    const occurrences = getOccurrences(concept);
                    
                    let itemsHtml = '';
                    if (occurrences.length <= 1) {
                        itemsHtml = '<p class="memory-link-empty">No other occurrences found.</p>';
                    } else {
                        itemsHtml = occurrences.map((occ, idx) => \`
                            <div class="memory-link-item" data-path="\${occ.path}">
                                <div class="memory-link-meta">
                                    <span class="memory-link-group">\${occ.group}</span>
                                    <span class="memory-link-type">\${occ.type}</span>
                                </div>
                                <p class="memory-link-text">\${occ.text}</p>
                            </div>
                        \`).join('');
                    }

                    popoverContainer.innerHTML = \`
                        <div class="memory-link-header">
                            <div class="memory-link-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path><path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path><path d="M19.938 10.5a4 4 0 0 1 .585.396"></path><path d="M6 18a4 4 0 0 1-1.967-.516"></path><path d="M19.967 17.484A4 4 0 0 1 18 18"></path></svg>
                                Memory Links: \${concept}
                            </div>
                            <button class="memory-link-close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div class="memory-link-content">
                            \${itemsHtml}
                        </div>
                    \`;

                    popoverContainer.classList.remove('hidden');

                    // Add event listeners to new elements
                    popoverContainer.querySelector('.memory-link-close').addEventListener('click', () => {
                        popoverContainer.classList.add('hidden');
                    });

                    popoverContainer.querySelectorAll('.memory-link-item').forEach(item => {
                        item.addEventListener('click', () => {
                            handleNavigate(item.getAttribute('data-path'));
                        });
                    });
                });
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!popoverContainer.contains(e.target) && !e.target.closest('[data-memory-link]')) {
                    popoverContainer.classList.add('hidden');
                }
            });
        }

        function initTextResizer() {
            const resizeBar = document.getElementById('text-resize-bar');
            const btnDecrease = document.getElementById('btn-text-decrease');
            const btnIncrease = document.getElementById('btn-text-increase');
            const display = document.getElementById('text-size-display');
            
            let currentScale = 100;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const layout = JSON.parse(saved);
                    if (layout.textSize) currentScale = parseInt(layout.textSize, 10);
                } catch (e) {}
            }
            
            const minScale = 50;
            const maxScale = 300;
            const step = 10;
            
            function updateFontSize() {
                display.textContent = currentScale + '%';
                // Change root html font size to scale rem units
                document.documentElement.style.fontSize = (16 * (currentScale / 100)) + 'px';
                saveLayout();
            }
            
            // Initial update
            updateFontSize();
            
            btnDecrease.addEventListener('click', () => {
                if (currentScale > minScale) {
                    currentScale -= step;
                    updateFontSize();
                }
            });
            
            btnIncrease.addEventListener('click', () => {
                if (currentScale < maxScale) {
                    currentScale += step;
                    updateFontSize();
                }
            });
            
            // Make it draggable using interact.js
            if (typeof interact !== 'undefined') {
                interact('.text-resize-bar').draggable({
                    allowFrom: '.resize-handle',
                    inertia: true,
                    modifiers: [
                        interact.modifiers.restrictRect({
                            restriction: 'body',
                            endOnly: true
                        })
                    ],
                    autoScroll: true,
                    listeners: {
                        move(event) {
                            const target = event.target;
                            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                            target.style.transform = \`translate(\${x}px, \${y}px)\`;

                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        }
                    }
                });
            }
        }

        function initInteractiveElements() {
            // MCQ Interactivity
            document.querySelectorAll('.mcq-container').forEach(container => {
                const options = container.querySelectorAll('.mcq-option');
                const submitBtn = container.querySelector('.mcq-submit-btn');
                const resetBtn = container.querySelector('.mcq-reset-btn');
                const actionsDiv = container.querySelector('.mcq-actions');
                const feedbackDiv = container.querySelector('.mcq-feedback');
                const answer = container.getAttribute('data-mcq-answer');
                const theme = container.getAttribute('data-theme');
                
                let selectedOption = null;
                let isSubmitted = false;

                function updateOptionsUI() {
                    options.forEach(opt => {
                        const optValue = opt.getAttribute('data-option');
                        const isSelected = selectedOption === optValue;
                        const isCorrect = optValue === answer;
                        
                        // Reset to base classes
                        opt.className = 'mcq-option w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between';
                        if (theme === 'minecraft') opt.classList.add('rounded-none', 'border-4');
                        if (theme === 'undertale') opt.classList.add('rounded-none', 'border-4', 'font-retro');
                        if (theme === 'comic') opt.classList.add('rounded-none', 'border-2', 'font-bold');

                        if (!isSubmitted) {
                            if (isSelected) {
                                opt.classList.add('selected');
                                if (theme === 'cyberpunk') opt.classList.add('border-cyan-400', 'bg-cyan-900/30', 'text-cyan-300');
                                else if (theme === 'terminal') opt.classList.add('border-green-400', 'bg-green-900/30', 'text-green-400');
                                else if (theme === 'undertale') opt.classList.add('border-yellow-400', 'text-yellow-400');
                                else if (theme === 'comic') opt.classList.add('border-black', 'bg-yellow-200', 'shadow-[4px_4px_0_rgba(0,0,0,1)]', 'translate-x-[-2px]', 'translate-y-[-2px]');
                                else opt.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
                            } else {
                                if (theme === 'cyberpunk') opt.classList.add('border-slate-800', 'hover:border-cyan-500/50', 'text-slate-300');
                                else if (theme === 'terminal') opt.classList.add('border-green-900', 'hover:border-green-500', 'text-green-600');
                                else if (theme === 'undertale') opt.classList.add('border-white', 'text-white', 'hover:border-yellow-200');
                                else if (theme === 'comic') opt.classList.add('border-black', 'shadow-[2px_2px_0_rgba(0,0,0,1)]', 'hover:shadow-[4px_4px_0_rgba(0,0,0,1)]', 'hover:translate-x-[-2px]', 'hover:translate-y-[-2px]');
                                else opt.classList.add('border-slate-200', 'hover:border-blue-300', 'hover:bg-slate-50');
                            }
                        } else {
                            if (isCorrect) {
                                opt.classList.add('correct', 'font-medium');
                                if (theme === 'cyberpunk') opt.classList.add('border-green-400', 'bg-green-900/30', 'text-green-300');
                                else if (theme === 'terminal') opt.classList.add('border-green-400', 'bg-green-900/30', 'text-green-400');
                                else if (theme === 'undertale') opt.classList.add('border-green-400', 'text-green-400');
                                else if (theme === 'comic') opt.classList.add('border-black', 'bg-green-300', 'shadow-[2px_2px_0_rgba(0,0,0,1)]');
                                else opt.classList.add('border-green-500', 'bg-green-50', 'text-green-700');
                            } else if (isSelected && !isCorrect) {
                                opt.classList.add('incorrect');
                                if (theme === 'cyberpunk') opt.classList.add('border-red-400', 'bg-red-900/30', 'text-red-300');
                                else if (theme === 'terminal') opt.classList.add('border-red-400', 'bg-red-900/30', 'text-red-400');
                                else if (theme === 'undertale') opt.classList.add('border-red-400', 'text-red-400');
                                else if (theme === 'comic') opt.classList.add('border-black', 'bg-red-300', 'shadow-[2px_2px_0_rgba(0,0,0,1)]');
                                else opt.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
                            } else {
                                opt.classList.add('opacity-50');
                                if (theme === 'cyberpunk') opt.classList.add('border-slate-800');
                                else if (theme === 'terminal') opt.classList.add('border-green-900');
                                else if (theme === 'undertale') opt.classList.add('border-white');
                                else if (theme === 'comic') opt.classList.add('border-black');
                                else opt.classList.add('border-slate-200');
                            }
                        }
                        
                        // Update icons
                        const iconContainer = opt.querySelector('.mcq-icon-container');
                        if (iconContainer) {
                            iconContainer.innerHTML = '';
                            if (isSubmitted) {
                                if (isCorrect) {
                                    iconContainer.innerHTML = '<svg class="w-5 h-5 text-green-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                } else if (isSelected && !isCorrect) {
                                    iconContainer.innerHTML = '<svg class="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                                }
                            }
                        }
                    });

                    if (submitBtn) {
                        submitBtn.disabled = !selectedOption;
                        submitBtn.className = 'mcq-submit-btn px-6 py-2.5 rounded-xl font-bold transition-all';
                        if (!selectedOption) {
                            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            if (theme === 'cyberpunk') submitBtn.classList.add('bg-slate-800', 'text-slate-500');
                            else if (theme === 'terminal') submitBtn.classList.add('bg-green-900/50', 'text-green-700');
                            else if (theme === 'undertale') submitBtn.classList.add('rounded-none', 'border-4', 'border-white', 'bg-black', 'text-white', 'font-retro');
                            else if (theme === 'comic') submitBtn.classList.add('bg-slate-200', 'text-slate-500', 'border-2', 'border-black');
                            else submitBtn.classList.add('bg-slate-100', 'text-slate-400');
                        } else {
                            if (theme === 'cyberpunk') submitBtn.classList.add('bg-cyan-500', 'text-black', 'hover:bg-cyan-400', 'shadow-[0_0_15px_rgba(6,182,212,0.5)]');
                            else if (theme === 'terminal') submitBtn.classList.add('bg-green-500', 'text-black', 'hover:bg-green-400');
                            else if (theme === 'undertale') submitBtn.classList.add('rounded-none', 'border-4', 'border-white', 'bg-black', 'text-white', 'hover:border-yellow-400', 'hover:text-yellow-400', 'font-retro');
                            else if (theme === 'comic') submitBtn.classList.add('bg-blue-500', 'text-white', 'border-2', 'border-black', 'shadow-[4px_4px_0_rgba(0,0,0,1)]', 'hover:translate-x-[-2px]', 'hover:translate-y-[-2px]', 'hover:shadow-[6px_6px_0_rgba(0,0,0,1)]');
                            else submitBtn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700', 'active:scale-95', 'shadow-md', 'hover:shadow-lg');
                        }
                    }
                }

                options.forEach(opt => {
                    opt.addEventListener('click', () => {
                        if (isSubmitted) return;
                        selectedOption = opt.getAttribute('data-option');
                        updateOptionsUI();
                    });
                });

                if (submitBtn) {
                    submitBtn.addEventListener('click', () => {
                        if (!selectedOption || isSubmitted) return;
                        isSubmitted = true;
                        updateOptionsUI();
                        
                        // Update feedback box
                        if (feedbackDiv) {
                            const isCorrect = selectedOption === answer;
                            const feedbackBox = feedbackDiv.querySelector('.mcq-feedback-box');
                            const feedbackIcon = feedbackDiv.querySelector('.mcq-feedback-icon');
                            const feedbackTitle = feedbackDiv.querySelector('.mcq-feedback-title');
                            
                            if (feedbackBox) {
                                feedbackBox.className = 'p-4 sm:p-6 rounded-2xl border-2 mt-4 mcq-feedback-box relative overflow-hidden';
                                const isDarkTheme = ['cyberpunk', 'terminal', 'undertale', 'god-of-war', 'minecraft'].includes(theme);
                                
                                if (isCorrect) {
                                    if (isDarkTheme) {
                                        feedbackBox.classList.add('bg-green-900/40', 'border-green-800');
                                    } else {
                                        feedbackBox.classList.add('bg-green-50', 'border-green-200');
                                    }
                                } else {
                                    if (isDarkTheme) {
                                        feedbackBox.classList.add('bg-red-900/40', 'border-red-800');
                                    } else {
                                        feedbackBox.classList.add('bg-red-50', 'border-red-200');
                                    }
                                }
                                
                                const feedbackContent = feedbackBox.querySelector('.mcq-feedback-content');
                                
                                if (theme === 'cyberpunk') {
                                    feedbackBox.classList.add('shadow-[0_0_30px_rgba(6,182,212,0.1)]', 'backdrop-blur-xl');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-cyan-100 opacity-90';
                                } else if (theme === 'terminal') {
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-green-400 opacity-90';
                                } else if (theme === 'undertale') {
                                    feedbackBox.classList.add('border-4', 'rounded-none');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-white font-retro opacity-90';
                                } else if (theme === 'comic') {
                                    feedbackBox.classList.add('border-4', 'border-black', 'shadow-[8px_8px_0_rgba(0,0,0,1)]', 'rounded-none');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-black font-black opacity-90';
                                } else if (theme === 'vintage') {
                                    feedbackBox.classList.add('border-4', 'border-double');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-[#4a3728] opacity-90';
                                } else if (theme === 'ethereal') {
                                    feedbackBox.classList.add('backdrop-blur-xl');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-indigo-900 opacity-90';
                                } else if (theme === 'prism') {
                                    feedbackBox.classList.add('backdrop-blur-md');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-slate-900 opacity-90';
                                } else if (theme === 'minecraft') {
                                    feedbackBox.classList.add('border-4');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-[#373737] font-pixel opacity-90';
                                } else {
                                    feedbackBox.classList.add('shadow-lg');
                                    if (feedbackContent) feedbackContent.className = 'mcq-feedback-content text-sm sm:text-base leading-relaxed text-slate-900 opacity-90';
                                }
                            }
                            
                            if (feedbackIcon) {
                                feedbackIcon.className = 'mcq-feedback-icon p-2 rounded-xl shrink-0 shadow-md text-white ' + (isCorrect ? 'bg-emerald-500' : 'bg-red-500');
                                if (isCorrect) {
                                    feedbackIcon.innerHTML = '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                                } else {
                                    feedbackIcon.innerHTML = '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                                }
                            }
                            
                            if (feedbackTitle) {
                                feedbackTitle.textContent = isCorrect ? "Correct Analysis" : "Incorrect Analysis";
                                feedbackTitle.className = 'mcq-feedback-title text-lg font-black uppercase tracking-widest mb-1';
                                
                                if (theme === 'cyberpunk') feedbackTitle.classList.add('text-cyan-400');
                                else if (theme === 'terminal') feedbackTitle.classList.add('text-green-500');
                                else if (theme === 'undertale') feedbackTitle.classList.add('text-white', 'font-retro');
                                else if (theme === 'comic') feedbackTitle.classList.add('text-black', 'font-black');
                                else if (theme === 'vintage') feedbackTitle.classList.add('text-[#8b4513]');
                                else if (theme === 'ethereal') feedbackTitle.classList.add('text-indigo-900');
                                else if (theme === 'minecraft') feedbackTitle.classList.add('text-[#373737]', 'font-pixel');
                                else feedbackTitle.classList.add('text-slate-900');
                            }
                            
                            actionsDiv.classList.add('hidden');
                            actionsDiv.classList.remove('block');
                            feedbackDiv.classList.remove('hidden');
                            feedbackDiv.classList.add('block');
                        }
                    });
                }

                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        selectedOption = null;
                        isSubmitted = false;
                        updateOptionsUI();
                        if (actionsDiv) {
                            actionsDiv.classList.remove('hidden');
                            actionsDiv.classList.add('block');
                        }
                        if (feedbackDiv) {
                            feedbackDiv.classList.add('hidden');
                            feedbackDiv.classList.remove('block');
                        }
                    });
                }

                // Initial UI sync
                updateOptionsUI();
                if (actionsDiv) {
                    actionsDiv.classList.remove('hidden');
                    actionsDiv.classList.add('block');
                }
                if (feedbackDiv) {
                    feedbackDiv.classList.add('hidden');
                    feedbackDiv.classList.remove('block');
                }
            });

            // Essay Interactivity
            document.querySelectorAll('.essay-container').forEach(container => {
                const textarea = container.querySelector('.essay-textarea');
                const submitBtn = container.querySelector('.essay-submit-btn');
                const resetBtn = container.querySelector('.essay-reset-btn');
                const actionsDiv = container.querySelector('.essay-actions');
                const feedbackDiv = container.querySelector('.essay-feedback');
                const theme = container.getAttribute('data-theme');
                
                let isSubmitted = false;

                function updateEssayUI() {
                    if (textarea) {
                        textarea.disabled = isSubmitted;
                        if (isSubmitted) {
                            textarea.classList.add('opacity-70', 'cursor-not-allowed');
                        } else {
                            textarea.classList.remove('opacity-70', 'cursor-not-allowed');
                        }
                    }

                    if (submitBtn) {
                        const hasText = textarea && textarea.value.trim().length > 0;
                        submitBtn.disabled = !hasText;
                        submitBtn.className = 'essay-submit-btn px-6 py-2.5 rounded-xl font-bold transition-all';
                        
                        if (!hasText) {
                            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                            if (theme === 'cyberpunk') submitBtn.classList.add('bg-slate-800', 'text-slate-500');
                            else if (theme === 'terminal') submitBtn.classList.add('bg-green-900/50', 'text-green-700');
                            else if (theme === 'undertale') submitBtn.classList.add('rounded-none', 'border-4', 'border-white', 'bg-black', 'text-white', 'font-retro');
                            else if (theme === 'comic') submitBtn.classList.add('bg-slate-200', 'text-slate-500', 'border-2', 'border-black');
                            else submitBtn.classList.add('bg-slate-100', 'text-slate-400');
                        } else {
                            if (theme === 'cyberpunk') submitBtn.classList.add('bg-fuchsia-500', 'text-black', 'hover:bg-fuchsia-400', 'shadow-[0_0_15px_rgba(217,70,239,0.5)]');
                            else if (theme === 'terminal') submitBtn.classList.add('bg-green-500', 'text-black', 'hover:bg-green-400');
                            else if (theme === 'undertale') submitBtn.classList.add('rounded-none', 'border-4', 'border-white', 'bg-black', 'text-white', 'hover:border-yellow-400', 'hover:text-yellow-400', 'font-retro');
                            else if (theme === 'comic') submitBtn.classList.add('bg-purple-500', 'text-white', 'border-2', 'border-black', 'shadow-[4px_4px_0_rgba(0,0,0,1)]', 'hover:translate-x-[-2px]', 'hover:translate-y-[-2px]', 'hover:shadow-[6px_6px_0_rgba(0,0,0,1)]');
                            else submitBtn.classList.add('bg-purple-600', 'text-white', 'hover:bg-purple-700', 'active:scale-95', 'shadow-md', 'hover:shadow-lg');
                        }
                    }
                }

                if (textarea) {
                    textarea.addEventListener('input', () => {
                        if (!isSubmitted) updateEssayUI();
                    });
                }

                if (submitBtn) {
                    submitBtn.addEventListener('click', () => {
                        if (isSubmitted || !textarea || !textarea.value.trim()) return;
                        isSubmitted = true;
                        updateEssayUI();
                        
                        if (actionsDiv) {
                            actionsDiv.classList.add('hidden');
                            actionsDiv.classList.remove('block');
                        }
                        if (feedbackDiv) {
                            feedbackDiv.classList.remove('hidden');
                            feedbackDiv.classList.add('block');
                            
                            // Style the main feedback container
                            feedbackDiv.className = 'essay-feedback p-4 sm:p-6 rounded-2xl border-2 mt-4';
                            if (theme === 'cyberpunk') feedbackDiv.classList.add('bg-black', 'border-fuchsia-500', 'shadow-[0_0_20px_rgba(217,70,239,0.2)]');
                            else if (theme === 'terminal') feedbackDiv.classList.add('bg-black', 'border-green-500');
                            else if (theme === 'undertale') feedbackDiv.classList.add('bg-black', 'border-4', 'border-white', 'rounded-none');
                            else if (theme === 'comic') feedbackDiv.classList.add('bg-white', 'border-4', 'border-black', 'shadow-[8px_8px_0_rgba(0,0,0,1)]', 'rounded-none');
                            else if (theme === 'vintage') feedbackDiv.classList.add('bg-[#fdfbf7]', 'border-4', 'border-double', 'border-[#8b4513]');
                            else if (theme === 'ethereal') feedbackDiv.classList.add('bg-white/40', 'backdrop-blur-xl', 'border-indigo-100');
                            else if (theme === 'prism') feedbackDiv.classList.add('bg-white/90', 'backdrop-blur-md', 'border-blue-200/50');
                            else if (theme === 'minecraft') feedbackDiv.classList.add('bg-[#c6c6c6]', 'border-4', 'border-[#373737]');
                            else feedbackDiv.classList.add('bg-white', 'border-blue-100', 'shadow-lg');

                            // Style feedback elements based on theme
                            const feedbackTitle = feedbackDiv.querySelector('.essay-feedback-title');
                            const feedbackSubtitle = feedbackDiv.querySelector('.essay-feedback-subtitle');
                            const feedbackBoxes = feedbackDiv.querySelectorAll('.essay-feedback-box');
                            const feedbackLabels = feedbackDiv.querySelectorAll('.essay-feedback-label');
                            const feedbackContents = feedbackDiv.querySelectorAll('.essay-feedback-content');
                            
                            if (theme === 'cyberpunk') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-fuchsia-500';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-slate-400 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-xl mt-3 bg-slate-900/50 border border-fuchsia-500/30');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-fuchsia-400 opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-slate-200');
                            } else if (theme === 'terminal') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-green-500';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-green-900 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-none mt-3 bg-black border border-green-500/30');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-green-600 opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-green-400');
                            } else if (theme === 'undertale') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-white font-retro';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-white font-retro opacity-70 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-none mt-3 bg-black border-4 border-white');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-white font-retro opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-white font-retro');
                            } else if (theme === 'comic') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-black font-black';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-black opacity-60 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-none mt-3 bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-black font-black opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-black');
                            } else if (theme === 'vintage') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-[#4a3728]';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-[#4a3728]/60 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-xl mt-3 bg-[#f4ece1] border-2 border-[#8b4513]/20');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-[#8b4513] opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-[#4a3728]');
                            } else if (theme === 'ethereal') {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-indigo-900';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-indigo-400 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-xl mt-3 bg-white/60 border border-indigo-100 backdrop-blur-sm');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-indigo-500 opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-indigo-900');
                            } else {
                                if (feedbackTitle) feedbackTitle.className = 'essay-feedback-title text-lg font-black uppercase tracking-widest mb-1 text-slate-900';
                                if (feedbackSubtitle) feedbackSubtitle.className = 'essay-feedback-subtitle text-[0.625rem] opacity-60 font-medium text-slate-500 uppercase tracking-wider';
                                feedbackBoxes.forEach(box => box.className = 'essay-feedback-box p-3 rounded-xl mt-3 bg-slate-50 border border-slate-200');
                                feedbackLabels.forEach(label => label.className = 'essay-feedback-label text-[0.625rem] font-black uppercase tracking-[0.2em] mb-2 text-slate-600 opacity-70');
                                feedbackContents.forEach(content => content.className = 'essay-feedback-content font-medium text-sm sm:text-base text-slate-900');
                            }
                        }
                    });
                }

                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        if (textarea) textarea.value = '';
                        isSubmitted = false;
                        updateEssayUI();
                        
                        if (actionsDiv) {
                            actionsDiv.classList.remove('hidden');
                            actionsDiv.classList.add('block');
                        }
                        if (feedbackDiv) {
                            feedbackDiv.classList.add('hidden');
                            feedbackDiv.classList.remove('block');
                        }
                    });
                }

                // Initial UI sync
                updateEssayUI();
                if (actionsDiv) {
                    actionsDiv.classList.remove('hidden');
                    actionsDiv.classList.add('block');
                }
                if (feedbackDiv) {
                    feedbackDiv.classList.add('hidden');
                    feedbackDiv.classList.remove('block');
                }
            });
        }

        function openOverlaySettings(draggable) {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'image-settings-modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'image-settings-modal';
            
            const currentSize = parseInt(draggable.style.width) || 150;
            
            modal.innerHTML = \`
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">Overlay Settings</h3>
                    <button class="close-icon-btn" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #94a3b8;">&times;</button>
                </div>
                
                <label>Size (<span id="overlay-size-val">\${currentSize}</span>px)</label>
                <div class="slider-container">
                    <span style="font-size: 12px; font-weight: bold; color: #94a3b8;">50px</span>
                    <input type="range" id="overlay-size-slider" min="50" max="500" value="\${currentSize}">
                    <span style="font-size: 12px; font-weight: bold; color: #94a3b8;">500px</span>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="remove-btn" style="flex: 1; background: #ef4444; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">Remove</button>
                    <button class="close-btn" style="flex: 1; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">Done</button>
                </div>
            \`;
            
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
            
            modal.querySelector('.close-icon-btn').addEventListener('click', () => modalOverlay.remove());
            modal.querySelector('.close-btn').addEventListener('click', () => modalOverlay.remove());
            modal.querySelector('.remove-btn').addEventListener('click', () => {
                draggable.style.display = 'none';
                draggable.setAttribute('data-removed', 'true');
                modalOverlay.remove();
                saveLayout();
            });
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) modalOverlay.remove();
            });
            
            const sizeSlider = modal.querySelector('#overlay-size-slider');
            const sizeVal = modal.querySelector('#overlay-size-val');
            sizeSlider.addEventListener('input', (e) => {
                const s = parseInt(e.target.value);
                sizeVal.textContent = s;
                draggable.style.width = s + 'px';
                draggable.style.height = s + 'px';
                // Maintain centering if not moved
                if (!draggable.getAttribute('data-x') || draggable.getAttribute('data-x') === '0') {
                    draggable.style.marginLeft = -(s / 2) + 'px';
                }
                saveLayout();
            });
        }

        function initOverlayVideo() {
            const draggables = document.querySelectorAll('.overlay-video-draggable');
            const moveBtn = document.getElementById('toggle-overlay-move');
            const moveIndicator = document.getElementById('overlay-video-move-indicator');
            if (draggables.length === 0) return;

            let isMoveMode = false;

            if (moveBtn) {
                moveBtn.addEventListener('click', () => {
                    isMoveMode = !isMoveMode;
                    moveBtn.classList.toggle('active', isMoveMode);
                    moveBtn.querySelector('.move-icon').classList.toggle('hidden', isMoveMode);
                    moveBtn.querySelector('.check-icon').classList.toggle('hidden', !isMoveMode);
                    
                    if (moveIndicator) {
                        moveIndicator.classList.toggle('hidden', !isMoveMode);
                    }
                    
                    draggables.forEach(d => {
                        d.classList.toggle('moving', isMoveMode);
                        interact(d).draggable({ enabled: isMoveMode });
                    });
                    
                    if (isMoveMode) {
                        document.body.style.overflow = 'hidden';
                        document.body.style.touchAction = 'none';
                    } else {
                        document.body.style.overflow = '';
                        document.body.style.touchAction = '';
                    }
                });
            }

            draggables.forEach(draggable => {
                let x = 0;
                let y = 0;
                let isDragging = false;
                let velocityY = 0;
                let lastY = 0;
                let lastTime = Date.now();

                // Double click to open settings
                draggable.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    openOverlaySettings(draggable);
                });

                // Initial position: bottom
                setTimeout(() => {
                    // Only set initial position if not already set by loadLayout
                    if (!draggable.getAttribute('data-y')) {
                        const rect = draggable.getBoundingClientRect();
                        // If rect.height is 0 (not loaded yet), use the style width as a fallback
                        const h = rect.height || parseInt(draggable.style.width) || 150;
                        y = window.innerHeight - h - 20;
                        
                        // Start slightly higher and animate the fall
                        const startY = -h - 50;
                        draggable.style.transform = 'translate(' + x + 'px, ' + startY + 'px)';
                        
                        setTimeout(() => {
                            draggable.style.transition = 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                            draggable.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                            draggable.setAttribute('data-x', x);
                            draggable.setAttribute('data-y', y);
                            
                            // Remove transition after animation to not interfere with dragging
                            setTimeout(() => {
                                draggable.style.transition = '';
                            }, 1200);
                        }, 100);
                    } else {
                        x = parseFloat(draggable.getAttribute('data-x'));
                        y = parseFloat(draggable.getAttribute('data-y'));
                    }
                }, 500);

                interact(draggable).draggable({
                    enabled: isMoveMode,
                    inertia: false,
                    listeners: {
                        start(event) {
                            isDragging = true;
                            velocityY = 0;
                            lastY = event.pageY;
                            lastTime = Date.now();
                        },
                        move(event) {
                            x += event.dx;
                            y += event.dy;
                            event.target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                            
                            const now = Date.now();
                            const dt = now - lastTime;
                            if (dt > 0) {
                                velocityY = (event.pageY - lastY) / dt * 16; // rough velocity
                            }
                            lastY = event.pageY;
                            lastTime = now;
                        },
                        end(event) {
                            isDragging = false;
                            animateFall();
                        }
                    }
                });

                function animateFall() {
                    if (isDragging) return;

                    const rect = draggable.getBoundingClientRect();
                    const targetY = window.innerHeight - rect.height - 20;
                    
                    const stiffness = 0.01; // Slower spring
                    const friction = 0.95;  // More damping
                    
                    function step() {
                        if (isDragging) return;

                        const dist = targetY - y;
                        velocityY += dist * stiffness;
                        velocityY *= friction;
                        y += velocityY;

                        if (Math.abs(dist) < 0.1 && Math.abs(velocityY) < 0.1) {
                            y = targetY;
                            draggable.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                            return;
                        }

                        draggable.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                        requestAnimationFrame(step);
                    }

                    requestAnimationFrame(step);
                }

                window.addEventListener('resize', () => {
                    if (!isDragging) animateFall();
                });
            });
        }

        loadLayout();
        initInteractions();
        initExplanations();
        initMemoryLinks();
        initTextResizer();
        initInteractiveElements();
        initOverlayVideo();
    </script>
</body>
</html>
  `;

  if (action === 'print') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for images and resources to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };
    } else {
      alert('Please allow popups to print the document.');
    }
  } else {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arcane-notes-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
