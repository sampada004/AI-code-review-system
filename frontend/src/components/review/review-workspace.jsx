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
import { PRSuccessModal } from "./pr-success-modal";
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

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const tokenize = (s) => s.toLowerCase().match(/\w+/g) || [];
  const tokens1 = new Set(tokenize(str1));
  const tokens2 = new Set(tokenize(str2));
  let intersection = 0;
  tokens1.forEach(t => { if (tokens2.has(t)) intersection++; });
  const union = tokens1.size + tokens2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function getLanguageFromFilename(name) {
  if (!name) return "plaintext";
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "java":
      return "java";
    case "py":
      return "python";
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";
    case "c":
      return "c";
    case "cs":
      return "csharp";
    case "php":
      return "php";
    default:
      return "plaintext";
  }
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
  const [selectedFindingIndex, setSelectedFindingIndex] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState(new Set());
  const editorRef = useRef(null);

  // Re-validation state
  const [originalReview, setOriginalReview] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [backgroundValidationReport, setBackgroundValidationReport] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isBackgroundValidating, setIsBackgroundValidating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [createdPrData, setCreatedPrData] = useState(null);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  
  // Repository State
  const searchParams = useSearchParams();
  const repoId = searchParams?.get("repoId");
  const repoName = searchParams?.get("name") || "Select a repository";
  const repoBranch = searchParams?.get("branch") || "main";
  const repoUrl = searchParams?.get("url") || "";
  const paramReviewId = searchParams?.get("reviewId");
  const paramAutoAnalyze = searchParams?.get("autoAnalyze");

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
  const [projectContext, setProjectContext] = useState(null);
  const [isDetectingContext, setIsDetectingContext] = useState(false);
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

  // Direct "Fix Issue" Navigation & Auto-Focus
  useEffect(() => {
    if (!selectedFileName || !selectedFileContent || selectedFileContent.startsWith("// Fetching")) return;
    
    let isMounted = true;
    if (paramReviewId) {
      let token = null;
      try { token = window.localStorage.getItem("auth_token"); } catch(e) {}
      
      fetch(apiUrl(`/reviews/${paramReviewId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (!isMounted) return;
          if (data.success && data.review && data.review.findings && data.review.findings.length > 0) {
            setOriginalReview(data.review);
            setFindings(data.review.findings);
            setAnalysisSummary(data.review.summary || "Review findings loaded for file.");
            setOverallSeverity(data.review.overall_severity || "high");
            setAnalysisState("completed");
            setIsFixesCollapsed(false);
            setSelectedFindingIndex(0);
          } else if (paramAutoAnalyze === "true" && analysisState === "idle") {
            const ext = selectedFileName.split(".").pop()?.toLowerCase();
            handleAnalyze({ sourceCode: selectedFileContent, language: ext });
          }
        })
        .catch(() => {
          if (isMounted && paramAutoAnalyze === "true" && analysisState === "idle") {
            const ext = selectedFileName.split(".").pop()?.toLowerCase();
            handleAnalyze({ sourceCode: selectedFileContent, language: ext });
          }
        });
    } else if (paramAutoAnalyze === "true" && analysisState === "idle") {
      const ext = selectedFileName.split(".").pop()?.toLowerCase();
      handleAnalyze({ sourceCode: selectedFileContent, language: ext });
    }

    return () => { isMounted = false; };
  }, [paramReviewId, paramAutoAnalyze, selectedFileName, selectedFileContent]);

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
      setProjectContext(null);
      setSelectedFileName("");
      setSelectedFileContent("");
      return;
    }

    // Fetch Repository Details to get Context
    let token = null;
    try {
      token = window.localStorage.getItem("auth_token");
    } catch (e) {}

    fetch(apiUrl(`/repositories/${repoId}`), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        if (data.success && data.repository) {
          if (data.repository.project_context) {
            setProjectContext(data.repository.project_context);
          } else {
            // Trigger automatic detection
            setIsDetectingContext(true);
            fetch(apiUrl(`/repositories/${repoId}/detect-context`), {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ branch: repoBranch })
            })
              .then(res => res.json())
              .then(detectData => {
                if (mounted && detectData.success) {
                  setProjectContext(detectData.context);
                }
              })
              .finally(() => mounted && setIsDetectingContext(false));
          }
        }
      })
      .catch(console.error);

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
          
          if (repoId) {
            setSelectedFileContent("// Fetching file contents from workspace...\n");
            let token = null;
            try {
              token = window.localStorage.getItem("auth_token");
            } catch (e) {}

            const rawUrl = apiUrl(`/repositories/${repoId}/file?path=${encodeURIComponent(firstFile)}&branch=${encodeURIComponent(repoBranch || 'main')}`);
            fetch(rawUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
              .then(res => res.ok ? res.text() : Promise.reject(new Error(`Failed to fetch (${res.status})`)))
              .then(text => {
                if (!mounted) return;
                setRepoFiles(prev => ({ ...prev, [firstFile]: text }));
                setSelectedFileContent(text);
              })
              .catch(e => {
                if (!mounted) return;
                setSelectedFileContent(`// Error fetching file: ${e.message}\n\n${data.files[firstFile] || ""}`);
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
    setSelectedFindingIndex(null);
    setAppliedFixes(new Set());
    setOriginalReview(null);
    setValidationReport(null);
    setCreatedPrData(null);
    setIsPRModalOpen(false);

    const existingContent = repoFiles[name];
    if (existingContent && !existingContent.startsWith("/* \n * File:")) {
      setSelectedFileContent(existingContent);
      return;
    }

    if (!repoId) {
      setSelectedFileContent(existingContent || "");
      return;
    }

    setSelectedFileContent("// Fetching file contents from workspace...\n");

    try {
      let token = null;
      try {
        token = window.localStorage.getItem("auth_token");
      } catch (e) {}

      const rawUrl = apiUrl(`/repositories/${repoId}/file?path=${encodeURIComponent(name)}&branch=${encodeURIComponent(repoBranch || 'main')}`);
      const res = await fetch(rawUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
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

  const handleIgnoreFix = (idx) => {
    setFindings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ignored: true };
      return next;
    });

    if (selectedFindingIndex === idx) {
      setSelectedFindingIndex(null);
    }
  };

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

  const handleAnalyze = async ({ sourceCode, language, isRevalidation = false, isBackground = false } = {}) => {
    // begin analysis / submit review
    if (!isBackground) {
      setStatusMessage("");
      setAnalysisState("analyzing");
      setFindings([]); // Clear findings to reset editor decorations
      setValidationReport(null);
      if (!isRevalidation) {
        setCreatedPrData(null);
        setIsPRModalOpen(false);
      }
      if (isRevalidation) setIsRevalidating(true);
      // ensure panel is hidden during analysis
      setIsFixesCollapsed(true);
    } else {
      setIsBackgroundValidating(true);
    }

    const payload = {
      sourceCode: sourceCode || "",
      fileName: selectedFileName || "unknown",
      repositoryId: repoId || null,
      language: language || "plaintext",
      isRevalidation,
      previousFindings: isRevalidation && originalReview ? originalReview.findings : undefined
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
      const newFindings = analysis?.findings || [];
      
      if (isRevalidation && originalReview) {
        // Compare new findings with original findings
        const resolved = [];
        const remaining = [];
        const newIssues = [];
        
        // Find remaining and resolved
        originalReview.findings.forEach(orig => {
          // If ignored, treat as resolved for validation purposes
          if (orig.ignored) {
            resolved.push(orig);
            return;
          }
          
          const match = newFindings.find(nf => {
            const str1 = orig.issue + " " + (orig.recommendation || "");
            const str2 = nf.issue + " " + (nf.recommendation || "");
            return calculateSimilarity(str1, str2) > 0.25;
          });
          if (match) {
            remaining.push(match);
          } else {
            resolved.push(orig);
          }
        });
        
        // Find new issues
        newFindings.forEach(nf => {
          const match = originalReview.findings.find(orig => {
            const str1 = orig.issue + " " + (orig.recommendation || "");
            const str2 = nf.issue + " " + (nf.recommendation || "");
            return calculateSimilarity(str1, str2) > 0.25;
          });
          if (!match) {
            newIssues.push(nf);
          }
        });
        
        let status = "all_resolved";
        if (newIssues.length > 0) status = "new_issues";
        else if (remaining.length > 0) status = "partial";
        
        if (isBackground) {
          setBackgroundValidationReport({
            status,
            resolved,
            remaining,
            newIssues,
            severityBefore: originalReview.overallSeverity,
            severityAfter: analysis?.overallSeverity || "none"
          });
        } else {
          setValidationReport({
            status,
            resolved,
            remaining,
            newIssues,
            severityBefore: originalReview.overallSeverity,
            severityAfter: analysis?.overallSeverity || "none"
          });
        }
      } else {
        // First time analysis
        setOriginalReview({
          findings: newFindings,
          summary: analysis?.summary || "",
          overallSeverity: analysis?.overallSeverity || "none"
        });
        setValidationReport(null);
        setBackgroundValidationReport(null);
      }

      if (!isBackground) {
        setFindings(newFindings);
        setAnalysisSummary(analysis?.summary || "Analysis completed.");
        setOverallSeverity(analysis?.overallSeverity || "none");
        setSelectedFindingIndex(null);
        setAppliedFixes(new Set());
        
        setStatusMessage(isRevalidation ? "Re-validation completed" : "Review completed successfully");
        setAnalysisState("completed");
        if (isRevalidation) setIsRevalidating(false);
        // show AI Suggested Fixes panel when done
        setIsFixesCollapsed(false);
      } else {
        setIsBackgroundValidating(false);
      }
    } catch (err) {
      if (!isBackground) {
        setStatusMessage(err?.message || "Network error");
        setAnalysisState("error");
        setIsRevalidating(false);
      } else {
        setIsBackgroundValidating(false);
      }
    }
  };

  const handleRevalidate = () => {
    let source = "";
    if (editorRef.current) {
      source = editorRef.current.getValue();
    }
    const language = getLanguageFromFilename(selectedFileName);
    handleAnalyze({ sourceCode: source, language, isRevalidation: true });
  };

  // Debounced auto-validation when fixes are applied
  useEffect(() => {
    if (appliedFixes.size === 0) return;
    
    // Prevent auto-revalidating if we are already in the process
    if (isRevalidating || analysisState === "analyzing" || isBackgroundValidating) return;

    const timer = setTimeout(() => {
      let source = editorRef.current ? editorRef.current.getValue() : "";
      const language = getLanguageFromFilename(selectedFileName);
      handleAnalyze({ sourceCode: source, language, isRevalidation: true, isBackground: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [appliedFixes]);

  const handleCreatePullRequest = async () => {
    if (!repoId || !selectedFileName || !editorRef.current) return;
    
    setIsCreatingPR(true);
    try {
      let token = window.localStorage.getItem("auth_token");
      
      const response = await fetch(apiUrl(`/repositories/${repoId}/pull-request`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filePath: selectedFileName,
          newContent: editorRef.current.getValue(),
          branch: repoBranch
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create Pull Request");
      }

      const prData = {
        prUrl: data.pullRequest?.prUrl || data.pullRequest?.url || "#",
        branchName: data.pullRequest?.branchName || repoBranch
      };
      setCreatedPrData(prData);
      setIsPRModalOpen(true);
    } catch (err) {
      alert("Error creating Pull Request: " + err.message);
    } finally {
      setIsCreatingPR(false);
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
                projectContext={projectContext}
                isDetectingContext={isDetectingContext}
                onRefreshContext={() => {
                  setIsDetectingContext(true);
                  let token = window.localStorage.getItem("auth_token");
                  fetch(apiUrl(`/repositories/${repoId}/detect-context`), {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ branch: repoBranch })
                  })
                    .then(res => res.json())
                    .then(detectData => {
                      if (detectData.success) {
                        setProjectContext(detectData.context);
                      }
                    })
                    .finally(() => setIsDetectingContext(false));
                }}
              />
              <div
                className="absolute inset-y-0 right-[-4px] z-10 w-2 cursor-col-resize hover:bg-sky-500/50"
                onPointerDown={beginExplorerResize}
                aria-label="Resize Explorer"
              />
            </div>
          ) : null}

          <div className="flex-1 min-w-0 h-full p-3 overflow-hidden">
            <div ref={workspaceRef} className="mx-auto max-w-full h-full flex flex-col min-h-0">
              
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
                  <div className="flex flex-1 h-full min-h-0 gap-3">
                    <div className="relative min-w-0 h-full flex-1 transition-[flex-basis,width] duration-300 ease-out" style={editorStyle}>
                      <EditorPlaceholder
                        ref={editorRef}
                        analysisState={analysisState}
                        onAnalyze={handleAnalyze}
                        layoutTrigger={layoutTick}
                        statusMessage={statusMessage}
                        fileName={selectedFileName}
                        fileContent={selectedFileContent}
                        repoName={repoName}
                        repoBranch={repoBranch}
                        onRefreshFiles={handleRefreshFiles}
                        findings={findings}
                        selectedFindingIndex={selectedFindingIndex}
                        onSelectFinding={setSelectedFindingIndex}
                        appliedFixes={appliedFixes}
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
                      selectedFindingIndex={selectedFindingIndex}
                      onSelectFinding={setSelectedFindingIndex}
                      appliedFixes={appliedFixes}
                      onApplyFix={(idx) => {
                        editorRef.current?.applyFix(idx);
                        setAppliedFixes(prev => new Set(prev).add(idx));
                      }}
                      onUndoFix={(idx) => {
                        editorRef.current?.undoFix(idx);
                        setAppliedFixes(prev => {
                          const next = new Set(prev);
                          next.delete(idx);
                          return next;
                        });
                      }}
                      onIgnoreFix={handleIgnoreFix}
                      onRevalidate={handleRevalidate}
                      isRevalidating={isRevalidating}
                      isBackgroundValidating={isBackgroundValidating}
                      validationReport={validationReport}
                      backgroundValidationReport={backgroundValidationReport}
                      originalReview={originalReview}
                      onCreatePullRequest={handleCreatePullRequest}
                      isCreatingPR={isCreatingPR}
                      createdPrData={createdPrData}
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

      <PRSuccessModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        prUrl={createdPrData?.prUrl}
        branchName={createdPrData?.branchName}
        repoName={repoName}
        fileName={selectedFileName}
      />
    </div>
  );
}
