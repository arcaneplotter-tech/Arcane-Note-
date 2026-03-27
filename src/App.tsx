/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Parser from './pages/Parser';
import SavedNotes from './pages/SavedNotes';
import FluidView from './pages/FluidView';
import PresentationView from './pages/PresentationView';
import GlobalBackground from './components/GlobalBackground';
import OverlayVideo from './components/OverlayVideo';
import { ThemeProvider } from './components/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <GlobalBackground />
        <OverlayVideo />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/parser" element={<Parser />} />
          <Route path="/saved" element={<SavedNotes />} />
          <Route path="/fluid" element={<FluidView />} />
          <Route path="/presentation" element={<PresentationView />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
