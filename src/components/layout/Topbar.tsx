import React from 'react';
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { IconButton } from '../common/Button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenSearch, isSidebarCollapsed, onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
      <IconButton label="Mở menu" onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu />
      </IconButton>
      <IconButton
        label={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        onClick={onToggleSidebar}
        aria-pressed={isSidebarCollapsed}
        className="hidden lg:inline-flex"
      >
        {isSidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </IconButton>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-control-sm min-w-0 flex-1 items-center gap-2 rounded-control border border-line bg-bg px-3 text-sm text-faint transition-colors hover:border-faint/60 sm:max-w-md sm:flex-none sm:basis-96"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Tìm vật phẩm, quái, địa điểm...</span>
        <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-2xs text-faint sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto">
        <IconButton label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={toggleTheme}>
          {isDark ? <Sun /> : <Moon />}
        </IconButton>
      </div>
    </header>
  );
};
