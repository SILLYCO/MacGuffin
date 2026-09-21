"use client";

import React, { useState, useMemo } from "react";
import {
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Square,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { CameraChannelWithDevice } from "@/lib/cctv/types";
import { CameraTile } from "./CameraTile";
import { FullScreenModal } from "./FullScreenModal";

type GridLayout = "1x1" | "2x2" | "3x3" | "4x4";

interface LiveCameraGridProps {
  channels: CameraChannelWithDevice[];
}

export function LiveCameraGrid({ channels }: LiveCameraGridProps) {
  const [layout, setLayout] = useState<GridLayout>("4x4");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullScreenChannel, setFullScreenChannel] = useState<CameraChannelWithDevice | null>(null);

  // Filter channels by name or location
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        `ch${c.channelNumber}`.includes(q) ||
        c.channelNumber.toString() === q
    );
  }, [channels, searchQuery]);

  // Determine items per page based on layout
  const pageSize = useMemo(() => {
    switch (layout) {
      case "1x1":
        return 1;
      case "2x2":
        return 4;
      case "3x3":
        return 9;
      case "4x4":
      default:
        return 16;
    }
  }, [layout]);

  const totalPages = Math.max(1, Math.ceil(filteredChannels.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const displayedChannels = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredChannels.slice(start, start + pageSize);
  }, [filteredChannels, currentPage, pageSize]);

  const getGridColsClass = () => {
    switch (layout) {
      case "1x1":
        return "grid-cols-1 max-w-4xl mx-auto";
      case "2x2":
        return "grid-cols-1 sm:grid-cols-2";
      case "3x3":
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "4x4":
      default:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur md:flex-row md:items-center md:justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search camera by name, location, or channel #..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Layout Switcher & Pagination */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout buttons */}
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-950/70 p-0.5">
            <button
              type="button"
              onClick={() => {
                setLayout("1x1");
                setPage(0);
              }}
              title="1x1 Single Focus"
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                layout === "1x1"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Square className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout("2x2");
                setPage(0);
              }}
              title="2x2 Quad Grid (4 Cameras)"
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                layout === "2x2"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout("3x3");
                setPage(0);
              }}
              title="3x3 Grid (9 Cameras)"
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                layout === "3x3"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout("4x4");
                setPage(0);
              }}
              title="4x4 Full 16-Channel Fleet"
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                layout === "4x4"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pager */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded p-0.5 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-[11px]">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="rounded p-0.5 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Camera Tiles */}
      {displayedChannels.length > 0 ? (
        <div className={`grid gap-3.5 ${getGridColsClass()}`}>
          {displayedChannels.map((ch, idx) => (
            <CameraTile
              key={ch.id}
              channel={ch}
              onSelectFullScreen={(selected) => setFullScreenChannel(selected)}
              isPriority={idx < 4}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">
          <Filter className="mb-3 h-10 w-10 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-300">No cameras matched</h3>
          <p className="mt-1 text-xs text-slate-500">
            No camera found matching &quot;{searchQuery}&quot;. Try a different search term.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Full-Screen HD Modal */}
      {fullScreenChannel && (
        <FullScreenModal
          channel={fullScreenChannel}
          allChannels={channels}
          onClose={() => setFullScreenChannel(null)}
          onNavigate={(next) => setFullScreenChannel(next)}
        />
      )}
    </div>
  );
}
