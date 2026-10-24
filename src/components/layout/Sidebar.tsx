import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Sword,
  Skull,
  Hammer,
  MapPin,
  Scroll,
  Calculator,
  Layers,
  Package,
  Target,
  FileText,
  Settings,
  Database,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { path: '/', label: 'Bảng tin sinh tồn', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'BÁCH KHOA TOÀN THƯ (WIKI)',
      items: [
        { path: '/wiki/items', label: 'Vật phẩm & Vũ khí', icon: <Sword className="w-4 h-4" /> },
        { path: '/wiki/enemies', label: 'Xác sống & Quái vật', icon: <Skull className="w-4 h-4" /> },
        { path: '/wiki/recipes', label: 'Công thức chế tạo', icon: <Hammer className="w-4 h-4" /> },
        { path: '/wiki/locations', label: 'Địa điểm sinh tồn', icon: <MapPin className="w-4 h-4" /> },
        { path: '/quests', label: 'Chuỗi nhiệm vụ', icon: <Scroll className="w-4 h-4" /> },
      ],
    },
    {
      title: 'CÔNG CỤ TÁC CHIẾN',
      items: [
        { path: '/combat', label: 'Máy tính chiến đấu', icon: <Calculator className="w-4 h-4" /> },
        { path: '/planner', label: 'Kế hoạch chế tạo', icon: <Layers className="w-4 h-4" /> },
      ],
    },
    {
      title: 'TIẾN ĐỘ CÁ NHÂN',
      items: [
        { path: '/inventory', label: 'Quản lý kho đồ', icon: <Package className="w-4 h-4" /> },
        { path: '/goals', label: 'Mục tiêu cá nhân', icon: <Target className="w-4 h-4" /> },
        { path: '/notes', label: 'Sổ tay ghi chép', icon: <FileText className="w-4 h-4" /> },
        { path: '/settings', label: 'Sao lưu & Dữ liệu', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-charcoal-950 border-r border-charcoal-800 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-charcoal-800/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-600/10 border border-amber-500/30 text-amber-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
            LDoE COMPANION
          </h1>
          <p className="text-[11px] font-mono text-amber-500/80 font-medium">TACTICAL OS v1.2</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <h2 className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
              {section.title}
            </h2>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-600/15 text-amber-400 border-l-2 border-amber-500 pl-2.5 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-charcoal-900 border-l-2 border-transparent'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-charcoal-800/80 bg-charcoal-950 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>Game DB: v1.20+</span>
        </span>
        <span className="text-[10px] bg-charcoal-850 px-1.5 py-0.5 rounded text-slate-400">
          Offline JSON
        </span>
      </div>
    </aside>
  );
};
