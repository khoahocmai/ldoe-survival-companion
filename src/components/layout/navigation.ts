import { LucideIcon, Sword, Skull, Hammer, MapPin, Scroll, Calculator, Target, Building2, Layers, Settings } from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  /** Shorter label for the mobile bottom bar. */
  shortLabel: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Bách khoa',
    items: [
      { path: '/wiki/items', label: 'Vật phẩm', shortLabel: 'Vật phẩm', icon: Sword },
      { path: '/wiki/enemies', label: 'Xác sống & Boss', shortLabel: 'Quái vật', icon: Skull },
      { path: '/wiki/recipes', label: 'Công thức', shortLabel: 'Công thức', icon: Hammer },
      { path: '/wiki/locations', label: 'Địa điểm', shortLabel: 'Địa điểm', icon: MapPin },
      { path: '/wiki/quests', label: 'Nhiệm vụ', shortLabel: 'Nhiệm vụ', icon: Scroll },
    ],
  },
  {
    title: 'Công cụ',
    items: [
      { path: '/combat', label: 'Chiến đấu', shortLabel: 'Chiến đấu', icon: Calculator },
      { path: '/points', label: 'Điểm sự kiện', shortLabel: 'Điểm', icon: Target },
      { path: '/construction', label: 'Công trình', shortLabel: 'Công trình', icon: Building2 },
      { path: '/planner', label: 'Kế hoạch chế tạo', shortLabel: 'Chế tạo', icon: Layers },
    ],
  },
  {
    title: 'Hệ thống',
    items: [{ path: '/settings', label: 'Cài đặt & dữ liệu', shortLabel: 'Cài đặt', icon: Settings }],
  },
];

/** Items pinned to the mobile bottom bar; everything else is reachable from the "Menu" button. */
export const MOBILE_PRIMARY_PATHS = ['/wiki/items', '/wiki/enemies', '/combat', '/planner'];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
