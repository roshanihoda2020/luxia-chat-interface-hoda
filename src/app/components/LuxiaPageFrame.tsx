import type { CSSProperties, ReactNode } from "react";
import {
  getLuxiaPageFrameStyle,
  LUXIA_PAGE_LAYOUT,
  type LuxiaPageFrameVariant,
} from "./luxiaPageLayout";

export type { LuxiaPageFrameVariant, LuxiaPageVariant } from "./luxiaPageLayout";

export interface LuxiaPageFrameProps {
  children: ReactNode;
  variant?: LuxiaPageFrameVariant;
  className?: string;
  style?: CSSProperties;
  /** When false, omit shared horizontal gutter (caller owns padding). Default true. */
  withGutter?: boolean;
  /** When true, omit top/bottom shell padding. Default false. */
  flush?: boolean;
}

/**
 * Shared content frame for Luxia pages.
 * Always full-width within the shell, centered, with identical gutters.
 */
export function LuxiaPageFrame({
  children,
  variant = "standard",
  className = "",
  style,
  withGutter = true,
  flush = false,
}: LuxiaPageFrameProps) {
  const frame = getLuxiaPageFrameStyle(variant);
  return (
    <div
      className={`luxia-page-frame min-w-0 ${className}`.trim()}
      style={{
        width: frame.width,
        maxWidth: frame.maxWidth,
        marginInline: frame.marginInline,
        boxSizing: frame.boxSizing,
        paddingInline: withGutter ? frame.paddingInline : undefined,
        paddingBlockStart: flush ? undefined : LUXIA_PAGE_LAYOUT.padTop,
        paddingBlockEnd: flush ? undefined : LUXIA_PAGE_LAYOUT.padBlockEnd,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface LuxiaPageBodyProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function LuxiaPageBody({
  children,
  className = "",
  style,
}: LuxiaPageBodyProps) {
  return (
    <div className={`luxia-page-body min-w-0 w-full ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
