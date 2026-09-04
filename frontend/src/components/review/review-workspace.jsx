"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { MultiFilePRModal } from "./multi-file-pr-modal";
import { apiUrl } from "@/lib/api";

const STORAGE_KEYS = {
  sidebarCollapsed: "inspectra.review.sidebarCollapsed",
  fixesWidth: "inspectra.review.fixesWidth",
  fixesCollapsed: "inspectra.review.fixesCollapsed",
  explorerOpen: "inspectra.review.explorerOpen",
  explorerWidth: "inspectra.review.explorerWidth",
  lastRepo: "inspectra.lastRepo",
  lastFilePrefix: "inspectra.lastFile_",
  draftPrefix: "inspectra.draft_",
  reviewSessionPrefix: "inspectra.reviewSession_"
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
    case "json":
      return "json";
    default:
      return "plaintext";
  }
}

export function ReviewWorkspace() {
  const router = useRouter();
  const workspaceRef = useRef(null);
  const dragStateRef = useRef({ startX: 0, startWidth: DEFAULT_EDITOR_WIDTH });
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFixesCollapsed, setIsFixesCollapsed] = useState(true);
  const [analysisState, setAnalysisState] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [findings, setFindings] = useState([]);
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [overallSeverity, setOverallSeverity] = useState("none");
  const [selectedFindingIndex, setSelectedFindingIndex] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState(new Set());
  const [analyzedFileNameForReview, setAnalyzedFileNameForReview] = useState("");
  const [analyzedCodeForActiveFile, setAnalyzedCodeForActiveFile] = useState("");
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
  const [isMultiPRModalOpen, setIsMultiPRModalOpen] = useState(false);
  const [multiPRInitialMode, setMultiPRInitialMode] = useState("single");
  
  // Repository State
  const searchParams = useSearchParams();
  const paramRepoId = searchParams?.get("repoId");
  const paramRepoName = searchParams?.get("name");
  const paramRepoBranch = searchParams?.get("branch") || "main";
  const paramRepoUrl = searchParams?.get("url") || "";
  const paramFile = searchParams?.get("file");
  const paramReviewId = searchParams?.get("reviewId");
  const paramAutoAnalyze = searchParams?.get("autoAnalyze");

  const [repoId, setRepoId] = useState(paramRepoId || null);
  const [repoName, setRepoName] = useState(paramRepoName || "Select a repository");
  const [repoBranch, setRepoBranch] = useState(paramRepoBranch || "main");
  const [repoUrl, setRepoUrl] = useState(paramRepoUrl || "");

  // Sync state if searchParams change
  useEffect(() => {
    if (paramRepoId) {
      setRepoId(paramRepoId);
      setRepoName(paramRepoName || "Select a repository");
      setRepoBranch(paramRepoBranch || "main");
      setRepoUrl(paramRepoUrl || "");
    }
  }, [paramRepoId, paramRepoName, paramRepoBranch, paramRepoUrl]);

  // Restore last repository if URL is empty on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!paramRepoId) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.lastRepo) || window.localStorage.getItem("codepilot.lastRepo");
        if (stored) {
          const repo = JSON.parse(stored);
          if (repo && repo.id) {
            const lastFile = window.localStorage.getItem(STORAGE_KEYS.lastFilePrefix + repo.id) || "";
            const fileQuery = lastFile ? `&file=${encodeURIComponent(lastFile)}` : "";
            const newUrl = `/reviews?repoId=${repo.id}&name=${encodeURIComponent(repo.name || "")}&url=${encodeURIComponent(repo.url || "")}&branch=${encodeURIComponent(repo.branch || "main")}${fileQuery}`;
            router.replace(newUrl);
            setRepoId(repo.id);
            setRepoName(repo.name || "Select a repository");
            setRepoBranch(repo.branch || "main");
            setRepoUrl(repo.url || "");
          }
        }
      } catch (e) {
        // ignore
      }
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEYS.lastRepo, JSON.stringify({
          id: paramRepoId,
          name: paramRepoName || "",
          url: paramRepoUrl || "",
          branch: paramRepoBranch || "main"
        }));
      } catch (e) {}
    }
  }, [paramRepoId, paramRepoName, paramRepoUrl, paramRepoBranch, router]);
  
  const [isFetchingWorkspace, setIsFetchingWorkspace] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [repoTree, setRepoTree] = useState([]);
  const [repoFiles, setRepoFiles] = useState({});
  const [projectContext, setProjectContext] = useState(null);
  const [isDetectingContext, setIsDetectingContext] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(paramFile || "");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [fixesWidth, setFixesWidth] = useState(FIXES_EXPANDED_WIDTH);
  const [explorerWidth, setExplorerWidth] = useState(240);
  const [layoutTick, setLayoutTick] = useState(0);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isExplorerResizing, setIsExplorerResizing] = useState(false);
  const explorerDragRef = useRef({ startX: 0, startWidth: 240 });
  const [isHydrated, setIsHydrated] = useState(false);
  const [fileStatusMap, setFileStatusMap] = useState({});

  // Scan and refresh analyzed file status map for all repository files
  const refreshFileStatusMap = useCallback(() => {
    if (!repoId || typeof window === "undefined") return;
    try {
      const prefix = `${STORAGE_KEYS.reviewSessionPrefix}${repoId}_`;
      const draftPrefix = `${STORAGE_KEYS.draftPrefix}${repoId}_`;
      const newMap = {};

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const filePath = key.substring(prefix.length);
          try {
            const session = JSON.parse(window.localStorage.getItem(key));
            if (session && session.analysisState === "completed" && session.fileName === filePath) {
              const draft = window.localStorage.getItem(`${draftPrefix}${filePath}`);
              let hasChanges = false;
              if (draft != null && session.analyzedCode != null) {
                hasChanges = draft.trim() !== session.analyzedCode.trim();
              }
              newMap[filePath] = {
                isAnalyzed: true,
                hasChanges,
                findingsCount: session.findings?.length || 0,
                severity: session.overallSeverity || "none"
              };
            }
          } catch (e) {}
        }
      }
      setFileStatusMap(newMap);
    } catch (e) {}
  }, [repoId]);

  // Hydrate layout preferences from localStorage
  useEffect(() => {
    setIsHydrated(true);

    try {
      const storedSidebar = window.localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
      const storedFixesWidth = window.localStorage.getItem(STORAGE_KEYS.fixesWidth);
      const storedFixesCollapsed = window.localStorage.getItem(STORAGE_KEYS.fixesCollapsed);
      const storedExplorerOpen = window.localStorage.getItem(STORAGE_KEYS.explorerOpen);
      const storedExplorerWidth = window.localStorage.getItem(STORAGE_KEYS.explorerWidth);

      if (storedSidebar != null) setIsSidebarCollapsed(storedSidebar === "true");
      if (storedFixesWidth != null) setFixesWidth(Number(storedFixesWidth) || FIXES_EXPANDED_WIDTH);
      if (storedFixesCollapsed != null) setIsFixesCollapsed(storedFixesCollapsed === "true");
      if (storedExplorerOpen != null) setIsExplorerOpen(storedExplorerOpen === "true");
      if (storedExplorerWidth != null) setExplorerWidth(Number(storedExplorerWidth) || 240);
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  // Persist layout preferences
  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(isSidebarCollapsed));
      window.localStorage.setItem(STORAGE_KEYS.fixesWidth, String(fixesWidth));
      window.localStorage.setItem(STORAGE_KEYS.fixesCollapsed, String(isFixesCollapsed));
      window.localStorage.setItem(STORAGE_KEYS.explorerOpen, String(isExplorerOpen));
      window.localStorage.setItem(STORAGE_KEYS.explorerWidth, String(explorerWidth));
    } catch {
      // Ignore storage access issues.
    }
  }, [isHydrated, isSidebarCollapsed, fixesWidth, isFixesCollapsed, isExplorerOpen, explorerWidth]);

  useEffect(() => {
    if (!workspaceRef.current) return undefined;
    const updateWorkspaceWidth = () => {
      const rect = workspaceRef.current?.getBoundingClientRect();
      setWorkspaceWidth(rect?.width || 0);
    };
    updateWorkspaceWidth();
    const observer = new ResizeObserver(updateWorkspaceWidth);
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, []);

  // Save active review session state per file
  const saveReviewSession = useCallback((file, currentFindings, currentSummary, currentSeverity, state, appliedSet, origReview, valReport, prData, collapsed, code) => {
    if (!repoId || !file || typeof window === "undefined") return;
    if (state !== "completed") return; // DO NOT SAVE IDLE OR EMPTY SESSIONS
    try {
      const sessionData = {
        fileName: file,
        analysisState: "completed",
        findings: currentFindings || [],
        analysisSummary: currentSummary || "",
        overallSeverity: currentSeverity || "none",
        selectedFindingIndex,
        appliedFixes: Array.from(appliedSet || []),
        originalReview: origReview,
        validationReport: valReport,
        createdPrData: prData,
        isFixesCollapsed: collapsed,
        analyzedCode: code !== undefined ? code : analyzedCodeForActiveFile,
        savedAt: Date.now()
      };
      window.localStorage.setItem(
        `${STORAGE_KEYS.reviewSessionPrefix}${repoId}_${file}`,
        JSON.stringify(sessionData)
      );
      refreshFileStatusMap();
    } catch (e) {}
  }, [repoId, selectedFindingIndex, analyzedCodeForActiveFile, refreshFileStatusMap]);

  // Restore review session state for a file
  const restoreReviewSession = useCallback((file) => {
    if (!repoId || !file || typeof window === "undefined") return false;
    try {
      const stored = window.localStorage.getItem(`${STORAGE_KEYS.reviewSessionPrefix}${repoId}_${file}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.analysisState === "completed" && data.fileName === file) {
          setAnalysisState("completed");
          setAnalyzedFileNameForReview(file);
          setFindings(data.findings || []);
          setAnalysisSummary(data.analysisSummary || "");
          setOverallSeverity(data.overallSeverity || "none");
          setSelectedFindingIndex(data.selectedFindingIndex ?? (data.findings && data.findings.length > 0 ? 0 : null));
          setAppliedFixes(new Set(data.appliedFixes || []));
          setOriginalReview(data.originalReview || null);
          setValidationReport(data.validationReport || null);
          setCreatedPrData(data.createdPrData || null);
          setAnalyzedCodeForActiveFile(data.analyzedCode || "");
          
          if (data.findings && data.findings.length > 0) {
            setIsFixesCollapsed(false); // ALWAYS show panel when unresolved bugs exist
          } else {
            setIsFixesCollapsed(data.isFixesCollapsed !== undefined ? data.isFixesCollapsed : true);
          }
          return true;
        }
      }
    } catch (e) {}
    return false;
  }, [repoId]);

  // Helper to update URL with active file without full navigation
  const updateUrlWithFile = useCallback((fileName) => {
    if (typeof window === "undefined" || !fileName) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("file", fileName);
      window.history.replaceState(null, "", url.toString());
    } catch (e) {}
  }, []);

  // Handle editor code modifications & autosave draft
  const handleContentChange = useCallback((newContent) => {
    if (newContent == null) return;
    setSelectedFileContent(newContent);
    if (selectedFileName && repoId && typeof window !== "undefined") {
      setRepoFiles((prev) => ({ ...prev, [selectedFileName]: newContent }));
      try {
        window.localStorage.setItem(`${STORAGE_KEYS.draftPrefix}${repoId}_${selectedFileName}`, newContent);
      } catch (e) {}
      refreshFileStatusMap();
    }
  }, [selectedFileName, repoId, refreshFileStatusMap]);

  // Determine if active file is analyzed and whether it has unanalyzed changes
  const isCurrentFileAnalyzed = useMemo(() => {
    return analysisState === "completed" && analyzedFileNameForReview === selectedFileName && Boolean(selectedFileName);
  }, [analysisState, analyzedFileNameForReview, selectedFileName]);

  const hasUnanalyzedChanges = useMemo(() => {
    if (!isCurrentFileAnalyzed || !analyzedCodeForActiveFile) return false;
    return (selectedFileContent || "").trim() !== analyzedCodeForActiveFile.trim();
  }, [isCurrentFileAnalyzed, analyzedCodeForActiveFile, selectedFileContent]);

  useEffect(() => {
    if (!isResizing) return undefined;
    const handlePointerMove = (event) => {
      const deltaX = dragStateRef.current.startX - event.clientX;
      const nextWidth = clamp(dragStateRef.current.startWidth + deltaX, 260, 600);
      setFixesWidth(nextWidth);
    };
    const handlePointerUp = () => setIsResizing(false);
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
            setAnalyzedCodeForActiveFile(selectedFileContent);
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
    if (!isExplorerResizing) return undefined;
    const handlePointerMove = (event) => {
      const nextWidth = clamp(
        event.clientX - explorerDragRef.current.startX + explorerDragRef.current.startWidth,
        200,
        600
      );
      setExplorerWidth(nextWidth);
    };
    const handlePointerUp = () => setIsExplorerResizing(false);
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

  const sidebarWidth = SIDEBAR_COLLAPSED_WIDTH;

  // Load Repository Tree and Initial Active File
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
        
        // Determine file to select: URL param > localStorage lastFile > firstFile
        const paths = Object.keys(data.files || {});
        let targetFile = paramFile;

        if (!targetFile && typeof window !== "undefined") {
          targetFile = window.localStorage.getItem(`${STORAGE_KEYS.lastFilePrefix}${repoId}`);
        }

        if (!targetFile || !paths.includes(targetFile)) {
          targetFile = paths.length > 0 ? paths[0] : "";
        }

        if (targetFile) {
          setSelectedFileName(targetFile);
          updateUrlWithFile(targetFile);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(`${STORAGE_KEYS.lastFilePrefix}${repoId}`, targetFile);
          }

          // Check if there is an unsaved draft in localStorage
          let savedDraft = null;
          try {
            savedDraft = window.localStorage.getItem(`${STORAGE_KEYS.draftPrefix}${repoId}_${targetFile}`);
          } catch (e) {}

          if (savedDraft != null) {
            setSelectedFileContent(savedDraft);
            setRepoFiles(prev => ({ ...prev, [targetFile]: savedDraft }));
          } else if (repoId) {
            setSelectedFileContent("// Fetching file contents from workspace...\n");
            const rawUrl = apiUrl(`/repositories/${repoId}/file?path=${encodeURIComponent(targetFile)}&branch=${encodeURIComponent(repoBranch || 'main')}`);
            fetch(rawUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
              .then(res => res.ok ? res.text() : Promise.reject(new Error(`Failed to fetch (${res.status})`)))
              .then(text => {
                if (!mounted) return;
                setRepoFiles(prev => ({ ...prev, [targetFile]: text }));
                setSelectedFileContent(text);
              })
              .catch(e => {
                if (!mounted) return;
                setSelectedFileContent(`// Error fetching file: ${e.message}\n\n${data.files[targetFile] || ""}`);
              });
          } else {
            setSelectedFileContent(data.files[targetFile] || "");
          }

          // 1. Restore local review session if one exists for targetFile
          restoreReviewSession(targetFile);
        } else {
          setSelectedFileName("");
          setSelectedFileContent("");
        }

        refreshFileStatusMap();
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
  }, [repoId, repoUrl, repoBranch, paramFile]);

  // Handle switching active file
  async function handleFileSelect(name) {
    if (name === selectedFileName) return;

    // Reset active review state immediately so previous file's analysis doesn't bleed into new file
    setAnalysisState("idle");
    setStatusMessage("");
    setFindings([]);
    setAnalysisSummary("");
    setOverallSeverity("none");
    setSelectedFindingIndex(null);
    setAppliedFixes(new Set());
    setOriginalReview(null);
    setValidationReport(null);
    setBackgroundValidationReport(null);
    setCreatedPrData(null);
    setIsPRModalOpen(false);
    setAnalyzedCodeForActiveFile("");
    setAnalyzedFileNameForReview("");
    setIsFixesCollapsed(true);

    setSelectedFileName(name);
    updateUrlWithFile(name);

    if (typeof window !== "undefined" && repoId) {
      try {
        window.localStorage.setItem(`${STORAGE_KEYS.lastFilePrefix}${repoId}`, name);
      } catch (e) {}
    }

    // Check draft first
    let savedDraft = null;
    try {
      if (typeof window !== "undefined" && repoId) {
        savedDraft = window.localStorage.getItem(`${STORAGE_KEYS.draftPrefix}${repoId}_${name}`);
      }
    } catch (e) {}

    if (savedDraft != null) {
      setSelectedFileContent(savedDraft);
    } else {
      const existingContent = repoFiles[name];
      if (existingContent && !existingContent.startsWith("/* \n * File:") && !existingContent.startsWith("// Fetching")) {
        setSelectedFileContent(existingContent);
      } else if (repoId) {
        setSelectedFileContent("// Fetching file contents from workspace...\n");
        try {
          let token = null;
          try { token = window.localStorage.getItem("auth_token"); } catch (e) {}
          const rawUrl = apiUrl(`/repositories/${repoId}/file?path=${encodeURIComponent(name)}&branch=${encodeURIComponent(repoBranch || 'main')}`);
          const res = await fetch(rawUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (res.ok) {
            const text = await res.text();
            setRepoFiles((prev) => ({ ...prev, [name]: text }));
            setSelectedFileContent(text);
          }
        } catch (e) {}
      }
    }

    // Attempt restoring review session for this file (only if it was analyzed previously in this workspace)
    restoreReviewSession(name);
  }

  function handleRefreshFiles() {
    setSelectedFileContent((prev) => prev);
  }

  const handleIgnoreFix = (idx) => {
    setFindings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ignored: true };

      if (analysisState === "completed" && analyzedFileNameForReview === selectedFileName) {
        saveReviewSession(
          selectedFileName,
          next,
          analysisSummary,
          overallSeverity,
          "completed",
          appliedFixes,
          originalReview,
          validationReport,
          createdPrData,
          isFixesCollapsed,
          analyzedCodeForActiveFile
        );
      }

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
    if (isFixesCollapsed) return;
    event.preventDefault();
    setIsResizing(true);
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: fixesWidth,
    };
  };

  const handleAnalyze = async ({ sourceCode, language, isRevalidation = false, isBackground = false } = {}) => {
    if (!isBackground) {
      setStatusMessage("");
      setAnalysisState("analyzing");
      setFindings([]);
      setValidationReport(null);
      if (!isRevalidation) {
        setCreatedPrData(null);
        setIsPRModalOpen(false);
      }
      if (isRevalidation) setIsRevalidating(true);
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

      const { analysis } = data;
      const newFindings = analysis?.findings || [];
      
      if (isRevalidation && originalReview) {
        const resolved = [];
        const remaining = [];
        const newIssues = [];
        
        originalReview.findings.forEach(orig => {
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
        
        const rep = {
          status,
          resolved,
          remaining,
          newIssues,
          severityBefore: originalReview.overallSeverity,
          severityAfter: analysis?.overallSeverity || "none"
        };

        if (isBackground) {
          setBackgroundValidationReport(rep);
        } else {
          setValidationReport(rep);
        }
      } else {
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
        setSelectedFindingIndex(newFindings.length > 0 ? 0 : null);
        setAppliedFixes(new Set());
        setAnalyzedCodeForActiveFile(payload.sourceCode);
        setAnalyzedFileNameForReview(payload.fileName);
        
        setStatusMessage(isRevalidation ? "Re-validation completed" : "Review completed successfully");
        setAnalysisState("completed");
        if (isRevalidation) setIsRevalidating(false);
        setIsFixesCollapsed(false);

        // Explicitly persist review session with analyzedCode
        saveReviewSession(
          payload.fileName,
          newFindings,
          analysis?.summary || "Analysis completed.",
          analysis?.overallSeverity || "none",
          "completed",
          new Set(),
          isRevalidation && originalReview ? originalReview : {
            findings: newFindings,
            summary: analysis?.summary || "",
            overallSeverity: analysis?.overallSeverity || "none"
          },
          validationReport,
          createdPrData,
          false,
          payload.sourceCode
        );
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
    if (isRevalidating || analysisState === "analyzing" || isBackgroundValidating) return;

    const timer = setTimeout(() => {
      let source = editorRef.current ? editorRef.current.getValue() : "";
      const language = getLanguageFromFilename(selectedFileName);
      handleAnalyze({ sourceCode: source, language, isRevalidation: true, isBackground: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [appliedFixes]);

  // Compute all modified files across active editor, drafts, and stored sessions
  const allModifiedFiles = useMemo(() => {
    if (!repoId || typeof window === "undefined") return [];
    const modifiedList = [];
    const seenPaths = new Set();
    const prefix = `${STORAGE_KEYS.reviewSessionPrefix}${repoId}_`;
    const draftPrefix = `${STORAGE_KEYS.draftPrefix}${repoId}_`;

    // 1. Current active file in editor
    if (selectedFileName) {
      const activeContent = editorRef.current ? editorRef.current.getValue() : selectedFileContent;
      let hasFixes = appliedFixes.size > 0;
      let isAnalyzed = analysisState === "completed" && analyzedFileNameForReview === selectedFileName;
      
      const origContent = repoFiles[selectedFileName];
      const hasContentChanges = activeContent && origContent != null && activeContent.trim() !== origContent.trim();
      
      // A file is ONLY modified if it has content changes compared to original repo code or has active applied fixes
      if (hasContentChanges || hasFixes) {
        modifiedList.push({
          path: selectedFileName,
          content: activeContent || "",
          isAnalyzed,
          hasAppliedFixes: hasFixes,
          findingsCount: findings.length
        });
        seenPaths.add(selectedFileName);
      }
    }

    // 2. Scan all stored sessions and drafts for other files
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const filePath = key.substring(prefix.length);
          if (!seenPaths.has(filePath)) {
            try {
              const session = JSON.parse(window.localStorage.getItem(key));
              const draft = window.localStorage.getItem(`${draftPrefix}${filePath}`);
              const orig = repoFiles[filePath];
              const fileContent = draft != null ? draft : (session?.analyzedCode || orig || "");
              const hasApplied = (session?.appliedFixes?.length || 0) > 0;
              const hasDraftChange = draft != null && orig != null && draft.trim() !== orig.trim();
              const hasCodeChange = session?.analyzedCode != null && orig != null && session.analyzedCode.trim() !== orig.trim();

              if (hasApplied || hasDraftChange || hasCodeChange) {
                modifiedList.push({
                  path: filePath,
                  content: fileContent,
                  isAnalyzed: session?.analysisState === "completed" && session?.fileName === filePath,
                  hasAppliedFixes: hasApplied,
                  findingsCount: session?.findings?.length || 0
                });
                seenPaths.add(filePath);
              }
            } catch (e) {}
          }
        } else if (key && key.startsWith(draftPrefix)) {
          const filePath = key.substring(draftPrefix.length);
          if (!seenPaths.has(filePath)) {
            const draft = window.localStorage.getItem(key);
            const orig = repoFiles[filePath];
            if (draft != null && orig != null && draft.trim() !== orig.trim()) {
              modifiedList.push({
                path: filePath,
                content: draft,
                isAnalyzed: false,
                hasAppliedFixes: false,
                findingsCount: 0
              });
              seenPaths.add(filePath);
            }
          }
        }
      }
    } catch (e) {}

    return modifiedList;
  }, [repoId, selectedFileName, selectedFileContent, appliedFixes, analysisState, analyzedFileNameForReview, findings, repoFiles, fileStatusMap]);

  const handleOpenPRModal = (mode = "single") => {
    setMultiPRInitialMode(mode);
    setIsMultiPRModalOpen(true);
  };

  const handleSubmitPR = async ({ isMulti, filePath, newContent, files, title, body, branch, customBranchName }) => {
    if (!repoId) return;
    
    setIsCreatingPR(true);
    try {
      let token = window.localStorage.getItem("auth_token");
      
      const payload = {
        title,
        body,
        branch: branch || repoBranch,
        customBranchName
      };

      if (isMulti && Array.isArray(files) && files.length > 0) {
        payload.files = files;
      } else {
        payload.filePath = filePath || selectedFileName;
        payload.newContent = newContent != null ? newContent : (editorRef.current ? editorRef.current.getValue() : selectedFileContent);
      }

      const response = await fetch(apiUrl(`/repositories/${repoId}/pull-request`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create Pull Request");
      }

      const prData = {
        prUrl: data.pullRequest?.prUrl || data.pullRequest?.url || "#",
        branchName: data.pullRequest?.branchName || repoBranch,
        files: data.pullRequest?.files || (payload.filePath ? [payload.filePath] : [])
      };
      setCreatedPrData(prData);
      setIsMultiPRModalOpen(false);
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
                fileStatusMap={fileStatusMap}
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
                        isAnalyzed={isCurrentFileAnalyzed}
                        hasUnanalyzedChanges={hasUnanalyzedChanges}
                        onAnalyze={handleAnalyze}
                        layoutTrigger={layoutTick}
                        statusMessage={statusMessage}
                        fileName={selectedFileName}
                        fileContent={selectedFileContent}
                        repoName={repoName}
                        repoBranch={repoBranch}
                        onRefreshFiles={handleRefreshFiles}
                        onContentChange={handleContentChange}
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
                        setAppliedFixes(prev => {
                          const next = new Set(prev).add(idx);
                          if (analysisState === "completed" && analyzedFileNameForReview === selectedFileName) {
                            saveReviewSession(
                              selectedFileName,
                              findings,
                              analysisSummary,
                              overallSeverity,
                              "completed",
                              next,
                              originalReview,
                              validationReport,
                              createdPrData,
                              isFixesCollapsed,
                              analyzedCodeForActiveFile
                            );
                          }
                          return next;
                        });
                      }}
                      onUndoFix={(idx) => {
                        editorRef.current?.undoFix(idx);
                        setAppliedFixes(prev => {
                          const next = new Set(prev);
                          next.delete(idx);
                          if (analysisState === "completed" && analyzedFileNameForReview === selectedFileName) {
                            saveReviewSession(
                              selectedFileName,
                              findings,
                              analysisSummary,
                              overallSeverity,
                              "completed",
                              next,
                              originalReview,
                              validationReport,
                              createdPrData,
                              isFixesCollapsed,
                              analyzedCodeForActiveFile
                            );
                          }
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
                      onCreatePullRequest={() => handleOpenPRModal("single")}
                      onOpenMultiFilePR={() => handleOpenPRModal("multi")}
                      modifiedFilesCount={allModifiedFiles.length}
                      onReanalyze={() => {
                        let source = editorRef.current ? editorRef.current.getValue() : selectedFileContent;
                        const language = getLanguageFromFilename(selectedFileName);
                        handleAnalyze({ sourceCode: source, language });
                      }}
                      isAnalyzing={analysisState === "analyzing"}
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
                        modifiedFilesCount={allModifiedFiles.length}
                        onOpenMultiFilePR={() => handleOpenPRModal("multi")}
                        onOpenSingleFilePR={() => handleOpenPRModal("single")}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <MultiFilePRModal
        isOpen={isMultiPRModalOpen}
        onClose={() => setIsMultiPRModalOpen(false)}
        repoName={repoName}
        repoBranch={repoBranch}
        currentFileName={selectedFileName}
        currentFileContent={editorRef.current ? editorRef.current.getValue() : selectedFileContent}
        allModifiedFiles={allModifiedFiles}
        onSubmitPR={handleSubmitPR}
        isCreatingPR={isCreatingPR}
        initialMode={multiPRInitialMode}
      />

      <PRSuccessModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        prUrl={createdPrData?.prUrl}
        branchName={createdPrData?.branchName}
        repoName={repoName}
        fileName={selectedFileName}
        files={createdPrData?.files}
      />
    </div>
  );
}
