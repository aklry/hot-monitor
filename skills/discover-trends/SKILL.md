---
name: discover-trends
description: Discover hot topics with Hots Monitor. Use when an agent needs to collect multi-source information for a scope, identify emerging trends with DeepSeek, inspect scores and evidence chains, or retrieve recent trend topics through the Hots Monitor backend.
---

# Discover Trends

Use the Hots Monitor backend as the source of truth. Do not reimplement source collection, DeepSeek trend prompts, clustering, scoring, or evidence generation inside this skill.

## Backend

Default API base URL:

```text
http://localhost:4000
```

If the user provides another API base URL, use it.

## Workflow

1. Ensure the backend is running.
2. To discover trends for a scope immediately, call:

```http
POST /trends/run-now
```

Body:

```json
{
  "scope": "ai programming"
}
```

3. To list current trends, call:

```http
GET /trends?scope=ai%20programming
```

4. To inspect a trend and its evidence chain, call:

```http
GET /trends/{id}
```

## Output

Return:

- scope
- trend title
- summary
- hot score
- growth score
- evidence count
- key source URLs
- AI reason for why the topic is hot now

If the backend is unavailable, report that trend discovery cannot run until the Hots Monitor API is started.
