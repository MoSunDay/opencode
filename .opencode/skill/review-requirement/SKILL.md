---
name: review-requirement
description: Review if current requirement is complete and analyze impact on other modules
---

## Use this when

- User asks to review if a feature/requirement is fully implemented
- User wants to check if changes affect other parts of the codebase
- User requests an impact analysis before finalizing changes
- User says "review this change" or "check if this is complete"

## Workflow

1. **Understand the requirement**
   - Ask user to clarify the original requirement if not clear
   - Identify acceptance criteria and expected behavior

2. **Review implementation completeness**
   - Check all changed files with `git diff` or read modified files
   - Verify all acceptance criteria are met
   - Look for TODOs, incomplete implementations, or edge cases not handled

3. **Analyze impact on other modules**
   - Identify all exported functions, types, or components that changed
   - Search for usages of modified APIs across the codebase
   - Check if breaking changes were introduced
   - Review if tests need updates

4. **Identify potential issues**
   - Type compatibility issues
   - Runtime behavior changes
   - Performance implications
   - Security considerations

5. **Provide modification plan if needed**
   - List any incomplete work
   - List affected modules that need updates
   - Suggest testing strategy
   - Recommend documentation updates

## Output Format

### Completion Status

- [ ] Criterion 1: status
- [ ] Criterion 2: status

### Impact Analysis

| Module | File | Impact Level    | Action Needed |
| ------ | ---- | --------------- | ------------- |
| ...    | ...  | High/Medium/Low | ...           |

### Recommendations

1. ...
2. ...

## Guidelines

- Be thorough but concise
- Focus on actual impact, not hypothetical issues
- Prioritize findings by severity
- Suggest concrete next steps
- If no issues found, clearly state the implementation is complete
