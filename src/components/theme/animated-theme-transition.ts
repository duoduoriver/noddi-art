import { flushSync } from 'react-dom';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

type AnimateThemeChangeOptions = {
  targetTheme: Theme;
  setTheme: (theme: Theme) => void;
  trigger?: HTMLElement | null;
  systemTheme?: ResolvedTheme;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

const THEME_TRANSITION_DURATION = 650;
const THEME_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(
  theme: Theme,
  systemTheme?: ResolvedTheme
): ResolvedTheme {
  return theme === 'system' ? (systemTheme ?? getSystemTheme()) : theme;
}

function getCurrentRootTheme(): ResolvedTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyRootTheme(theme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function commitThemeChange(
  targetTheme: Theme,
  resolvedTheme: ResolvedTheme,
  setTheme: (theme: Theme) => void
) {
  applyRootTheme(resolvedTheme);
  setTheme(targetTheme);
}

export async function animateThemeChange({
  targetTheme,
  setTheme,
  trigger,
  systemTheme,
}: AnimateThemeChangeOptions) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    setTheme(targetTheme);
    return;
  }

  const resolvedTheme = resolveTheme(targetTheme, systemTheme);
  const currentTheme = getCurrentRootTheme();
  const documentWithTransition = document as DocumentWithViewTransition;

  if (
    !trigger ||
    !documentWithTransition.startViewTransition ||
    prefersReducedMotion() ||
    currentTheme === resolvedTheme
  ) {
    commitThemeChange(targetTheme, resolvedTheme, setTheme);
    return;
  }

  const { top, left, width, height } = trigger.getBoundingClientRect();
  const x = left + width / 2;
  const y = top + height / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const root = document.documentElement;

  root.classList.add('theme-transitioning');

  const transition = documentWithTransition.startViewTransition(() => {
    flushSync(() => {
      commitThemeChange(targetTheme, resolvedTheme, setTheme);
    });
  });

  try {
    await transition.ready;

    const reveal = root.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: THEME_TRANSITION_DURATION,
        easing: THEME_TRANSITION_EASING,
        pseudoElement: '::view-transition-new(root)',
      }
    );

    await Promise.allSettled([reveal.finished, transition.finished]);
  } finally {
    root.classList.remove('theme-transitioning');
  }
}
