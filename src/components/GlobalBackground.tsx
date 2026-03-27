import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { GameIcon } from './GameIcons';

export default function GlobalBackground() {
  const { theme, videoBackgroundEnabled, customVideoUrl, videoBackgroundBase64 } = useTheme();

  // General Video Background
  if (videoBackgroundEnabled && (videoBackgroundBase64 || customVideoUrl || theme === 'minecraft')) {
    const videoUrl = videoBackgroundBase64 || customVideoUrl || (theme === 'minecraft' ? "https://videotourl.com/videos/1774375839537-54f7385d-7c6e-4155-9af5-fd19b3b978eb.webm" : "");
    
    if (videoUrl) {
      return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
          <motion.video
            autoPlay
            loop
            muted
            playsInline
            animate={theme === 'minecraft' ? { 
              x: ["-16.66%", "-33.33%", "0%", "-16.66%"],
            } : {}}
            transition={theme === 'minecraft' ? { 
              duration: 40, 
              repeat: Infinity, 
              ease: "linear",
              times: [0, 0.25, 0.75, 1]
            } : {}}
            style={theme === 'minecraft' ? { width: '150%', height: '100%', maxWidth: 'none' } : { width: '100%', height: '100%' }}
            className="absolute inset-0 object-cover"
            src={videoUrl}
          />
          <div 
            className="absolute inset-0 z-10" 
            style={{ background: 'radial-gradient(circle, transparent, rgba(0,0,0,0.2))' }}
          />
        </div>
      );
    }
  }

  const renderBackground = () => {
    switch (theme) {
      case 'minecraft':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#4a90e2]">
            {/* Sky Gradient */}
            <motion.div 
              animate={{ 
                backgroundColor: ["#4a90e2", "#1a237e", "#4a90e2"],
              }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0" 
            />
            
            {/* Sun & Moon Cycle */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <GameIcon name="MinecraftSun" theme="minecraft" className="w-32 h-32" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-60">
                <GameIcon name="MinecraftMoon" theme="minecraft" className="w-24 h-24" />
              </div>
            </motion.div>

            {/* Stars */}
            <div className="absolute inset-0">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 120 }}
                  className="absolute bg-white w-1 h-1"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                />
              ))}
            </div>

            {/* Parallax Clouds */}
            {[...Array(3)].map((_, layer) => (
              <motion.div
                key={layer}
                animate={{ x: [-400, 2400] }}
                transition={{ duration: 60 + layer * 30, repeat: Infinity, ease: "linear", delay: layer * -20 }}
                className="absolute left-0 w-64 h-16 bg-white/30"
                style={{ 
                  top: `${15 + layer * 10}%`,
                  boxShadow: '16px 16px 0 rgba(255,255,255,0.1)',
                  scale: 1 - layer * 0.2,
                  opacity: 0.4 - layer * 0.1
                }}
              />
            ))}

            {/* Falling Leaves/Particles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [-20, 1000],
                  x: [0, Math.sin(i) * 50],
                  rotate: [0, 360]
                }}
                transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                className="absolute w-2 h-2 bg-green-600/20"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}

            {/* Floor */}
            <div className="absolute bottom-0 left-0 right-0 h-40 flex flex-col">
              <div className="h-6 bg-[#4caf50] w-full" style={{ backgroundImage: 'linear-gradient(90deg, #4caf50 50%, #388e3c 50%)', backgroundSize: '64px 100%' }} />
              <div className="flex-1 bg-[#795548]" style={{ backgroundImage: 'radial-gradient(#5d4037 20%, transparent 20%), radial-gradient(#5d4037 20%, transparent 20%)', backgroundPosition: '0 0, 32px 32px', backgroundSize: '64px 64px' }} />
            </div>
          </div>
        );

      case 'cyberpunk':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#020204]">
            {/* Deep Perspective Grid */}
            <div className="absolute inset-0 opacity-20" style={{ perspective: '1000px' }}>
              <motion.div 
                animate={{ rotateX: [60, 65, 60], y: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 origin-bottom"
                style={{ 
                  backgroundImage: 'linear-gradient(to bottom, transparent, #06b6d4 1px), linear-gradient(to right, transparent, #06b6d4 1px)',
                  backgroundSize: '60px 60px',
                  transform: 'rotateX(60deg) scale(2)',
                  height: '200%',
                  top: '-50%'
                }}
              />
            </div>

            {/* Falling Data Streams */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`stream-${i}`}
                animate={{ y: [-200, 1200], opacity: [0, 1, 0] }}
                transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                className="absolute w-[2px] bg-magenta-500"
                style={{ 
                  left: `${Math.random() * 100}%`,
                  height: `${100 + Math.random() * 300}px`,
                  boxShadow: '0 0 15px #d946ef'
                }}
              />
            ))}

            {/* Circuit Nodes & Paths */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`node-${i}`}
                  animate={{ opacity: [0.1, 0.5, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute border-t-2 border-l-2 border-cyan-400"
                  style={{ 
                    width: '150px', 
                    height: '150px',
                    top: `${20 + (i * 15) % 60}%`,
                    left: `${10 + (i * 25) % 80}%`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 20%, 20% 20%, 20% 100%, 0 100%)'
                  }}
                />
              ))}
            </div>

            {/* Glitch Overlays */}
            <motion.div
              animate={{ 
                opacity: [0, 0.1, 0, 0.05, 0],
                x: [0, 10, -10, 5, 0],
                backgroundColor: ['transparent', '#ff00ff', 'transparent', '#00ffff', 'transparent']
              }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 8 }}
              className="absolute inset-0 z-10"
            />

            {/* Scanning Beam */}
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-[100px] bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent"
            />
          </div>
        );

      case 'terminal':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-black">
            {/* CRT Scanlines */}
            <div className="absolute inset-0 z-20 opacity-[0.15]" style={{ 
              backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
              backgroundSize: '100% 4px'
            }} />
            
            {/* CRT Flicker */}
            <motion.div
              animate={{ opacity: [0.95, 1, 0.98, 1, 0.96] }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="absolute inset-0 bg-green-500/5 z-10"
            />

            {/* Matrix Rain */}
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [-100, 1200] }}
                transition={{ duration: 8 + Math.random() * 12, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                className="absolute font-mono text-[12px] text-green-500/40 whitespace-pre leading-none"
                style={{ left: `${(i / 25) * 100}%` }}
              >
                {[...Array(20)].map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('\n')}
              </motion.div>
            ))}

            {/* Moving Scanline */}
            <motion.div
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-x-0 h-20 bg-green-500/5 blur-xl"
            />

            {/* Blinking Cursor */}
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute bottom-8 right-8 w-4 h-8 bg-green-500/40"
            />
          </div>
        );

      case 'vintage':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#f4ece1]">
            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
            
            {/* Vignette */}
            <motion.div 
              animate={{ opacity: [0.15, 0.2, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#4a3728]/40" 
            />

            {/* Film Scratches */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                  opacity: [0, 0.3, 0]
                }}
                transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 2 }}
                className="absolute top-0 bottom-0 w-[1px] bg-black/20"
              />
            ))}

            {/* Dust & Hair */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [0, (Math.random() - 0.5) * 200],
                  y: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360],
                  opacity: [0, 0.4, 0]
                }}
                transition={{ duration: 15 + Math.random() * 15, repeat: Infinity }}
                className={`absolute bg-black/10 ${Math.random() > 0.5 ? 'w-1 h-1 rounded-full' : 'w-4 h-[0.5px]'}`}
                style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
              />
            ))}

            {/* Sepia Overlay */}
            <div className="absolute inset-0 bg-orange-900/5 mix-blend-overlay" />
          </div>
        );

      case 'ethereal':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#f0f4ff]">
            {/* Aurora Waves */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: ["-20%", "20%"],
                  y: ["-10%", "10%"],
                  rotate: [0, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 20 + i * 10, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 opacity-20 blur-[120px] ${i === 0 ? 'bg-blue-300' : i === 1 ? 'bg-purple-300' : 'bg-cyan-200'}`}
                style={{ transform: `rotate(${i * 45}deg)` }}
              />
            ))}

            {/* Light Beams */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.1, 0.4, 0.1],
                    rotate: [-20, -15, -20]
                  }}
                  transition={{ duration: 10, repeat: Infinity, delay: i * 2 }}
                  className="absolute top-[-50%] left-[10%] w-32 h-[200%] bg-gradient-to-b from-white via-white/20 to-transparent origin-top"
                  style={{ left: `${10 + i * 20}%` }}
                />
              ))}
            </div>

            {/* Twinkling Sparkles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180]
                }}
                transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 10 }}
                className="absolute w-1 h-1 bg-white shadow-[0_0_10px_white]"
                style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        );

      case 'prism':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-white">
            {/* Refracted Light Beams */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`ray-${i}`}
                  animate={{ 
                    rotate: [i * 30, i * 30 + 360],
                    opacity: [0.05, 0.15, 0.05]
                  }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 w-[200%] h-[40px] origin-left"
                  style={{ 
                    background: `linear-gradient(90deg, ${['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8b00ff'][i % 7]}22, transparent)`,
                    marginTop: '-20px'
                  }}
                />
              ))}
            </div>

            {/* Floating Crystalline Shards */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`crystal-${i}`}
                animate={{ 
                  rotate: [0, 360],
                  x: [0, (Math.random() - 0.5) * 500, 0],
                  y: [0, (Math.random() - 0.5) * 500, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{ duration: 20 + Math.random() * 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-32 h-32 border border-white/40 shadow-lg"
                style={{ 
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#ff000011', '#00ff0011', '#0000ff11', '#ffffff22'][i % 4],
                  clipPath: i % 2 === 0 ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                }}
              />
            ))}

            {/* Central Focal Point */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-100 rounded-full blur-[150px]"
            />
          </div>
        );

      case 'undertale':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-black">
            {/* Stars with different patterns */}
            <div className="absolute inset-0">
              {[...Array(60)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.8, 0.2],
                    y: [0, Math.random() * 20, 0]
                  }}
                  transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
                  className={`absolute bg-white ${i % 5 === 0 ? 'w-1 h-1' : 'w-[2px] h-[2px]'}`}
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                />
              ))}
            </div>

            {/* Save Point Sparkles */}
            <div className="absolute bottom-20 left-20">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [0, 1, 0],
                    rotate: [0, 90],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                  className="absolute w-4 h-4 bg-yellow-400"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    left: `${(i % 2) * 10}px`,
                    top: `${Math.floor(i / 2) * 10}px`
                  }}
                />
              ))}
            </div>

            {/* Battle Box Outline */}
            <div className="absolute inset-10 border-2 border-white/5 rounded-sm" />

            {/* Pulsing Soul */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], filter: ['drop-shadow(0 0 5px #ef4444)', 'drop-shadow(0 0 15px #ef4444)', 'drop-shadow(0 0 5px #ef4444)'] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-12"
            >
              <div className="w-6 h-6 bg-red-600 rotate-45" style={{ clipPath: 'path("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z")' }} />
            </motion.div>
          </div>
        );

      case 'god-of-war':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#0c0d12]">
            {/* Mist Layers */}
            {[...Array(2)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ x: ["-10%", "10%"], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-slate-800/20 via-transparent to-transparent blur-3xl"
              />
            ))}

            {/* Rising Embers */}
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [1000, -100],
                  x: [0, Math.sin(i) * 100],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{ duration: 6 + Math.random() * 8, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                className="absolute w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}

            {/* Runic Glow */}
            <motion.div
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px]"
            />

            {/* Snow */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [-20, 1000],
                  x: [0, 50],
                  opacity: [0, 0.4, 0]
                }}
                transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
                className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60" />
          </div>
        );

      case 'cuphead':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#dccfb9]">
            {/* Film Jitter */}
            <motion.div 
              animate={{ x: [-1, 1, -0.5, 0.5, 0], y: [0.5, -0.5, 1, -1, 0] }}
              transition={{ duration: 0.15, repeat: Infinity }}
              className="absolute inset-[-10px] bg-[#dccfb9]"
            >
              {/* Film Grain */}
              <div className="absolute inset-0 opacity-[0.12] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
              
              {/* Scratches & Blotches */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 0.4, 0],
                    x: [Math.random() * 100 + "%", Math.random() * 100 + "%"]
                  }}
                  transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 1 }}
                  className="absolute top-0 bottom-0 w-[2px] bg-black/10"
                />
              ))}

              {/* Ink Splatters */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: Math.random() * 5 }}
                  className="absolute w-8 h-8 bg-black/5 rounded-full blur-sm"
                  style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                />
              ))}
            </motion.div>

            {/* Vignette Border */}
            <div className="absolute inset-0 border-[30px] border-black/10 pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20" />
          </div>
        );

      case 'comic':
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#ffde00]">
            {/* Halftone Pattern */}
            <motion.div 
              animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-15" 
              style={{ 
                backgroundImage: 'radial-gradient(#000 15%, transparent 15%)',
                backgroundSize: '20px 20px'
              }} 
            />

            {/* Action Lines */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute top-1/2 left-1/2 w-[200%] h-4 bg-black origin-left"
                  style={{ transform: `rotate(${i * 30}deg) translateY(-50%)` }}
                />
              ))}
            </div>

            {/* Floating Shapes */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  rotate: [i * 90, i * 90 + 360],
                  scale: [1, 1.1, 1],
                  x: [0, (Math.random() - 0.5) * 100, 0],
                  y: [0, (Math.random() - 0.5) * 100, 0]
                }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute w-64 h-64 opacity-80 shadow-[8px_8px_0_rgba(0,0,0,0.2)] ${i % 3 === 0 ? 'bg-red-500' : i % 3 === 1 ? 'bg-blue-500' : 'bg-white'}`}
                style={{ 
                  top: `${Math.random() * 80}%`, 
                  left: `${Math.random() * 80}%`,
                  borderRadius: i % 2 === 0 ? '0' : '100%'
                }}
              />
            ))}

            {/* Speech Bubble Shapes */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-20 w-32 h-24 bg-white rounded-[50%] opacity-40 shadow-[4px_4px_0_rgba(0,0,0,0.1)]"
            />
          </div>
        );

      default:
        return (
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-[#f8fafc]">
            {/* Architectural Blueprint Grid */}
            <div className="absolute inset-0 opacity-5" style={{ 
              backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)',
              backgroundSize: '100px 100px'
            }} />

            {/* Rotating Technical Schematics */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`schematic-${i}`}
                  animate={{ rotate: i % 2 === 0 ? [0, 360] : [360, 0] }}
                  transition={{ duration: 60 + i * 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-slate-400"
                  style={{ 
                    width: `${400 + i * 200}px`,
                    height: `${400 + i * 200}px`,
                    borderRadius: i === 1 ? '50%' : '0'
                  }}
                >
                  <div className="absolute top-0 left-1/2 w-[1px] h-full bg-slate-400" />
                  <div className="absolute left-0 top-1/2 w-full h-[1px] bg-slate-400" />
                </motion.div>
              ))}
            </div>

            {/* Floating Design Modules */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`module-${i}`}
                animate={{ 
                  y: [0, -50, 0],
                  x: [0, (Math.random() - 0.5) * 100, 0],
                  opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute border border-slate-300 bg-white/50"
                style={{ 
                  width: `${100 + Math.random() * 200}px`,
                  height: `${80 + Math.random() * 150}px`,
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  borderRadius: '4px'
                }}
              >
                <div className="w-full h-4 border-b border-slate-200 bg-slate-50/50" />
                <div className="p-2 space-y-1">
                  <div className="w-3/4 h-[2px] bg-slate-200" />
                  <div className="w-1/2 h-[2px] bg-slate-200" />
                </div>
              </motion.div>
            ))}

            {/* Precision Points */}
            <div className="absolute inset-0">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={`point-${i}`}
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full"
                  style={{ 
                    top: `${Math.floor(Math.random() * 10) * 10}%`, 
                    left: `${Math.floor(Math.random() * 10) * 10}%` 
                  }}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 -z-50"
      >
        {renderBackground()}
      </motion.div>
    </AnimatePresence>
  );
}
