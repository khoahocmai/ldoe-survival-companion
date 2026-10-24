import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { NAV_SECTIONS } from './navigation';
import { IconButton } from '../common/Button';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => (
  <aside className="flex h-full w-60 shrink-0 select-none flex-col border-r border-line bg-surface">
    <div className="flex h-14 items-center justify-between gap-2 px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-solid text-accent-fg">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">LDoE Companion</span>
      </div>
      {onCloseMobile && (
        <IconButton label="Đóng menu" onClick={onCloseMobile} className="lg:hidden">
          <X />
        </IconButton>
      )}
    </div>

    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Điều hướng chính">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="mb-1 px-3 text-xs font-medium text-faint">{section.title}</h2>
          <ul className="space-y-0.5">
            {section.items.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-subtle font-medium text-fg' : 'text-muted hover:bg-subtle/60 hover:text-fg'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </aside>
);
