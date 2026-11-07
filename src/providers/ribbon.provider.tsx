import { Typography } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { TOOLBAR_HEIGHT_PX } from '../components/toolbar';

export type RibbonContent = ReactNode;

type RibbonContextValue = {
  content: RibbonContent;
  /** Replace the ribbon body. Pass `null` to clear. */
  setRibbon: (content: RibbonContent) => void;
  clearRibbon: () => void;
};

const RibbonContext = createContext<RibbonContextValue | null>(null);

/** Shared with full-bleed page shells under the ribbon. */
export const RIBBON_MIN_HEIGHT_PX = 48;

export function RibbonProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<RibbonContent>(null);

  const setRibbon = useCallback((next: RibbonContent) => {
    setContent(next);
  }, []);

  const clearRibbon = useCallback(() => {
    setContent(null);
  }, []);

  const value = useMemo<RibbonContextValue>(
    () => ({
      content,
      setRibbon,
      clearRibbon,
    }),
    [content, setRibbon, clearRibbon],
  );

  return (
    <RibbonContext.Provider value={value}>{children}</RibbonContext.Provider>
  );
}

export function useRibbon() {
  const context = useContext(RibbonContext);
  if (!context) {
    throw new Error('useRibbon must be used inside RibbonProvider');
  }
  return context;
}

/**
 * Set ribbon content while this component is mounted; clears on unmount.
 * Recreates when `deps` change.
 */
export function useSetRibbon(content: RibbonContent, deps: unknown[]) {
  const { setRibbon, clearRibbon } = useRibbon();

  useEffect(() => {
    setRibbon(content);
    return () => {
      clearRibbon();
    };
    // Caller controls freshness via deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, deps);
}

/** Standard page title + description block for the ribbon. */
export function RibbonTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        flex: 1,
      }}
    >
      <Typography.Title
        level={4}
        style={{ margin: 0, lineHeight: 1.3, fontSize: 18 }}
      >
        {title}
      </Typography.Title>
      {description ? (
        <Typography.Text
          type='secondary'
          style={{ fontSize: 13, lineHeight: 1.35 }}
        >
          {description}
        </Typography.Text>
      ) : null}
    </div>
  );
}

/**
 * Always rendered directly under the toolbar (sticky).
 * Pages fill it via {@link useRibbon} / {@link useSetRibbon}.
 */
export function AppRibbon() {
  const { content } = useRibbon();

  return (
    <div
      role='region'
      aria-label='ribbon'
      style={{
        position: 'sticky',
        insetBlockStart: TOOLBAR_HEIGHT_PX,
        zIndex: 9,
        minHeight: RIBBON_MIN_HEIGHT_PX,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingInline: 16,
        paddingBlock: 8,
        background: '#fff',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          width: '100%',
          minHeight: RIBBON_MIN_HEIGHT_PX - 16,
        }}
      >
        {content}
      </div>
    </div>
  );
}
