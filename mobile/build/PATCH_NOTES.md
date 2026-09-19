# Patch notes — REBUILD.md and BUILD_PROMPT.md

These two files are NOT being replaced (their audit/history content is still
accurate and useful). Apply these small edits so nothing in them contradicts the new
`PRD.md`/`UI.md`. Everything not listed here stays exactly as-is.

## REBUILD.md

**§0 Locked decisions** — the repo-shape block currently says:

    src/         <- web as-is, frozen

Replace with:

    src/         <- web app; being rebranded to Bells Notes in parallel (see PRD.md §6/§9)
                    — no longer frozen. Both web and mobile now share one Convex
                    deployment (PRD.md §6 supersedes this file's "new account" note
                    below where they conflict).

**§0** also currently says *"Backend: Keep Convex, new account (own deployment)"* —
append: *"Superseded by PRD.md §6: web and mobile share ONE new account, not two
separate ones."*

No other change needed in REBUILD.md — its web-app audit (§1), schema-gap analysis
(§2–3), keep/rewrite/drop list (§4), and bug inventory (§5) are all still accurate
engineering history and stay untouched.

## BUILD_PROMPT.md

**§A** (how the three docs relate) — add a line at the top:

> As of the Bells Notes rebrand pass, `PRD.md` and `UI.md` referenced below are the
> Bells Notes versions, not the original Caleb's Library ones. `REBUILD.md` stays as
> historical audit/backend reference only — treat any of its statements about visual
> brand-matching or web being frozen as void (see its patch notes).

**§B Locked decisions** — currently says:

> Color + typography identical to web.

Delete this sentence entirely — it's the exact opposite of the new brand direction
(monochrome, Fraunces/General Sans, explicitly *not* matching the old web brand).

**§B** — the repo-shape note *"Web `src/` stays frozen at repo root"* — delete;
replace with: *"Web `src/` is being rebranded in parallel and shares the same Convex
deployment as mobile (PRD.md §6)."*

**Phase log (everything from "Phase 0" onward)** — leave entirely as-is. This is a
factual record of what got built and when; rewriting it would destroy real history
for no benefit. The rebrand work should be logged as new entries appended after the
existing log (e.g. "Rebrand R1," "Rebrand R2" matching `PRD.md` §9's milestone
labels), not by editing old entries.

One thing to flag explicitly to whoever executes the rebrand: the phase log records
that gamification (milestones/celebrate bursts) is already built. `PRD.md` §0 and §4
lock the decision to keep it — if you see any instruction elsewhere implying
gamification is still undecided, `PRD.md` is the current source of truth.
