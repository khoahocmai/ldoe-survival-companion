import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useGameData } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { ItemsPage } from './pages/encyclopedia/ItemsPage';
import { EnemiesPage } from './pages/encyclopedia/EnemiesPage';
import { RecipesPage } from './pages/encyclopedia/RecipesPage';
import { LocationsPage } from './pages/encyclopedia/LocationsPage';
import { CombatCalculator } from './pages/CombatCalculator';
import { CraftingPlanner } from './pages/CraftingPlanner';
import { Inventory } from './pages/Inventory';
import { QuestTracker } from './pages/QuestTracker';
import { Goals } from './pages/Goals';
import { Notes } from './pages/Notes';
import { Settings } from './pages/Settings';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const LoadingFallback: React.FC = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-charcoal-950 text-slate-200">
    <div className="p-3 bg-amber-600/10 border border-amber-500/30 rounded-xl text-amber-500 mb-4 animate-pulse">
      <ShieldAlert className="w-10 h-10" />
    </div>
    <h2 className="text-base font-bold font-mono tracking-wider text-slate-100">
      ĐANG KHỞI TẠO CƠ SỞ DỮ LIỆU SINH TỒN...
    </h2>
    <p className="text-xs text-slate-500 mt-1">Đang tải và xác thực JSON datasets</p>
  </div>
);

const AppContent: React.FC = () => {
  const { isLoading, error, reload } = useGameData();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-charcoal-950 text-slate-200 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-100 mb-2">Lỗi tải cơ sở dữ liệu game</h2>
        <p className="text-xs text-red-400 font-mono mb-4 max-w-md">{error}</p>
        <button
          onClick={() => reload()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-charcoal-950 font-bold rounded-lg text-sm"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="wiki/items" element={<ItemsPage />} />
          <Route path="wiki/enemies" element={<EnemiesPage />} />
          <Route path="wiki/recipes" element={<RecipesPage />} />
          <Route path="wiki/locations" element={<LocationsPage />} />
          <Route path="combat" element={<CombatCalculator />} />
          <Route path="planner" element={<CraftingPlanner />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="quests" element={<QuestTracker />} />
          <Route path="goals" element={<Goals />} />
          <Route path="notes" element={<Notes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
