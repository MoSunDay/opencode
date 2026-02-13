---
name: git-review-commit
description: Review uncommitted changes, understand the intent, and commit to remote
---

## Use this when

- User asks to review and commit uncommitted changes
- User asks to commit pending changes to remote

## Workflow

1. Run `git status` to see uncommitted files
2. Run `git diff` to see actual changes
3. Analyze the changes to understand the intent
4. Stage the changes with `git add -A`
5. Create a descriptive commit message based on the changes
6. Commit with `git commit -m "message"`
7. Push to remote with `git push`

## Guidelines

- Review all changes carefully before committing
- Write a clear, concise commit message that explains the "why", not just the "what"
- If there are many files, group them logically in the commit
- Use conventional commit format when appropriate: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, etc.
- If changes seem incomplete or有问题, mention it to the user before committing

## Git Commands Reference

```bash
# See uncommitted changes
git status
git diff

# Stage and commit
git add -A
git commit -m "your message"

# Push to remote
git push

# Or do all at once
git add -A && git commit -m "message" && git push
```
