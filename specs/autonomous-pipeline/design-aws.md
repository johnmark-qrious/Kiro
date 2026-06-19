# Autonomous Agentic Development Pipeline — AWS Infrastructure

**Version:** 2.1
**Date:** 2026-05-21
**Status:** Proposal (Deathmatch-validated)

---

## Overview

This document describes the AWS infrastructure for the escape hatch: the full custom pipeline built on AWS if GitHub Copilot native (Hybrid B+) proves insufficient. The core pipeline design, safety model, team structure, rollout plan, and success metrics are defined in `design.md`.

**When to build this:** Only if Hybrid B+ fails on a measured task class (see design.md Section 3k Quality Ratchet for trigger criteria).

**Chat platform:** Microsoft Teams (via webhooks to AWS).
**Ticket system:** Azure DevOps (no AWS dependency — ADO works fine with any backend).

---

## Technology Stack

| Component | AWS Service | Purpose |
|---|---|---|
| Event listeners / functions | **Lambda** | Webhook handlers, orchestration logic |
| Workflow orchestration | **Step Functions** | State machine for task lifecycle (retry, timeout, routing) |
| Sandbox compute | **E2B** (Phase 1) / **ECS Fargate** (Phase 2+) | Isolated agent execution |
| Secrets management | **Secrets Manager** | LLM API keys, GitHub tokens |
| Monitoring / alerts | **CloudWatch + EventBridge** | Pipeline health, error routing |
| Queue (async tasks) | **SQS** | Task queuing between stages |
| Audit log storage | **DynamoDB** | Immutable task history (1-year retention) |
| Artifact storage (videos) | **S3** | Playwright video recordings |
| API gateway | **API Gateway (HTTP API)** | Webhook endpoints (Teams, ADO, GitHub) |
| Container registry | **ECR** | Sandbox base images |
| Identity / approver auth | **Cognito** | Group-based approval enforcement |

---

## Architecture

```
Teams Webhook ──────────► API Gateway → Lambda (Ticket Agent)
                                │
                                ▼ creates PBI in ADO
ADO Webhook ────────────► API Gateway → Lambda (Orchestrator)
                                │
                                ├── Step Functions state machine
                                │   ├── Classify complexity
                                │   ├── Route (small/medium/large)
                                │   └── Spawn sandbox task
                                │
                                ▼
ECS Fargate Task (or E2B sandbox):
├── Isolated container (no internet via VPC config)
├── Agent implements in git worktree
├── Runs tests + Playwright (video → S3)
├── Pushes branch via git proxy
└── Opens PR (GitHub API)
                                │
                                ▼
GitHub Webhook ─────────► API Gateway → Lambda (Review Agent)
                                │
                                ├── Approved → notify Teams
                                └── Changes requested → Step Functions → new sandbox → fix loop
                                │
                                ▼
GitHub Webhook (merged) ► Lambda (Skill Evolution) → updates skill files in repo
```

---

## Sandbox Options

| Option | Cold Start | Isolation | Cost | Best For |
|---|---|---|---|---|
| **E2B** | ~150ms | Firecracker microVM | ~$0.05/vCPU-hr | Phase 1: strongest isolation, fastest, $200 free tier |
| **ECS Fargate** | 30-60s | Container (VPC isolated) | ~$0.04/vCPU-min | Phase 2+: full control, VPC integration |
| **CodeBuild** | 30-90s | Container | ~$0.005/build-min | Cheapest, less flexible |
| **EC2 spot + custom AMI** | 60-120s | Full VM | ~$0.03/hr (spot) | Maximum customization |

**Recommendation:** E2B for Phase 1 (fastest, simplest, free tier). Migrate to ECS Fargate in Phase 2 if you need VPC integration or cost optimization at scale.

---

## Network Isolation

```
VPC Configuration:
├── Private subnet (no internet gateway, no NAT)
├── VPC endpoint for S3 (artifact upload)
├── VPC endpoint for ECR (pull base image)
├── Security group: deny all outbound except:
│   ├── LLM proxy (host-side sidecar on localhost)
│   └── Git proxy (host-side, branch-locked)
└── No public IP assigned to task
```

If using E2B (external): isolation is built-in (Firecracker microVM, no network by default). Configure allowed endpoints explicitly.

---

## Step Functions State Machine

Handles the full task lifecycle: classify → route → implement → review → fix loop → escalate.

```json
{
  "StartAt": "ClassifyTicket",
  "States": {
    "ClassifyTicket": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:orchestrator-classify",
      "Next": "RouteByComplexity"
    },
    "RouteByComplexity": {
      "Type": "Choice",
      "Choices": [
        { "Variable": "$.complexity", "StringEquals": "small", "Next": "SpawnEngineer" },
        { "Variable": "$.complexity", "StringEquals": "medium", "Next": "SpawnArchitect" },
        { "Variable": "$.complexity", "StringEquals": "large", "Next": "SpawnArchitectDA" }
      ],
      "Default": "EscalateToHuman"
    },
    "SpawnEngineer": {
      "Type": "Task",
      "Resource": "arn:aws:states:::ecs:runTask.sync",
      "Next": "WaitForPR"
    },
    "WaitForPR": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:wait-for-pr",
      "TimeoutSeconds": 1800,
      "Next": "ReviewAgent",
      "Catch": [{ "ErrorEquals": ["States.Timeout"], "Next": "EscalateToHuman" }]
    },
    "ReviewAgent": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:review-agent",
      "Next": "CheckReviewResult"
    },
    "CheckReviewResult": {
      "Type": "Choice",
      "Choices": [
        { "Variable": "$.reviewResult", "StringEquals": "approved", "Next": "NotifyHuman" },
        { "Variable": "$.reviewResult", "StringEquals": "changes_requested", "Next": "FixLoop" }
      ]
    },
    "FixLoop": {
      "Type": "Task",
      "Resource": "arn:aws:states:::ecs:runTask.sync",
      "Next": "IncrementRetry"
    },
    "IncrementRetry": {
      "Type": "Choice",
      "Choices": [
        { "Variable": "$.retryCount", "NumericLessThan": 2, "Next": "ReviewAgent" }
      ],
      "Default": "EscalateToHuman"
    },
    "NotifyHuman": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:notify-teams",
      "End": true
    },
    "EscalateToHuman": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:escalate",
      "End": true
    }
  }
}
```

