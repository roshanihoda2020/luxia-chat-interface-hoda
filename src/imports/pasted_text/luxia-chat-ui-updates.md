Update the Luxia Chat controls and header actions without redesigning the rest of the page.

Preserve the current Luxia Design System, layout, workflows, chat data, and all existing interactions.

Do not commit or push.

==================================================
1. FIX THE RESPONSE-TYPE DROPDOWN
==================================================

The response-type dropdown below the typing bar is currently not fully visible because it opens downward near the bottom of the viewport.

Make this dropdown open upward above its trigger.

Use collision-aware positioning:

- preferred side: top
- side offset: 8px
- automatically avoid viewport edges
- render through a portal
- never clip inside the composer, page, or parent container
- remain visible at all screen sizes

The trigger remains below the typing bar:

[response icon] [Standard / Narrative] [ChevronDown]

PDF Chat options:

- Standard
- Deep

Database Chat options:

- Narrative
- Charts

Dropdown menu styling:

- background: #FFFFFF
- border: 1px solid #E2E8F0
- radius: 12px
- shadow: 0 4px 16px rgba(15, 23, 42, 0.10)
- padding: 6px
- min-width: 160px
- clean selected state
- no badges
- no toggle switch
- no purple focus halo

Ensure the menu works with:

- mouse
- Enter
- Space
- Arrow Up
- Arrow Down
- Home
- End
- Escape
- outside click
- focus restoration

==================================================
2. REMOVE THE CURRENT HEADING TOGGLE
==================================================

Remove the current assistant-mode segmented toggle from the top-right heading area:

- Luxia
- Knowledge Base
- Luxia / AI

Do not leave empty space.

Do not replace it with another segmented control.

==================================================
3. ADD ONE OPTIONS BUTTON IN THE HEADING
==================================================

Add one “Options” button in the top-right area of the Chat heading, following the real Luxia interaction pattern shown in the reference.

Use the current approved Luxia visual style, not the old production styling.

Button:

- label: Options
- optional MoreHorizontal or Settings2 icon
- height: 36–40px
- horizontal padding: 16px
- radius: 9999px or the approved compact pill radius
- background: approved Luxia primary gradient
- text: #FFFFFF
- border: none
- subtle shadow
- hover and pressed states
- no black stroke
- no purple focus halo

The button must remain aligned with the Chat title/header area.

==================================================
4. OPTIONS MENU
==================================================

Clicking the Options button must open a fully functional dropdown menu.

Menu items in this exact order:

1. Rename
2. Share
3. Share List
4. Generate report
5. Divider
6. Delete chat

Use proper icons:

- Rename: Pencil
- Share: Share2
- Share List: List
- Generate report: FileText
- Delete chat: Trash2

Menu styling:

- background: #FFFFFF
- border: 1px solid #E2E8F0
- radius: 12px
- shadow: 0 4px 16px rgba(15, 23, 42, 0.10)
- width: approximately 210–230px
- padding: 6px
- item height: 40px
- item radius: 8px
- text: #30214E
- icons: #64748B
- hover: rgba(142, 99, 235, 0.08)
- destructive item: #F75050
- divider: #F1F5F9

Use a portal and collision-aware placement.

The menu must never clip at the right edge.

==================================================
5. RENAME ACTION
==================================================

Rename opens a dialog.

Dialog content:

- title: Rename Chat
- text input containing the current chat name
- Cancel
- Rename

Behavior:

- input is prefilled
- validation prevents an empty name
- Rename updates the visible chat title and active tab
- close restores focus to the Options button
- no purple typing halo
- use the shared Luxia dialog style

==================================================
6. SHARE ACTION
==================================================

Share opens a dialog.

Dialog content:

- title: Share [current chat name]
- searchable user selector or multi-select
- Cancel
- Share

Behavior:

- selected users can be added and removed
- Share updates the local shared-users state
- show concise success feedback
- do not fake backend persistence
- use existing data or local demo state where no API exists

==================================================
7. SHARE LIST ACTION
==================================================

Share List opens a dialog showing users who currently have access.

Display:

- Full Name
- Email

Use a compact table or empty state.

Do not show decorative status badges.

If no users are shared, show:

“No users currently have access to this chat.”

==================================================
8. GENERATE REPORT ACTION
==================================================

Generate report opens a professional Luxia dialog.

Use English product copy consistently.

Dialog title:

Generate Report

Section 1 — Include:

- Entire conversation
- Selected interactions

Section 2 — Report content:

- Transcript with charts
- Summary only
- Transcript and summary

Optional field:

- Custom instructions

Footer:

- Cancel
- Generate and open in editor

Behavior:

- radio groups work correctly
- selected-interactions mode allows message selection
- action creates a local report preview or calls the existing implementation
- do not claim real generation if no API exists
- preserve current report behavior where already implemented

==================================================
9. DELETE CHAT ACTION
==================================================

Delete chat opens a destructive confirmation dialog.

Content:

- title: Delete Chat?
- explain that this removes the current chat
- Cancel
- Delete Chat

Use:

- destructive button background: #F75050
- white text
- no black border

Do not delete immediately from the dropdown menu.

==================================================
10. SHARED DIALOG STYLE
==================================================

All dialogs opened from Options must use the approved Luxia dialog system:

- clean white surface
- border: 1px solid #E2E8F0
- radius: 16px
- shadow: 0 12px 32px rgba(15, 23, 42, 0.14)
- safe viewport margins
- fixed header
- scrollable body when needed
- fixed footer
- Cancel first, primary/destructive action second
- overlay: rgba(15, 23, 42, 0.40)
- Escape closes the topmost layer only
- focus trap
- correct focus restoration

Do not use the old solid-purple dialog header.

Use the current cleaner Luxia styling.

==================================================
11. KEEP ASSISTANT MODE FUNCTIONAL
==================================================

Removing the heading toggle must not remove the underlying assistant-mode capability.

Keep assistant-mode state available internally.

If an assistant-mode selector is still required in the product, place it inside the typing bar as a compact dropdown, matching the approved composer pattern.

Do not duplicate it in both the heading and composer.

Only one visible assistant-mode selector may exist.

==================================================
12. FINAL VERIFICATION
==================================================

Verify:

- response-type dropdown opens upward and is fully visible
- response-type menu never clips
- old heading toggle is removed
- one Options button appears in the heading
- Options menu opens correctly
- Rename works
- Share works
- Share List works
- Generate Report works
- Delete Chat uses confirmation
- menus and dialogs are keyboard accessible
- no purple typing/focus halo appears
- no black button borders appear
- current Luxia Design System styling is preserved
- responsive layout works
- build passes

Run:

npm run build

Fix all errors.

At the end report only:

- files changed
- response dropdown positioning fixed
- heading toggle removed
- Options menu added
- actions implemented
- dialogs added or updated
- build result

Do not commit or push.