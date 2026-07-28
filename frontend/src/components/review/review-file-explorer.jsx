"use client";

import { useState } from "react";
import { ChevronIcon, FileIcon, FolderIcon, RefreshIcon } from "./review-icons";

function TreeNode({ item, depth = 0, onFileSelect, expandedFolders, toggleFolder, activeFile }) {
  const isFolder = item.type === "folder";
  const isExpanded = expandedFolders.has(item.name);
  const isActive = activeFile === item.path;

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(item.name);
    } else if (onFileSelect && item.path) {
      onFileSelect(item.path);
    }
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center justify-between gap-2 rounded-[4px] px-2 py-1.5 text-[12px] transition ${
          isActive ? "bg-[#4b525c] text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isFolder ? (
            <div className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </div>
          ) : (
            <div className="w-3.5" />
          )}
          {isFolder ? (
            <FolderIcon className="h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <FileIcon className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
      </div>
      
      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.name}
              item={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              activeFile={activeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewFileExplorer({ tree = [], repository = { name: "", branch: "" }, onFileSelect, onRefresh, activeFile }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src", "components", "services"]));

  const toggleFolder = (folderName) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-[#141821] border-r border-[#2d333b]">
      <div className="border-b border-[#2d333b] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-slate-400">Repository Explorer</div>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-[#e7ebf3]">
              {repository.name}
            </h2>
            <p className="mt-1 text-[12px] text-slate-400">
              branch: {repository.branch}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Refresh files"
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 pr-2">
        {tree.length > 0 ? (
          <div>
            {tree.map((item) => (
              <TreeNode
                key={item.name}
                item={item}
                onFileSelect={onFileSelect}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                activeFile={activeFile}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-slate-400 shadow-inner">
              <FolderIcon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-slate-300">Workspace Empty</p>
            <p className="mt-1 text-[12px] text-slate-500">
              Select or paste files directly into the editor to begin analysis.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
