import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type DialogVariant = 'center' | 'top' | 'drawer-right' | 'drawer-left';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `center`: modal (bottom sheet on phones). `top`: command palette. `drawer-*`: full-height side panel. */
  variant?: DialogVariant;
  /** Accessible name when the content has no visible title. */
  label?: string;
  /** Id of the element inside that titles the dialog. */
  labelledBy?: string;
  /** Extra classes for the panel (width, height). */
  className?: string;
  children: React.ReactNode;
}

const EXIT_MS = 150;

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];
const FOCUSABLE = FOCUSABLE_SELECTORS.join(',');
const FOCUSABLE_IN_BODY = FOCUSABLE_SELECTORS.map((s) => `[data-dialog-body] ${s}`).join(',');

const placement: Record<DialogVariant, string> = {
  center: 'z-modal items-end justify-center p-0 sm:items-center sm:p-4',
  top: 'z-modal items-start justify-center p-4 pt-[12vh]',
  'drawer-right': 'z-overlay justify-end',
  'drawer-left': 'z-overlay justify-start',
};

const shape: Record<DialogVariant, string> = {
  center: 'max-h-[92vh] w-full overflow-hidden rounded-t-dialog border border-line sm:rounded-dialog',
  top: 'w-full overflow-hidden rounded-dialog border border-line',
  'drawer-right': 'h-full w-full',
  'drawer-left': 'h-full',
};

const enter: Record<DialogVariant, string> = {
  center: 'animate-pop-in',
  top: 'animate-pop-in',
  'drawer-right': 'animate-slide-in',
  'drawer-left': 'animate-slide-in-left',
};

const exit: Record<DialogVariant, string> = {
  center: 'animate-pop-out',
  top: 'animate-pop-out',
  'drawer-right': 'animate-slide-out',
  'drawer-left': 'animate-slide-out-left',
};

// Dialogs can nest (a confirm above an edit form): only the topmost one reacts to Escape,
// and the page behind stays locked until the last one closes.
const openStack: number[] = [];
let nextId = 0;
let lockCount = 0;
let previousOverflow = '';

function lockScroll() {
  if (lockCount++ === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  if (--lockCount === 0) document.body.style.overflow = previousOverflow;
}

function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
}

/**
 * Accessible overlay shared by every modal, drawer and palette: rendered in a portal, labelled for
 * screen readers, traps Tab inside, closes on Escape / backdrop click and gives focus back to
 * whatever opened it. Content stays mounted for the exit animation.
 */
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  variant = 'center',
  label,
  labelledBy,
  className = '',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Keep the last content while the exit animation plays, since callers often clear it as they close.
  const shownChildren = useRef(children);
  if (isOpen) shownChildren.current = children;

  const [lingering, setLingering] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setLingering(true);
      return;
    }
    const timer = setTimeout(() => setLingering(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id = nextId++;
    openStack.push(id);
    lockScroll();

    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const target =
        panel.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.querySelector<HTMLElement>(FOCUSABLE_IN_BODY) ??
        focusables(panel)[0] ??
        panel;
      target.focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      openStack.splice(openStack.indexOf(id), 1);
      unlockScroll();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = focusables(panel);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if ((!isOpen && !lingering) || typeof document === 'undefined') return null;
  const closing = !isOpen;

  return createPortal(
    <div className={`fixed inset-0 flex ${placement[variant]}`}>
      <div
        className={`absolute inset-0 bg-black/50 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className={`relative z-raised flex flex-col bg-surface shadow-pop outline-none ${shape[variant]} ${
          closing ? exit[variant] : enter[variant]
        } ${className}`}
      >
        {shownChildren.current}
      </div>
    </div>,
    document.body
  );
};
