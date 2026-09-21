"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UseWebRtcStreamOptions {
  channelNumber: number;
  quality?: "sub" | "hd";
  enabled?: boolean;
  customEndpoint?: string;
  customBody?: Record<string, any>;
}

export interface UseWebRtcStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: "idle" | "connecting" | "connected" | "disconnected" | "failed";
  error: string | null;
  reconnect: () => void;
}

export function useWebRtcStream({
  channelNumber,
  quality = "sub",
  enabled = true,
  customEndpoint,
  customBody,
}: UseWebRtcStreamOptions): UseWebRtcStreamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<UseWebRtcStreamReturn["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(async () => {
    if (!enabled || !channelNumber) {
      cleanup();
      setStatus("idle");
      return;
    }

    cleanup();
    setStatus("connecting");
    setError(null);

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      // Add receive-only transceiver for incoming video stream
      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.play().catch((e) => {
            console.warn("[WebRTC Player] Autoplay prevented:", e.message);
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (!pcRef.current) return;
        const state = pc.connectionState;
        if (state === "connected") {
          setStatus("connected");
          setError(null);
          reconnectAttempts.current = 0;
        } else if (state === "disconnected") {
          setStatus("disconnected");
        } else if (state === "failed") {
          setStatus("failed");
          setError("WebRTC peer connection failed.");
          // Attempt reconnect up to 3 times
          if (reconnectAttempts.current < 3) {
            reconnectAttempts.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              startStream();
            }, 3000 * reconnectAttempts.current);
          }
        }
      };

      // Create WebRTC Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Determine endpoint
      const endpoint = customEndpoint || `/api/cctv/webrtc/${channelNumber}`;
      const bodyPayload = customBody
        ? { ...customBody, sdp: offer.sdp, quality }
        : { sdp: offer.sdp, quality };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const rawErr = data.error || `Server returned error status ${res.status}`;
        let friendlyMsg = rawErr;
        if (rawErr.includes("no route to host") || rawErr.includes("dial tcp")) {
          friendlyMsg = "DVR at 192.168.1.114 is unreachable (no route to host)";
        }
        console.warn(`[WebRTC Ch ${channelNumber}] Stream unavailable: ${friendlyMsg}`);
        setStatus("failed");
        setError(friendlyMsg);
        return;
      }

      const data = await res.json();
      const sdpAnswer = data.sdp;

      if (!sdpAnswer) {
        setStatus("failed");
        setError("Invalid SDP answer received from stream server.");
        return;
      }

      // Complete handshake
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: sdpAnswer })
      );
    } catch (err: any) {
      const rawMsg = err.message || "Failed to connect to video gateway.";
      let friendlyMsg = rawMsg;
      if (rawMsg.includes("no route to host") || rawMsg.includes("dial tcp")) {
        friendlyMsg = "DVR at 192.168.1.114 is unreachable (no route to host)";
      }
      console.warn(`[WebRTC Ch ${channelNumber}] Stream connection warning: ${friendlyMsg}`);
      setStatus("failed");
      setError(friendlyMsg);
    }
  }, [channelNumber, quality, enabled, customEndpoint, customBody, cleanup]);

  useEffect(() => {
    startStream();
    return () => {
      cleanup();
    };
  }, [startStream, cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    startStream();
  }, [startStream]);

  return {
    videoRef,
    status,
    error,
    reconnect,
  };
}
