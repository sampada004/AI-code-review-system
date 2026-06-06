"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { EditorPlaceholder } from "./EditorPlaceholder";
import { RepositoryExplorerDrawer } from "./repository-explorer-drawer";
import { ReviewBottomBar } from "./review-bottom-bar";
import { ReviewFixesPanel } from "./review-fixes-panel";

const STORAGE_KEYS = {
  sidebarCollapsed: "codepilot.review.sidebarCollapsed",
  editorWidth: "codepilot.review.editorWidth",
  fixesCollapsed: "codepilot.review.fixesCollapsed",
};

const MIN_EDITOR_WIDTH = 640;
const MAX_EDITOR_WIDTH = 1280;
const DEFAULT_EDITOR_WIDTH = 900;
const FIXES_EXPANDED_WIDTH = 360;
const FIXES_COLLAPSED_WIDTH = 56;
const SIDEBAR_COLLAPSED_WIDTH = 70;
const SIDEBAR_EXPANDED_WIDTH = 240;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function ReviewWorkspace() {
  const workspaceRef = useRef(null);
  const dragStateRef = useRef({ startX: 0, startWidth: DEFAULT_EDITOR_WIDTH });
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFixesCollapsed, setIsFixesCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    try {
      const storedSidebar = window.localStorage.getItem(STORAGE_KEYS.sidebarCollapsed);
      const storedEditorWidth = window.localStorage.getItem(STORAGE_KEYS.editorWidth);
      const storedFixesCollapsed = window.localStorage.getItem(STORAGE_KEYS.fixesCollapsed);

      if (storedSidebar != null) {
        setIsSidebarCollapsed(storedSidebar === "true");
      }

      if (storedEditorWidth != null) {
        setEditorWidth(Number(storedEditorWidth) || DEFAULT_EDITOR_WIDTH);
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
      window.localStorage.setItem(STORAGE_KEYS.editorWidth, String(editorWidth));
    } catch {
      // Ignore storage access issues.
    }
  }, [editorWidth, isHydrated]);

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
      const availableWidth = Math.max(
        0,
        workspaceWidth - (isFixesCollapsed ? FIXES_COLLAPSED_WIDTH : FIXES_EXPANDED_WIDTH) - 24
      );
      const nextWidth = clamp(
        event.clientX - dragStateRef.current.startX + dragStateRef.current.startWidth,
        MIN_EDITOR_WIDTH,
        Math.min(MAX_EDITOR_WIDTH, availableWidth || MAX_EDITOR_WIDTH)
      );

      setEditorWidth(nextWidth);
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
  }, [isFixesCollapsed, isResizing, workspaceWidth]);

  const sidebarWidth = isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  const editorStyle = useMemo(
    () =>
      isFixesCollapsed
        ? {
            flex: "1 1 0%",
            width: "100%",
            minWidth: 0,
          }
        : {
            flex: `0 0 min(${editorWidth}px, 100%)`,
            width: `min(${editorWidth}px, 100%)`,
            minWidth: `min(${MIN_EDITOR_WIDTH}px, 100%)`,
            maxWidth: `min(${MAX_EDITOR_WIDTH}px, calc(100% - ${FIXES_EXPANDED_WIDTH}px - 24px))`,
          },
    [editorWidth, isFixesCollapsed]
  );

  const beginResize = (event) => {
    if (isFixesCollapsed) {
      return;
    }

    event.preventDefault();
    setIsResizing(true);
    dragStateRef.current = {
      startX: event.clientX,
      startWidth: editorWidth,
    };
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100">
      <DashboardSidebar
        activeItem="Reviews"
        collapsed={isSidebarCollapsed}
        workspaceMode
        mobileOpen={isMobileSidebarOpen}
      />

      <RepositoryExplorerDrawer open={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} />

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
          onToggleSidebar={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setIsMobileSidebarOpen((value) => !value);
              return;
            }

            setIsSidebarCollapsed((value) => !value);
          }}
          onToggleRepositoryExplorer={() => setIsExplorerOpen((value) => !value)}
        />

        <main className="min-h-[calc(100vh-64px)] pb-24">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div ref={workspaceRef} className="mx-auto max-w-[1700px]">
              <div className="flex min-h-[calc(100vh-180px)] flex-col gap-4 xl:flex-row">
                <div
                  className="relative min-w-0 min-h-0 transition-[flex-basis,width] duration-300 ease-out"
                  style={editorStyle}
                >
                  <EditorPlaceholder />

                  {!isFixesCollapsed ? (
                    <button
                      type="button"
                      aria-label="Resize editor"
                      onPointerDown={beginResize}
                      className="absolute right-[-8px] top-0 z-20 hidden h-full w-4 cursor-col-resize xl:block"
                    >
                      <span className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/10 transition" />
                    </button>
                  ) : null}
                </div>

                <div className="min-h-0 shrink-0 transition-[width] duration-300 ease-out">
                  <ReviewFixesPanel
                    collapsed={isFixesCollapsed}
                    onToggleCollapse={() => setIsFixesCollapsed((value) => !value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ReviewBottomBar />
    </div>
  );
}
