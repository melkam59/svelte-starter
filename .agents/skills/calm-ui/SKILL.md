---
name: calm-ui
description: Robi's UI taste, calm, flat, light, one number leads. Load before building, restyling or reviewing any user-facing UI (web, mobile, generated images, print).
---

# Calm UI

A taste file. Every rule came from a real correction on a shipped app, and several were repeated before they landed here. When a rule conflicts with a habit or a library default, the rule wins.

The whole taste is one word: **calm**. Flat surfaces, soft ink, one thing asking for attention per screen.

## How to work

- **Fix the scale, not the spot.** A complaint about one element's color, weight, size or radius is a complaint about the token it inherits. Change the token in the theme, then check the element that was pointed at. A class on that one element leaves every sibling wrong.
- **One component first.** For a restyle of a screen people use daily, change one component, show it running, and get a verdict before touching the rest. "Let me see" means show one, not apply all.
- **The eye outranks the checklist.** Review skills and contrast checkers find candidates. A visual change ships only after the person you build for has seen it. Invisible fixes (aria labels, focus order) go in their own batch.
- **Done means seen.** Check the change on the running app at real size, in light and dark, not just compiled.
- **Inspiration means pictures.** Real app screenshots, never text cards describing them.
- Run the slop checklist at https://impeccable.style/slop/ over new UI before calling it done.
- **Grow this file.** When the same feedback comes twice, add a rule here in the same commit as the fix.

## Surfaces and depth

- **Flat fills, separated by border and tint.** Everything in the page flow (cards, inputs, buttons, selects, switches, active tabs, segmented-control thumbs) has no shadow. Elevation belongs only to layers that float over arbitrary content: popovers, menus, dialogs, sheets, a fixed action button. A `0 0 0 1px` ring is a border, not elevation, and may stay.
- **Tooltips float but carry no shadow.** Border plus popover fill is the whole separation. A shadow on a label that chases the cursor is clutter.
- **One card level.** A bordered card never sits inside another bordered card. Inside a card, separate with dividers or an inset tinted panel.
- **Mark state on all four sides.** A colored stripe on one edge of a rounded box (left accent bar, bottom rule, one-side inset shadow) is out. Use a fill, a tint, a pattern such as a hatch, or a ring all the way round.
- **Flat color only.** No radial washes, gradient text or decorative blends, on pages or on generated images.
- **Titled cards sit on a tinted band.** The frame is a soft tinted surface. The title row (small icon plus a quiet sentence-case label) sits on the tint, and the body is a full-bleed card-colored panel beneath it with concentric corners. The eye reads page background, then band, then card body. Tables get this too: a bordered table straight on the page background has no tonality. Plain label-plus-number tiles stay bandless.

## Shape

- **One default radius** for cards, inputs, buttons and nav items (12px works well). Smaller radii only on small things: chips, badges, tiny icon buttons. Nothing over 24px, and a squircle (superellipse) instead of a pill wherever the platform allows it.
- **Stacked corners are concentric.** Outer radius = inner radius + the gap between the two edges, borders included, so both curves share a centre. Derive the inner radius from the outer token (`calc(var(--radius-xl) - 7px)`) instead of hard-coding it. When the gap is bigger than the outer radius, move the inner surface closer instead of shrinking its corner to nothing.

## Type

- **Hierarchy comes from size, heading level and color, never weight.** Display text sits in the light range. The strongest form is one weight for the whole app, with hierarchy from size and color alone: "variation in weight makes the UI unpredictable." Generated images follow it too (no 700 in an OG card).
- **Sentence case everywhere.** No all-caps labels, eyebrows or headers.
- **Monospace only for strings read character by character:** account numbers, IDs, codes. Everything else uses the UI font.

## Color and ink

- **One palette, one source of truth.** Every color comes from a semantic token (`bg-card`, `text-muted-foreground`, surface and on-surface roles). No raw palette utilities (`text-emerald-600`) and no hex outside the theme file. When two apps share a brand, one owns the palette and the other mirrors its roles. Raw colors are how the two drift apart.
- **Soft ink.** Body text is the theme's softened foreground (around `#444` on white), never pure black.
- **Check contrast in light mode, where it is hardest.** Text meets WCAG AA 4.5:1. Keep a small tone ramp (primary, secondary, tertiary) whose lowest tone is the floor. Bright stock hexes (Material blue, amber) usually fail on white. For ink on a tinted pill, deepen the ink and keep the fill.
- **Brand colors identify; they never measure.** A logo or brand chip says whose row it is. Gauges, meters and coverage bars use semantic colors (green good, amber watch, red bad) on a neutral track. In brand colors a 99% and an 88% look equally fine.

