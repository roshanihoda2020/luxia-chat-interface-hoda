import { useEffect, useId, useRef } from "react";

/** Official star path from Luxia-Star.svg (upper-right end of lockup). */
const STAR_PATH =
  "M104.83 15.958V3.75529L108.58 0.0234375V11.166L104.841 15.9368L109.635 12.2262H117.498L113.758 15.9474H104.83V15.958ZM104.83 15.958V28.1607L101.09 31.882V20.7395L104.819 15.9686L100.025 19.6899H92.1621L95.9017 15.9686H104.83V15.958Z";

/** Official LUXIA letter paths from Luxia-Star.svg. */
function LockupGeometry() {
  return (
    <>
      <path d={STAR_PATH} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M88.6111 32.3504L86.6797 38.9552H90.9883L89.0568 32.3504H88.5997H88.6111ZM83.6283 27.6016H94.0511L99.834 45.6016H92.9426L92.4054 43.7767H85.2626L84.7254 45.6016H77.834L83.6168 27.6016H83.6283Z"
      />
      <path d="M73.834 26.6016H67.834V45.6016H73.834V26.6016Z" />
      <path d="M56.8387 27.6016L53.9441 31.5831H53.7973L50.9341 27.6016H43.834L50.3363 36.6016L43.834 45.6016H50.9341L53.7658 41.6407H53.9756L56.8387 45.6016H63.834L57.3841 36.6016L63.834 27.6016H56.8387Z" />
      <path d="M32.4751 27.6016V37.2608C32.4751 39.4891 31.3897 40.6544 29.3724 40.6544C27.355 40.6544 26.1929 39.4891 26.1929 37.2608V27.6016H19.834V37.3631C19.834 43.3426 24.2414 45.6016 29.2408 45.6016C34.2402 45.6016 38.834 43.3426 38.834 37.3631V27.6016H32.4751Z" />
      <path d="M1.83398 27.6016V45.6016H17.834V40.8396H9.82859L1.83398 45.6016L8.09157 37.8621V27.6016H1.83398Z" />
    </>
  );
}

const VIEW_W = 120;
const VIEW_H = 47;

/** Matches resting/lit SVG pattern cell (same lattice everywhere). */
const DOT_GRID = 0.65;
const DOT_ORIGIN = 0.325;

/** Local flashlight — true screen-space px (~4× prior hazelnut size). */
const RADIUS_MIN = 70;
const RADIUS_MAX = 100;
const RADIUS_BASE = 84;

function LockupDotsSvg({
  uid,
  fill,
  className,
  dotR = 0.42,
}: {
  uid: string;
  fill: string;
  className?: string;
  dotR?: number;
}) {
  const clipId = `luxia-clip-${uid}`;
  const patternId = `luxia-pat-${uid}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMinYMid meet"
      focusable="false"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <LockupGeometry />
        </clipPath>
        <pattern
          id={patternId}
          width={DOT_GRID}
          height={DOT_GRID}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={DOT_ORIGIN} cy={DOT_ORIGIN} r={dotR} fill={fill} />
        </pattern>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={VIEW_W} height={VIEW_H} fill={`url(#${patternId})`} />
      </g>
    </svg>
  );
}

