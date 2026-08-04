import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { LUXIA_PAGE_HEADER_ACTION } from "@/app/components/LuxiaPageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  ACCESS_LEVELS_GUIDANCE,
  PERMISSION_HIERARCHY_COPY,
} from "./ia";

export interface LuxiaAccessGuideContent {
  title?: string;
  sections?: { heading: string; body: string }[];
}

export interface LuxiaAccessGuideProps {
  content?: LuxiaAccessGuideContent;
  triggerLabel?: string;
  className?: string;
}

function defaultGuideContent(): Required<LuxiaAccessGuideContent> {
  return {
    title: "Access guide",
    sections: [
      {
        heading: "Access Levels",
        body: ACCESS_LEVELS_GUIDANCE.listPageDescription,
      },
      {
        heading: "Scope",
        body: ACCESS_LEVELS_GUIDANCE.listPageRule,
      },
      {
        heading: "Editor",
        body: ACCESS_LEVELS_GUIDANCE.editorPageDescription,
      },
      {
        heading: "Data Sources & Permissions",
        body: ACCESS_LEVELS_GUIDANCE.sourcesPermissionsDescription,
      },
      {
        heading: "Manage permission",
        body: PERMISSION_HIERARCHY_COPY.manage,
      },
      {
        heading: "Use permission",
        body: PERMISSION_HIERARCHY_COPY.use,
      },
      {
        heading: "Constellation access",
        body: PERMISSION_HIERARCHY_COPY.constellationAccess,
      },
    ],
  };
}

export function LuxiaAccessGuide({
  content,
  triggerLabel = "Access guide",
  className,
}: LuxiaAccessGuideProps) {
  const [open, setOpen] = useState(false);
  const resolved = {
    ...defaultGuideContent(),
    ...content,
    sections: content?.sections ?? defaultGuideContent().sections,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          {...LUXIA_PAGE_HEADER_ACTION.tertiary}
          className={className}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(88vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--luxia-purple-70)" }}>
            {resolved.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Guidance for Access Levels and permission hierarchy.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {resolved.sections.map((section) => (
            <section key={section.heading}>
              <h3
                className="luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {section.heading}
              </h3>
              <p
                className="mt-1 luxia-type-body-dense"
                style={{ color: "var(--luxia-text-secondary)" }}
              >
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
