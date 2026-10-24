import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useGameData } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { Button } from './components/common/Button';
import { ItemsPage } from './pages/encyclopedia/ItemsPage';
import { EnemiesPage } from './pages/encyclopedia/EnemiesPage';
import { RecipesPage } from './pages/encyclopedia/RecipesPage';
import { LocationsPage } from './pages/encyclopedia/LocationsPage';
import { QuestsPage } from './pages/encyclopedia/QuestsPage';
import { CombatCalculator } from './pages/CombatCalculator';
import { PointCalculator } from './pages/PointCalculator';
import { ConstructionCalculator } from './pages/ConstructionCalculator';
import { CraftingPlanner } from './pages/CraftingPlanner';
import { Settings } from './pages/Settings';

const FullScreenMessage: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent [&>svg]:h-6 [&>svg]:w-6">{icon}</div>
    <h1 className="text-base font-semibold">{title}</h1>
    {children}
  </div>
);

const AppContent: React.FC = () => {
  const { db, isLoading, error, reload } = useGameData();

  if (isLoading) {
    return (
      <FullScreenMessage icon={<ShieldAlert className="animate-pulse" />} title="Đang tải dữ liệu...">
        <p className="text-sm text-muted">Gộp dữ liệu gốc với chỉnh sửa của bạn.</p>
      </FullScreenMessage>
    );
  }

  if (error || !db) {
    return (
      <FullScreenMessage icon={<AlertTriangle />} title="Không tải được dữ liệu">
        <p className="max-w-md text-sm text-danger">{error ?? 'Dữ liệu trống.'}</p>
        <Button onClick={() => reload()}>Thử lại</Button>
      </FullScreenMessage>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/wiki/items" replace />} />
          <Route path="wiki/items" element={<ItemsPage />} />
          <Route path="wiki/enemies" element={<EnemiesPage />} />
          <Route path="wiki/recipes" element={<RecipesPage />} />
          <Route path="wiki/locations" element={<LocationsPage />} />
          <Route path="wiki/quests" element={<QuestsPage />} />
          <Route path="quests" element={<Navigate to="/wiki/quests" replace />} />

          <Route path="combat" element={<CombatCalculator />} />
          <Route path="points" element={<PointCalculator />} />
          <Route path="construction" element={<ConstructionCalculator />} />
          <Route path="planner" element={<CraftingPlanner />} />

          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/wiki/items" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}
