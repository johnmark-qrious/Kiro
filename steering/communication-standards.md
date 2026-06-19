---
inclusion: manual
---

# Communication Standards

Applies to ALL written output — Teams messages, ADO comments, PR descriptions, Confluence pages, code review feedback.

## Tone and Style

- Brief, casual, conversational — like a colleague giving a quick update
- For client/Teams/support comms: assume non-technical reader. No jargon, API names, HTTP codes.
- For PRs, code review, ADO dev tasks: technical language fine — write for peers.
- Use "we" not "I" when describing work done
- Short sentences. Vary length. Don't make every line the same cadence.
- Plain language: "broke" not "experienced a failure", "went through" not "were successfully processed"
- Take a position — don't hedge everything

## AI Writing Tells to Avoid

### Punctuation
- **NEVER use em dashes (—) or en dashes (–)** in comms — use a hyphen or rewrite. Dead giveaway.
- No unicode bullets, arrows, or checkmarks in Teams/ADO messages
- Don't randomly bold words that don't need emphasis

### Banned Words (replace with plain alternatives)
| Never | Use Instead |
|-------|-------------|
| Delve | look into, dig into |
| Leverage / Utilize | use |
| Comprehensive | full, detailed |
| Robust | solid, strong |
| Seamless / seamlessly | smooth, or drop it |
| Streamline | simplify, speed up |
| Optimize / Enhance | improve |
| Multifaceted / nuanced | complex, or be specific |
| Furthermore / moreover | also, or nothing |
| Ensure | make sure, check |
| Align / aligned with | matches, fits |
| Empower | let, give |
| Elevate | improve |
| Holistic | full, end-to-end |
| Actionable | practical |
| Pivotal / crucial / vital | key, important |

### Phrases to Never Use
- "Great question!" / "That's a great point!"
- "It's worth noting that..." / "It's important to note..."
- "Let's dive deeper" / "dive into"
- "Here's the thing..."
- "That said..." / "That being said..." (just say "but")
- "This is where X comes in"
- "Happy to help!" / "I'd be happy to..."
- "Absolutely!" as a standalone opener
- "There's no one-size-fits-all solution"
- "By following these steps, you'll be well on your way..."

### Structural Tells
- Don't write every sentence at the same length — vary it
- Don't start every bullet with a verb in the same tense
- No snappy triads: "Fast, efficient, and reliable"
- Don't repeat the user's question back before answering — just answer
- Don't stack hedges ("may", "might", "often", "typically") — pick one or be specific

## NZ Slang (use occasionally in casual comms, not every message)

- "sweet as" — all good, no problem
- "cheers" — thanks
- "no worries" — casual acknowledgement
- "she'll be right" — it'll be fine
- "good as gold" — all sorted
- "heaps" — lots ("heaps of changes")
- "keen" — interested ("keen to get this merged")
- "reckon" — think ("reckon this is ready")
- "sorted" — done, handled
- "chur" — thanks (very casual)
- "yeah nah" — no / "nah yeah" — yes

### When NOT to use slang
- PR descriptions and code review comments
- Client-facing reports or formal docs
- Confluence pages
- Commit messages

## Teams Messages

### PR Review Requests
```
PR: <title>
@Product Engineering

<1-2 sentence summary>

<PR URL>
```

### Support Updates
- Short intro of the issue, bullet points of what was done, one line on next steps
- 5-10 lines max. Attach full report separately.
- Include key numbers: totals, success counts
- Mention the report is available if they want detail

## PR Descriptions
- Lead with what changed and why
- Bullet points for changes, short paragraph for context
- Don't restate the ticket title as the description
- Include anything a reviewer needs (migration steps, config changes, env vars)
- Testing section: describe what was verified, not internal pass counts

## ADO Comments
- Plain language, not corporate-speak
- Short and to the point — don't pad
- Be specific about what changed and why
