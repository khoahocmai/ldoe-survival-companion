import React, { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  label: React.ReactNode;
  /** A single element that accepts pointer/focus handlers (button, link, or a component that spreads its props). */
  children: React.ReactElement;
  /** Milliseconds before a hover opens it; keyboard focus opens it immediately. */
  delay?: number;
}

interface Anchor {
  x: number;
  y: number;
  below: boolean;
}

const EDGE = 96;

/**
 * Hover and keyboard-focus hint. Unlike the `title` attribute it is reachable without a mouse and is
 * announced through aria-describedby. Touch screens never see it, so it must only carry extras:
 * anything the user needs has to be visible text.
 */
export const Tooltip: React.FC<TooltipProps> = ({ label, children, delay = 350 }) => {
  const id = useId();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setAnchor(null);
  }, []);

  const show = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const below = rect.top < 48;
    setAnchor({
      x: Math.min(Math.max(rect.left + rect.width / 2, EDGE), window.innerWidth - EDGE),
      y: below ? rect.bottom + 8 : rect.top - 8,
      below,
    });
  }, []);

  useEffect(() => {
    if (!anchor) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', hide, true);
    };
  }, [anchor, hide]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!label) return children;

  const own = children.props as {
    onPointerEnter?: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave?: (e: React.PointerEvent<HTMLElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  };

  const trigger = cloneElement(children, {
    'aria-describedby': anchor ? id : undefined,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      own.onPointerEnter?.(e);
      if (e.pointerType !== 'mouse') return;
      const el = e.currentTarget;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => show(el), delay);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      own.onPointerLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      own.onFocus?.(e);
      let keyboard = true;
      try {
        keyboard = e.currentTarget.matches(':focus-visible');
      } catch {
        /* older browser: treat every focus as keyboard focus */
      }
      if (keyboard) show(e.currentTarget);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      own.onBlur?.(e);
      hide();
    },
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      own.onClick?.(e);
      hide();
    },
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <>
      {trigger}
      {anchor &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ left: anchor.x, top: anchor.y }}
            className={`pointer-events-none fixed z-toast max-w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 animate-fade-in rounded-md bg-fg px-2 py-1 text-center text-xs font-medium text-bg shadow-pop ${
              anchor.below ? '' : '-translate-y-full'
            }`}
          >
            {label}
          </div>,
          document.body
        )}
    </>
  );
};