## Controls

- **Fills, not strokes.** Primary is a filled button, secondary a tonal fill, low emphasis a text button. Outline buttons, outline chips and outline-only inputs are out.
- **Inputs read as enabled.** A solid fill that separates from what sits behind it, a full-strength border if there is one, and a placeholder at about 80% of the muted tone. Faint fill plus faint border plus faint placeholder reads as disabled.
- **Real tooltips, never native `title` attributes.** One shared tooltip component, rendered in a portal so nothing clips it, flipping near edges. Extend it instead of adding a second mechanism.
- **An empty state's next step is a primary filled button with a leading icon.** Not a text link, not a pill.

## Layout and data

- **Calm, light, one number leads.** Each surface has one hero number; supporting detail stays small and quiet. Walls of bar charts and dense many-numbers-per-row tables never make the primary view.
- **No empty columns.** A page header puts prose and controls on the left and the KPI tiles on the right, as one row of equal height. A heading with nothing beside it folds into a tile label. A table's count, filters and search sit on its own band, not as loose lines above it.
- **Show the answer and where it came from.** When there are several candidates (a category, a match), show the winner plus a quiet line naming its source ("Set by you", "From a rule"), not a cloud of chips.
- **Icons mean status.** A row's leading icon says where the item stands (done, skipped, want, need), reusing the icon of the control that set it. Never an icon guessed from the item's name.
- **AI work gets one honest mark.** Something a model did shows one consistent icon (pick one that is not the sparkle cliché) beside words that say what happened ("Claude is reading it…").
- **One avatar style per kind of thing.** People and devices never share an identicon system.
- **Charts are real.** Proper scales and shape generators (d3 or equivalent), drawn at the measured pixel width. A fixed `viewBox` stretched with `preserveAspectRatio="none"` bends strokes and geometry.

## Loading, empty and motion

- **Skeletons mean loading only.** An empty-but-loaded slot shows monochrome demo content, never a shimmer.
- **A skeleton is a hand-built copy of the loaded layout:** same frame, padding, gaps, row count and text sizes. A text bone takes the real line height but paints a glyph-height bar, so stacked lines keep their gap. Build it from a screenshot of the loaded state and compare side by side. It must come out the same height, so nothing jumps when the data lands. Auto-captured skeletons drift from the real layout.
- **Motion travels, it never teleports.** When live data jumps several steps, move through the steps in between, faster for a bigger jump. A moving thing is one element sliding, not two copies crossfading. Easing is smooth (no bounce or elastic), and nothing loops so hard it becomes unreadable.

## Other surfaces

- **Print is ink on white paper.** Dark text, brand color only on small things (a logo, one line), thin light rules between items. No filled tiles, no big color blocks, no grey text (printers turn it into dots). Start from paper, never from the screen styling.
- **Generated images follow the page rules.** OG cards and store graphics get flat fills, soft ink and one weight (no `fontWeight: 700` in a Satori card).

## On the web

- **Strip shadcn's shadows on the way in.** shadcn ships `shadow-xs` on inputs, selects, buttons, checkboxes and switches. Remove it from the primitives in `components/ui/` once, so a select never sits on a shadow its neighbouring buttons lack.
- **`rounded-xl` is the default** for cards, inputs, textareas, select triggers, buttons and sidebar items. Set it in the primitives; a `rounded-md` control beside them looks like a different app.
- **Put `antialiased` on the body.** Without it, macOS subpixel smoothing renders a 400 weight about half a weight heavier.
- **Pin `th`, `b` and `strong` to `font-weight: inherit`** in global CSS. Tailwind's preflight leaves them bold, so table headers go bold behind your back.
- **Tokens, not palette classes:** `bg-card`, `border-border`, `text-muted-foreground`, `bg-popover`. Never `zinc-*`, `slate-*`, `gray-*` or arbitrary hex in a class.
- **Tooltips are a portal component** (bits-ui Tooltip in shadcn-svelte, or your own). Chart hover labels count as tooltips: border plus `bg-popover`, no shadow.
- **Charts:** `scaleUtc` / `scaleLinear`, d3-shape generators, width measured with a `ResizeObserver`.
