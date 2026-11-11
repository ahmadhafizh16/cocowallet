# Two-column wallet redesign

**Status:** User-approved shape; implementation in progress under
[T11-04](tasks/TASKS-11.md#t11-04). The user selected two columns, popup Send money
from the left menu, icon navigation with tooltips, actual shadcn form foundations,
  and consistent styled theme/history controls, then said “Proceed with the redesign”.

**Direction provenance:** This is the user's explicitly pinned layout/interaction
refinement of their approved frosted identity. New-work's user-pinned-direction
exception applies; no random direction roll was required or performed. The former
surface-brief claim that seeds were unavailable was inaccurate and is withdrawn.
The original HTML reference remains unchanged and its checksum is recorded in
[DESIGN_REFERENCE.md](DESIGN_REFERENCE.md).

## Confirmed brief

- **Job / audience / outcome:** A local-demo evaluator inspects exact preview
  balances and explores the four simulated money forms without confusing draft
  review with completed money movement. Operate mode; preserve the existing
  account isolation, exact parser, privacy and disconnected-service safeguards.
- **Direction:** Keep the approved icy glass/navy world, with clearer light/dark
  tonal hierarchy and readable task copy. Use two content columns: balance/actions
  and compact activity at left, currency wallets at right. Integrate count/default
  metadata; remove the redundant conversion teaser and large account object.
- **Interaction:** Desktop icon rail uses shadcn Tooltip with keyboard-accessible
  names; Send money and the other financial actions open a shadcn Dialog. Preserve
  drafts on close/reopen, trap/restore focus correctly, and make mobile dialogs
  fit the viewport with internally scrollable content. Mobile navigation retains
  usable labels rather than depending on hover. Account/theme menus and history
  filters use actual registry-derived shadcn/Radix components.
- **States / constraints:** One global simulation/preview notice; relevant local
  form guidance; precise missing/zero/precision/funds errors; dependent error
  clearing; no same-currency conversion choice. Skeletons match the new topology.
  No DB, seed, financial API, quotes/rates, invented activity, or enabled final
  submission. Respect reduced motion, storage failure, narrow layouts, and
  inspect-only destinations. Existing platform/runtime dependencies stay intact.

## Acceptance

Verify desktop at 1440px and the user's 1688px/1769px widths, tablet and 320/390px
mobile in light/dark. Exercise icon tooltips, all dialogs, menu selection, Escape,
focus trapping/return, draft retention, validation/review, privacy, account
isolation, skeleton/error states, and no financial requests. Run the Docker check,
production-browser tests, one manual detector pass, batched visual inspection,
independent finish review, and design-document reconciliation. Critique findings
are archived under `.impeccable/critique/`; the previous implementation remains a
historical baseline, not this redesign's acceptance verdict.
