import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Dashboard } from '@/pages/Dashboard';
import { WakeUpBanner } from '@/components/WakeUpBanner';

export default function App() {
  return (
    <BrowserRouter>
      <WakeUpBanner />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/park/:parkId" element={<Dashboard />} />
        <Route path="*"             element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
