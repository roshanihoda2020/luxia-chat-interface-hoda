/**
 * Prototype-only demo user avatars — presentation only.
 * Colors and initials are keyed by Organization user ID, never Project role.
 */

export type DemoUserAvatarSpec = {
  initials: string;
  background: string;
};

export const DEMO_USER_AVATAR_BY_ID: Record<string, DemoUserAvatarSpec> = {
  "user-01": { initials: "U1", background: "var(--luxia-purple-60)" },
  "user-02": { initials: "U2", background: "var(--luxia-blue-70)" },
  "user-03": { initials: "U3", background: "var(--luxia-purple-50)" },
  "user-04": { initials: "U4", background: "var(--luxia-blue-60)" },
  "user-05": { initials: "U5", background: "var(--luxia-brand-primary)" },
  "user-06": { initials: "U6", background: "var(--luxia-neutral-600)" },
};

const FALLBACK_AVATAR: DemoUserAvatarSpec = {
  initials: "?",
  background: "var(--luxia-neutral-600)",
};

export function getDemoUserAvatarSpec(userId: string): DemoUserAvatarSpec {
  return DEMO_USER_AVATAR_BY_ID[userId] ?? FALLBACK_AVATAR;
}

const SIZE_CLASS = {
  sm: "h-8 w-8 rounded-[8px] luxia-type-caption",
  md: "h-8 w-8 rounded-[8px] luxia-type-caption",
  lg: "h-12 w-12 rounded-[10px] luxia-type-body-dense-strong",
} as const;

export function DemoUserAvatar({
  userId,
  size = "sm",
  className = "",
  "aria-hidden": ariaHidden = true,
}: {
  userId: string;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const spec = getDemoUserAvatarSpec(userId);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-white ${SIZE_CLASS[size]} ${className}`}
      style={{ background: spec.background }}
      aria-hidden={ariaHidden}
    >
      {spec.initials}
    </span>
  );
}

export function DemoUserIdentityRow({
  userId,
  name,
  secondary,
  secondaryClassName,
}: {
  userId: string;
  name: string;
  secondary?: string;
  secondaryClassName?: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <DemoUserAvatar userId={userId} aria-hidden />
      <span className="min-w-0 flex flex-1 flex-col gap-0.5">
        <span className="truncate">{name}</span>
        {secondary ? (
          <span
            className={`truncate luxia-type-caption ${secondaryClassName ?? ""}`}
            style={secondaryClassName ? undefined : { color: "var(--luxia-text-muted)" }}
          >
            {secondary}
          </span>
        ) : null}
      </span>
    </span>
  );
}
