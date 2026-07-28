"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import dynamic from "next/dynamic";
const EditorPlaceholder = dynamic(() => import("./EditorPlaceholder").then((mod) => mod.EditorPlaceholder), { ssr: false });
import { RepositoryExplorerDrawer } from "./repository-explorer-drawer";
import { ReviewBottomBar } from "./review-bottom-bar";
import { ReviewFixesPanel } from "./review-fixes-panel";
import { ReviewFileExplorer } from "./review-file-explorer";
import { fetchRepositoryData } from "./review-data";
import { apiUrl } from "@/lib/api";

const STORAGE_KEYS = {
  sidebarCollapsed: "codepilot.review.sidebarCollapsed",
  fixesWidth: "codepilot.review.fixesWidth",
  fixesCollapsed: "codepilot.review.fixesCollapsed",
  lastRepo: "codepilot.lastRepo",
};

const MIN_EDITOR_WIDTH = 640;
const MAX_EDITOR_WIDTH = 1280;
const DEFAULT_EDITOR_WIDTH = 900;
const FIXES_EXPANDED_WIDTH = 360;
const FIXES_COLLAPSED_WIDTH = 56;
const SIDEBAR_COLLAPSED_WIDTH = 70;
const SIDEBAR_EXPANDED_WIDTH = 240;

