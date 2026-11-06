import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { WakeUpBanner } from '@/components/WakeUpBanner';
import { ThemeProvider } from '@/hooks/useTheme';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <WakeUpBanner />
        <Routes>
          <Route path="/"             element={<Home />} />
          <Route path="/park/:parkId" element={<Dashboard />} />
          <Route path="*"             element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
