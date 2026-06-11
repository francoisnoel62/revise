# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/shared/plans/`. These plans contain phases with specific changes and success criteria.

## Preliminary Steps

Before beginning any setup or implementing any plans, it is essential to review the following files:

- README.md — if missing, notify the user.
- .claude/philosophie.md — if missing, notify the user.
- package.json — if missing, notify the user.
- CLAUDE.md
- documentation files in /docs/ linked with the approved technical plan
- all readme files in /src/

These documents define the philosophical, collaborative, and technical foundations of the project and must be understood before any action is taken.

## Getting Started

When given a plan path:

- Read all the files in : Preliminary Steps
- Read the plan completely and check for any existing checkmarks (- [x])
- Read the original ticket and all files mentioned in the plan
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- Create a todo list to track your progress
- Start implementing if you understand what needs to be done

If no plan path provided, ask for one.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:

- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:

  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Verification Approach

Work autonomously **within** a phase, and pause **between** phases for the user's go-ahead.

After implementing a phase:

- Run the phase's **automated** success criteria yourself (lint, tests, type-check, build) —
  do NOT ask permission for these; they are deterministic gates (and some are enforced by hooks).
- Fix any issues before proceeding.
- Update your progress in both the plan and your todos.
- Check off completed items in the plan file itself using Edit.
- Then **STOP at the phase boundary**: summarize what was done, list the **manual** success
  criteria the user should verify, and wait for their go-ahead before starting the next phase.

Don't let automated verification interrupt your flow - batch it at natural stopping points
inside the phase; the explicit checkpoint is the phase boundary.

## If You Get Stuck

When something isn't working as expected:

- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly if relevant - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:

- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.
