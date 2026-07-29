/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { HoloraSocket } from "./socket";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

export type CallStatus =
  | "idle"
  | "outgoing_ringing"
  | "incoming_ringing"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "ended";

export interface CallState {
  status: CallStatus;
  callId: string | null;
  callType: "voice" | "video";
  remoteUserId: string | null;
  remoteUserName: string | null;
  localAudioEnabled: boolean;
  localVideoEnabled: boolean;
  remoteAudioEnabled: boolean;
  remoteVideoEnabled: boolean;
  duration: number;
}

const INITIAL_CALL_STATE: CallState = {
  status: "idle",
  callId: null,
  callType: "video",
  remoteUserId: null,
  remoteUserName: null,
  localAudioEnabled: true,
  localVideoEnabled: true,
  remoteAudioEnabled: true,
  remoteVideoEnabled: true,
  duration: 0,
};

/* ================================================================== */
/*  TURN credential fetcher                                            */
/* ================================================================== */

async function fetchTurnCredentials(api: any): Promise<RTCIceServer[]> {
  try {
    const data = await api.get("/chat/turn-credentials/");
    const servers = data?.ice_servers || data?.data?.ice_servers;
    if (Array.isArray(servers) && servers.length > 0) {
      return servers.map((s: any) => ({
        urls: s.urls,
        ...(s.username ? { username: s.username, credential: s.credential } : {}),
      }));
    }
  } catch {
    // Fallback to STUN only
  }
  return [{ urls: "stun:stun.l.google.com:19302" }];
}

/* ================================================================== */
/*  WebRTC Service                                                     */
/* ================================================================== */

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

  private onLocalStreamCb: ((stream: MediaStream) => void) | null = null;
  private onRemoteStreamCb: ((stream: MediaStream) => void) | null = null;
  private onIceCandidateCb: ((candidate: RTCIceCandidateInit) => void) | null = null;
  private onConnectionStateChangeCb: ((state: string) => void) | null = null;

  constructor(options: {
    onLocalStream: (stream: MediaStream) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onIceCandidate: (candidate: RTCIceCandidateInit) => void;
    onConnectionStateChange?: (state: string) => void;
  }) {
    this.onLocalStreamCb = options.onLocalStream;
    this.onRemoteStreamCb = options.onRemoteStream;
    this.onIceCandidateCb = options.onIceCandidate;
    this.onConnectionStateChangeCb = options.onConnectionStateChange || null;
  }

  setIceServers(servers: RTCIceServer[]): void {
    this.iceServers = servers;
  }

  async startLocalMedia(video: boolean): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: video
        ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
        : false,
    };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.onLocalStreamCb?.(this.localStream);
    return this.localStream;
  }

  createPeerConnection(): void {
    this.pc = new RTCPeerConnection({ iceServers: this.iceServers });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.localStream!);
      });
    }

    this.pc.ontrack = (event) => {
      this.remoteStream = event.streams[0] || new MediaStream([event.track]);
      this.onRemoteStreamCb?.(this.remoteStream);
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidateCb?.(event.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState || "unknown";
      this.onConnectionStateChangeCb?.(state);
    };

    // Flush any candidates that arrived before peer connection was created
    this.flushPendingCandidates();
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("No peer connection");
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return { type: offer.type, sdp: offer.sdp };
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.pc) throw new Error("No peer connection");
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.flushPendingCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return { type: answer.type, sdp: answer.sdp };
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) throw new Error("No peer connection");
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    this.flushPendingCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc?.remoteDescription) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore invalid candidates
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  toggleAudio(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  dispose(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.remoteStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingCandidates = [];
  }

  get connectionState(): string | null {
    return this.pc?.connectionState ?? null;
  }

  private flushPendingCandidates(): void {
    if (!this.pc?.remoteDescription) return;
    const candidates = [...this.pendingCandidates];
    this.pendingCandidates = [];
    candidates.forEach((c) => {
      this.pc?.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
    });
  }
}

/* ================================================================== */
/*  useWebRTC hook                                                     */
/* ================================================================== */

