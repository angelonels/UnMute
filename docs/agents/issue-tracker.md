# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`.
- **Read an issue**: `gh issue view <number> --comments`, also fetching its labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments` with appropriate label and state filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `gh issue edit <number> --remove-label "..."`.
- **Close an issue**: `gh issue close <number> --comment "..."`.

Infer the repository from `git remote -v`; `gh` does this automatically inside the clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** Set this to `yes` only if external pull requests should enter the triage queue.

When enabled, PRs use the equivalent `gh pr` operations. GitHub shares one number space across issues and pull requests, so resolve an ambiguous number with `gh pr view <number>` and fall back to `gh issue view <number>`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

The Wayfinder map is a single issue whose decision tickets are child issues.

- **Map**: create one issue labelled `wayfinder:map`. Its body holds the Destination, Notes, Decisions so far, Not yet specified, and Out of scope sections.
- **Child ticket**: create an issue labelled with one of `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`, then link it to the map using GitHub's sub-issues API. If sub-issues are unavailable, put `Part of #<map>` at the top of the child and add it to a task list in the map.
- **Blocking**: use GitHub's native issue dependencies. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-database-id>`, where the database id comes from `gh api repos/<owner>/<repo>/issues/<number> --jq .id`. If dependencies are unavailable, use a `Blocked by: #<number>` line in the child body.
- **Frontier query**: list the map's open children in map order and discard any with an open blocker or an assignee. The first remaining ticket is the next frontier ticket.
- **Claim**: assign the ticket to the driving developer before doing any work with `gh issue edit <number> --add-assignee @me`.
- **Resolve**: post the answer as a resolution comment, close the ticket, and append a one-line gist and named link to the map's Decisions so far section.
