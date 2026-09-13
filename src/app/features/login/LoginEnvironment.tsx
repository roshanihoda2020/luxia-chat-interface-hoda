import { useEffect, useRef } from "react";
import { LoginDotBrand } from "@/app/features/login/LoginDotBrand";

/** Depth parallax on fine pointers only — does not affect flashlight tracking. */
export function LoginEnvironment() {
  const envRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = envRef.current;
    if (!root) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerMq = window.matchMedia("(any-pointer: fine)");

    let frame = 0;
    let running = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function apply(x: number, y: number) {
      root!.style.setProperty("--luxia-para-x", x.toFixed(3));
      root!.style.setProperty("--luxia-para-y", y.toFixed(3));
    }

    function allowed() {
      return !reduceMq.matches && finePointerMq.matches;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      apply(currentX, currentY);

      if (
        Math.abs(targetX - currentX) < 0.002 &&
        Math.abs(targetY - currentY) < 0.002
      ) {
        running = false;
        currentX = targetX;
        currentY = targetY;
        apply(currentX, currentY);
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

    function onMove(event: PointerEvent) {
      if (!allowed()) return;
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
      ensureTick();
    }

    function reset() {
      targetX = 0;
      targetY = 0;
      ensureTick();
    }

    function onConstraintChange() {
      if (!allowed()) {
        targetX = 0;
        targetY = 0;
        currentX = 0;
        currentY = 0;
        apply(0, 0);
        window.cancelAnimationFrame(frame);
        running = false;
      }
    }

    apply(0, 0);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", reset);
    reduceMq.addEventListener("change", onConstraintChange);
    finePointerMq.addEventListener("change", onConstraintChange);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", reset);
      reduceMq.removeEventListener("change", onConstraintChange);
      finePointerMq.removeEventListener("change", onConstraintChange);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={envRef}
      className="luxia-login-environment"
      style={{ background: "var(--luxia-gradient-navigation)" }}
    >
      <div aria-hidden>
        <div className="luxia-login-environment-wash" />

        <div className="luxia-login-environment-field luxia-login-environment-field--far">
          <div className="luxia-login-environment-dots luxia-login-environment-dots--far" />
        </div>
        <div className="luxia-login-environment-field luxia-login-environment-field--mid">
          <div className="luxia-login-environment-dots luxia-login-environment-dots--mid" />
        </div>

        {/* Local wall light — same pointer as logo; reveals pixels, not a flat spotlight */}
        <div className="luxia-login-environment-wall-light">
          <div className="luxia-login-environment-wall-light__pixels luxia-login-environment-wall-light__pixels--far" />
          <div className="luxia-login-environment-wall-light__pixels luxia-login-environment-wall-light__pixels--mid" />
        </div>

        <div className="luxia-login-environment-vignette" />
      </div>

      <div className="luxia-login-brand-compose">
        <LoginDotBrand />
        <p className="luxia-login-brand-tagline">
          Intelligence that illuminates your work.
        </p>
      </div>
    </div>
  );
}
