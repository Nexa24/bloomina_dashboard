---
description: How to maintain the chat history checkpoint log
---

## ⏺️ Recording Chat History Milestones

To ensure continuity and a clear record for the next user, follow these steps every 5 turns:

1.  **Locate the Checkpoint File**: Check the current artifact directory for `chat_checkpoint_log.md`.
2.  **Summarize Last 5 Turns**: Review the recent conversation logs to identify major milestones, decisions, or completed tasks.
3.  **Append New Checkpoint**:
    -   Add a new `## Checkpoint X` header.
    -   Describe the **Current Goal**, **Completed Tasks**, and **Pending Items**.
    -   List any critical context (e.g., active files, branches).
4.  **Update the Next Scheduled Checkpoint**: Increment the turn target by 5.

> [!IMPORTANT]
> This workflow was requested by the user to ensure no context is lost during long-running sessions.
