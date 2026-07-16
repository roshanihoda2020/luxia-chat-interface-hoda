Fix the remaining UI inconsistencies shown in the current Luxia Chat Interface.

Do not redesign the product.
Do not change flows or behavior.
Do not add new labels.
Do not commit or push.

====================================================
1. REMOVE NUMBER BADGES / COUNT PILLS
====================================================

Remove the rounded number pills shown on right-sidebar module cards.

Remove visible counts such as:

- 5
- 4
- 2
- 1
- any similar rounded count indicator

Apply this to:

- Knowledge Base
- Active Data Tables
- Extra Context Files
- Relationship
- Metrics
- Instruction
- PDF Files
- Crawler URL Data
- every other constellation module

Do not replace them with another badge.

If the count is useful internally, keep it only in data/state.
Do not display it in the module header.

The module header should contain only:

- module icon
- module title
- open-manager action when available
- expand/collapse action when available

====================================================
2. STANDARDIZE MODULE HEADER TYPOGRAPHY
====================================================

The Instruction row currently looks bolder and visually different from the other module titles.

Make all right-sidebar module titles use exactly the same typography:

- font family: Nunito
- font size: 14px
- line height: 20px
- font weight: 600
- color: #30214E

Apply the same style to:

- Knowledge Base
- Active Data Tables
- Extra Context Files
- Relationship
- Metrics
- Instruction
- PDF Files
- Crawler URL Data

Do not bold one module more than another.

Do not use different font sizes for expandable versus non-expandable items.

====================================================
3. FIX THE OPEN / EXPAND ICON PATTERN
====================================================

The current icon area is visually inconsistent.

Use one consistent structure:

- Open manager: Maximize2 icon
- Expand/collapse: ChevronDown icon
- Do not mix unrelated arrow icons
- Do not make the open icon look larger than the title
- Do not show icons when the action is not available

Icon-button rules:

- size: 32px × 32px
- icon size: 15px or 16px
- stroke width: 1.8
- color: #64748B
- background: transparent
- border: none
- radius: 8px
- hover background: rgba(142, 99, 235, 0.08)
- hover color: #30214E

For expand/collapse:

- use one ChevronDown
- rotate 180 degrees when expanded
- transition: transform 160ms ease
- keep accessible labels

For open-manager:

- use Maximize2
- no rotation
- keep visually separate from expand/collapse
- stop event propagation so it does not expand the section accidentally

Do not use decorative arrows or oversized glyphs.

====================================================
4. REMOVE PURPLE GLOW FROM EVERY TYPING FIELD
====================================================

The purple halo still appears when typing or focusing inputs.

Remove it globally from all:

- chat composer
- text inputs
- textareas
- search fields
- dialogs
- drawers
- manager forms
- filters
- selects
- editable controls

Search for and remove or override:

- focus:ring-*
- focus-visible:ring-*
- focus-within:ring-*
- ring-purple-*
- ring-primary
- box-shadow using rgba(142, 99, 235, ...)
- purple outline
- browser outline
- pseudo-elements creating focus glow
- duplicated focus styling on wrapper and input

Do not remove keyboard focus visibility completely.

Use one clean focus treatment only.

For normal inputs and textareas:

Default:
- background: #FFFFFF
- border: 1px solid #E2E8F0
- box-shadow: none

Hover:
- border-color: #CBD5E1

Focus:
- background: #FFFFFF
- border-color: #8E63EB
- outline: none
- box-shadow: none

For the chat composer:

Default:
- background: #FFFFFF
- border: 1px solid #D7E0EA
- box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06)

Focus / typing:
- border-color: #8E63EB
- outline: none
- box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08)

The inner textarea/input must use:

- border: none
- outline: none
- box-shadow: none
- background: transparent

Only the outer composer wrapper may show the single border.

There must be no purple blur, halo, ring, double border, or outer glow.

====================================================
5. REMOVE SOURCE PILLS
====================================================

In the assistant message, remove the rounded source pills such as:

- Table 1
- Document A

Keep the information as plain links or plain text.

Use:

Sources: Table 1, Document A

Style:

- “Sources:” label: #64748B, 12px, weight 600
- source links: #7652C4, 12px, weight 500
- hover: #30214E
- no rounded background
- no border
- no pill shape

Do not turn sources into badges.

====================================================
6. REMOVE OTHER NONESSENTIAL LABELS
====================================================

Search the visible product UI for decorative pills, chips, labels, or status indicators.

Remove them when they only repeat information already visible from:

- title
- icon
- layout
- selected state
- context

Do not display:

- counts in pills
- type labels
- selected labels
- decorative status labels
- response type pills
- module category pills

Keep only functional feedback such as:

- validation error
- upload progress
- real failure
- required status that affects workflow

====================================================
7. ALIGNMENT AND SPACING
====================================================

After removing count pills, rebalance each right-sidebar module header.

Use:

- horizontal padding: 14px
- vertical padding: 12px
- gap between icon and title: 10px
- actions aligned right
- title takes remaining available width
- no large empty gap where the count badge was removed

Ensure every module header has the same height.

====================================================
8. VERIFY THE RESULT
====================================================

Verify all of these:

- no number badges remain in right-sidebar module headers
- all module titles use the same font size and weight
- Instruction matches the typography of other modules
- open-manager icon is consistent
- expand/collapse icon is consistent
- no purple focus halo appears anywhere
- chat composer has only one clean border when focused
- search fields have no purple glow
- dialog inputs have no purple glow
- source items are plain links, not pills
- no unnecessary status/type labels remain
- behavior is unchanged
- build passes

Run:

npm run build

Fix all errors.

At the end report only:

- files changed
- count badges removed
- module typography standardized
- icons standardized
- purple focus glow removed
- source pills removed
- build result

Do not commit or push.