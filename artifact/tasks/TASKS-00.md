# Tasks 00 — Git setup and planning baseline

**Feature PRD:** [PRD-01](../prd/PRD-01-platform.md).  
**Related references:** [Coding guide](../CODING_GUIDE.md#git-and-commit-convention), [readiness checklist](../READINESS.md).  
Status is mirrored in [KANBAN.md](../KANBAN.md). Local Git setup began after the user authorized implementation.

### T00-01

**Initialize local Git and targeted ignore rules**  
**Status:** Done. Local Git initialized on `main`; ignore rules and excluded engine verified.  
**Decisions:** [D-020](../DECISIONS.md#d-020), [D-021](../DECISIONS.md#d-021), [D-022](../DECISIONS.md#d-022).  
**Depends on:** None.  
**Implementation:** When implementation begins, initialize a local repository after confirming the current directory and preserving all existing work. Add targeted ignore rules for secrets, dependencies, build/test output, SQLite database and journal/WAL files, and the installed platform-specific Impeccable engine binary. Do not ignore all design-context files or delete the installed engine. Do not create a remote or push automatically.

**Acceptance and tests:** Git reports a local repository; `artifact/` and relevant non-binary skill files remain available; the installed binary and runtime databases are not staged. Inspect status and ignore behavior without discarding user work. Verify existing paths before writing any ignore file.

### T00-02

**Create small planning/tooling baseline commits**  
**Status:** Done. Planning/architecture/tooling baseline split by intention; engine restoration and corrupt-download rejection verified.  
**Decisions:** [D-014](../DECISIONS.md#d-014), [D-020](../DECISIONS.md#d-020), [D-021](../DECISIONS.md#d-021), [D-022](../DECISIONS.md#d-022).  
**Depends on:** [T00-01](#t00-01).  
**Implementation:** Review the existing planning artifacts and intended project-local skill files, then stage and commit them in multiple coherent intentions using Angular messages rather than one bulk commit. Keep the excluded engine local and document/verify a reproducible, integrity-checked restoration path under [O-008](../DECISIONS.md#o-008). Include related tests/docs where appropriate; never stage unrelated user work.

**Acceptance and tests:** Each baseline commit represents one reviewable intention, uses the agreed message format/body rules, and contains no engine binary, real database, or secrets. Verify artifact links after the sequence and test skill restoration without deleting the user's installed engine. No remote or push occurs without approval.