/** Soft contact silhouette (solid fill — blurred in CSS, not a pixel extrusion). */
function LockupSolidSvg({
  uid,
  fill,
  className,
}: {
  uid: string;
  fill: string;
  className?: string;
}) {
  const clipId = `luxia-clip-${uid}`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMinYMid meet"
      focusable="false"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <LockupGeometry />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={VIEW_W} height={VIEW_H} fill={fill} />
      </g>
    </svg>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Dotted Luxia lockup — depth + rest tonal layers + digital flicker + flashlight.
 * Hover/flashlight mechanics intentionally unchanged.
 */
export function LoginDotBrand() {
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerMq = window.matchMedia("(any-pointer: fine)");

    let frame = 0;
    let running = false;
    let targetX = 0.42;
    let targetY = 0.72;
    let targetLit = 0;
    let currentX = targetX;
    let currentY = targetY;
    let currentLit = 0;
    const radiusPx = clamp(RADIUS_BASE, RADIUS_MIN, RADIUS_MAX);

    function apply(x: number, y: number, lit: number) {
      root!.style.setProperty("--luxia-dot-x", `${(x * 100).toFixed(2)}%`);
      root!.style.setProperty("--luxia-dot-y", `${(y * 100).toFixed(2)}%`);
      root!.style.setProperty("--luxia-dot-r", `${radiusPx}px`);
      root!.style.setProperty("--luxia-dot-lit", lit.toFixed(4));
    }

    function interactionAllowed(): boolean {
      return !reduceMq.matches && finePointerMq.matches;
    }

    function tick() {
      // Enter snappy; leave ~300–400ms
      const litEase = targetLit > currentLit ? 0.45 : 0.18;
      currentX += (targetX - currentX) * 0.5;
      currentY += (targetY - currentY) * 0.5;
      currentLit += (targetLit - currentLit) * litEase;
      apply(currentX, currentY, currentLit);

      if (
        Math.abs(targetX - currentX) < 0.0008 &&
        Math.abs(targetY - currentY) < 0.0008 &&
        Math.abs(targetLit - currentLit) < 0.0008
      ) {
        running = false;
        currentX = targetX;
        currentY = targetY;
        currentLit = targetLit;
        apply(currentX, currentY, currentLit);
        return;
      }

      frame = window.requestAnimationFrame(tick);
    }

    function ensureTick() {
      if (!running) {
        running = true;
        frame = window.requestAnimationFrame(tick);
      }
    }

    function resetLit() {
      targetLit = 0;
      ensureTick();
    }

    function onMove(event: PointerEvent) {
      if (!interactionAllowed()) return;

      const rect = root!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const pad = radiusPx * 0.4;
      const outsideX = Math.max(0, -(localX + pad), localX - pad - rect.width);
      const outsideY = Math.max(0, -(localY + pad), localY - pad - rect.height);
      const outsideDist = Math.hypot(outsideX, outsideY);

      targetX = clamp(localX / rect.width, 0, 1);
      targetY = clamp(localY / rect.height, 0, 1);
      targetLit =
        outsideDist >= pad ? 0 : Math.max(0, 1 - outsideDist / pad);

      ensureTick();
    }

    function onConstraintChange() {
      if (!interactionAllowed()) {
        targetLit = 0;
        currentLit = 0;
        apply(currentX, currentY, 0);
        window.cancelAnimationFrame(frame);
        running = false;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) resetLit();
    }

    apply(targetX, targetY, 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", resetLit);
    document.documentElement.addEventListener("mouseleave", resetLit, {
      passive: true,
    });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduceMq.addEventListener("change", onConstraintChange);
    finePointerMq.addEventListener("change", onConstraintChange);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", resetLit);
      document.documentElement.removeEventListener("mouseleave", resetLit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceMq.removeEventListener("change", onConstraintChange);
      finePointerMq.removeEventListener("change", onConstraintChange);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  /* 18 irregular spatial distributions — async overlap = changing active locations */
  const flickerGroups = [
    { id: 1, fill: "var(--luxia-purple-40)" },
    { id: 2, fill: "var(--luxia-purple-20)" },
    { id: 3, fill: "var(--luxia-purple-40)" },
    { id: 4, fill: "var(--luxia-purple-20)" },
    { id: 5, fill: "var(--luxia-purple-10)" },
    { id: 6, fill: "var(--luxia-purple-40)" },
    { id: 7, fill: "var(--luxia-purple-20)" },
    { id: 8, fill: "var(--luxia-purple-10)" },
    { id: 9, fill: "var(--luxia-purple-40)" },
    { id: 10, fill: "var(--luxia-purple-20)" },
    { id: 11, fill: "var(--luxia-purple-10)" },
    { id: 12, fill: "var(--luxia-purple-20)" },
    { id: 13, fill: "var(--luxia-purple-40)" },
    { id: 14, fill: "var(--luxia-purple-20)" },
    { id: 15, fill: "var(--luxia-purple-10)" },
    { id: 16, fill: "var(--luxia-purple-40)" },
    { id: 17, fill: "color-mix(in srgb, #96DBFB 36%, var(--luxia-purple-20))" },
    { id: 18, fill: "color-mix(in srgb, #96DBFB 32%, var(--luxia-purple-10))" },
  ] as const;

  /* Tiny silhouette edge slices — CSS clip + brief edge-aware translate */
  const edgeFragments = [
    { id: 1, fill: "var(--luxia-purple-20)" },
    { id: 2, fill: "var(--luxia-purple-40)" },
    { id: 3, fill: "var(--luxia-purple-20)" },
    { id: 4, fill: "var(--luxia-purple-10)" },
    { id: 5, fill: "var(--luxia-purple-20)" },
    { id: 6, fill: "var(--luxia-purple-10)" },
    { id: 7, fill: "var(--luxia-purple-20)" },
    { id: 8, fill: "var(--luxia-purple-40)" },
    { id: 9, fill: "var(--luxia-purple-20)" },
    { id: 10, fill: "var(--luxia-purple-10)" },
    { id: 11, fill: "var(--luxia-purple-20)" },
    { id: 12, fill: "var(--luxia-purple-40)" },
    { id: 13, fill: "var(--luxia-purple-20)" },
    { id: 14, fill: "var(--luxia-purple-10)" },
    { id: 15, fill: "var(--luxia-purple-20)" },
    { id: 16, fill: "var(--luxia-purple-10)" },
  ] as const;

  const volumeSteps = [
    {
      id: 5,
      fill: "color-mix(in srgb, #0c0612 55%, var(--luxia-purple-70))",
    },
    {
      id: 4,
      fill: "color-mix(in srgb, #100818 40%, var(--luxia-purple-70))",
    },
    {
      id: 3,
      fill: "color-mix(in srgb, var(--luxia-purple-70) 85%, #100818)",
    },
    {
      id: 2,
      fill: "color-mix(in srgb, var(--luxia-purple-70) 70%, var(--luxia-purple-60))",
    },
    {
      id: 1,
      fill: "color-mix(in srgb, var(--luxia-purple-60) 75%, var(--luxia-purple-70))",
    },
  ] as const;

  return (
    <div ref={rootRef} className="luxia-login-dotmark" aria-hidden>
      <LockupSolidSvg
        uid={`${uid}-shadow`}
        className="luxia-login-dotmark__contact-shadow"
        fill="color-mix(in srgb, #100818 82%, var(--luxia-purple-70))"
      />

      <div className="luxia-login-dotmark__volume">
        {volumeSteps.map((step) => (
          <LockupDotsSvg
            key={step.id}
            uid={`${uid}-vol${step.id}`}
            className={`luxia-login-dotmark__volume-step luxia-login-dotmark__volume-step--${step.id}`}
            fill={step.fill}
            dotR={0.22}
          />
        ))}
      </div>

      <LockupDotsSvg
        uid={`${uid}-rest`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--rest"
        fill="var(--luxia-purple-40)"
        dotR={0.22}
      />
      <LockupDotsSvg
        uid={`${uid}-restm`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--rest-m"
        fill="var(--luxia-purple-20)"
        dotR={0.22}
      />
      <LockupDotsSvg
        uid={`${uid}-resth`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--rest-h"
        fill="var(--luxia-purple-10)"
        dotR={0.22}
      />
      <LockupDotsSvg
        uid={`${uid}-restrim`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--rest-rim"
        fill="var(--luxia-purple-10)"
        dotR={0.22}
      />
      <LockupDotsSvg
        uid={`${uid}-restb`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--rest-b"
        fill="color-mix(in srgb, #96DBFB 40%, var(--luxia-purple-20))"
        dotR={0.22}
      />
      <div className="luxia-login-dotmark__flicker">
        {flickerGroups.map((group) => (
          <LockupDotsSvg
            key={group.id}
            uid={`${uid}-fx${group.id}`}
            className={`luxia-login-dotmark__layer luxia-login-dotmark__flicker-g luxia-login-dotmark__flicker-g--${group.id}`}
            fill={group.fill}
            dotR={0.22}
          />
        ))}
      </div>
      <div className="luxia-login-dotmark__edge-glitch">
        {edgeFragments.map((frag) => (
          <LockupDotsSvg
            key={frag.id}
            uid={`${uid}-eg${frag.id}`}
            className={`luxia-login-dotmark__layer luxia-login-dotmark__edge-frag luxia-login-dotmark__edge-frag--${frag.id}`}
            fill={frag.fill}
            dotR={0.22}
          />
        ))}
      </div>
      <LockupDotsSvg
        uid={`${uid}-lit`}
        className="luxia-login-dotmark__layer luxia-login-dotmark__layer--lit"
        fill="currentColor"
        dotR={0.24}
      />
    </div>
  );
}
