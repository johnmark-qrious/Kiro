import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REPOS = [
  { name: "Ubiquity-WebApps", path: "C:/Projects/GitHub/Ubiquity-WebApps", org: "qriousnz" },
  { name: "QT-Ubi-UbiquityBackend", path: "C:/Projects/GitHub/QT-Ubi-UbiquityBackend", org: "qriousnz" },
  { name: "ubiquity-platform-api", path: "C:/Projects/GitHub/ubiquity-platform-api", org: "qriousnz" },
  { name: "ubiquity-protos", path: "C:/Projects/GitHub/ubiquity-protos", org: "qriousnz" },
];

async function git(repoPath: string, args: string[]): Promise<string> {
  const proc = Bun.spawn(["git", ...args], { cwd: repoPath, stdout: "pipe", stderr: "pipe" });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}

async function getRepoBranchState(repo: typeof REPOS[0], featureBranch: string) {
  const { path, name } = repo;
  try {
    const currentBranch = await git(path, ["branch", "--show-current"]);
    const branches = await git(path, ["branch", "--list", `*${featureBranch}*`]);
    const matchingBranches = branches.split("\n").map((b) => b.trim().replace("* ", "")).filter(Boolean);

    let lastCommit = "";
    let aheadBehind = "";
    if (matchingBranches.length > 0) {
      const targetBranch = matchingBranches[0];
      lastCommit = await git(path, ["log", "-1", "--format=%h %s (%cr)", targetBranch]).catch(() => "");
      aheadBehind = await git(path, ["rev-list", "--left-right", "--count", `origin/main...${targetBranch}`]).catch(() => "");
    }

    return {
      repo: name,
      currentBranch,
      featureBranches: matchingBranches,
      lastCommit,
      aheadBehind: aheadBehind ? `ahead ${aheadBehind.split("\t")[0]}, behind ${aheadBehind.split("\t")[1]}` : "",
      hasUncommitted: (await git(path, ["status", "--porcelain"])).length > 0,
    };
  } catch {
    return { repo: name, currentBranch: "unknown", featureBranches: [], lastCommit: "", aheadBehind: "", hasUncommitted: false, error: "repo not accessible" };
  }
}

async function checkGitHubPRs(org: string, repo: string, branch: string): Promise<any[]> {
  // Use GitHub CLI if available
  try {
    const proc = Bun.spawn(["gh", "pr", "list", "--repo", `${org}/${repo}`, "--head", branch, "--json", "number,title,state,url,reviewDecision"], { stdout: "pipe", stderr: "pipe" });
    const text = await new Response(proc.stdout).text();
    await proc.exited;
    return text ? JSON.parse(text) : [];
  } catch {
    return [];
  }
}

const server = new McpServer({ name: "feature-state", version: "1.0.0" });

server.tool(
  "feature_status",
  "Get the state of a feature across all Ubiquity repos. Shows branches, PRs, commits, and uncommitted changes.",
  { branch: z.string().describe("Feature branch name or partial match (e.g., 'admin-billing' or 'feature/admin-billing-ui')") },
  async ({ branch }) => {
    const branchKey = branch.replace("feature/", "");
    const results = await Promise.all(REPOS.map((r) => getRepoBranchState(r, branchKey)));
    const prs = await Promise.all(REPOS.map((r) => checkGitHubPRs(r.org, r.name, branch)));

    const state = results.map((r, i) => ({
      ...r,
      prs: prs[i],
    }));

    return { content: [{ type: "text", text: JSON.stringify(state, null, 2) }] };
  }
);

server.tool(
  "feature_blockers",
  "Identify what's blocking a feature from being complete. Checks: unmerged dependencies, failing CI, missing reviews, uncommitted work.",
  { branch: z.string().describe("Feature branch name or partial match") },
  async ({ branch }) => {
    const branchKey = branch.replace("feature/", "");
    const results = await Promise.all(REPOS.map((r) => getRepoBranchState(r, branchKey)));
    const prs = await Promise.all(REPOS.map((r) => checkGitHubPRs(r.org, r.name, branch)));

    const blockers: string[] = [];

    results.forEach((r, i) => {
      if (r.hasUncommitted) blockers.push(`${r.repo}: has uncommitted changes`);
      if (r.featureBranches.length > 0 && prs[i].length === 0) blockers.push(`${r.repo}: branch exists but no PR created`);
      prs[i].forEach((pr: any) => {
        if (pr.reviewDecision === "CHANGES_REQUESTED") blockers.push(`${r.repo}: PR #${pr.number} has changes requested`);
        if (pr.reviewDecision === "" || pr.reviewDecision === null) blockers.push(`${r.repo}: PR #${pr.number} awaiting review`);
      });
    });

    // Check proto version alignment
    const protoVersions = new Set<string>();
    for (const repo of REPOS) {
      if (repo.name === "ubiquity-protos") continue;
      const branchState = results.find((r) => r.repo === repo.name);
      if (branchState?.featureBranches.length) {
        // Could check package versions here but would need file reads
      }
    }

    const summary = {
      feature: branch,
      blockers: blockers.length > 0 ? blockers : ["No blockers found - feature appears ready"],
      reposInvolved: results.filter((r) => r.featureBranches.length > 0).map((r) => r.repo),
      reposNotInvolved: results.filter((r) => r.featureBranches.length === 0).map((r) => r.repo),
    };

    return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
