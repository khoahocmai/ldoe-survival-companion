import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sword, Calculator, Layers, Package } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Bảng tin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/wiki/items', label: 'Vật phẩm', icon: <Sword className="w-5 h-5" /> },
    { path: '/combat', label: 'Chiến đấu', icon: <Calculator className="w-5 h-5" /> },
    { path: '/planner', label: 'Chế tạo', icon: <Layers className="w-5 h-5" /> },
    { path: '/inventory', label: 'Kho đồ', icon: <Package className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-charcoal-950/95 backdrop-blur-md border-t border-charcoal-800 flex items-center justify-around px-2 z-30 select-none">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-all ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
