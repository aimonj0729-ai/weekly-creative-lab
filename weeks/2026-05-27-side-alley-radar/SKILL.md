---
name: side-alley-radar
description: Use when turning hot GitHub projects and AI trends into small, defensible project ideas that an indie builder can ship in one week.
---

# Side-Alley Radar

Use this skill when the user wants a weekly GitHub idea, a small market-entry opportunity, a new agent skill, a workflow, or a niche product direction.

## Mission

Do not chase the busiest street. Use crowded trends as evidence, then look for side alleys:

- narrower user group
- more concrete workflow
- less crowded keyword space
- smaller first build
- better packaging and taste

## Inputs

Accept any of:

- A topic such as AI agents, MCP, browser QA, design tools, education, music, marketing, or developer tools.
- A list of GitHub repositories.
- A GitHub search snapshot.
- A weekly build constraint such as "one day", "one week", "skill only", or "must publish to GitHub".

If the user gives no topic, scan broadly across AI agent infrastructure, skills, workflows, MCP, browser automation, developer tooling, and creative productivity.

## Workflow

1. Gather 10-30 signals from current GitHub repos, release notes, websites, or community trend lists.
2. Cluster them into 3-5 macro trends.
3. For each trend, ask: what is the smaller, underserved workflow hiding behind it?
4. Score each opportunity:
   - Pain intensity: 1-10
   - Entry ease: 1-10
   - Competition inverse: 1-10 where 10 means low competition
   - Taste leverage: 1-10
   - Weekly shippability: 1-10
   - Trust risk: 1-10 where 10 means low risk
5. Pick one opportunity and turn it into a small build:
   - skill
   - workflow
   - CLI
   - README-first product
   - template
   - browser demo
   - agent playbook

## Output Format

```markdown
## Today's Signal

One sharp paragraph about what changed.

## Crowded Streets

- trend: evidence, what is crowded, why not compete head-on.

## Side Alleys

| Idea | User | Pain | Wedge | Score |
| --- | --- | ---: | --- | ---: |

## Best Weekly Build

Name, audience, first version, README angle, proof of usefulness.

## Ship Plan

1. Files to create.
2. Minimum validation.
3. GitHub presentation notes.
```

## Judgment Rules

- Prefer a narrow workflow over a generic platform.
- Prefer installable artifacts over essays.
- Prefer one memorable metaphor over bland positioning.
- Avoid security misuse, scraping abuse, gray-area bypasses, or copied brands.
- Do not copy code or proprietary prompts from hot repos.
- If the idea needs regulated data, make the first version local/offline and clearly scoped.

## Good Side-Alley Patterns

- "Receipt" products: produce proof that something was actually checked.
- "Fit check" products: decide whether a hot architecture is worth using.
- "Taste patch" products: improve how something looks and reads.
- "Vertical skill" products: apply a broad agent pattern to one job role.
- "Evidence trail" products: keep artifacts humans can inspect.

## Anti-Patterns

- "Another general AI agent platform."
- "Awesome list with no workflow."
- "Thin wrapper around a single API."
- "A tool that only exists because a policy loophole exists."
- "A README that promises automation but ships no example."
