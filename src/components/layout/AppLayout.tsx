import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { Dialog } from '../common/Dialog';

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
      {/* An href="#..." would collide with the hash router, so this is a button that moves focus. */}
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only z-toast rounded-control bg-accent-solid px-3 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Bỏ qua điều hướng
      </button>
      <div className="hidden h-full lg:block">
        <Sidebar collapsed={isCollapsed} />
      </div>

      <Dialog isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} variant="drawer-left" label="Menu">
        <Sidebar onCloseMobile={() => setIsMenuOpen(false)} />
      </Dialog>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileMenu={() => setIsMenuOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main ref={mainRef} tabIndex={-1} className="flex-1 outline-none overflow-y-auto px-3 py-page-y pb-24 sm:px-4 lg:px-5 lg:pb-5">
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
