/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  WebSocket Message Protocol                                         */
/*                                                                     */
/*  The backend exposes a unified WebSocket at `/ws/?token=<JWT>`.     */
/*  Every message is JSON with a `feature` field that identifies the   */
/*  subsystem:                                                         */
/*                                                                     */
/*    { "feature": "private_chat", "type": "send_message", ... }       */
/*    { "feature": "community_chat", "type": "join", ... }             */
/*    { "feature": "call", "type": "invite", ... }                     */
/*    { "feature": "notification", ... }                               */
/*                                                                     */
/*  Outbound: clients send JSON with `feature` + `type` + payload.     */
/*  Inbound:  server sends JSON with `feature` + `type` + payload.     */
/*  The HoloraSocket class multiplexes listeners by `feature` key.     */
/* ------------------------------------------------------------------ */

type Listener = (data: any) => void;

/**
 * Chat event types — used for fallback routing when backend sends events
 * without a `feature` field. Matches Flutter SocketEventRouter exactly.
 */
const CHAT_TYPES = new Set([
  "new_message", "typing", "stop_typing",
  "delivery_status", "delivery_status_bulk", "read_receipt",
  "reaction_update", "message_edited", "message_deleted",
  "message_starred", "message_pinned", "message_disappeared",
  "message_scheduled", "conversation_muted", "conversation_unmuted",
  "conversation_archived", "settings_updated",
  "joined", "online_status", "sync_batch", "message_replay",
]);

/**
 * Derives the WebSocket base URL from the REST API base URL.
 *
 * Examples:
 *   "http://localhost:8000/HoloraPerformance" → "ws://localhost:8000"
 *   "https://api.holora.com/HoloraPerformance" → "wss://api.holora.com"
 *
 * The WS endpoint is at the root level `/ws/`, NOT under the API path.
 */
