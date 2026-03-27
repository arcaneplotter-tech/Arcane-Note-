import React, { useEffect, useRef } from 'react';

export type AnimationMode = 'blur' | 'slide' | 'none' | 'scramble' | 'typewriter' | 'elastic' | 'flash' | 'rotate' | 'glitch' | 'wave' | 'neon';

export function TextAnimationContainer({ children, mode = 'blur', className = "" }: { children: React.ReactNode, mode?: AnimationMode, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    const container = containerRef.current;
    let wordSpans = Array.from(container.querySelectorAll('.anim-word')) as HTMLSpanElement[];

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

    // If not wrapped yet, wrap text nodes
    if (wordSpans.length === 0) {
      const textNodes: Text[] = [];
      const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
          // Skip empty text nodes or nodes inside scripts/styles
          if (!node.nodeValue?.trim() || node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
            return NodeFilter.FILTER_REJECT;
          }
          // Skip nodes inside .no-scramble or already wrapped
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
        textNodes.push(node as Text);
      }

      textNodes.forEach(textNode => {
        const text = textNode.nodeValue || '';
        // Split by words, keeping whitespace
        const parts = text.split(/(\s+)/);
        
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
            span.style.opacity = '0'; // Hide initially
            // Ensure RTL text works correctly by not forcing text-align or width
            wordSpans.push(span);
            fragment.appendChild(span);
          }
        });
        
        textNode.parentNode?.replaceChild(fragment, textNode);
      });
    }

    let totalCharsBefore = 0;

    // Apply animations
    wordSpans.forEach((span, index) => {
      // Reset animation to re-trigger it
      span.style.animation = 'none';
      span.style.opacity = '0';
      span.style.filter = 'none';
      span.style.transform = 'none';
      
      const originalText = span.getAttribute('data-original') || span.textContent || '';
      if (!span.hasAttribute('data-original')) {
        span.setAttribute('data-original', originalText);
      }
      
      // Trigger reflow
      void span.offsetWidth;
      
      const delay = index * 0.04; // 40ms stagger per word
      
      if (mode === 'blur') {
        span.textContent = originalText;
        span.style.animation = `animBlur 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards`;
      } else if (mode === 'slide') {
        span.textContent = originalText;
        span.style.animation = `animSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`;
      } else if (mode === 'scramble') {
        span.style.opacity = '1';
        span.textContent = originalText.replace(/./g, ' '); // Keep width
        
        const chars = '!<>-_\\\\/[]{}—=+*^?#________';
        const duration = 500; // 500ms per word
        const steps = 12;
        const stepDuration = duration / steps;
        const sequentialDelay = index * (duration / 1000); // Sequential delay
        
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
              // Reveal characters gradually
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
        const typeSpeed = 30; // 30ms per char for a more readable typing speed
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
        span.style.animation = `animElastic 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) ${delay}s forwards`;
      } else if (mode === 'flash') {
        span.textContent = originalText;
        span.style.animation = `animFlash 1s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards`;
      } else if (mode === 'rotate') {
        span.textContent = originalText;
        span.style.animation = `animRotate 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards`;
      } else if (mode === 'glitch') {
        span.textContent = originalText;
        span.style.animation = `animGlitch 0.6s steps(2, end) ${delay}s both`;
        span.classList.add('is-glitching');
      } else if (mode === 'wave') {
        span.textContent = originalText;
        span.style.animation = `animWave 1s cubic-bezier(0.445, 0.05, 0.55, 0.95) ${delay}s both`;
      } else if (mode === 'neon') {
        span.textContent = originalText;
        span.style.animation = `animNeon 1s ease-out ${delay}s both`;
      }
    });

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [mode, children]);

  return (
    <>
      <style>{`
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
      `}</style>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </>
  );
}