const getGithubMeta = (url) => {
  if (!url || !url.includes("github.com")) return null;
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return { owner: parts[0], repo: parts[1].replace(".git", "") };
  } catch(e) {}
  return null;
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function ReviewWorkspace() {
  const workspaceRef = useRef(null);
  const dragStateRef = useRef({ startX: 0, startWidth: DEFAULT_EDITOR_WIDTH });
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  // start hidden by default in the reviews workspace; menu toggle will show it
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // hide AI Suggested Fixes panel by default
  const [isFixesCollapsed, setIsFixesCollapsed] = useState(true);
  const [analysisState, setAnalysisState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [findings, setFindings] = useState([]);
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [overallSeverity, setOverallSeverity] = useState("none");
  
  // Repository State
  const searchParams = useSearchParams();
  const repoId = searchParams?.get("repoId");
  const repoName = searchParams?.get("name") || "Select a repository";
  const repoBranch = searchParams?.get("branch") || "main";
  const repoUrl = searchParams?.get("url") || "";

  useEffect(() => {
    if (repoId && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.lastRepo, JSON.stringify({
        id: repoId,
        name: repoName,
        url: repoUrl,
        branch: repoBranch
      }));
    }
  }, [repoId, repoName, repoUrl, repoBranch]);
  
  const [isFetchingWorkspace, setIsFetchingWorkspace] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [repoTree, setRepoTree] = useState([]);
  const [repoFiles, setRepoFiles] = useState({});
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [fixesWidth, setFixesWidth] = useState(FIXES_EXPANDED_WIDTH);
  const [explorerWidth, setExplorerWidth] = useState(240);
  const [layoutTick, setLayoutTick] = useState(0);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isExplorerResizing, setIsExplorerResizing] = useState(false);
  const explorerDragRef = useRef({ startX: 0, startWidth: 240 });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    try {
      const storedSidebar = window.localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
      const storedFixesWidth = window.localStorage.getItem(STORAGE_KEYS.fixesWidth);
      const storedFixesCollapsed = window.localStorage.getItem(STORAGE_KEYS.fixesCollapsed);

      if (storedSidebar != null) {
        setIsSidebarCollapsed(storedSidebar === "true");
      }

      if (storedFixesWidth != null) {
        setFixesWidth(Number(storedFixesWidth) || FIXES_EXPANDED_WIDTH);
      }

      if (storedFixesCollapsed != null) {
        setIsFixesCollapsed(storedFixesCollapsed === "true");
      }
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(isSidebarCollapsed));
    } catch {
      // Ignore storage access issues.
    }
  }, [isHydrated, isSidebarCollapsed]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.fixesWidth, String(fixesWidth));
    } catch {
      // Ignore storage access issues.
    }
  }, [fixesWidth, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.fixesCollapsed, String(isFixesCollapsed));
    } catch {
      // Ignore storage access issues.
    }
  }, [isFixesCollapsed, isHydrated]);

  useEffect(() => {
    if (!workspaceRef.current) {
      return undefined;
    }

    const updateWorkspaceWidth = () => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      setWorkspaceWidth(rect?.width || 0);
    };

    updateWorkspaceWidth();

    const observer = new ResizeObserver(updateWorkspaceWidth);
    observer.observe(workspaceRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      // moving left increases the width of the right panel
      const deltaX = dragStateRef.current.startX - event.clientX;
      const nextWidth = clamp(dragStateRef.current.startWidth + deltaX, 260, 600);
      setFixesWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isExplorerResizing) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const nextWidth = clamp(
        event.clientX - explorerDragRef.current.startX + explorerDragRef.current.startWidth,
        200,
        600
      );
      setExplorerWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsExplorerResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isExplorerResizing]);

  const beginExplorerResize = (event) => {
    event.preventDefault();
    setIsExplorerResizing(true);
    explorerDragRef.current = {
      startX: event.clientX,
      startWidth: explorerWidth,
    };
  };

  // In Review Workspace, the sidebar is permanently a 70px icon strip
  const sidebarWidth = SIDEBAR_COLLAPSED_WIDTH;

  useEffect(() => {
    let mounted = true;

    if (!repoId) {
      setRepoTree([]);
      setRepoFiles({});
      setSelectedFileName("");
      setSelectedFileContent("");
      return;
    }

    setIsFetchingWorkspace(true);
    setFetchError(null);
    fetchRepositoryData(repoId, repoUrl, repoBranch)
      .then((data) => {
        if (!mounted) return;
        setRepoTree(data.tree || []);
        setRepoFiles(data.files || {});
        
        // auto-select first file if available
        const paths = Object.keys(data.files || {});
        if (paths.length > 0) {
          const firstFile = paths[0];
          setSelectedFileName(firstFile);
          
          const githubMeta = getGithubMeta(repoUrl);
          if (githubMeta) {
            setSelectedFileContent("// Fetching file contents from GitHub...\n");
            const rawUrl = `https://raw.githubusercontent.com/${githubMeta.owner}/${githubMeta.repo}/${repoBranch || 'main'}/${firstFile}`;
            fetch(rawUrl)
              .then(res => res.ok ? res.text() : Promise.reject(new Error("Failed to fetch")))
              .then(text => {
                if (!mounted) return;
                setRepoFiles(prev => ({ ...prev, [firstFile]: text }));
                setSelectedFileContent(text);
              })
              .catch(e => {
                if (!mounted) return;
                setSelectedFileContent(`// Error fetching file: ${e.message}\n\n${data.files[firstFile]}`);
              });
          } else {
            setSelectedFileContent(data.files[firstFile]);
          }
        } else {
          setSelectedFileName("");
          setSelectedFileContent("");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setFetchError(err.message || "Failed to load repository.");
      })
      .finally(() => {
        if (mounted) setIsFetchingWorkspace(false);
      });

    return () => {
      mounted = false;
    };
  }, [repoId, repoUrl, repoBranch]);

  async function handleFileSelect(name) {
    setSelectedFileName(name);
    setAnalysisState("idle");
    setFindings([]);
    setAnalysisSummary("");
    setOverallSeverity("none");
    
    const existingContent = repoFiles[name];
    if (existingContent && !existingContent.startsWith("/* \n * File:")) {
      setSelectedFileContent(existingContent);
      return;
    }

    const githubMeta = getGithubMeta(repoUrl);
    if (!githubMeta) {
      setSelectedFileContent(existingContent || "");
      return;
    }

    setSelectedFileContent("// Fetching file contents from GitHub...\n");

    try {
      const rawUrl = `https://raw.githubusercontent.com/${githubMeta.owner}/${githubMeta.repo}/${repoBranch || 'main'}/${name}`;
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error("Failed to fetch");
      const text = await res.text();
      
      setRepoFiles((prev) => ({ ...prev, [name]: text }));
      setSelectedFileContent(text);
    } catch (e) {
      setSelectedFileContent(`// Error fetching file: ${e.message}\n\n${existingContent || ""}`);
    }
  }

  function handleRefreshFiles() {
    // Re-fetch logic if needed
    setSelectedFileContent((prev) => prev);
  }

  const editorStyle = useMemo(() => {
    return {
      flex: "1 1 0%",
      width: "100%",
      minWidth: 0,
    };
  }, []);

  const beginResize = (event) => {
    if (isFixesCollapsed) {
      return;
    }

    event.preventDefault();
    setIsResizing(true);
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: fixesWidth,
    };
  };

  const handleAnalyze = async ({ sourceCode, language } = {}) => {
    // begin analysis / submit review
    setStatusMessage("");
    setAnalysisState("analyzing");
    // ensure panel is hidden during analysis
    setIsFixesCollapsed(true);

    const payload = {
      sourceCode: sourceCode || "",
      fileName: selectedFileName || "unknown",
      repositoryId: repoId || null,
      language: language || "plaintext",
    };

    if (!payload.sourceCode) {
      setStatusMessage("Please select a file with code before analyzing");
      setAnalysisState("error");
      return;
    }

    try {
      // retrieve token stored at login (if available)
      let token = null;
      try {
        token = window.localStorage.getItem("auth_token");
      } catch (e) {
        token = null;
      }

      const response = await fetch(apiUrl("/reviews/analyze"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || "Failed to analyze code";
        setStatusMessage(message);
        setAnalysisState("error");
        return;
      }

      // success
      const { analysis } = data;
      setFindings(analysis?.findings || []);
      setAnalysisSummary(analysis?.summary || "Analysis completed.");
      setOverallSeverity(analysis?.overallSeverity || "none");
      
      setStatusMessage("Review completed successfully");
      setAnalysisState("completed");
      // show AI Suggested Fixes panel when done
      setIsFixesCollapsed(false);
    } catch (err) {
      setStatusMessage(err?.message || "Network error");
      setAnalysisState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <DashboardSidebar
        activeItem="Reviews"
        collapsed={true}
        workspaceMode
        mobileOpen={isMobileSidebarOpen}
        onToggleExplorer={() => setIsExplorerOpen((prev) => !prev)}
      />


      {isMobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      ) : null}

      <div
        className="min-h-screen transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-width)]"
        style={{ "--sidebar-width": `${sidebarWidth}px` }}
      >
        <DashboardTopbar
          showWorkspaceControls
          onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
          onToggleRepositoryExplorer={() => setIsExplorerOpen((value) => !value)}
        />

        <main className="flex h-[calc(100vh-64px)] overflow-hidden">
          {isExplorerOpen && repoId && !isFetchingWorkspace ? (
            <div className="relative shrink-0 h-full border-r border-[#2d333b]" style={{ width: `${explorerWidth}px` }}>
              <ReviewFileExplorer 
                tree={repoTree}
                repository={{ name: repoName, branch: repoBranch }}
                onFileSelect={handleFileSelect} 
                onRefresh={handleRefreshFiles} 
                activeFile={selectedFileName} 
              />
              <div
                className="absolute inset-y-0 right-[-4px] z-10 w-2 cursor-col-resize hover:bg-sky-500/50"
                onPointerDown={beginExplorerResize}
                aria-label="Resize Explorer"
              />
            </div>
          ) : null}

          <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">
            <div ref={workspaceRef} className="mx-auto max-w-full h-full flex flex-col">
              
              {!repoId ? (
                <div className="flex flex-1 items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/5">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-slate-200">No Repository Selected</h3>
                    <p className="mt-2 text-sm text-slate-400">Select a repository from the Dashboard to begin reviewing.</p>
                  </div>
                </div>
              ) : isFetchingWorkspace ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                    <span>Loading workspace...</span>
                  </div>
                </div>
              ) : fetchError ? (
                <div className="flex flex-1 items-center justify-center border border-dashed border-red-500/20 rounded-xl bg-red-500/5">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-red-400">Failed to Load Repository</h3>
                    <p className="mt-2 text-sm text-red-300/70">{fetchError}</p>
                    <p className="mt-4 text-xs text-slate-500">Ensure the repository is public or you have the proper access tokens configured.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-1 min-h-[calc(100vh-180px)] gap-4 flex-col xl:flex-row">
                    <div className="relative min-w-0 min-h-0 transition-[flex-basis,width] duration-300 ease-out" style={editorStyle}>
                      <EditorPlaceholder
                        analysisState={analysisState}
                        onAnalyze={handleAnalyze}
                        layoutTrigger={layoutTick}
                        statusMessage={statusMessage}
                        fileName={selectedFileName}
                        fileContent={selectedFileContent}
                        repoName={repoName}
                        repoBranch={repoBranch}
                        onRefreshFiles={handleRefreshFiles}
                      />
                    </div>
                  {analysisState === "completed" && !isFixesCollapsed ? (
                    <div className="relative shrink-0" style={{ width: `${fixesWidth}px` }}>
                      <div
                        className="absolute inset-y-0 left-[-12px] z-10 w-2 cursor-col-resize hover:bg-sky-500/50"
                        onPointerDown={beginResize}
                        aria-label="Resize Fixes Panel"
                      />
                      <ReviewFixesPanel 
                      collapsed={false} 
                      onToggleCollapse={() => setIsFixesCollapsed(true)} 
                      findings={findings}
                      summary={analysisSummary}
                      overallSeverity={overallSeverity}
                    />
                    </div>
                  ) : null}
                  </div>
                  {analysisState === "completed" && (
                    <div className="mt-4 shrink-0">
                      <ReviewBottomBar
                        onExpandFixes={() => setIsFixesCollapsed(false)}
                        isFixesExpanded={!isFixesCollapsed}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
