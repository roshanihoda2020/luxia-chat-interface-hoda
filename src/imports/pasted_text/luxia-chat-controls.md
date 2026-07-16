Update only the Luxia Chat controls to match the attached reference exactly in layout, hierarchy, spacing, proportions, and interaction pattern.

Do not redesign the rest of the application.
Do not move unrelated page sections.
Do not change existing chat behavior.
Do not add extra labels or badges.
Do not commit or push.

REFERENCE GOAL

The final chat control area must match this structure exactly:

[ Language Selector ]   [ Large Typing Bar with Assistant Mode dropdown on the right ]   [ Voice Button ]   [ Send Button ]

Directly under the typing bar, aligned to its left edge:

[ Response Type icon ] [ Current Response Type ] [ Chevron Down ]

The response type must be a dropdown under the typing bar.

The assistant mode currently shown in the page heading must be moved into the typing bar, on the right side, exactly like the attached reference.

==================================================
1. MAIN COMPOSER STRUCTURE
==================================================

Build one horizontal row:

- language selector
- typing field
- voice button
- send button

The typing field must take all available horizontal space.

Use a stable shared component structure, not manually positioned one-off controls.

Recommended structure:

ChatComposer
- LanguageSelector
- ComposerColumn
  - ComposerInput
    - Textarea/Input
    - AssistantModeTrigger
  - ResponseTypeDropdown
- VoiceButton
- SendButton

==================================================
2. LANGUAGE SELECTOR
==================================================

Match the reference:

- circular flag
- small chevron-down beside it
- no visible container border
- no filled pill background
- vertically centered with the typing bar
- compact width
- subtle hover only

Use:

- flag size: 24–28px
- chevron size: 16px
- gap: 6–8px
- text not required when only the flag is shown

Do not use the current “US” text capsule.

==================================================
3. TYPING BAR
==================================================

Match the attached reference as closely as possible.

Use:

- height: 48–52px
- background: #FFFFFF
- border: 1px solid #E2E8F0
- radius: 9999px
- no heavy shadow
- no purple focus glow
- generous left and right padding
- placeholder: “Ask something”
- placeholder style: italic, muted

The input must remain visually clean.

On focus:

- keep the same white surface
- border-color may become #CBD5E1
- no purple halo
- no outer ring
- no double border
- no browser outline

The inner input/textarea must have:

- border: none
- outline: none
- box-shadow: none
- transparent background

==================================================
4. ASSISTANT MODE INSIDE THE TYPING BAR
==================================================

Move the assistant mode control from the page heading into the typing bar.

Place it inside the typing bar on the far right, before the voice and send buttons.

The trigger should look exactly like the reference:

- plain text label
- small chevron-down
- no filled pill
- no visible border
- transparent background
- text color: #64748B
- hover text color: #30214E
- hover background: transparent or extremely subtle
- vertically centered

Do not display “Knowledge base” in the heading after this change.

Use the actual assistant modes already supported by the product.

If current options include:

- Knowledge Base
- Luxia
- Luxia / AI

keep those same options.

Do not invent new assistant modes.

Dropdown menu:

- white background
- border: #E2E8F0
- radius: 12px
- MD shadow
- compact spacing
- selected option uses stronger text, not a badge
- keyboard accessible

==================================================
5. RESPONSE TYPE BELOW THE TYPING BAR
==================================================

Place the response type dropdown directly below the typing field.

It must align with the left edge of the typing bar content, not with the language selector.

Match the reference:

- small response icon
- label such as “Standard”
- chevron-down
- transparent background
- no toggle switch
- no segmented control
- no pill background by default
- compact horizontal layout

Use:

- height: 28–32px
- font: Nunito
- font size: 14px
- font weight: 500–600
- text color: #64748B
- icon color: #64748B
- chevron size: 16px
- gap: 6–8px
- padding: 0–4px

Hover:

- text color: #30214E
- background remains transparent or uses only Secondary 04–08%

Open state:

- chevron rotates 180 degrees
- no purple ring

Response options by chat type:

PDF Chat:
- Standard
- Deep

Database Chat:
- Narrative
- Charts

Show only the relevant pair for the active chat type.

Do not display all four options together.

==================================================
6. VOICE BUTTON
==================================================

Match the circular reference control.

Use:

- size: 44–48px
- circle
- approved Luxia purple gradient
- white microphone icon
- no black border
- subtle purple depth
- vertically centered with the typing bar

Shadow:

0 4px 12px rgba(48, 33, 78, 0.18)

Do not make the button excessively large.

==================================================
7. SEND BUTTON
==================================================

Match the circular reference control.

Use:

- same size as voice button
- circle
- approved Luxia purple gradient
- white send icon
- no black border
- same vertical alignment

Enabled:

- visible gradient
- white icon
- subtle shadow

Disabled:

- background: #E2E8F0
- icon: #94A3B8
- no shadow
- no pale lavender active-looking state

==================================================
8. SPACING AND ALIGNMENT
==================================================

Match the reference proportions.

Use:

- language selector to typing bar gap: 20–24px
- typing bar to voice button gap: 16–20px
- voice to send gap: 12–16px
- response dropdown top gap: 6–8px
- response dropdown aligned under the input, not under the flag

The composer must feel balanced and horizontally calm.

Do not stretch the language selector.
Do not place the response dropdown too far left.
Do not let the response dropdown overlap helper text.

==================================================
9. REMOVE DUPLICATED CONTROLS
==================================================

After moving the assistant mode into the typing bar:

- remove it from the heading
- remove duplicate assistant-mode controls elsewhere
- remove duplicate response-type toggles
- remove Standard/Deep toggle switches
- remove Narrative/Charts toggle switches
- remove any Knowledge Base selector duplicated outside the composer when it serves the same purpose

Keep only one assistant-mode control and one response-type control.

==================================================
10. REMOVE PURPLE TYPING HIGHLIGHT
==================================================

Remove all purple focus glow from:

- typing bar
- response dropdown
- assistant-mode dropdown
- language selector
- search fields
- textareas
- dialogs
- manager forms

Search for:

- focus:ring
- focus-visible:ring
- focus-within:ring
- ring-primary
- purple box-shadow
- browser outline
- duplicated wrapper and input focus states

Use only a clean border change without glow.

==================================================
11. RESPONSIVE BEHAVIOR
==================================================

Desktop:

- keep the exact horizontal layout from the reference

Tablet:

- language selector remains left
- typing bar remains dominant
- buttons stay right
- response dropdown stays below the input

Mobile:

- composer may wrap into two rows
- typing bar uses full width
- voice and send remain visible
- response dropdown remains directly below
- no horizontal overflow

==================================================
12. FINAL VERIFICATION
==================================================

Verify:

- composer layout visually matches the attached reference
- flag selector looks lightweight
- assistant mode is inside the typing bar
- assistant mode is removed from the heading
- response type is a dropdown below the typing bar
- PDF Chat uses Standard / Deep
- Database Chat uses Narrative / Charts
- voice and send buttons are circular and balanced
- no purple typing glow remains
- no duplicate controls remain
- keyboard behavior works
- build passes

Run:

npm run build

Fix all errors.

At the end report only:

- files changed
- composer layout updated
- assistant mode moved into typing bar
- response dropdown added below input
- duplicate controls removed
- purple focus glow removed
- build result

Do not commit or push.