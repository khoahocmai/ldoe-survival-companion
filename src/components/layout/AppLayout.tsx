import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';

const SIDEBAR_KEY = 'ldoe_sidebar_collapsed';

export const AppLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const mainRef = React.useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleSidebar = () =>
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        /* preference just won't persist */
      }
      return next;
    });

  // A new page should start at the top, not wherever the previous one was scrolled.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <div className="hidden h-full lg:block">
        <Sidebar collapsed={isCollapsed} />
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/50" onClick={() => setIsMenuOpen(false)} aria-hidden="true" />
          <div className="relative h-full animate-slide-in shadow-pop">
            <Sidebar onCloseMobile={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileMenu={() => setIsMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-3 py-4 pb-24 sm:px-4 lg:px-5 lg:py-4 lg:pb-5">
          <div className="mx-auto max-w-[1400px]">
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
        <MobileNav onOpenMenu={() => setIsMenuOpen(true)} />
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
