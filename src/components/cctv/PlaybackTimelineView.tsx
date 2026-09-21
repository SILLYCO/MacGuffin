"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Calendar,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  Film,
  Clock,
  AlertCircle,
  VideoOff,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { CameraChannelWithDevice, DvrRecordingFile } from "@/lib/cctv/types";

interface PlaybackTimelineViewProps {
  channels: CameraChannelWithDevice[];
}

export function PlaybackTimelineView({ channels }: PlaybackTimelineViewProps) {
  const [selectedChannelNumber, setSelectedChannelNumber] = useState<number>(
    channels[0]?.channelNumber || 1
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [recordings, setRecordings] = useState<DvrRecordingFile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Playback stream state
  const [activeClip, setActiveClip] = useState<DvrRecordingFile | null>(null);
  const [playheadSeconds, setPlayheadSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [activeStreamName, setActiveStreamName] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<{ seconds: number; x: number } | null>(null);

  const selectedChannel = useMemo(() => {
    return channels.find((c) => c.channelNumber === selectedChannelNumber);
  }, [channels, selectedChannelNumber]);

  // Fetch recordings from server
  const fetchRecordings = useCallback(async () => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/cctv/recordings?channel=${selectedChannelNumber}&date=${selectedDate}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setRecordings(data.recordings || []);
      if (data.recordings && data.recordings.length > 0) {
        // Default to first recording clip
        setActiveClip(data.recordings[0]);
        setPlayheadSeconds(data.recordings[0].startSeconds);
      } else {
        setActiveClip(null);
      }
    } catch (err: any) {
      console.warn("Failed to fetch recordings:", err);
      setSearchError(err.message || "Failed to retrieve recordings from DVR.");
      setRecordings([]);
      setActiveClip(null);
    } finally {
      setIsSearching(false);
    }
  }, [selectedChannelNumber, selectedDate]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Cleanup active WebRTC playback session
  const cleanupPlayback = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (activeStreamName) {
      fetch(`/api/cctv/playback?streamName=${encodeURIComponent(activeStreamName)}`, {
        method: "DELETE",
      }).catch(() => {});
      setActiveStreamName(null);
    }
  }, [activeStreamName]);

  // Start WebRTC playback stream for a clip or time range
  const startPlaybackStream = useCallback(
    async (startTime: string, endTime: string) => {
      cleanupPlayback();
      setPlaybackLoading(true);
      setPlaybackError(null);

      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ],
        });
        pcRef.current = pc;

        pc.addTransceiver("video", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((e) => {
              console.warn("Playback autoplay prevented:", e.message);
            });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch("/api/cctv/playback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: selectedChannelNumber,
            startTime,
            endTime,
            sdp: offer.sdp,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error || `Server returned ${res.status}`;
          console.warn("[Playback Stream] Stream unavailable:", errMsg);
          setPlaybackError(
            errMsg.includes("no route to host")
              ? "DVR is currently unreachable on the network."
              : "Unable to start playback stream for this time segment."
          );
          return;
        }

        const data = await res.json();
        setActiveStreamName(data.streamName);

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: data.sdp })
        );
      } catch (err: any) {
        console.warn("Playback start warning:", err);
        setPlaybackError(err.message || "Could not start historical stream playback.");
      } finally {
        setPlaybackLoading(false);
      }
    },
    [selectedChannelNumber, cleanupPlayback]
  );

  // Play a specific clip
  const playClip = (clip: DvrRecordingFile) => {
    setActiveClip(clip);
    setPlayheadSeconds(clip.startSeconds);
    startPlaybackStream(clip.startTime, clip.endTime);
  };

  // Convert seconds to HH:MM:SS
  const formatSecondsToTime = (totalSeconds: number): string => {
    const s = Math.max(0, Math.min(86399, Math.floor(totalSeconds)));
    const hh = Math.floor(s / 3600).toString().padStart(2, "0");
    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  // Timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const clickedSeconds = Math.floor(ratio * 86400);

    setPlayheadSeconds(clickedSeconds);

    // Find if click landed on an existing recording clip
    const matchedClip = recordings.find(
      (r) => clickedSeconds >= r.startSeconds && clickedSeconds <= r.endSeconds
    );

    if (matchedClip) {
      playClip(matchedClip);
    } else {
      // Create a 15-minute on-demand playback window from clicked timestamp
      const startTimeStr = `${selectedDate} ${formatSecondsToTime(clickedSeconds)}`;
      const endTimeSeconds = Math.min(86399, clickedSeconds + 900);
      const endTimeStr = `${selectedDate} ${formatSecondsToTime(endTimeSeconds)}`;

      setActiveClip({
        channel: selectedChannelNumber,
        startTime: startTimeStr,
        endTime: endTimeStr,
        startSeconds: clickedSeconds,
        endSeconds: endTimeSeconds,
        length: endTimeSeconds - clickedSeconds,
        type: "general",
      });

      startPlaybackStream(startTimeStr, endTimeStr);
    }
  };

  // Timeline mouse hover time indicator
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const seconds = Math.floor(ratio * 86400);
    setHoverTime({ seconds, x });
  };

  // Total recorded duration
  const totalRecordedSeconds = useMemo(() => {
    return recordings.reduce((acc, r) => acc + r.length, 0);
  }, [recordings]);

  return (
    <div className="space-y-5">
      {/* Top Filter Bar: Channel, Date, & Search Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Camera:</label>
            <select
              value={selectedChannelNumber}
              onChange={(e) => setSelectedChannelNumber(parseInt(e.target.value, 10))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {channels.map((ch) => (
                <option key={ch.id} value={ch.channelNumber}>
                  CH {ch.channelNumber.toString().padStart(2, "0")} — {ch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400">Date:</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRecordings}
            disabled={isSearching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Search className={`h-3.5 w-3.5 ${isSearching ? "animate-spin" : ""}`} />
            <span>{isSearching ? "Searching DVR..." : "Search Recordings"}</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Continuous / Regular</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Motion Detection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Alarm Event</span>
          </div>
        </div>
      </div>

      {/* Main Playback Area: Video Player & Clips List */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2 Cols: Video Player */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-xl lg:col-span-2">
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              playsInline
              autoPlay
            />

            {playbackLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="mt-2 text-xs font-medium text-indigo-400">
                  Retrieving Dahua Playback Stream via Transcode...
                </span>
              </div>
            )}

            {playbackError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center">
                <div className="rounded-full bg-rose-500/10 p-2 text-rose-400">
                  <VideoOff className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs font-semibold text-rose-400">
                  Playback Error
                </span>
                <span className="mt-1 max-w-sm text-[11px] text-slate-400">
                  {playbackError}
                </span>
              </div>
            )}

            {!activeClip && !playbackLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4 text-center">
                <Film className="mb-2 h-10 w-10 text-slate-600" />
                <span className="text-sm font-semibold text-slate-300">
                  Select a recording or click the timeline
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {recordings.length} recording segments found for {selectedDate}
                </span>
              </div>
            )}

            {/* Video overlay header */}
            {activeClip && (
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    CH {selectedChannelNumber.toString().padStart(2, "0")}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {selectedChannel?.name}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                    {activeClip.startTime}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950/80 px-2 py-0.5 text-[10px] font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                    <Sparkles className="h-3 w-3" /> H.264 Playback Transcode
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-3 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }
                }}
                disabled={!activeClip}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime -= 10;
                }}
                title="Rewind 10 seconds"
                className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime += 10;
                }}
                title="Forward 10 seconds"
                className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <span className="font-mono text-xs text-slate-400">
                Playhead: <span className="font-semibold text-slate-200">{formatSecondsToTime(playheadSeconds)}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeClip && (
                <div className="text-right text-[11px] text-slate-400">
                  <span>Clip Duration: </span>
                  <span className="font-medium text-slate-200">{Math.round(activeClip.length / 60)} min</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Found Clips List */}
        <div className="flex h-[430px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-indigo-400" />
              <h3 className="font-semibold text-white">Recordings Found</h3>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
              {recordings.length} clips
            </span>
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {isSearching ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="mt-2 text-xs text-slate-400">Searching DVR recordings...</span>
              </div>
            ) : searchError ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertCircle className="mb-1 h-4 w-4" />
                <span>{searchError}</span>
              </div>
            ) : recordings.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center text-slate-500">
                <Clock className="mb-2 h-8 w-8 text-slate-600" />
                <span className="text-xs">No recordings found for this date.</span>
              </div>
            ) : (
              recordings.map((clip, idx) => {
                const isActive =
                  activeClip &&
                  activeClip.startTime === clip.startTime &&
                  activeClip.channel === clip.channel;

                const badgeBg =
                  clip.type === "motion"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : clip.type === "alarm"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                return (
                  <button
                    key={`${clip.startTime}-${idx}`}
                    type="button"
                    onClick={() => playClip(clip)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50"
                        : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-200">
                        <span>{clip.startTime.split(" ")[1]}</span>
                        <span className="text-slate-500">→</span>
                        <span>{clip.endTime.split(" ")[1]}</span>
                      </div>
                      <span className="mt-0.5 text-[10px] text-slate-400">
                        Duration: {Math.round(clip.length / 60)}m ({clip.length}s)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${badgeBg}`}>
                        {clip.type}
                      </span>
                      <ChevronRight className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-600"}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Interactive Timeline Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-white">24-Hour Recording Timeline</h3>
            <span className="text-xs text-slate-400">({selectedDate})</span>
          </div>

          <div className="text-xs text-slate-400">
            Total recorded:{" "}
            <span className="font-semibold text-slate-200">
              {(totalRecordedSeconds / 3600).toFixed(1)} hrs
            </span>
          </div>
        </div>

        {/* Timeline track container */}
        <div className="relative mt-2 select-none">
          {/* Timeline Bar */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            className="relative h-12 w-full cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-inner"
          >
            {/* 1-Hour vertical tick subdivisions */}
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="absolute top-0 bottom-0 border-r border-slate-800/80"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {/* Recording blocks */}
            {recordings.map((r, idx) => {
              const leftPercent = (r.startSeconds / 86400) * 100;
              const widthPercent = Math.max(0.15, (r.length / 86400) * 100);

              let blockColor = "bg-emerald-500/80 hover:bg-emerald-400";
              if (r.type === "motion") blockColor = "bg-amber-500/80 hover:bg-amber-400";
              if (r.type === "alarm") blockColor = "bg-rose-500/80 hover:bg-rose-400";

              return (
                <div
                  key={idx}
                  title={`${r.startTime} - ${r.endTime} (${r.type})`}
                  className={`absolute top-0 bottom-0 transition-colors ${blockColor}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              );
            })}

            {/* Current Playhead cursor line */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${(playheadSeconds / 86400) * 100}%` }}
            >
              <div className="absolute -top-1 -left-1.5 h-3.5 w-3.5 rounded-full border border-rose-400 bg-rose-500 shadow" />
            </div>

            {/* Hover preview cursor line */}
            {hoverTime && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-white/60"
                style={{ left: `${hoverTime.x}px` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-white shadow ring-1 ring-slate-700">
                  {formatSecondsToTime(hoverTime.seconds)}
                </div>
              </div>
            )}
          </div>

          {/* Hour Markers Label strip (00:00 to 24:00) */}
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
            <span>00:00</span>
            <span>02:00</span>
            <span>04:00</span>
            <span>06:00</span>
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
