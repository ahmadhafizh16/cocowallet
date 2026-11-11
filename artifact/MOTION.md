# CocoWallet branding and motion

**Status:** In progress under [T11-06](tasks/TASKS-11.md#t11-06).
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
- **Budget:** CSS keyframes/transitions only, no new dependency, load delay,
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
