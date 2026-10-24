import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ALL_NAV_ITEMS, MOBILE_PRIMARY_PATHS } from './navigation';

interface MobileNavProps {
  onOpenMenu: () => void;
}

const itemClass = (active: boolean) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
    active ? 'text-accent' : 'text-muted'
  }`;

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const primary = MOBILE_PRIMARY_PATHS.map((p) => ALL_NAV_ITEMS.find((i) => i.path === p)!).filter(Boolean);

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {primary.map(({ path, shortLabel, icon: Icon }) => (
        <NavLink key={path} to={path} className={({ isActive }) => itemClass(isActive)}>
          <Icon className="h-5 w-5" />
          <span>{shortLabel}</span>
        </NavLink>
      ))}
      <button type="button" onClick={onOpenMenu} className={itemClass(false)}>
        <Menu className="h-5 w-5" />
        <span>Thêm</span>
      </button>
    </nav>
  );
};
