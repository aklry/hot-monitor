---
name: monitor-keyword
description: Monitor a keyword with Hots Monitor. Use when an agent needs to create, run, or inspect a keyword monitor, verify whether matching content is truly relevant, detect impersonation or misleading content, and optionally trigger in-app, browser, or email notifications through the Hots Monitor backend.
---

# Monitor Keyword

Use the Hots Monitor backend as the source of truth. Do not reimplement collection, DeepSeek prompts, scoring, or notification logic inside this skill.

## Backend

Default API base URL:

```text
http://localhost:4000
```

If the user provides another API base URL, use it.

## Workflow

1. Ensure the backend is running.
2. If the keyword should be tracked continuously, call:

```http
POST /monitors
```

Body:

```json
{
  "keyword": "keyword to monitor",
  "scope": "domain or market scope",
  "checkIntervalMinutes": 10,
  "enabled": true
}
```

3. To run an immediate check, call:

```http
POST /monitors/{id}/run-now
```

4. To inspect existing monitors, call:

```http
GET /monitors
```

5. To review notifications created by a run, call:

```http
GET /notifications
```

## Output

Return:

- monitor id
- keyword and scope
- candidate count
- analyzed count
- notification count
- relevant notification titles
- risk alert titles

If the backend is unavailable, report that the monitor cannot run until the Hots Monitor API is started.