Step Functions gives you: built-in retry logic, timeouts, error handling, visual execution history, and native ECS/Lambda integration.

---

## Reference Architecture

AWS provides an open-source reference: [sample-autonomous-cloud-coding-agents](https://github.com/aws-samples/sample-autonomous-cloud-coding-agents)

Pre-built:
- CDK stack (infrastructure as code)
- Lambda orchestrator
- AgentCore MicroVMs (isolated sandboxes)
- Webhook integration (Slack/GitHub)
- Task lifecycle management (DynamoDB)
- CLI for manual task submission

**What you'd add on top:**
- Teams webhook adapter (Lambda receiving Teams events)
- ADO integration (webhook on PBI status change)
- Playwright video gate (custom quality hook in CI)
- Skill evolution engine (Lambda triggered on PR merge)
- Approval flow (Teams adaptive card → Lambda → Cognito group check)

---

## Approver Group Enforcement

```python
import boto3

cognito = boto3.client('cognito-idp')

APPROVER_GROUPS = {
    'low-risk': 'engineering-team',
    'medium-risk': 'senior-engineers',
    'high-risk': 'tech-leads'
}

def handler(event, context):
    user_id = event['teams_user_id']
    risk_level = event['risk_level']
    required_group = APPROVER_GROUPS[risk_level]
    
    groups = cognito.admin_list_groups_for_user(
        Username=user_id,
        UserPoolId=USER_POOL_ID
    )['Groups']
    
    group_names = [g['GroupName'] for g in groups]
    
    if required_group not in group_names:
        return {'approved': False, 'reason': f'Requires {required_group} membership'}
    
    return {'approved': True}
```

---

## Cost Model (15 Engineers)

| Item | Calculation | Monthly Cost |
|---|---|---|
| Lambda (orchestrator + agents) | ~5000 invocations/mo x 10s avg x 512MB | $15 |
| ECS Fargate (sandbox tasks) | 29 tasks x 20 min x 2 vCPU x $0.04/min | $46 |
| LLM API (Claude via Anthropic) | ~29 tasks x 250K tokens avg x $3/MTok | $90 |
| S3 (video artifacts) | ~10GB/mo | $0.23 |
| DynamoDB (audit + state) | On-demand, ~100K reads/writes | $1 |
| Step Functions | ~200 executions x 10 transitions | $0.05 |
| API Gateway | ~2000 requests/mo | $2 |
| CodeRabbit | 15 seats x $15 | $225 |
| Agent gardening (2-4 hrs/week x $90/hr) | Engineer time | $720-1,440 |
| **Total operating** | | **~$1,100-1,820/month** |

> **Note:** Cost model uses realistic Phase 1-2 volume (~29 routine PBIs/month from sprint audit). At full custom steady state with active routing, volume and costs scale proportionally.

---

## Teams Integration (via Webhook)

Teams connects to AWS via outgoing webhooks or Bot Framework:

1. **Incoming:** Lambda sends Teams messages via webhook URL (notifications, adaptive cards)
2. **Outgoing:** Teams bot posts to API Gateway endpoint (slash commands, approval reactions)

No Power Automate needed. Direct webhook integration is simpler and has no M365 dependency beyond Teams itself.

---

## References

| Reference | URL | Relevance |
|---|---|---|
| AWS Sample Autonomous Cloud Coding Agents | https://github.com/aws-samples/sample-autonomous-cloud-coding-agents | Pre-built reference architecture. CDK + Lambda + AgentCore. |
| AWS DevOps Agent (incident response) | https://aws.amazon.com/blogs/devops/leverage-agentic-ai-autonomous-incident-response-with-aws-devops-agent/ | Autonomous agent for ops (future phase). |
| Amazon Q Developer Agent | https://aws.amazon.com/blogs/devops/reinventing-the-amazon-q-developer-agent-for-software-development/ | AWS coding agent. Issue to PR in CodeCatalyst. |
| Step Functions Best Practices | https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html | State machine patterns. |
| ECS Fargate Task Networking | https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html | VPC isolation for sandbox containers. |
| E2B Sandbox | https://e2b.dev | Firecracker microVMs, 150ms cold starts. |
| Stripe Minions (1,300 PRs/week) | https://jangwook.net/en/blog/en/stripe-minions-autonomous-coding-agents-1300-prs/ | Production precedent. |
| Pilot (quantflow.studio) | https://pilot.quantflow.studio/ | Open-source ticket-to-PR. #1 Terminal-Bench. |
| Playwright Video | https://playwright.dev/docs/videos | Native video recording for test evidence. |
| CodeRabbit | https://coderabbit.ai | AI code review bot. |
