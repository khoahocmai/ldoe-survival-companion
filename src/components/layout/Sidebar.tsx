import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, X } from 'lucide-react';
import { NAV_SECTIONS } from './navigation';
import { IconButton } from '../common/Button';
import { Tooltip } from '../common/Tooltip';

interface SidebarProps {
  onCloseMobile?: () => void;
  /** Desktop only: show just the icons. The mobile drawer is always expanded. */
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, collapsed = false }) => (
  <aside
    className={`flex h-full shrink-0 select-none flex-col border-r border-line bg-surface transition-[width] duration-200 ${
      collapsed ? 'w-14' : 'w-52'
    }`}
  >
    <div className={`flex h-12 items-center gap-2 ${collapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-solid text-accent-fg">
          <ShieldAlert className="h-4 w-4" />
        </span>
        {!collapsed && <span className="text-sm font-semibold tracking-tight">LDoE Companion</span>}
      </div>
      {onCloseMobile && (
        <IconButton label="Đóng menu" onClick={onCloseMobile} className="lg:hidden">
          <X />
        </IconButton>
      )}
    </div>

    <nav className={`flex-1 overflow-y-auto py-2 px-2`} aria-label="Điều hướng chính">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.title} className={index > 0 ? (collapsed ? 'mt-2 border-t border-line pt-2' : 'mt-4') : ''}>
          {!collapsed && <h2 className="mb-0.5 px-2.5 text-xs font-medium text-faint">{section.title}</h2>}
          <ul className="space-y-0.5">
            {section.items.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <Tooltip label={collapsed ? label : undefined}>
                <NavLink
                  to={path}
                  onClick={onCloseMobile}
                  aria-label={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-lg text-sm transition-colors ${
                      collapsed ? 'h-9 justify-center' : 'gap-2.5 px-2.5 py-1.5'
                    } ${isActive ? 'bg-subtle font-medium text-fg' : 'text-muted hover:bg-subtle/60 hover:text-fg'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </aside>
);
