import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useGameData } from './context/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/common/Toast';
import { Button } from './components/common/Button';
import { Skeleton } from './components/common/Layout';
import { ItemsPage } from './pages/encyclopedia/ItemsPage';
import { WeaponModsPage } from './pages/encyclopedia/WeaponModsPage';
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

/** Page-shaped placeholder shown while the game data loads, so the layout does not jump when it arrives. */
const AppSkeleton: React.FC = () => (
  <div role="status" aria-label="Đang tải dữ liệu..." className="flex h-screen w-screen bg-bg">
    <div className="hidden w-52 shrink-0 space-y-3 border-r border-line bg-surface p-3 lg:block">
      <Skeleton className="h-8 w-8 rounded-lg" />
      {Array.from({ length: 9 }, (_, i) => (
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-12 items-center border-b border-line bg-surface px-3">
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
          {Array.from({ length: 24 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { db, isLoading, error, reload } = useGameData();

  if (isLoading) return <AppSkeleton />;

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
          <Route path="wiki/weapon-mods" element={<WeaponModsPage />} />
          <Route path="mods" element={<Navigate to="/wiki/weapon-mods" replace />} />
          <Route path="wiki/enemies" element={<EnemiesPage />} />
          <Route path="wiki/recipes" element={<RecipesPage />} />
          <Route path="wiki/locations" element={<LocationsPage />} />
          <Route path="wiki/quests" element={<QuestsPage />} />
          <Route path="quests" element={<Navigate to="/wiki/quests" replace />} />

          <Route path="combat" element={<CombatCalculator />} />
          <Route path="points" element={<PointCalculator />} />
          <Route path="construction" element={<ConstructionCalculator />} />
          <Route path="chopper" element={<Navigate to="/construction?tab=chopper" replace />} />
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
      <ToastProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
