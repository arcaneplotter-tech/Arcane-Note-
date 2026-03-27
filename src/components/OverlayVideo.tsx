import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useTheme, OverlayVideo as OverlayVideoType } from './ThemeContext';
import { X, Trash2 } from 'lucide-react';

function SingleOverlay({ video }: { 
  video: OverlayVideoType
}) {
  const { updateOverlayVideo, removeOverlayVideo } = useTheme();
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [showSettings, setShowSettings] = useState(false);
  
  const videoSrc = video.base64 || video.url;
  const isGif = videoSrc?.toLowerCase().endsWith('.gif') || videoSrc?.startsWith('data:image/gif');

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial position: bottom of the screen
  useEffect(() => {
    if (video.enabled && videoSrc) {
      // Use a slightly longer delay and animate the fall
      const timer = setTimeout(() => {
        const targetY = windowHeight - video.size - 20;
        controls.start({ 
          y: targetY,
          transition: { 
            type: "spring", 
            stiffness: 40, 
            damping: 12,
            delay: 0.2
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [video.enabled, videoSrc, windowHeight, controls, video.size]);

  const handleDragEnd = (_: any, info: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const targetY = windowHeight - rect.height - 20;
    
    controls.start({
      y: targetY,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        velocity: info.velocity.y 
      }
    });
  };

  if (!video.enabled || !videoSrc) return null;

  return (
    <div className="contents">
      <motion.div
        ref={containerRef}
        drag
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onDoubleClick={() => setShowSettings(true)}
        animate={controls}
        className="absolute pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow z-[9999]"
        style={{ 
          width: `${video.size}px`, 
          height: `${video.size}px`,
          left: '50%',
          marginLeft: `-${video.size / 2}px`,
          top: 0
        }}
      >
        {isGif ? (
          <img
            src={videoSrc}
            className="w-full h-full object-contain"
            alt="Overlay GIF"
            referrerPolicy="no-referrer"
          />
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-contain"
            src={videoSrc}
          />
        )}

        {/* Settings Overlay Triggered by Double Click */}
        {showSettings && (
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-4 z-[10001] pointer-events-auto"
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-2 right-2 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Overlay Settings</p>
            
            <div className="w-full space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-white/70 uppercase">Size</label>
                  <span className="text-[10px] font-mono text-blue-400">{video.size}px</span>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="500"
                  value={video.size}
                  onChange={(e) => updateOverlayVideo(video.id, { size: parseInt(e.target.value) })}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button
                onClick={() => removeOverlayVideo(video.id)}
                className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3 h-3" />
                Remove Overlay
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function OverlayVideo() {
  const { overlayVideos } = useTheme();

  if (overlayVideos.length === 0) return null;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {overlayVideos.map(video => (
          <SingleOverlay 
            key={video.id} 
            video={video} 
          />
        ))}
      </div>
    </>
  );
}
