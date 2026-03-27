import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'realistic' | 'modern' | 'cyberpunk' | 'vintage' | 'terminal' | 'ethereal' | 'prism' | 'minecraft' | 'undertale' | 'god-of-war' | 'cuphead' | 'comic' | 'professional';

export interface OverlayVideo {
  id: string;
  url: string;
  base64: string;
  size: number;
  enabled: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  videoBackgroundEnabled: boolean;
  setVideoBackgroundEnabled: (enabled: boolean) => void;
  customVideoUrl: string;
  setCustomVideoUrl: (url: string) => void;
  videoBackgroundBase64: string;
  setVideoBackgroundBase64: (base64: string) => void;
  overlayVideos: OverlayVideo[];
  setOverlayVideos: (videos: OverlayVideo[]) => void;
  addOverlayVideo: (video: Partial<OverlayVideo>) => void;
  updateOverlayVideo: (id: string, updates: Partial<OverlayVideo>) => void;
  removeOverlayVideo: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('arcane-notes-theme');
    return (saved as Theme) || 'modern';
  });

  const [videoBackgroundEnabled, setVideoBackgroundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('arcane-notes-video-bg-enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [customVideoUrl, setCustomVideoUrlState] = useState<string>(() => {
    return localStorage.getItem('arcane-notes-custom-video-url') || '';
  });

  const [videoBackgroundBase64, setVideoBackgroundBase64State] = useState<string>(() => {
    return localStorage.getItem('arcane-notes-video-bg-base64') || '';
  });

  const [overlayVideos, setOverlayVideosState] = useState<OverlayVideo[]>(() => {
    const saved = localStorage.getItem('arcane-notes-overlay-videos');
    if (saved) return JSON.parse(saved);
    
    // Migration from old single overlay state
    const oldEnabled = localStorage.getItem('arcane-notes-overlay-video-enabled') === 'true';
    const oldUrl = localStorage.getItem('arcane-notes-overlay-video-url') || '';
    const oldBase64 = localStorage.getItem('arcane-notes-overlay-video-base64') || '';
    
    if (oldEnabled || oldBase64 || oldUrl) {
      return [{
        id: 'default-overlay',
        url: oldUrl,
        base64: oldBase64,
        size: 200,
        enabled: oldEnabled
      }];
    }
    
    return [];
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('arcane-notes-theme', newTheme);
  };

  const setVideoBackgroundEnabled = (enabled: boolean) => {
    setVideoBackgroundEnabledState(enabled);
    localStorage.setItem('arcane-notes-video-bg-enabled', enabled.toString());
  };

  const setCustomVideoUrl = (url: string) => {
    setCustomVideoUrlState(url);
    localStorage.setItem('arcane-notes-custom-video-url', url);
  };

  const setVideoBackgroundBase64 = (base64: string) => {
    setVideoBackgroundBase64State(base64);
    localStorage.setItem('arcane-notes-video-bg-base64', base64);
  };

  const setOverlayVideos = (videos: OverlayVideo[]) => {
    setOverlayVideosState(videos);
    localStorage.setItem('arcane-notes-overlay-videos', JSON.stringify(videos));
  };

  const addOverlayVideo = (video: Partial<OverlayVideo>) => {
    const newVideo: OverlayVideo = {
      id: Math.random().toString(36).substr(2, 9),
      url: video.url || '',
      base64: video.base64 || '',
      size: video.size || 200,
      enabled: video.enabled !== undefined ? video.enabled : true
    };
    const newVideos = [...overlayVideos, newVideo];
    setOverlayVideos(newVideos);
  };

  const updateOverlayVideo = (id: string, updates: Partial<OverlayVideo>) => {
    const newVideos = overlayVideos.map(v => v.id === id ? { ...v, ...updates } : v);
    setOverlayVideos(newVideos);
  };

  const removeOverlayVideo = (id: string) => {
    const newVideos = overlayVideos.filter(v => v.id !== id);
    setOverlayVideos(newVideos);
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'arcane-notes-theme' && e.newValue) {
        setThemeState(e.newValue as Theme);
      }
      if (e.key === 'arcane-notes-video-bg-enabled' && e.newValue) {
        setVideoBackgroundEnabledState(e.newValue === 'true');
      }
      if (e.key === 'arcane-notes-custom-video-url' && e.newValue !== null) {
        setCustomVideoUrlState(e.newValue);
      }
      if (e.key === 'arcane-notes-video-bg-base64' && e.newValue !== null) {
        setVideoBackgroundBase64State(e.newValue);
      }
      if (e.key === 'arcane-notes-overlay-videos' && e.newValue) {
        setOverlayVideosState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      videoBackgroundEnabled, 
      setVideoBackgroundEnabled,
      customVideoUrl,
      setCustomVideoUrl,
      videoBackgroundBase64,
      setVideoBackgroundBase64,
      overlayVideos,
      setOverlayVideos,
      addOverlayVideo,
      updateOverlayVideo,
      removeOverlayVideo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
