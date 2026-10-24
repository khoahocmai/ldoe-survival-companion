import React from 'react';
import { usePersonalData } from '../../hooks/usePersonalData';
import { Menu, Search, Target, Scroll, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenSearch }) => {
  const { goals, questProgress } = usePersonalData();

  const activeGoalsCount = goals.filter((g) => !g.completed).length;
  const inProgressQuestsCount = Object.values(questProgress).filter((q) => q.status === 'in_progress').length;

  return (
    <header className="h-14 bg-charcoal-900 border-b border-charcoal-800 px-4 flex items-center justify-between shrink-0 select-none z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-charcoal-800 focus:outline-none"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-charcoal-950 border border-charcoal-750 hover:border-amber-500/50 text-slate-400 hover:text-slate-200 text-xs sm:text-sm transition-all sm:w-72"
        >
          <Search className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">Tra cứu dữ liệu game...</span>
          <kbd className="hidden sm:inline-block ml-auto px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-charcoal-800 rounded border border-charcoal-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
        {/* Quick Combat Calc button */}
        <Link
          to="/combat"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-charcoal-800 hover:bg-charcoal-750 border border-charcoal-700 text-slate-300 hover:text-amber-400 transition-colors"
          title="Mở máy tính chiến đấu"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-500" />
          <span>Combat Calc</span>
        </Link>

        {/* Active Goals indicator */}
        <Link
          to="/goals"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-750 text-slate-300 hover:text-slate-100 transition-colors"
          title="Mục tiêu đang thực hiện"
        >
          <Target className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Mục tiêu:</span>
          <span className="font-bold text-amber-400">{activeGoalsCount}</span>
        </Link>

        {/* Active Quests indicator */}
        <Link
          to="/quests"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-charcoal-850 hover:bg-charcoal-800 border border-charcoal-750 text-slate-300 hover:text-slate-100 transition-colors"
          title="Nhiệm vụ đang làm"
        >
          <Scroll className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Nhiệm vụ:</span>
          <span className="font-bold text-blue-400">{inProgressQuestsCount}</span>
        </Link>
      </div>
    </header>
  );
};
