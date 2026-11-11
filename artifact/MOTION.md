# CocoWallet branding and motion

**Status:** Implemented and verified under [T11-06](tasks/TASKS-11.md#t11-06).
The user approved applying the generated logo and requested smooth website
animation/transitions. [D-027](DECISIONS.md#d-027) extends the asset-only scope of
D-026; the two-column topology and disconnected financial boundary stay fixed.

## Motion thesis

- **Focal moment:** Opening a money action lifts a bounded frosted sheet into
  protected focus. The scrim settles with it; dismissal is faster than arrival.
- **Continuity:** Form → local review → edit uses a short directional transition.
  Menus emerge from their actual trigger edge. Theme changes interpolate existing
  canvas/panel/control colors rather than flashing a page-sized overlay.
- **Feedback:** Hover/focus/selected states share a decelerating color/shadow
  rhythm; pressing an enabled control gives a tiny physical acknowledgement.
  Section navigation retains smooth scrolling. Privacy masks money immediately;
  balances, rates and operation outcomes are never tweened or fabricated.
- **Budget:** CSS owns keyframe/transition timing; an event-bound snapshot
  preserves interrupted presence without a per-frame JavaScript loop. No new dependency, load delay,
  staggered page choreography, scroll listeners, persistent will-change, parallax,
  or decorative loops. Animate transform/opacity on bounded overlays and step
  content; keep existing blur constant rather than animating full-screen filters.
- **Timing / access:** 120ms exits/feedback, 180ms state/menu changes, 240ms dialog
  arrivals, 220ms theme settling; natural deceleration without bounce. Reduced
  motion makes spatial/opacity choreography and transitions immediate while
  preserving focus, state, labels, and readable errors. Hidden tabs add no work.

## Branding integration

Use the approved vector geometry in the header, matching skeleton, error and
not-found surfaces. The inline wordmark follows theme ink; the navy/icy icon
retains its approved colors. Use the same mark for the favicon and CocoWallet in
page metadata. Fit the full wordmark at 320px without dropping its accessible
name or displacing account/theme controls. Keep downloadable SVGs unchanged.

## Acceptance

Verify actual browser animations, their completed styles, fast open/close/reopen,
Escape/focus return, keyboard menus, mobile Actions → Dialog, form/review/edit,
per-operation drafts, theme/privacy, explicit light/dark branding, favicon/title,
320px fit, reduced motion, and stable development hydration. Run full Docker and
production-browser checks without sharing active Next output, inspect batched
captures, record detector results and reconcile design/handover evidence. No
financial requests, schema changes, or enabled final submissions are authorized.

## Implementation evidence

- Full Docker check and optimized build pass with **572 Jest tests**.
- **38 Chromium tests** pass against production, including five new
  branding/motion journeys. They observe actual animation starts/completion,
  interruptions, explicit themes, favicon/title, 320px fit, focus/drafts and
  reduced motion. Helpers wait for real Radix exit unmounts instead of sleeps.
- Timeline evidence under `.impeccable/review/`: `motion-open-016.png`,
  `motion-open-080.png`, `motion-open-240.png`, `motion-mobile-dark.png`, and
  `motion-observation.json`. The named frames pause the real CSS animation;
  blur remains 5px while opacity/translation/scale settle. These are not
  frame-rate or device-performance benchmarks.
- The pre-correction UI detector export has 23 advisory local token-inventory
  findings and no non-advisory findings. The separate branding-only pass returned
  `[]`; neither certifies accessibility or establishes a new palette/type scale.
- Before restoring development, only generated `.next/dev` was retained as
  `.next/dev.pre-branding-motion-1794405063925`, avoiding reuse of the earlier
  problematic cache. SQLite and source were untouched. The restored page
  hydrated and stayed stable for 300 animation frames with no further navigation
  or browser errors; the branded header and deposit dialog were interactive.
  The final continuity build repeated this recovery with
  `.next/dev.pre-motion-continuity-1794406183800` retained and passed the same
  300-frame, theme/menu/dialog browser-readiness check.
- Initial implementation is committed at `020257d`; the interruption correction
  is `b7e41cb`. Design-note reconciliation is verified separately from the bounded
  implementation/fix-list verdict below.

### Interrupted-arrival correction

The bounded reviewer found one material issue: hard-coded fully-open exit
keyframes could jump if dismissal interrupted arrival. A small shared
`useMotionOpen` controller now captures the rendered opacity/translation/scale
before the Radix state changes, including explicit overview-dismiss buttons.
CSS exits start there; still-mounted layers can reopen from a captured exit
frame. Reads precede writes, no animation-frame loop or dependency is added,
and reduced motion skips capture work. Six unit tests cover snapshots and
controlled/default-open behavior. A targeted Chromium test pauses real arrivals
at 16ms and compares the exit's first frame: dialog, scrim, DropdownMenu and
Select values are unchanged. `motion-interruption.json` and the before/exit-start
captures record this evidence, not a frame-rate benchmark. Full verification was
repeated after correction. The same reviewer scored its sole material issue
**resolved**, returning **`ship` at fix-list scope**; no further fix or recapture
was required for that issue. Root design/sidecar checks verify 38 source colors,
six motion constants, eight canonical sections, valid references, 20 component
entries and 10 standalone previews. App source is unchanged since that verified
production build. Connected features and broader accessibility remain separate.
