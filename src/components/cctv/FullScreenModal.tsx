"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Camera,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  VideoOff,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useWebRtcStream } from "./useWebRtcStream";
import { CameraChannelWithDevice } from "@/lib/cctv/types";

interface FullScreenModalProps {
  channel: CameraChannelWithDevice;
  allChannels: CameraChannelWithDevice[];
  onClose: () => void;
  onNavigate: (nextChannel: CameraChannelWithDevice) => void;
}

export function FullScreenModal({
  channel,
  allChannels,
  onClose,
  onNavigate,
}: FullScreenModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Connect to HD main-stream
  const { videoRef, status, error, reconnect } = useWebRtcStream({
    channelNumber: channel.channelNumber,
    quality: "hd",
    enabled: channel.enabled,
  });

  // Handle keyboard navigation: Esc to close, Arrow keys to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        navigatePrevious();
      } else if (e.key === "ArrowRight") {
        navigateNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channel, allChannels]);

  const currentIndex = allChannels.findIndex((c) => c.id === channel.id);

  const navigatePrevious = () => {
    if (allChannels.length <= 1) return;
    const prevIdx = (currentIndex - 1 + allChannels.length) % allChannels.length;
    onNavigate(allChannels[prevIdx]);
  };

  const navigateNext = () => {
    if (allChannels.length <= 1) return;
    const nextIdx = (currentIndex + 1) % allChannels.length;
    onNavigate(allChannels[nextIdx]);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.href = dataUrl;
        a.download = `cctv_ch${channel.channelNumber}_${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to take video snapshot:", err);
    }
  };

  const toggleTrueFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request denied:", err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-5 py-3 text-slate-100 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-7 items-center justify-center rounded-md bg-indigo-600 px-2 font-mono text-xs font-bold text-white shadow-sm">
              CH {channel.channelNumber.toString().padStart(2, "0")}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{channel.name}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/80 px-2 py-0.5 text-[11px] font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                  <Sparkles className="h-3 w-3 text-indigo-400" /> 1080N HD
                </span>
              </div>
              {channel.location && (
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3 text-slate-500" />
                  {channel.location}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "connected" && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                LIVE STREAMING
              </div>
            )}

            <button
              type="button"
              onClick={takeSnapshot}
              title="Capture Snapshot Image"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                snapshotSuccess
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>{snapshotSuccess ? "Saved!" : "Snapshot"}</span>
            </button>

            <button
              type="button"
              onClick={toggleTrueFullscreen}
              title="Browser Fullscreen"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <Maximize className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Fullscreen (Esc)"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Stage with Left/Right Nav Buttons */}
        <div className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            autoPlay
            playsInline
            muted={isMuted}
          />

          {/* Loading overlay */}
          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent" />
              <span className="mt-3 text-sm font-medium text-indigo-400">
                Opening HD Transcoded Stream...
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Streaming 1080N Dahua RTSP Main-Stream via go2rtc gateway
              </span>
            </div>
          )}

          {/* Error overlay */}
          {status === "failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center">
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-400">
                <VideoOff className="h-8 w-8" />
              </div>
              <span className="mt-3 text-sm font-semibold text-rose-400">
                Unable to Connect HD Stream
              </span>
              <span className="mt-1 max-w-md text-xs text-slate-400">
                {error || "Check DVR reachability and go2rtc gateway"}
              </span>
              <button
                type="button"
                onClick={reconnect}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500"
              >
                <RotateCw className="h-3.5 w-3.5" /> Reconnect HD Stream
              </button>
            </div>
          )}

          {/* Previous / Next Floating Arrows */}
          {allChannels.length > 1 && (
            <>
              <button
                type="button"
                onClick={navigatePrevious}
                title="Previous Camera (Left Arrow)"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/60 p-2.5 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={navigateNext}
                title="Next Camera (Right Arrow)"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/60 p-2.5 text-white/80 backdrop-blur transition hover:bg-black/80 hover:text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Status & Info Bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/90 px-5 py-2.5 text-xs text-slate-400 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="inline-flex items-center gap-1.5 text-slate-300 transition hover:text-white"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-indigo-400" />}
              <span>{isMuted ? "Audio Muted" : "Audio Active"}</span>
            </button>

            <button
              type="button"
              onClick={reconnect}
              className="inline-flex items-center gap-1 text-slate-400 transition hover:text-slate-200"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Reload Stream</span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span>DVR: {channel.cameraDevice.host}</span>
            <span>•</span>
            <span>RTSP 554</span>
            {channel.cameraDevice.networkDevice && (
              <>
                <span>•</span>
                <span className="text-indigo-400">
                  {channel.cameraDevice.networkDevice.name}
                  {channel.cameraDevice.networkDevice.incomingConnections?.[0] &&
                    ` (Port ${channel.cameraDevice.networkDevice.incomingConnections[0].fromPort})`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
