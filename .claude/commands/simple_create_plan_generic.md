# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Preliminary Steps

Before beginning any setup or responding to user queries, it is essential to review the following files:

- README.md — if missing, notify the user.
- .claude/philosophie.md — if missing, notify the user.
- package.json — if missing, notify the user.
- CLAUDE.md
- all documentation files in /docs/
- all readme files in /src/

These documents define the philosophical, collaborative, and technical foundations of the project and must be understood before any action is taken.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or ticket reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/ticket description (or reference to a ticket file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with a research document directly: `/create_plan thoughts/shared/research/2026-06-01_topic.md`
For deeper analysis, try: `/create_plan think deeply about thoughts/shared/research/2026-06-01_topic.md`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Read all mentioned files immediately and FULLY**:
   - Research documents
   - Related implementation plans
   - Any JSON/data files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially - if a file is mentioned, read it completely
   - If a research document is mentioned, use the **docs-analyzer** agent to extract its key insights

2. **Spawn initial research tasks to gather context**:
   Before asking the user any questions, use specialized agents to research in parallel
   (defined in `.claude/agents/`):
   - Use the **codebase-locator** agent to find all files related to the task
   - Use the **codebase-analyzer** agent to understand how the current implementation works
   - Use the **docs-locator** agent ONLY IF RELEVANT to find existing docs/research about this feature
   - Use the **web-search-researcher** agent to research the web based on your questions or documentation

   These agents will:
   - Find relevant source files, configs, and tests
   - Trace data flow and key functions
   - Return detailed explanations with file:line references

   Use these agents only if relevant or if you need them.

3. **Read all files identified by research tasks**:
   - After research tasks complete, read ALL files they identified as relevant
   - Read them FULLY into the main context
   - This ensures you have complete understanding before proceeding

4. **Analyze and verify understanding**:
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

5. **Present informed understanding and focused questions**:

   ```
   Based on my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions that you genuinely cannot answer through code investigation.

### Step 2: Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Create a research todo list** to track exploration tasks

3. **Spawn parallel sub-tasks for comprehensive research if relevant**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent for each type of research:

   **For deeper investigation:**
   - **codebase-locator** - To find more specific files (e.g., "find all files that handle [specific component]")
   - **codebase-analyzer** - To understand implementation details (e.g., "analyze how [system] works")
   - **codebase-pattern-finder** - To find similar features we can model after

   **For historical context:**
   - **docs-locator** - To find any research, plans, or decisions about this area
   - **docs-analyzer** - To extract key insights from the most relevant documents

   These agents are defined in the `.claude/agents/` folder.

4. **Wait for ALL sub-tasks to complete** before proceeding

5. **Present findings and design options**:

   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   **Open Questions:**
   - [Technical uncertainty]
   - [Design decision needed]

   Which approach aligns best with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Create initial plan outline**:

   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback on structure** before writing details

### Step 4: Detailed Plan Writing

After structure approval:

1. **IMPORTANT** : Instead of generating one large implementation plan in a single document, always break it down into multiple smaller. Generate each document sequentially, and after completing one, stop and explicitly ask me whether to continue to the next phase/document. This must be an iterative, interactive process rather than a single exhaustive output.
2. **Architecture** : Always ask the user whether a sub-folder already exists, or if he want to create a sub-folder inside `thoughts/shared/plans/`. If yes, request the sub-folder name `{subfolder_name}`.
3. **Write the plan** to `thoughts/shared/plans/{subfolder_name}?/{descriptive_name}.md`
4. **Readability**: Each generated plan document must be shorter than 20 pages. If longer, it should be split into multiples documents:
   - `thoughts/shared/plans/{subfolder_name}?/{descriptive_name}_phase1.md`
   - `thoughts/shared/plans/{subfolder_name}?/{descriptive_name}_phase2.md`
   - `thoughts/shared/plans/{subfolder_name}?/{descriptive_name}_phase3.md`
   - etc...
5. **Use this template structure**:

````markdown
# [Feature/Task Name] Implementation Plan

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[A Specification of the desired end state after this plan is complete, and how to verify it]

### Key Discoveries:

- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview

[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]

**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```[language]
// Specific code to add/modify
```
````

### Success Criteria:

#### Automated Verification:

- [ ] Migration applies cleanly
- [ ] Unit tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Integration tests pass

#### Manual Verification:

- [ ] Feature works as expected when tested via UI
- [ ] Performance is acceptable under load
- [ ] Edge case handling verified manually
- [ ] No regressions in related features

---

## Phase 2: [Descriptive Name]

[Similar structure with both automated and manual success criteria...]

---

## Testing Strategy

### Unit Tests:

- [What to test]
- [Key edge cases]

### Integration Tests:

- [End-to-end scenarios]

### Manual Testing Steps:

1. [Specific step to verify feature]
2. [Another verification step]
3. [Edge case to test manually]

## Performance Considerations

[Any performance implications or optimizations needed]

## Migration Notes

[If applicable, how to handle existing data/systems]

## References

- Similar implementation: `[file:line]`

```

### Step 5: Sync and Review

1. **Sync the thoughts directory**:
   - This ensures the plan is properly indexed and available

2. **Present the draft plan location**:

```

I've created the implementations plans at:
`thoughts/shared/plans/{subfolder_name}/[filename].md`

Please review it and let me know:

- Are the phases properly scoped?
- Are the success criteria specific enough?
- Any technical details that need adjustment?
- Missing edge cases or considerations?

````

3. **Iterate based on feedback** - be ready to:
- Add missing phases
- Adjust technical approach
- Clarify success criteria (both automated and manual)
- Add/remove scope items

4. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Be Skeptical**:
- Question vague requirements
- Identify potential issues early
- Ask "why" and "what about"
- Don't assume - verify with code

2. **Be Interactive**:
- Don't write the full plan in one shot
- Get buy-in at each major step
- Allow course corrections
- Work collaboratively

3. **Be Thorough**:
- Read all context files COMPLETELY before planning
- Research actual code patterns using parallel sub-tasks
- Include specific file paths and line numbers
- Write measurable success criteria with clear automated vs manual distinction

4. **Be Practical**:
- Focus on incremental, testable changes
- Consider migration and rollback
- Think about edge cases
- Include "what we're NOT doing"

5. **Track Progress**:
- Track planning tasks
- Update todos as you complete research
- Mark planning tasks complete when done

6. **No Open Questions in Final Plan**:
- If you encounter open questions during planning, STOP
- Research or ask for clarification immediately
- Do NOT write the plan with unresolved questions
- The implementation plan must be complete and actionable
- Every decision must be made before finalizing the plan

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** (can be run by execution agents):
- Commands that can be run: `make test`, `npm run lint`, etc.
- Specific files that should exist
- Code compilation/type checking
- Automated test suites

2. **Manual Verification** (requires human testing):
- UI/UX functionality
- Performance under real conditions
- Edge cases that are hard to automate
- User acceptance criteria

**Format example:**
```markdown
### Success Criteria:

#### Automated Verification:
- [ ] Database migration runs successfully:
- [ ] All unit tests pass:
- [ ] No linting errors:
- [ ] API endpoint returns 200

#### Manual Verification:
- [ ] New feature appears correctly in the UI
- [ ] Performance is acceptable with 1000+ items
- [ ] Error messages are user-friendly
- [ ] Feature works correctly on mobile devices
````

## Common Patterns

### For Database Changes:

- Start with schema/migration
- Add store methods
- Update business logic
- Expose via API
- Update clients

### For New Features:

- Research existing patterns first
- Start with data model
- Build backend logic
- Add API endpoints
- Implement UI last

### For Refactoring:

- Document current behavior
- Plan incremental changes
- Maintain backwards compatibility
- Include migration strategy

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Provide detailed instructions** including:
   - Exactly what to search for
   - Which directories to focus on
   - What information to extract
   - Expected output format
4. **Be EXTREMELY specific about directories**:
   - Include the full path context in your prompts
5. **Specify read-only tools** to use
6. **Request specific file:line references** in responses
7. **Wait for all tasks to complete** before synthesizing
8. **Verify sub-task results**:
   - If a sub-task returns unexpected results, spawn follow-up tasks
   - Cross-check findings against the actual codebase
   - Don't accept results that seem incorrect

Example of spawning multiple tasks:

```python
# Spawn these tasks concurrently:
tasks = [
    Task("Research database schema", db_research_prompt),
    Task("Find API patterns", api_research_prompt),
    Task("Investigate UI components", ui_research_prompt),
    Task("Check test patterns", test_research_prompt)
]
```

9. **Roadmap – Next Steps**:
   Once the current implementation is complete and stable, optionally propose a short,
   forward-looking list of next steps for the backlog. Keep it grounded in Revise's
   product reality (an AI writing assistant for fiction authors), for example:

   - **Author experience**: refine the suggestion UX, keep the author always in control of choices.
   - **AI quality**: improve stylistic variations, language preservation, prompt iteration.
   - **Robustness**: tests/coverage, error handling, performance of the editor and exports.
   - **Architecture**: keep Clean Architecture boundaries, swappable LLM providers and parsers/exporters.
   - **Data ownership**: reinforce multi-tenant isolation (`ownerId`) and the never-train-on-user-text guarantee.

**Important**: These items are NOT part of the current scope. They serve only as a
forward-looking roadmap to inspire backlog creation. Confirm with the user before
including any of them, and if yes, create a separate report:

- `thoughts/shared/plans/{subfolder_name}?/{descriptive_name}_whatsnexts.md`

---
