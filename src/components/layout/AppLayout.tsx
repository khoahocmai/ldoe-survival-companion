import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';

export const AppLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  // A new page should start at the top, not wherever the previous one was scrolled.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      <div className="hidden h-full lg:block">
        <Sidebar />
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
        <Topbar onOpenMobileMenu={() => setIsMenuOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-8">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
        <MobileNav onOpenMenu={() => setIsMenuOpen(true)} />
      </div>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
