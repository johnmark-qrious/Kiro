# Autonomous Agentic Development Pipeline — AWS Variant

**Version:** 2.0
**Date:** 2026-05-18
**Status:** Proposal (Updated post-deathmatch)
**Base Document:** autonomous-pipeline-design.md

---

## Implementation Decision Update

After adversarial tournament, the recommended approach is **Hybrid B+ (GitHub Copilot native)**. This is largely **cloud-agnostic** because the core execution happens on GitHub, not in your cloud provider.

### What's Cloud-Agnostic (Works Regardless)

- GitHub Copilot Coding Agent (runs on GitHub's infrastructure)
- Agent Merge (native GitHub)
- CodeRabbit (SaaS)
- Branch protection / human merge gate (GitHub)
- copilot-instructions.md (in repo)

### What Needs a Cloud Provider (Minimal)

| Component | Azure Option | AWS Option |
|---|---|---|
| ADO → GitHub Issue sync | Power Automate | **Lambda + EventBridge** (or keep Power Automate - works fine from AWS) |
| Playwright CI | GitHub Actions (cloud-agnostic) | GitHub Actions (same) |
| Artifact storage (videos) | GitHub Artifacts (free) | GitHub Artifacts (same) |

**Key insight:** With Hybrid B+, the cloud provider choice barely matters. GitHub handles the heavy lifting. You only need cloud for the ADO sync trigger (one function).

### If You Need the Escape Hatch (Full Custom on AWS)

The rest of this document describes the AWS-native full custom pipeline. Use this only if GitHub Copilot native proves insufficient.

---

## What Changes (Azure → AWS) — Escape Hatch Only

The pipeline design, safety model, team structure, rollout plan, risk register, and success metrics are **identical** to the Azure variant. Only the infrastructure components swap.

---

## Technology Mapping

| Component | Azure Version | AWS Version | Notes |
|---|---|---|---|
| Event listeners / functions | Azure Functions | **AWS Lambda** | Same pattern: webhook → function → action |
| Workflow orchestration | Power Automate | **AWS Step Functions** | More powerful (native state machines), slightly more setup |
| Chat platform | Teams | **Teams** (unchanged) | Teams works with any backend via webhooks |
| Ticket system | Azure DevOps | **Jira** (or keep ADO - works fine with AWS) | ADO has no AWS dependency. Keep it if you prefer. |
| Identity / group auth | Azure AD groups | **IAM Identity Center** (SSO) or **Cognito** groups | For approver group enforcement |
| Sandbox compute | Daytona | **E2B** or **ECS Fargate tasks** or **CodeBuild** | See comparison below |
| Secrets management | Azure Key Vault | **AWS Secrets Manager** | Same pattern |
| Monitoring / alerts | Azure Monitor | **CloudWatch + EventBridge** | EventBridge for event routing |
| Queue (async tasks) | Azure Service Bus | **SQS** (or EventBridge pipes) | For task queuing between stages |
| Audit log storage | Azure Table Storage | **DynamoDB** | Immutable append, cheap at scale |
| Artifact storage (videos) | Azure Blob | **S3** | Playwright videos stored here |
| API gateway | Azure API Management | **API Gateway** (HTTP API) | Webhook endpoints |
| Container registry | Azure ACR | **ECR** | For sandbox base images |

---

## AWS Architecture Diagram

```
Teams Webhook ──────────► API Gateway → Lambda (Ticket Agent)
                                │
                                ▼ creates ticket (Jira or ADO)
Jira/ADO Webhook ───────► API Gateway → Lambda (Orchestrator)
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

## Sandbox Options (AWS-Specific)

| Option | Cold Start | Isolation | Cost | Best For |
|---|---|---|---|---|
| **ECS Fargate** | 30-60s | Container (VPC isolated) | ~$0.04/vCPU-min | Full control, existing AWS estate |
| **E2B** | ~150ms | Firecracker microVM | ~$0.05/vCPU-hr | Strongest isolation, fastest |
| **CodeBuild** | 30-90s | Container | ~$0.005/build-min | Cheapest, but less flexible |
| **EC2 spot + custom AMI** | 60-120s | Full VM | ~$0.03/hr (spot) | Maximum customization |

**Recommendation:** E2B for Phase 1 (fastest, simplest, $200 free). Migrate to ECS Fargate in Phase 2 if you need VPC integration or cost optimization at scale.

---

## Network Isolation (AWS)

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

If using E2B (external): isolation is built-in (Firecracker microVM, no network by default). You configure allowed endpoints explicitly.

---

## Step Functions State Machine (Replaces Power Automate)

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

**Advantage over Power Automate:** Step Functions gives you built-in retry logic, timeouts, error handling, and visual execution history. More robust for this use case.

---

## AWS-Specific Reference Architecture

AWS provides an open-source reference: [sample-autonomous-cloud-coding-agents](https://github.com/aws-samples/sample-autonomous-cloud-coding-agents)

This gives you pre-built:
- CDK stack (infrastructure as code)
- Lambda orchestrator
- AgentCore MicroVMs (isolated sandboxes)
- Webhook integration (Slack/GitHub)
- Task lifecycle management (DynamoDB)
- CLI for manual task submission

**What you'd add on top:**
- Teams webhook adapter (Lambda that receives Teams events)
- Jira/ADO integration (or keep their GitHub Issues integration)
- Playwright video gate (custom quality hook)
- Skill evolution engine (Lambda triggered on PR merge)
- Approval flow (Teams adaptive card → Lambda → verify group membership)

---

## Cost Model (AWS, 15 Engineers)

| Item | Calculation | Monthly Cost |
|---|---|---|
| Lambda (orchestrator + agents) | ~5000 invocations/mo × 10s avg × 512MB | $15 |
| ECS Fargate (sandbox tasks) | 220 tasks × 20 min × 2 vCPU × $0.04/min | $352 |
| LLM API (Claude via Anthropic) | Same as Azure variant | $690 |
| S3 (video artifacts) | ~50GB/mo | $1.15 |
| DynamoDB (audit + state) | On-demand, ~1M reads/writes | $5 |
| Step Functions | ~1000 executions × 10 transitions | $0.25 |
| API Gateway | ~5000 requests/mo | $5 |
| CodeRabbit | 15 seats × $15 | $225 |
| **Total operating** | | **~$1,295/month** |

Slightly cheaper than Azure variant ($1,330) due to Lambda + Fargate pricing.

---

## Approver Group Enforcement (AWS)

```python
# Lambda: verify approver is in authorized Cognito group
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
    
    # Check group membership
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

## What Stays Exactly The Same (Regardless of Cloud)

- Pipeline flow (Teams → Ticket → Orchestrator → Engineer → Review → Human → Skill Evolution)
- Safety model (two human gates, sandbox isolation, 2-retry cap)
- Team structure (cells aligned to repos)
- Rollout phases (1a → 1b → 2 → 3 with exit criteria)
- Risk register (all 10 risks + mitigations)
- Success metrics and KPIs
- Decision log (all ADRs)
- Skill evolution engine (same protocol)
- Playwright video proof (same approach)
- Human merge gate (GitHub branch protection - cloud-agnostic)

---

## Decision: Azure vs AWS

| Factor | Azure | AWS |
|---|---|---|
| Teams integration | Native (Power Automate) | Webhook (slightly more work) |
| Orchestration | Power Automate (simpler) | Step Functions (more powerful) |
| Sandbox | Daytona (external) | E2B (external) or ECS Fargate (native) |
| Reference architecture | None | aws-samples/sample-autonomous-cloud-coding-agents |
| Cost | ~$1,330/mo | ~$1,295/mo |
| If you already have | Azure estate + M365 | AWS estate |
| Effort to build | 4-6 weeks | 4-6 weeks (3-4 if using reference arch) |

**Pick based on where your infrastructure already lives.** The pipeline doesn't care.


---

## References (AWS-Specific + Shared)

### AWS-Specific

| Reference | URL | Relevance |
|---|---|---|
| AWS Sample Autonomous Cloud Coding Agents | https://github.com/aws-samples/sample-autonomous-cloud-coding-agents | Pre-built reference architecture. CDK + Lambda + AgentCore. |
| AWS DevOps Agent (incident response) | https://aws.amazon.com/blogs/devops/leverage-agentic-ai-autonomous-incident-response-with-aws-devops-agent/ | AWS-native autonomous agent for ops (future phase reference). |
| Amazon Q Developer Agent | https://aws.amazon.com/blogs/devops/reinventing-the-amazon-q-developer-agent-for-software-development/ | AWS coding agent capabilities. Issue → PR in CodeCatalyst. |
| Amazon Q Agentic Coding in IDE | https://aws.amazon.com/blogs/devops/amazon-q-developer-agentic-coding-experience/ | Agentic coding with file read/write, bash commands. |
| Step Functions Best Practices | https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html | State machine patterns for orchestration. |
| ECS Fargate Task Networking | https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html | VPC isolation for sandbox containers. |

### Shared (Same as Azure Variant)

| Reference | URL | Relevance |
|---|---|---|
| Stripe Minions (1,300 PRs/week) | https://jangwook.net/en/blog/en/stripe-minions-autonomous-coding-agents-1300-prs/ | Production precedent. Blueprint architecture. |
| Pilot (quantflow.studio) | https://pilot.quantflow.studio/ | Open-source ticket-to-PR. #1 Terminal-Bench. |
| DORA Metrics + AI Impact | https://www.faros.ai/blog/key-takeaways-from-the-dora-report-2025 | Problem statement data. |
| Multi-Agent Failure Rates | https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them | 41-86% failure without coordination. |
| Anthropic Dreaming | https://claude.com/blog/new-in-claude-managed-agents | Self-improving agents. 6x improvement at Harvey. |
| E2B Sandbox | https://e2b.dev | Firecracker microVMs, 150ms cold starts. |
| Playwright Video | https://playwright.dev/docs/videos | Native video recording for test evidence. |
| Optimizing Software Factories | https://tomtunguz.com/optimizing-software-factories/ | AI/labor ratio analysis. |
| Agent Fleet Concurrency | https://tianpan.co/blog/2026-04-22-agent-fleet-concurrency-coordination | Coordination patterns at scale. |
| CodeRabbit | https://coderabbit.ai | AI code review bot. |
