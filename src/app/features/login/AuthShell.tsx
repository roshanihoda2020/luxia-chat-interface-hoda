import type { ReactNode } from "react";
import { LoginEnvironment } from "@/app/features/login/LoginEnvironment";

export function AuthShell({
  children,
  expanded = false,
}: {
  children: ReactNode;
  expanded?: boolean;
}) {
  return (
    <div className="luxia-login-shell">
      <LoginEnvironment />

      <section className={`luxia-login-auth luxia-scrollbar${expanded ? " luxia-login-auth--expanded" : ""}`}>
        <div className={expanded ? "luxia-login-panel luxia-login-panel--expanded" : "luxia-login-panel"}>
          {children}
        </div>
      </section>
    </div>
  );
}