function deriveWsUrl(apiBaseUrl: string): string {
  // Strip trailing slash
  let url = apiBaseUrl.replace(/\/+$/, "");

  // Remove the API path segment (e.g. /HoloraPerformance)
  try {
    const parsed = new URL(url);
    // Keep only protocol + host (no pathname)
    const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${parsed.host}`;
  } catch {
    // Fallback for malformed URLs: simple string replacement
    url = url.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    // Strip path after host
    const parts = url.split("/");
    return parts.slice(0, 3).join("/");
  }
}

/* ------------------------------------------------------------------ */
/*  HoloraSocket                                                       */
/* ------------------------------------------------------------------ */

export class HoloraSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Listener>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private token: string;
  private wsBaseUrl: string;
  private isManualClose = false;

  constructor(apiBaseUrl: string, token: string) {
    this.wsBaseUrl = deriveWsUrl(apiBaseUrl);
    this.token = token;
  }

  /* ── Connection lifecycle ──────────────────────────────────────── */

  connect(): void {
    // Prevent duplicate connections
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isManualClose = false;

    const url = `${this.wsBaseUrl}/ws/?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);

        // Respond to server heartbeat to keep connection alive
        if (data?.type === "ping") {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "pong" }));
          }
          return;
        }
        if (data?.type === "pong") return;

        // Infer feature from type when backend sends without feature field
        // (matches Flutter SocketEventRouter fallback logic exactly)
        let feature: string | undefined = data?.feature;
        if (!feature) {
          const type: string = data?.type || "";
          if (type === "new_notification") {
            feature = "notification";
          } else if (
            type.startsWith("call_") ||
            type === "incoming_call" || type === "offer" || type === "answer" ||
            type === "ice_candidate" || type === "media_state" ||
            type === "connection_state"
          ) {
            feature = "call";
          } else if (CHAT_TYPES.has(type)) {
            feature = "private_chat";
          }
        }
        if (!feature) return;

        const featureListeners = this.listeners.get(feature);
        if (featureListeners) {
          featureListeners.forEach((cb) => {
            try {
              cb(data);
            } catch (err) {
              console.error(`[HoloraSocket] Listener error (${feature}):`, err);
            }
          });
        }
      } catch {
        // Silently ignore non-JSON messages
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.ws = null;

      // Code 4003 = token expired — do not reconnect, let auth handle it
      if (event.code === 4003) {
        return;
      }

      if (!this.isManualClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // The close handler will fire after this and manage reconnection.
      // Nothing extra needed here.
    };
  }

  disconnect(): void {
    this.isManualClose = true;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /* ── Sending ───────────────────────────────────────────────────── */

  /**
   * Send a JSON message tagged with a `feature` key.
   * No-op if the socket is not open.
   */
  send(feature: string, data: Record<string, any>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ feature, ...data }));
    }
  }

  /* ── Subscribing ───────────────────────────────────────────────── */

  /**
   * Register a listener for messages with the given `feature` tag.
   * Returns an unsubscribe function.
   */
  on(feature: string, callback: Listener): () => void {
    let set = this.listeners.get(feature);
    if (!set) {
      set = new Set();
      this.listeners.set(feature, set);
    }
    set.add(callback);

    return () => {
      set!.delete(callback);
      if (set!.size === 0) {
        this.listeners.delete(feature);
      }
    };
  }

  /* ── Reconnection ──────────────────────────────────────────────── */

  /**
   * Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s.
   * Gives up after `maxReconnectAttempts`.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.clearReconnectTimer();

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30_000,
    );
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /* ── Status ────────────────────────────────────────────────────── */

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /* ================================================================ */
  /*  Convenience helpers — Private Chat                               */
  /*                                                                   */
  /*  Message protocol:                                                */
  /*    → { feature: "private_chat", type: "join",                     */
  /*         other_user_id: "<id>", since?: "<ISO>" }                  */
  /*    → { feature: "private_chat", type: "send_message",             */
  /*         other_user_id: "<id>", content: "...",                    */
  /*         message_type: "text", reply_to_id?: "<msg_id>" }          */
  /*    → { feature: "private_chat", type: "typing",                   */
  /*         other_user_id: "<id>" }                                   */
  /*    → { feature: "private_chat", type: "stop_typing",              */
  /*         other_user_id: "<id>" }                                   */
  /*    → { feature: "private_chat", type: "mark_read",                */
  /*         message_id: "<id>", other_user_id: "<id>" }               */
  /* ================================================================ */

  /** Join a private chat room. Optionally provide `since` ISO date to load history after that point. */
  joinPrivateChat(otherUserId: string | number, since?: string): void {
    this.send("private_chat", {
      type: "join",
      other_user_id: String(otherUserId),
      ...(since ? { since } : {}),
    });
  }

  /** Send a text message in a private chat. */
  sendPrivateMessage(
    otherUserId: string | number,
    content: string,
    messageType = "text",
    replyToId?: string,
  ): void {
    this.send("private_chat", {
      type: "send_message",
      other_user_id: String(otherUserId),
      content,
      message_type: messageType,
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    });
  }

  /** Notify the other user that we are typing. */
  sendTyping(otherUserId: string | number): void {
    this.send("private_chat", {
      type: "typing",
      other_user_id: String(otherUserId),
    });
  }

  /** Notify the other user that we stopped typing. */
  sendStopTyping(otherUserId: string | number): void {
    this.send("private_chat", {
      type: "stop_typing",
      other_user_id: String(otherUserId),
    });
  }

  /** Mark a specific message as read in a private chat. */
  markRead(messageId: string, otherUserId: string | number): void {
    this.send("private_chat", {
      type: "mark_read",
      message_id: messageId,
      other_user_id: String(otherUserId),
    });
  }

  /* ================================================================ */
  /*  Convenience helpers — Community Chat                             */
  /*                                                                   */
  /*  Message protocol:                                                */
  /*    → { feature: "community_chat", type: "join",                   */
  /*         community_id: "<id>" }                                    */
  /*    → { feature: "community_chat", type: "send_message",           */
  /*         community_id: "<id>", content: "...",                     */
  /*         message_type: "text" }                                    */
  /* ================================================================ */

  /** Join a community chat room to receive messages. */
  joinCommunity(communityId: string | number): void {
    this.send("community_chat", {
      type: "join",
      community_id: String(communityId),
    });
  }

  /** Send a text message in a community chat. */
  sendCommunityMessage(communityId: string | number, content: string): void {
    this.send("community_chat", {
      type: "send_message",
      community_id: String(communityId),
      content,
      message_type: "text",
    });
  }

  /* ================================================================ */
  /*  Convenience helpers — Call Signaling                              */
  /*                                                                   */
  /*  Message protocol (outbound):                                     */
  /*    → { feature: "call", type: "invite",                           */
  /*         target_user_id: "<id>", call_type: "voice"|"video" }      */
  /*    → { feature: "call", type: "accept", call_id: "<id>" }         */
  /*    → { feature: "call", type: "reject", call_id: "<id>" }         */
  /*    → { feature: "call", type: "cancel", call_id: "<id>" }         */
  /*    → { feature: "call", type: "hangup", call_id: "<id>" }         */
  /*    → { feature: "call", type: "relay_signal",                     */
  /*         call_id: "<id>", signal_type: "offer"|"answer",           */
  /*         sdp: <RTCSessionDescriptionInit> }                        */
  /*    → { feature: "call", type: "relay_signal",                     */
  /*         call_id: "<id>", signal_type: "ice_candidate",            */
  /*         candidate: <RTCIceCandidateInit> }                        */
  /*    → { feature: "call", type: "relay_media_state",                */
  /*         call_id: "<id>", audio_enabled: bool, video_enabled: bool }*/
  /*                                                                   */
  /*  Inbound events (from server):                                    */
  /*    ← { feature: "call", type: "incoming_call",                    */
  /*         call_id, caller_id, caller_name, call_type }              */
  /*    ← { feature: "call", type: "call_accepted", call_id }          */
  /*    ← { feature: "call", type: "call_ringing", call_id }           */
  /*    ← { feature: "call", type: "offer", call_id, sdp }             */
  /*    ← { feature: "call", type: "answer", call_id, sdp }            */
  /*    ← { feature: "call", type: "ice_candidate", call_id,           */
  /*         candidate }                                                */
  /*    ← { feature: "call", type: "call_ended",                       */
  /*         call_id, reason }                                          */
  /*    ← { feature: "call", type: "media_state", call_id,             */
  /*         audio_enabled, video_enabled }                             */
  /* ================================================================ */

  /** Initiate a voice or video call to another user. */
  inviteCall(targetUserId: string | number, callType: "voice" | "video"): void {
    this.send("call", {
      type: "invite",
      target_user_id: String(targetUserId),
      call_type: callType,
    });
  }

  /** Accept an incoming call. */
  acceptCall(callId: string): void {
    this.send("call", { type: "accept", call_id: callId });
  }

  /** Reject an incoming call. */
  rejectCall(callId: string): void {
    this.send("call", { type: "reject", call_id: callId });
  }

  /** Cancel an outgoing call before it is answered. */
  cancelCall(callId: string): void {
    this.send("call", { type: "cancel", call_id: callId });
  }

  /** Hang up an ongoing call. */
  hangupCall(callId: string): void {
    this.send("call", { type: "hangup", call_id: callId });
  }

  /**
   * Relay a WebRTC signaling message (offer, answer, or ICE candidate)
   * through the backend to the remote peer.
   */
  sendSignal(
    callId: string,
    signalType: "offer" | "answer" | "ice_candidate",
    payload: any,
  ): void {
    this.send("call", {
      type: "relay_signal",
      signal_type: signalType,
      call_id: callId,
      ...(signalType === "ice_candidate"
        ? { candidate: payload }
        : { sdp: payload }),
    });
  }

  /** Inform the remote peer of local audio/video mute state. */
  sendMediaState(
    callId: string,
    audioEnabled: boolean,
    videoEnabled: boolean,
  ): void {
    this.send("call", {
      type: "relay_media_state",
      call_id: callId,
      audio_enabled: audioEnabled,
      video_enabled: videoEnabled,
    });
  }
}

/* ------------------------------------------------------------------ */
/*  React Hook                                                         */
/* ------------------------------------------------------------------ */

/**
 * Creates and manages a HoloraSocket instance tied to the component lifecycle.
 *
 * - Connects automatically when `accessToken` is available.
 * - Disconnects and cleans up on unmount or when the token changes.
 * - Returns `null` if no token is provided (user not authenticated).
 */
export function useSocket(
  apiBaseUrl: string,
  accessToken: string | null,
): HoloraSocket | null {
  const [socket, setSocket] = useState<HoloraSocket | null>(null);
  const socketRef = useRef<HoloraSocket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      // If the token was cleared (logout), tear down any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Create a new socket instance and connect
    const sock = new HoloraSocket(apiBaseUrl, accessToken);
    socketRef.current = sock;
    setSocket(sock);
    sock.connect();

    return () => {
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [apiBaseUrl, accessToken]);

  return socket;
}