export function useWebRTC(socket: HoloraSocket | null) {
  const [callState, setCallState] = useState<CallState>({ ...INITIAL_CALL_STATE });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WebRTCService | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callStateRef = useRef(callState);
  callStateRef.current = callState;

  // Attach stream to video element
  const attachStream = useCallback((ref: React.RefObject<HTMLVideoElement | null>, stream: MediaStream) => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, []);

  // Cleanup everything
  const cleanup = useCallback(() => {
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
    rtcRef.current?.dispose();
    rtcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  // Create WebRTC service
  const createRTC = useCallback(() => {
    const rtc = new WebRTCService({
      onLocalStream: (stream) => attachStream(localVideoRef, stream),
      onRemoteStream: (stream) => attachStream(remoteVideoRef, stream),
      onIceCandidate: (candidate) => {
        const cs = callStateRef.current;
        if (cs.callId && socket) {
          socket.sendSignal(cs.callId, "ice_candidate", candidate);
        }
      },
      onConnectionStateChange: (state) => {
        if (state === "connected") {
          setCallState((prev) => ({ ...prev, status: "connected" }));
        } else if (state === "disconnected" || state === "failed") {
          setCallState((prev) => {
            if (prev.status === "connected") return { ...prev, status: "reconnecting" };
            return prev;
          });
        }
      },
    });
    rtcRef.current = rtc;
    return rtc;
  }, [socket, attachStream]);

  // Start outgoing call
  const startCall = useCallback(async (
    targetUserId: string,
    targetUserName: string,
    callType: "voice" | "video",
    api: any,
  ) => {
    if (!socket) return;
    cleanup();

    const iceServers = await fetchTurnCredentials(api);
    const rtc = createRTC();
    rtc.setIceServers(iceServers);

    try {
      await rtc.startLocalMedia(callType === "video");
    } catch {
      rtc.dispose();
      return;
    }

    rtc.createPeerConnection();
    socket.inviteCall(targetUserId, callType);

    setCallState({
      ...INITIAL_CALL_STATE,
      status: "outgoing_ringing",
      callType,
      remoteUserId: targetUserId,
      remoteUserName: targetUserName,
      localVideoEnabled: callType === "video",
    });

    // Ring timeout: 35 seconds
    ringTimeoutRef.current = setTimeout(() => {
      if (callStateRef.current.status === "outgoing_ringing") {
        endCall();
      }
    }, 35000);
  }, [socket, cleanup, createRTC]);

  // Accept incoming call
  const acceptCall = useCallback(async (api: any) => {
    if (!socket || !callStateRef.current.callId) return;
    const cs = callStateRef.current;

    const iceServers = await fetchTurnCredentials(api);
    const rtc = createRTC();
    rtc.setIceServers(iceServers);

    try {
      await rtc.startLocalMedia(cs.callType === "video");
    } catch {
      rtc.dispose();
      return;
    }

    rtc.createPeerConnection();
    socket.acceptCall(cs.callId!);

    setCallState((prev) => ({
      ...prev,
      status: "connecting",
      localVideoEnabled: cs.callType === "video",
    }));

    if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
  }, [socket, createRTC]);

  // End / reject / cancel call
  const endCall = useCallback(() => {
    const cs = callStateRef.current;
    if (cs.callId && socket) {
      if (cs.status === "outgoing_ringing") {
        socket.cancelCall(cs.callId);
      } else if (cs.status === "incoming_ringing") {
        socket.rejectCall(cs.callId);
      } else {
        socket.hangupCall(cs.callId);
      }
    }
    cleanup();
    setCallState({ ...INITIAL_CALL_STATE, status: "ended" });
    // Reset to idle after brief ended state
    setTimeout(() => setCallState({ ...INITIAL_CALL_STATE }), 2000);
  }, [socket, cleanup]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const enabled = rtcRef.current?.toggleAudio() ?? false;
    setCallState((prev) => ({ ...prev, localAudioEnabled: enabled }));
    const cs = callStateRef.current;
    if (cs.callId && socket) {
      socket.sendMediaState(cs.callId, enabled, cs.localVideoEnabled);
    }
  }, [socket]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const enabled = rtcRef.current?.toggleVideo() ?? false;
    setCallState((prev) => ({ ...prev, localVideoEnabled: enabled }));
    const cs = callStateRef.current;
    if (cs.callId && socket) {
      socket.sendMediaState(cs.callId, cs.localAudioEnabled, enabled);
    }
  }, [socket]);

  // Listen for WebSocket call events
  useEffect(() => {
    if (!socket) return;

    const unsub = socket.on("call", async (data: any) => {
      const cs = callStateRef.current;

      switch (data.type) {
        case "incoming_call": {
          if (cs.status !== "idle") break;
          setCallState({
            ...INITIAL_CALL_STATE,
            status: "incoming_ringing",
            callId: data.call_id,
            callType: data.call_type || "video",
            remoteUserId: String(data.from_id),
            remoteUserName: data.from_name || "Unknown",
          });
          // Auto-decline after 35s
          ringTimeoutRef.current = setTimeout(() => {
            if (callStateRef.current.status === "incoming_ringing") {
              endCall();
            }
          }, 35000);
          break;
        }

        case "call_ringing": {
          if (cs.status === "outgoing_ringing" && data.call_id) {
            setCallState((prev) => ({ ...prev, callId: data.call_id }));
          }
          break;
        }

        case "call_accepted": {
          if (ringTimeoutRef.current) { clearTimeout(ringTimeoutRef.current); ringTimeoutRef.current = null; }
          setCallState((prev) => ({ ...prev, status: "connecting", callId: data.call_id || prev.callId }));

          // Caller creates offer
          if (rtcRef.current) {
            try {
              const offer = await rtcRef.current.createOffer();
              socket.sendSignal(data.call_id || cs.callId!, "offer", offer);
            } catch {
              endCall();
            }
          }
          break;
        }

        case "offer": {
          if (rtcRef.current) {
            try {
              const answer = await rtcRef.current.handleOffer(data.payload);
              socket.sendSignal(data.call_id || cs.callId!, "answer", answer);
            } catch {
              endCall();
            }
          }
          break;
        }

        case "answer": {
          if (rtcRef.current) {
            try {
              await rtcRef.current.handleAnswer(data.payload);
            } catch {
              endCall();
            }
          }
          break;
        }

        case "ice_candidate": {
          if (rtcRef.current) {
            await rtcRef.current.addIceCandidate(data.payload || data.candidate);
          }
          break;
        }

        case "call_ended":
        case "call_rejected":
        case "call_cancelled":
        case "call_missed": {
          cleanup();
          setCallState({ ...INITIAL_CALL_STATE, status: "ended" });
          setTimeout(() => setCallState({ ...INITIAL_CALL_STATE }), 2000);
          break;
        }

        case "media_state": {
          setCallState((prev) => ({
            ...prev,
            remoteAudioEnabled: data.audio_enabled ?? prev.remoteAudioEnabled,
            remoteVideoEnabled: data.video_enabled ?? prev.remoteVideoEnabled,
          }));
          break;
        }
      }
    });

    return unsub;
  }, [socket, endCall, cleanup]);

  // Duration timer
  useEffect(() => {
    if (callState.status === "connected") {
      durationRef.current = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    }
    return () => {
      if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
    };
  }, [callState.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
