import { useEffect, useId, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { TagColorSwatches } from "./TagColorSwatches";
import type { DocumentTagColorId } from "./types";

export function TagDefinitionForm({
  title,
  initialName,
  initialColor,
  submitLabel,
  namePlaceholder,
  actionsSpread = false,
  onCancel,
  onSubmit,
}: {
  title: string;
  initialName: string;
  initialColor: DocumentTagColorId;
  submitLabel: string;
  namePlaceholder?: string;
  actionsSpread?: boolean;
  onCancel: () => void;
  onSubmit: (name: string, color: DocumentTagColorId) => string | null;
}) {
  const nameId = useId();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<DocumentTagColorId>(initialColor);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
    setError(null);
  }, [initialName, initialColor]);

  function handleSubmit() {
    const message = onSubmit(name, color);
    if (message) setError(message);
  }

  return (
    <div className="space-y-3 p-3">
      <p className="luxia-type-label-small" style={{ color: "var(--luxia-text-primary)" }}>
        {title}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          autoComplete="off"
          autoFocus
          placeholder={namePlaceholder}
        />
      </div>
      <div className="space-y-1.5">
        <p className="luxia-type-label-form">Color</p>
        <TagColorSwatches name={`${nameId}-color`} value={color} onChange={setColor} />
      </div>
      {error ? (
        <p className="luxia-type-caption" style={{ color: "var(--luxia-error-70)" }} role="alert">
          {error}
        </p>
      ) : null}
      <div className={`flex items-center gap-2 ${actionsSpread ? "justify-between" : "justify-end"}`}>
        <Button type="button" variant="tertiary" size="compact" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="compact" onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
