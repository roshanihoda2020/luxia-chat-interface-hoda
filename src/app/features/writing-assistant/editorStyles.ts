export const WRITING_ASSISTANT_EDITOR_STYLES = `
  .writing-assistant-editor {
    word-break: normal;
    overflow-wrap: break-word;
    white-space: normal;
    hyphens: none;
    min-width: 0;
    user-select: text;
    -webkit-user-select: text;
  }
  .writing-assistant-editor b,
  .writing-assistant-editor strong {
    font-weight: 700;
  }
  .writing-assistant-editor i,
  .writing-assistant-editor em {
    font-style: italic;
  }
  .writing-assistant-editor u {
    text-decoration: underline;
  }
  .writing-assistant-editor s,
  .writing-assistant-editor strike {
    text-decoration: line-through;
  }
  .writing-assistant-editor * {
    user-select: text;
    -webkit-user-select: text;
  }
  .writing-assistant-editor p,
  .writing-assistant-editor li,
  .writing-assistant-editor h1,
  .writing-assistant-editor h2,
  .writing-assistant-editor h3,
  .writing-assistant-editor blockquote {
    max-width: 100%;
    letter-spacing: normal;
    word-spacing: normal;
    word-break: normal;
    overflow-wrap: break-word;
    white-space: normal;
    hyphens: none;
  }
  .writing-assistant-editor span,
  .writing-assistant-editor font {
    letter-spacing: normal !important;
    word-spacing: normal !important;
    word-break: inherit !important;
    white-space: inherit !important;
    hyphens: none !important;
  }
  ::highlight(wa-search-match) {
    background-color: rgba(253, 230, 138, 0.55);
    color: inherit;
  }
  ::highlight(wa-search-current) {
    background-color: rgba(251, 191, 36, 0.5);
    color: inherit;
  }
  .writing-assistant-editor .wa-mark-assist,
  .writing-assistant-editor .wa-mark-revision,
  .writing-assistant-editor .wa-mark-comment,
  .writing-assistant-editor .wa-has-comment {
    pointer-events: none;
  }
  .writing-assistant-editor .wa-mark-assist {
    background: var(--luxia-opacity-brand-primary-08, rgba(88, 80, 236, 0.08));
    border-radius: 2px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .writing-assistant-editor.wa-show-revisions .wa-mark-revision,
  .writing-assistant-editor:not(.wa-hide-revisions) .wa-mark-revision {
    background: color-mix(in srgb, var(--luxia-success, #10B981) 12%, transparent);
    border-radius: 2px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .writing-assistant-editor.wa-hide-revisions .wa-mark-revision {
    background: transparent;
  }
  /* Comment: dotted underline only — no heavy fill; badge lives in the margin. */
  .writing-assistant-editor .wa-mark-comment,
  .writing-assistant-editor .wa-has-comment {
    text-decoration: underline dotted color-mix(in srgb, var(--luxia-blue-50, #3BA8D9) 85%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 3px;
    border-bottom: none;
    background: transparent;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  /* Revision + comment on same host: keep tint + dotted underline. */
  .writing-assistant-editor.wa-show-revisions .wa-mark-revision.wa-has-comment,
  .writing-assistant-editor:not(.wa-hide-revisions) .wa-mark-revision.wa-has-comment {
    text-decoration: underline dotted color-mix(in srgb, var(--luxia-blue-50, #3BA8D9) 85%, transparent);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 3px;
  }
  .wa-empty-zone {
    pointer-events: none;
    width: min(100%, 22.5rem);
    border-radius: 10px;
    border: 1.5px dashed color-mix(in srgb, #8E63EB 28%, var(--luxia-border-default, #D8D4E0));
    background: color-mix(in srgb, #8E63EB 5%, white);
    padding: 1.75rem 1.5rem 1.6rem;
    text-align: center;
    transition:
      border-color 150ms ease,
      background-color 150ms ease,
      box-shadow 150ms ease,
      transform 150ms ease;
  }
  .wa-empty-zone--hover {
    border-color: color-mix(in srgb, #8E63EB 42%, var(--luxia-border-default, #D8D4E0));
    background: color-mix(in srgb, #8E63EB 8%, white);
    box-shadow: 0 1px 2px color-mix(in srgb, #8E63EB 8%, transparent);
  }
  .wa-empty-zone--drag-valid {
    border-style: solid;
    border-color: color-mix(in srgb, #8E63EB 55%, var(--luxia-border-default, #D8D4E0));
    background: color-mix(in srgb, #8E63EB 11%, white);
    box-shadow: 0 0 0 1px color-mix(in srgb, #8E63EB 12%, transparent);
  }
  .wa-empty-zone--drag-invalid,
  .wa-empty-zone--error {
    border-style: solid;
    border-color: color-mix(in srgb, var(--luxia-error-70, #B91C1C) 42%, var(--luxia-border-default, #D8D4E0));
    background: color-mix(in srgb, var(--luxia-error-70, #B91C1C) 5%, white);
  }
  .wa-empty-zone--uploading {
    border-style: solid;
    border-color: color-mix(in srgb, #8E63EB 40%, var(--luxia-border-default, #D8D4E0));
    background: color-mix(in srgb, #8E63EB 7%, white);
  }
  .wa-empty-zone__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    margin-bottom: 0.85rem;
    border-radius: 9px;
    color: #8E63EB;
    background: color-mix(in srgb, #8E63EB 12%, white);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, #8E63EB 16%, transparent);
  }
  .wa-empty-zone__icon--error {
    color: var(--luxia-error-70, #B91C1C);
    background: color-mix(in srgb, var(--luxia-error-70, #B91C1C) 8%, white);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--luxia-error-70, #B91C1C) 16%, transparent);
  }
  .wa-empty-zone__divider {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin: 1rem 0 0.85rem;
    color: color-mix(in srgb, var(--luxia-text-muted, #6B7280) 78%, transparent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: lowercase;
  }
  .wa-empty-zone__divider::before,
  .wa-empty-zone__divider::after {
    content: "";
    height: 1px;
    flex: 1;
    background: color-mix(in srgb, #8E63EB 16%, var(--luxia-border-subtle, #E8E4EF));
  }
  .wa-empty-zone__spin {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 999px;
    border: 1.5px solid color-mix(in srgb, #8E63EB 22%, transparent);
    border-top-color: #8E63EB;
    animation: wa-empty-spin 0.7s linear infinite;
  }
  @keyframes wa-empty-spin {
    to {
      transform: rotate(360deg);
    }
  }

  [data-wa-editor-shell] {
    --wa-header-bg: var(--luxia-brand-primary, #30214E);
    --wa-header-fg: #ffffff;
    --wa-header-fg-muted: color-mix(in srgb, white 68%, transparent);
    --wa-header-hover: color-mix(in srgb, white 12%, transparent);
    --wa-header-border: color-mix(in srgb, white 14%, transparent);
    --wa-header-accent: var(--luxia-brand-secondary, #8E63EB);
    --wa-chrome-toolbar-bg: #FAF8FD;
    --wa-chrome-surface-hover: #F0EBFC;
    --wa-chrome-title: var(--luxia-brand-primary, #30214E);
    --wa-chrome-icon: var(--luxia-brand-primary, #30214E);
    --wa-chrome-accent: var(--luxia-brand-secondary, #8E63EB);
    --wa-chrome-border: color-mix(in srgb, var(--luxia-brand-secondary, #8E63EB) 16%, var(--luxia-border-subtle, #F1F5F9));
  }

  .wa-doc-header {
    background: var(--wa-header-bg);
    border-bottom: 1px solid color-mix(in srgb, #000000 18%, var(--wa-header-bg));
    color: var(--wa-header-fg);
  }

  .wa-doc-title-trigger {
    color: var(--wa-header-fg);
  }
  .wa-doc-title-trigger:hover {
    background: var(--wa-header-hover);
  }
  .wa-doc-title-trigger:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-header-accent) 55%, transparent);
  }
  .wa-doc-title-label {
    color: var(--wa-header-fg);
  }
  .wa-doc-title-input {
    color: var(--wa-header-fg);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .wa-doc-title-input::placeholder {
    color: var(--wa-header-fg-muted);
  }
  .wa-doc-title-input:focus-visible {
    border-color: transparent;
    background: color-mix(in srgb, white 10%, transparent);
    box-shadow: inset 0 -1.5px 0 0 color-mix(in srgb, var(--wa-header-accent) 75%, white);
  }

  .writing-assistant-editor h1,
  .writing-assistant-editor h2,
  .writing-assistant-editor h3 {
    color: var(--luxia-brand-primary, #30214E);
  }

  .wa-doc-switcher-title-input:focus-visible {
    border-color: color-mix(in srgb, var(--luxia-brand-secondary, #8E63EB) 55%, white) !important;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--luxia-brand-secondary, #8E63EB) 22%, transparent);
  }

  .wa-doc-documents-btn {
    background: transparent !important;
    border: 1px solid var(--wa-header-border) !important;
    box-shadow: none !important;
  }
  .wa-doc-documents-btn:hover:not(:disabled),
  .wa-doc-documents-btn[data-state="open"] {
    background: var(--wa-header-hover) !important;
    border-color: color-mix(in srgb, white 28%, transparent) !important;
    color: var(--wa-header-fg) !important;
  }
  .wa-doc-documents-btn:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-header-accent) 55%, transparent) !important;
  }

  .wa-doc-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .wa-doc-header-btn {
    height: 2rem !important;
    min-height: 2rem !important;
    max-height: 2rem !important;
    border-radius: 6px !important;
    color: var(--wa-header-fg) !important;
  }

  .wa-doc-icon-btn.luxia-button--ghost,
  .wa-doc-icon-btn.luxia-button--icon-compact {
    width: 2rem !important;
    padding: 0 !important;
  }

  .wa-doc-share-btn {
    background: transparent !important;
    border: 1px solid transparent !important;
    box-shadow: none !important;
  }
  .wa-doc-share-btn:hover:not(:disabled),
  .wa-doc-share-btn:focus-visible {
    background: var(--wa-header-hover) !important;
    border-color: color-mix(in srgb, white 22%, transparent) !important;
    color: var(--wa-header-fg) !important;
  }
  .wa-doc-share-btn:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-header-accent) 55%, transparent) !important;
  }

  .wa-doc-new-btn {
    background: color-mix(in srgb, white 14%, transparent) !important;
    border: 1px solid color-mix(in srgb, white 22%, transparent) !important;
    box-shadow: none !important;
  }
  .wa-doc-new-btn:hover:not(:disabled) {
    background: color-mix(in srgb, white 20%, transparent) !important;
    border-color: color-mix(in srgb, white 32%, transparent) !important;
    color: var(--wa-header-fg) !important;
  }
  .wa-doc-new-btn:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-header-accent) 55%, transparent) !important;
  }

  .wa-doc-file-btn {
    background: transparent !important;
    border: 1px solid var(--wa-header-border) !important;
    box-shadow: none !important;
  }
  .wa-doc-file-btn:hover:not(:disabled),
  .wa-doc-file-btn[data-state="open"] {
    background: var(--wa-header-hover) !important;
    border-color: color-mix(in srgb, white 28%, transparent) !important;
    color: var(--wa-header-fg) !important;
  }
  .wa-doc-file-btn:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-header-accent) 55%, transparent) !important;
  }

  .wa-doc-toolbar {
    background: var(--wa-chrome-toolbar-bg);
    border-bottom: 1px solid var(--wa-chrome-border);
    color: var(--wa-chrome-icon);
  }
  .wa-doc-toolbar .wa-tb-icon.luxia-button--ghost {
    color: var(--wa-chrome-icon);
  }
  .wa-doc-toolbar .wa-tb-icon:hover:not(:disabled) {
    background: var(--wa-chrome-surface-hover) !important;
    color: var(--wa-chrome-accent) !important;
  }
  .wa-doc-toolbar .wa-tb-icon[aria-pressed="true"] {
    background: var(--wa-chrome-surface-hover) !important;
    color: var(--wa-chrome-accent) !important;
  }
  .wa-doc-toolbar .wa-tb-icon:disabled {
    color: color-mix(in srgb, var(--wa-chrome-icon) 42%, transparent);
    opacity: 1;
  }
  .wa-doc-toolbar .wa-tb-select {
    color: var(--wa-chrome-title);
    background: white;
    border-color: color-mix(in srgb, var(--wa-chrome-accent) 18%, var(--luxia-border-default, #E2E8F0));
  }
  .wa-doc-toolbar .wa-tb-select:focus-visible,
  .wa-doc-toolbar .wa-tb-select[data-state="open"] {
    border-color: var(--wa-chrome-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--wa-chrome-accent) 22%, transparent);
  }
  .wa-doc-toolbar .wa-tb-divider::after {
    background: color-mix(in srgb, var(--wa-chrome-accent) 18%, var(--luxia-border-subtle, #F1F5F9)) !important;
  }
  .wa-doc-toolbar .wa-tb-cluster {
    border-color: color-mix(in srgb, var(--wa-chrome-accent) 16%, var(--luxia-border-subtle, #F1F5F9));
    background: color-mix(in srgb, white 88%, var(--wa-chrome-surface-hover));
  }
`;
