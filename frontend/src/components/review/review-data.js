export const repositorySummary = {
  name: "Workspace Mode",
  branch: "Local",
  commit: "Draft",
  owner: "You",
};

export const mockRepositoryTree = [
  {
    type: "folder",
    name: "src",
    children: [
      {
        type: "folder",
        name: "components",
        children: [
          { type: "file", name: "Button.jsx", path: "src/components/Button.jsx" },
          { type: "file", name: "Header.jsx", path: "src/components/Header.jsx" },
        ],
      },
      {
        type: "folder",
        name: "services",
        children: [
          { type: "file", name: "authService.js", path: "src/services/authService.js" },
          { type: "file", name: "api.js", path: "src/services/api.js" },
        ],
      },
      { type: "file", name: "index.js", path: "src/index.js" },
      { type: "file", name: "App.jsx", path: "src/App.jsx" },
    ],
  },
  { type: "file", name: "package.json", path: "package.json" },
  { type: "file", name: "README.md", path: "README.md" },
];

export const mockFiles = {
  "src/components/Button.jsx": "export default function Button({ children }) {\n  return (\n    <button className=\"bg-blue-500 text-white px-4 py-2 rounded\">\n      {children}\n    </button>\n  );\n}",
  "src/components/Header.jsx": "export default function Header() {\n  return (\n    <header className=\"border-b p-4 flex justify-between\">\n      <h1>App</h1>\n      <nav>Links</nav>\n    </header>\n  );\n}",
  "src/services/authService.js": "export async function login(email, password) {\n  const res = await fetch('/api/login', {\n    method: 'POST',\n    body: JSON.stringify({ email, password })\n  });\n  return res.json();\n}",
  "src/services/api.js": "export const api = {\n  get: (url) => fetch(url).then(r => r.json()),\n  post: (url, data) => fetch(url, { method: 'POST', body: JSON.stringify(data) })\n};",
  "src/index.js": "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />);",
  "src/App.jsx": "import Header from './components/Header';\nimport Button from './components/Button';\n\nexport default function App() {\n  return (\n    <div>\n      <Header />\n      <main className=\"p-8\">\n        <Button>Click Me</Button>\n      </main>\n    </div>\n  );\n}",
  "package.json": "{\n  \"name\": \"code-pilot-demo\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {\n    \"react\": \"^18.2.0\"\n  }\n}",
  "README.md": "# CodePilot Demo\n\nThis is a sample repository to test the file explorer.",
};

export const suggestedFixes = [];
export const reviewStats = [];

function buildTreeFromGithub(githubTreeArray) {
  const root = [];
  const map = { "": { children: root } };

  // First pass: create all folder nodes
  githubTreeArray.filter(item => item.type === "tree").forEach(item => {
    const parts = item.path.split('/');
    const name = parts.pop();
    const parentPath = parts.join('/');
    
    const node = {
      type: "folder",
      name: name,
      path: item.path,
      children: []
    };
    
    map[item.path] = node;
    
    if (map[parentPath]) {
      map[parentPath].children.push(node);
    } else {
      root.push(node);
    }
  });

  // Second pass: add file nodes
  githubTreeArray.filter(item => item.type === "blob").forEach(item => {
    const parts = item.path.split('/');
    const name = parts.pop();
    const parentPath = parts.join('/');
    
    const node = {
      type: "file",
      name: name,
      path: item.path
    };
    
    if (map[parentPath]) {
      map[parentPath].children.push(node);
    } else {
      root.push(node);
    }
  });

  // Sort folders first, then files alphabetically
  const sortTree = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) sortTree(node.children);
    });
  };
  
  sortTree(root);
  return root;
}

export async function fetchRepositoryData(repoId, repoUrl, repoBranch) {
  let owner = null;
  let repo = null;
  
  if (repoUrl && repoUrl.includes("github.com")) {
    try {
      const urlObj = new URL(repoUrl);
      const parts = urlObj.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        owner = parts[0];
        repo = parts[1].replace(".git", "");
      }
    } catch (e) {
      console.error("Failed to parse github URL", e);
    }
  }

  // Fallback to mock data if not a valid GitHub URL
  if (!owner || !repo) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      tree: mockRepositoryTree,
      files: mockFiles,
    };
  }

  const branch = repoBranch || "main";
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  
  if (!res.ok) {
    throw new Error(`GitHub API Error: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  const tree = buildTreeFromGithub(data.tree || []);
  
  // Temporary: populate editor with placeholder text until content fetching is added
  const files = {};
  (data.tree || []).filter(item => item.type === "blob").forEach(item => {
    files[item.path] = `/* \n * File: ${item.path}\n * Size: ${item.size || "Unknown"} bytes\n * \n * (File content fetching will be implemented next)\n */\n`;
  });

  return { tree, files };
}

