---
inclusion: manual
---

# Gladiator Roster (Tournament Defenders)

Non-permanent roles spawned during `tournament` tournaments. The orchestrator picks which gladiators are relevant per challenge - not every gladiator fights every round.

| Gladiator | Fighting Style | Deploy When |
|-----------|---------------|-------------|
| @architect | "Here's how to make it work" | Always (default defender) |
| @cost-analyst | "What does this cost in money, time, and opportunity?" | Infrastructure, build vs buy, new dependencies |
| @user-advocate | "What does the user actually experience?" | Any decision with UX consequences (even backend) |
| @ops-gladiator | "Who deploys this at 2am when it breaks?" | New services, infra changes, monitoring gaps |
| @legacy-defender | "The current thing works. Prove the new thing is worth the tax." | Any rewrite/migration proposal |
| @future-self | "It's 2 years from now. Does this still make sense?" | Tech choices, dependency adoption, patterns |
| @simplicity | "Can you explain this to a new dev in 5 minutes?" | Over-engineering detection |

**Rule:** Don't force a gladiator into the arena if they have nothing meaningful to argue. If a challenge is purely technical with no user/ops/cost angle, only @architect defends.
