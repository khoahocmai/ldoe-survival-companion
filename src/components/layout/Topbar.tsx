import React from 'react';
import { Laptop, Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { IconButton } from '../common/Button';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

const NEXT_THEME = { dark: 'light', light: 'system', system: 'dark' } as const;
const THEME_LABEL = { dark: 'Tối', light: 'Sáng', system: 'Theo hệ thống' } as const;

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === 'system' ? Laptop : theme === 'dark' ? Moon : Sun;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-5">
      <IconButton label="Mở menu" onClick={onOpenMobileMenu} className="lg:hidden">
        <Menu />
      </IconButton>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-bg px-3 text-sm text-faint transition-colors hover:border-faint/60 sm:max-w-md sm:flex-none sm:basis-96"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Tìm vật phẩm, quái, địa điểm...</span>
        <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] text-faint sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto">
        <IconButton
          label={`Giao diện: ${THEME_LABEL[theme]} (bấm để đổi)`}
          onClick={() => setTheme(NEXT_THEME[theme])}
        >
          <ThemeIcon />
        </IconButton>
      </div>
    </header>
  );
};
