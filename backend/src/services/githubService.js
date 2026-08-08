const githubAccountModel = require("../models/githubAccountModel");
const encryption = require("../utils/encryption");

async function getGithubToken(userId) {
  const githubAccount = await githubAccountModel.findByUserId(userId);
  if (githubAccount && githubAccount.encrypted_access_token) {
    const token = encryption.decryptToken(githubAccount.encrypted_access_token);
    if (token) return token;
  }
  return process.env.GITHUB_TOKEN; // fallback
}

async function fetchGitHubAPI(endpoint, method, token, body = null) {
  const url = `https://api.github.com${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "CodePilot-AI",
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    throw new Error(`GitHub API Error (${res.status}): ${data.message || res.statusText}`);
  }
  
  return data;
}

async function createPullRequest({ userId, repoName, baseBranch, filePath, newContent, title, body }) {
  const token = await getGithubToken(userId);
  if (!token) {
    throw new Error("No GitHub token found. Please connect your GitHub account.");
  }

  const branchName = `codepilot/fix-issues-${Date.now()}`;

  // 1. Get the SHA of the latest commit on the base branch
  const refData = await fetchGitHubAPI(`/repos/${repoName}/git/ref/heads/${baseBranch}`, "GET", token);
  const baseCommitSha = refData.object.sha;

  // 2. Get the commit to find its tree SHA
  const commitData = await fetchGitHubAPI(`/repos/${repoName}/git/commits/${baseCommitSha}`, "GET", token);
  const baseTreeSha = commitData.tree.sha;

  // 3. Create a new branch reference
  await fetchGitHubAPI(`/repos/${repoName}/git/refs`, "POST", token, {
    ref: `refs/heads/${branchName}`,
    sha: baseCommitSha
  });

  // 4. Create a blob for the new file contents
  const blobData = await fetchGitHubAPI(`/repos/${repoName}/git/blobs`, "POST", token, {
    content: newContent,
    encoding: "utf-8"
  });

  // 5. Create a new tree with the updated file
  const treeData = await fetchGitHubAPI(`/repos/${repoName}/git/trees`, "POST", token, {
    base_tree: baseTreeSha,
    tree: [
      {
        path: filePath,
        mode: "100644", // File (blob)
        type: "blob",
        sha: blobData.sha
      }
    ]
  });

  // 6. Create a new commit
  const newCommitData = await fetchGitHubAPI(`/repos/${repoName}/git/commits`, "POST", token, {
    message: title,
    tree: treeData.sha,
    parents: [baseCommitSha]
  });

  // 7. Update the branch reference to point to the new commit
  await fetchGitHubAPI(`/repos/${repoName}/git/refs/heads/${branchName}`, "PATCH", token, {
    sha: newCommitData.sha,
    force: true
  });

  // 8. Open the Pull Request
  const prData = await fetchGitHubAPI(`/repos/${repoName}/pulls`, "POST", token, {
    title: title,
    body: body || "Applied AI-suggested fixes to improve code quality.",
    head: branchName,
    base: baseBranch
  });

  return {
    prUrl: prData.html_url,
    prNumber: prData.number,
    branchName
  };
}

module.exports = {
  createPullRequest
};
