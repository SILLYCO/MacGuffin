"use client";

import React, { useState, useRef, useEffect } from "react";
import { Maximize2, Volume2, VolumeX, RotateCw, Video, VideoOff, Wifi, MapPin } from "lucide-react";
import { useWebRtcStream } from "./useWebRtcStream";
import { CameraChannelWithDevice } from "@/lib/cctv/types";

interface CameraTileProps {
  channel: CameraChannelWithDevice;
  onSelectFullScreen?: (channel: CameraChannelWithDevice) => void;
  isPriority?: boolean; // If true, stream connects immediately without waiting for intersection
}

export function CameraTile({
  channel,
  onSelectFullScreen,
  isPriority = false,
}: CameraTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(isPriority);
  const [isMuted, setIsMuted] = useState(true);

  // Lazy load stream: only connect if tile is visible in the viewport
  useEffect(() => {
    if (isPriority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isPriority]);

  const { videoRef, status, error, reconnect } = useWebRtcStream({
    channelNumber: channel.channelNumber,
    quality: "sub",
    enabled: channel.enabled && isVisible,
  });

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <div
      ref={containerRef}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-lg backdrop-blur transition-all duration-200 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Video Display */}
      <div className="relative h-full w-full bg-slate-950">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted={isMuted}
        />

        {/* Video Overlay states */}
        {!channel.enabled ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center">
            <VideoOff className="mb-2 h-8 w-8 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">Channel Disabled</span>
            <span className="text-[10px] text-slate-600">Activate in camera settings</span>
          </div>
        ) : !isVisible ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 p-4">
            <Video className="h-6 w-6 animate-pulse text-slate-600" />
          </div>
        ) : status === "connecting" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="mt-2 text-[11px] font-medium text-indigo-400">
              Connecting stream...
            </span>
          </div>
        ) : status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center">
            <div className="rounded-full bg-rose-500/10 p-2 text-rose-400">
              <VideoOff className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-rose-400">Offline / No Signal</span>
            <span className="mt-1 line-clamp-2 max-w-[200px] text-[10px] text-slate-500">
              {error || "Stream unavailable"}
            </span>
            <button
              type="button"
              onClick={reconnect}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <RotateCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}

        {/* Top bar info overlay */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 items-center justify-center rounded bg-indigo-600/90 px-1.5 font-mono text-[10px] font-bold text-white shadow-sm">
              CH {channel.channelNumber.toString().padStart(2, "0")}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200 drop-shadow-sm line-clamp-1">
                {channel.name}
              </span>
              {channel.location && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <MapPin className="h-2.5 w-2.5 text-slate-500" />
                  <span className="line-clamp-1">{channel.location}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {channel.transcodeSub && (
              <span className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[9px] font-medium text-amber-300">
                TRANSCODE
              </span>
            )}
            {status === "connected" && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </div>
            )}
          </div>
        </div>

        {/* Bottom Hover Actions Bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
              className="rounded bg-slate-900/80 p-1.5 text-slate-300 backdrop-blur transition hover:bg-slate-800 hover:text-white"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={reconnect}
              title="Reconnect Stream"
              className="rounded bg-slate-900/80 p-1.5 text-slate-300 backdrop-blur transition hover:bg-slate-800 hover:text-white"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onSelectFullScreen && (
              <button
                type="button"
                onClick={() => onSelectFullScreen(channel)}
                title="Expand to Fullscreen HD"
                className="inline-flex items-center gap-1 rounded bg-indigo-600/90 px-2 py-1 text-[11px] font-medium text-white shadow backdrop-blur transition hover:bg-indigo-500"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>HD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
