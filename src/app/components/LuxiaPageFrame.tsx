import { forwardRef, type CSSProperties, type ReactNode } from "react";
import {
  getLuxiaPageFrameStyle,
  getLuxiaPageHeadingRegionStyle,
  LUXIA_PAGE_LAYOUT,
  type LuxiaPageFrameVariant,
} from "./luxiaPageLayout";

export type { LuxiaPageFrameVariant, LuxiaPageVariant } from "./luxiaPageLayout";

export interface LuxiaPageFrameProps {
  children: ReactNode;
  variant?: LuxiaPageFrameVariant;
  className?: string;
  style?: CSSProperties;
  withGutter?: boolean;
  flush?: boolean;
}

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

export interface LuxiaPageHeadingRegionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const LuxiaPageHeadingRegion = forwardRef<
  HTMLDivElement,
  LuxiaPageHeadingRegionProps
>(function LuxiaPageHeadingRegion(
  { children, className = "", style },
  ref,
) {
  const region = getLuxiaPageHeadingRegionStyle();
  return (
    <div
      ref={ref}
      className={`luxia-page-heading-region min-w-0 ${className}`.trim()}
      style={{
        width: region.width,
        maxWidth: region.maxWidth,
        marginInline: region.marginInline,
        boxSizing: region.boxSizing,
        ...style,
      }}
    >
      {children}
    </div>
  );
});
