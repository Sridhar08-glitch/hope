"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@holora/auth";
import { Spinner, Button, BRAND, Sidebar, Toast, useToast } from "@holora/ui";
import {
  Bell,
  Search,
  PanelLeftOpen,
  PanelLeftClose,
  X,
} from "lucide-react";
import { useSocket } from "@/lib/socket";
import { useWebRTC } from "@/lib/webrtc";

import { trainerApi } from "@/lib/trainer-api";
import { NAV_ITEMS, NAV_GROUPS, type TabId } from "@/lib/nav-config";

import { DashboardView } from "@/components/views/dashboard-view";
import { BookingsView } from "@/components/views/bookings-view";
import { ClientsView } from "@/components/views/clients-view";
import { CoachingPlansView } from "@/components/views/coaching-plans-view";
import { AvailabilityView } from "@/components/views/availability-view";
import { EarningsView } from "@/components/views/earnings-view";
import { BusinessView } from "@/components/views/business-view";
import { MessagesView } from "@/components/views/messages-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { ProfileView } from "@/components/views/profile-view";
import { StudioDashboardView } from "@/components/views/studio-dashboard-view";
import { MyVideosView } from "@/components/views/my-videos-view";
import { UploadVideoView } from "@/components/views/upload-video-view";
import { VideoAnalyticsView } from "@/components/views/video-analytics-view";
import { ProgramsView } from "@/components/views/programs-view";
import { CommentsView } from "@/components/views/comments-view";

/* ================================================================== */
/*  Dashboard Shell — Protected layout with sidebar + content          */
/* ================================================================== */

export function DashboardShell() {
  const { user, api, logout, getAccessToken } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  // WebSocket — single connection for real-time chat, presence, calls
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/HoloraPerformance";
  // Get access token directly from auth context (reads from accessTokenRef)
  const wsToken = user ? (getAccessToken?.() || null) : null;
  const socket = useSocket(API_URL, wsToken);

  // WebRTC — voice/video calls via socket
  const webrtc = useWebRTC(socket);

  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Application state
  const [profile, setProfile] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  // Video Studio state
  const [studioDashboardData, setStudioDashboardData] = useState<any>(null);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [videoCursor, setVideoCursor] = useState<string | null>(null);
  const [videoStatusFilter, setVideoStatusFilter] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  // Analytics state
  const [videoAnalytics, setVideoAnalytics] = useState<any[]>([]);
  const [selectedAnalyticsVideoId, setSelectedAnalyticsVideoId] = useState<string | null>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);
  const [funnelAnalytics, setFunnelAnalytics] = useState<any>(null);
  const [bestPostingHour, setBestPostingHour] = useState<number | null>(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState({ start_date: "", end_date: "" });

  // Programs state
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [programAvailableVideos, setProgramAvailableVideos] = useState<any[]>([]);

  // Comments state
  const [videoComments, setVideoComments] = useState<any[]>([]);

  // UI state
  const [bookingFilter, setBookingFilter] = useState("pending");
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: "monday", start_time: "09:00", end_time: "10:00" });
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [trainerProfileId, setTrainerProfileId] = useState<string | number | null>(null);

  // ── Fetch Functions ────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, dashboard: true }));
      const dashData = await trainerApi.dashboard.get(api);
      const trainerInfo = dashData?.trainer || {};
      setStats({
        ...dashData?.stats,
        total_clients: trainerInfo.total_clients ?? dashData?.stats?.total_clients ?? 0,
        total_sessions: trainerInfo.total_sessions ?? 0,
        total_bookings: trainerInfo.total_bookings ?? 0,
        rating: trainerInfo.rating ?? dashData?.stats?.rating,
        total_reviews: trainerInfo.total_reviews ?? 0,
        total_revenue: trainerInfo.total_revenue ?? 0,
        retention_rate: trainerInfo.retention_rate ?? null,
        completion_rate: trainerInfo.completion_rate ?? null,
      });

      const profileData = await trainerApi.profile.getMyProfile(api);
      setProfile(profileData || {});

      if (trainerInfo?.id) {
        setTrainerProfileId(trainerInfo.id);
        try {
          const trainerDetail = await trainerApi.profile.getTrainerDetail(api, trainerInfo.id);
          setProfile((prev: any) => ({ ...prev, ...trainerDetail }));
        } catch {
          // trainer detail fetch failed — continue with basic profile
        }
      }

      // Fetch unread notification count
      trainerApi.notifications
        .unreadCount(api)
        .then((r: any) => setUnreadCount(r?.unread_count ?? 0))
        .catch(() => {});
    } catch (err: any) {
      showToast(`Failed to load dashboard: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  }, [api, showToast]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, bookings: true }));
      const data = await trainerApi.bookings.list(api);
      setBookings(data?.results || data || []);
    } catch (err: any) {
      showToast(`Failed to load bookings: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  }, [api, showToast]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, clients: true }));
      const data = await trainerApi.clients.list(api);
      setClients(data?.results || data || []);
    } catch (err: any) {
      showToast(`Failed to load clients: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, clients: false }));
    }
  }, [api, showToast]);

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, availability: true }));
      const [availData, blockedData] = await Promise.all([
        trainerApi.availability.list(api),
        trainerApi.blockedDates.list(api).catch(() => { console.warn("Failed to load blocked dates"); return { results: [] }; }),
      ]);
      setAvailability(availData?.results || availData || []);
      setBlockedDates(blockedData?.results || blockedData || []);
    } catch (err: any) {
      showToast(`Failed to load availability: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, availability: false }));
    }
  }, [api, showToast]);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, plans: true }));
      const [subPlans, wPlans, mPlans] = await Promise.all([
        trainerApi.plans.list(api).catch(() => []),
        trainerApi.workoutPlans.list(api).catch(() => ({ results: [] })),
        trainerApi.mealPlans.list(api).catch(() => ({ results: [] })),
      ]);
      setPlans(subPlans || []);
      setWorkoutPlans(wPlans?.results || wPlans || []);
      setMealPlans(mPlans?.results || mPlans || []);
    } catch (err: any) {
      showToast(`Failed to load plans: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, plans: false }));
    }
  }, [api, showToast]);

  const fetchFinance = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, finance: true }));
      const [paymentData, invoiceData] = await Promise.all([
        trainerApi.finance.payments(api),
        trainerApi.finance.invoices(api),
      ]);
      setPayments(paymentData?.results || paymentData || []);
      setInvoices(invoiceData?.results || invoiceData || []);
    } catch (err: any) {
      showToast(`Failed to load finance data: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, finance: false }));
    }
  }, [api, showToast]);

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, messages: true }));
      const data = await trainerApi.chat.communities(api);
      setCommunities(data?.results || data || []);
    } catch (err: any) {
      showToast(`Failed to load communities: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }));
    }
  }, [api, showToast]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, notifications: true }));
      const data = await trainerApi.notifications.list(api);
      let notifs = data?.results || data?.data || data || [];
      // If trainer-specific returns empty, try universal notifications
      if (notifs.length === 0) {
        try {
          const uData = await api.get<any>("/notifications/");
          notifs = uData?.data?.results || uData?.results || [];
        } catch {
          // silent
        }
      }
      setNotifications(notifs);
      // Also refresh unread count
      trainerApi.notifications
        .unreadCount(api)
        .then((r: any) => setUnreadCount(r?.unread_count ?? 0))
        .catch(() => {});
    } catch (err: any) {
      showToast(`Failed to load notifications: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, notifications: false }));
    }
  }, [api, showToast]);

  // ── Video Studio Fetch Functions ───────────────────────────────────

  const fetchStudioDashboard = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, studio: true }));
      const data = await trainerApi.studioDashboard.get(api);
      setStudioDashboardData(data);
    } catch (err: any) {
      showToast(`Failed to load studio dashboard: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, studio: false }));
    }
  }, [api, showToast]);

  const videoCursorRef = useRef(videoCursor);
  videoCursorRef.current = videoCursor;

  const fetchMyVideos = useCallback(async (reset = true) => {
    try {
      setLoading((prev) => ({ ...prev, myVideos: true }));
      const params: Record<string, string> = { page_size: "20" };
      if (videoStatusFilter) {
        if (videoStatusFilter === "PROCESSING") {
          params.status = "pending";
        } else {
          params.status = videoStatusFilter.toLowerCase();
        }
      }
      if (videoSearch) params.search = videoSearch;
      if (!reset && videoCursorRef.current) params.cursor = videoCursorRef.current;

      const data = await trainerApi.studio.listMine(api, params);
      const results = data?.results || [];
      if (reset) {
        setMyVideos(results);
      } else {
        setMyVideos((prev) => [...prev, ...results]);
      }
      setVideoCursor(data?.next_cursor || null);
    } catch (err: any) {
      showToast(`Failed to load videos: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, myVideos: false }));
    }
  }, [api, showToast, videoStatusFilter, videoSearch]);

  const fetchVideoAnalytics = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, analytics: true }));
      const [analyticsRes, bestHourRes] = await Promise.allSettled([
        trainerApi.videoAnalytics.list(api),
        trainerApi.videoAnalytics.bestPostingTime(api),
      ]);
      if (analyticsRes.status === "fulfilled") {
        const list = analyticsRes.value;
        setVideoAnalytics(Array.isArray(list) ? list : list?.results || []);
      }
      if (bestHourRes.status === "fulfilled") {
        setBestPostingHour((bestHourRes.value as any)?.best_hour ?? null);
      }
    } catch (err: any) {
      showToast(`Failed to load analytics: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  }, [api, showToast]);

  const fetchDailyAnalytics = useCallback(async (videoId: string, dateRange?: { start_date: string; end_date: string }) => {
    try {
      const range = dateRange || analyticsDateRange;
      const params: Record<string, string> = {};
      if (range.start_date) params.start_date = range.start_date;
      if (range.end_date) params.end_date = range.end_date;
      const data = await trainerApi.videoAnalytics.daily(api, videoId, params);
      setDailyAnalytics(Array.isArray(data) ? data : []);
    } catch {
      setDailyAnalytics([]);
    }
  }, [api, analyticsDateRange]);

  const fetchFunnelAnalytics = useCallback(async (videoId: string) => {
    try {
      const data = await trainerApi.videoAnalytics.funnel(api, videoId);
      setFunnelAnalytics(data);
    } catch {
      setFunnelAnalytics(null);
    }
  }, [api]);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, programs: true }));
      const data = await trainerApi.trainerPrograms.list(api);
      setPrograms(Array.isArray(data) ? data : data?.results || []);
    } catch (err: any) {
      showToast(`Failed to load programs: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, programs: false }));
    }
  }, [api, showToast]);

  const fetchProgramDetail = useCallback(async (programId: number) => {
    try {
      const data = await trainerApi.trainerPrograms.get(api, programId);
      setSelectedProgram(data);
    } catch (err: any) {
      showToast(`Failed to load program: ${err.message}`, "error");
    }
  }, [api, showToast]);

  const fetchVideoComments = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, comments: true }));
      // Fetch published videos first, then comments for each
      const videosData = await trainerApi.studio.listMine(api, { status: "published", page_size: "20" });
      const videos = videosData?.results || [];
      const commentPromises = videos.map((v: any) =>
        trainerApi.studio.listComments(api, v.id).then((c: any) => {
          const comments = c?.results || (Array.isArray(c) ? c : []);
          return comments.map((comment: any) => ({
            ...comment,
            _video_id: v.id,
            _video_title: v.title,
          }));
        }).catch(() => [])
      );
      const allComments = await Promise.all(commentPromises);
      const merged = allComments.flat().sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setVideoComments(merged);
    } catch (err: any) {
      showToast(`Failed to load comments: ${err.message}`, "error");
    } finally {
      setLoading((prev) => ({ ...prev, comments: false }));
    }
  }, [api, showToast]);

  const fetchProgramAvailableVideos = useCallback(async () => {
    try {
      const data = await trainerApi.studio.listMine(api, { status: "PUBLISHED", page_size: "50" });
      setProgramAvailableVideos(data?.results || []);
    } catch {
      setProgramAvailableVideos([]);
    }
  }, [api]);

  // ── Data loading on tab change ─────────────────────────────────────

  useEffect(() => {
    if (activeTab === "dashboard") fetchDashboard();
    else if (activeTab === "bookings") fetchBookings();
    else if (activeTab === "clients") fetchClients();
    else if (activeTab === "availability") fetchAvailability();
    else if (activeTab === "business") fetchPlans();
    else if (activeTab === "finance") fetchFinance();
    else if (activeTab === "messages") fetchCommunities();
    else if (activeTab === "notifications") fetchNotifications();
    else if (activeTab === "studio-dashboard") fetchStudioDashboard();
    else if (activeTab === "my-videos") fetchMyVideos(true);
    else if (activeTab === "video-analytics") fetchVideoAnalytics();
    else if (activeTab === "programs") { fetchPrograms(); fetchProgramAvailableVideos(); }
    else if (activeTab === "comments") fetchVideoComments();
    // upload-video has no initial fetch
  }, [activeTab, fetchDashboard, fetchBookings, fetchClients, fetchAvailability, fetchPlans, fetchFinance, fetchCommunities, fetchNotifications, fetchStudioDashboard, fetchMyVideos, fetchVideoAnalytics, fetchPrograms, fetchProgramAvailableVideos, fetchVideoComments]);

  // Initial dashboard load
  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced video search
  useEffect(() => {
    if (activeTab !== "my-videos") return;
    const timer = setTimeout(() => {
      fetchMyVideos(true);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSearch, videoStatusFilter]);

  // ── Action Handlers ────────────────────────────────────────────────

  const handleAcceptBooking = async (bookingId: string | number) => {
    try {
      await trainerApi.bookings.accept(api, bookingId);
      showToast("Booking accepted!", "success");
      fetchBookings();
    } catch (err: any) {
      showToast(`Failed to accept booking: ${err.message}`, "error");
    }
  };

  const handleRejectBooking = async (bookingId: string | number) => {
    try {
      await trainerApi.bookings.reject(api, bookingId, "");
      showToast("Booking rejected", "success");
      fetchBookings();
    } catch (err: any) {
      showToast(`Failed to reject booking: ${err.message}`, "error");
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!trainerProfileId) { showToast("Trainer profile not loaded yet. Please try again.", "error"); return; }
      const slot = { ...newSlot, trainer: trainerProfileId };
      if (slot.start_time && !slot.start_time.includes(":00:")) slot.start_time += ":00";
      if (slot.end_time && !slot.end_time.includes(":00:")) slot.end_time += ":00";
      await trainerApi.availability.create(api, slot);
      showToast("Availability slot added!", "success");
      setNewSlot({ day: "monday", start_time: "09:00", end_time: "10:00" });
      setIsAddingSlot(false);
      fetchAvailability();
    } catch (err: any) {
      showToast(`Failed to add slot: ${err.message}`, "error");
    }
  };

  const handleDeleteSlot = async (slotId: string | number) => {
    try {
      await trainerApi.availability.delete(api, slotId);
      showToast("Availability slot deleted", "success");
      fetchAvailability();
    } catch (err: any) {
      showToast(`Failed to delete slot: ${err.message}`, "error");
    }
  };

  // Modal state for block date
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [blockDateForm, setBlockDateForm] = useState({ date: "", reason: "" });

  const handleBlockDate = async () => {
    setShowBlockDateModal(true);
  };

  const handleBlockDateSubmit = async () => {
    if (!blockDateForm.date) { showToast("Date is required", "error"); return; }
    if (!trainerProfileId) { showToast("Trainer profile not loaded yet. Please try again.", "error"); return; }
    try {
      await trainerApi.blockedDates.create(api, { blocked_date: blockDateForm.date, reason: blockDateForm.reason, trainer: trainerProfileId });
      showToast("Date blocked", "success");
      setShowBlockDateModal(false);
      setBlockDateForm({ date: "", reason: "" });
      fetchAvailability();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUnblockDate = async (id: string | number) => {
    try {
      await trainerApi.blockedDates.delete(api, id);
      showToast("Date unblocked", "success");
      fetchAvailability();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Modal state for plan creation
  const [showPlanModal, setShowPlanModal] = useState<"sub" | "workout" | "meal" | null>(null);
  const [planForm, setPlanForm] = useState<Record<string, any>>({ name: "", price: "0", duration_days: "30", description: "" });

  const handleCreatePlan = async () => {
    setShowPlanModal("sub");
    setPlanForm({ name: "", price: "0", duration_days: "30", description: "" });
  };

  const handleCreateWorkoutPlan = async () => {
    setShowPlanModal("workout");
    setPlanForm({ name: "" });
    if (clients.length === 0) fetchClients();
  };

  const handleCreateMealPlan = async () => {
    setShowPlanModal("meal");
    setPlanForm({ name: "" });
    if (clients.length === 0) fetchClients();
  };

  const handlePlanSubmit = async () => {
    if (!planForm.name?.trim()) { showToast("Name is required", "error"); return; }
    try {
      if (showPlanModal === "sub") {
        // Subscription plans endpoint is read-only (GET).
        // Plans are managed by admins. Show info message.
        showToast("Subscription plans are managed by the admin. Contact support to create one.", "error");
        setShowPlanModal(null);
        return;
      } else if (showPlanModal === "workout" || showPlanModal === "meal") {
        // Backend requires: title, trainer, client. The plan is assigned to a
        // specific CLIENT the trainer selects — never the trainer's own id.
        if (!trainerProfileId) {
          showToast("Trainer profile not loaded. Please try again.", "error");
          return;
        }
        if (!planForm.client) {
          showToast("Please select a client for this plan.", "error");
          return;
        }
        const endpoint = showPlanModal === "workout" ? trainerApi.workoutPlans : trainerApi.mealPlans;
        await endpoint.create(api, {
          title: planForm.name,
          description: planForm.description || "",
          trainer: trainerProfileId,
          client: Number(planForm.client),
        });
      }
      showToast("Plan created!", "success");
      setShowPlanModal(null);
      fetchPlans();
    } catch (err: any) {
      const detail = err?.response?.data;
      if (detail && typeof detail === "object") {
        const firstError = Object.values(detail).flat().join(", ");
        showToast(firstError || err.message, "error");
      } else {
        showToast(err.message || "Failed to create plan", "error");
      }
    }
  };

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    const chatType = selectedChat?.type || "community";
    const loadMessages = async () => {
      try {
        let msgs;
        if (chatType === "community") {
          msgs = await trainerApi.chat.communityMessages(api, selectedChat.id);
        } else {
          msgs = await trainerApi.chat.privateMessages(api, selectedChat.id);
        }
        setChatMessages(msgs?.results || msgs || []);
      } catch {
        // silent - chat may not have messages yet
      }
    };
    loadMessages();
  }, [selectedChat, api]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;
    const chatType = selectedChat?.type || "community";

    try {
      if (chatType === "community") {
        await trainerApi.chat.sendCommunityMessage(api, selectedChat.id, messageInput);
      } else {
        await trainerApi.chat.sendPrivateMessage(api, selectedChat.id, messageInput);
      }
      setMessageInput("");
      // Reload messages after sending
      const msgs =
        chatType === "community"
          ? await trainerApi.chat.communityMessages(api, selectedChat.id)
          : await trainerApi.chat.privateMessages(api, selectedChat.id);
      setChatMessages(msgs?.results || msgs || []);
      showToast("Message sent!", "success");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        showToast("Rate limited — please wait before sending another message", "error");
      } else {
        showToast(`Failed to send message: ${err.message}`, "error");
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trainerApi.profile.updateProfile(api, profile);
      showToast("Profile updated successfully!", "success");
      setIsEditingProfile(false);
    } catch (err: any) {
      showToast(`Failed to update profile: ${err.message}`, "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await trainerApi.notifications.markAllRead(api);
      showToast("All marked as read", "success");
      setUnreadCount(0);
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleMarkRead = async (notif: any) => {
    // Trainer notifications expose both `is_read` (new integer-keyed endpoint)
    // and legacy `read_at`/`status` — treat any of them as "already read".
    if (notif.is_read || notif.read_at || notif.status === "read" || notif.status === "clicked") return;
    // Optimistic update; reconcile on failure.
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id
          ? { ...n, is_read: true, read_at: new Date().toISOString(), status: "read" }
          : n
      )
    );
    try {
      await trainerApi.notifications.markRead(api, notif.id);
    } catch {
      // Revert on failure.
      setUnreadCount((c) => c + 1);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, is_read: false, read_at: null, status: "unread" } : n
        )
      );
    }
  };

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully", "success");
  };

  // ── Video Studio Action Handlers ─────────────────────────────────

  const handleEditVideo = async (videoId: string, data: Record<string, unknown>) => {
    try {
      await trainerApi.studio.updateVideo(api, videoId, data);
      showToast("Video updated!", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to update video: ${err.message}`, "error");
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await trainerApi.studio.deleteVideo(api, videoId);
      showToast("Video deleted", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to delete video: ${err.message}`, "error");
    }
  };

  const handleArchiveVideo = async (videoId: string) => {
    try {
      await trainerApi.studio.archiveVideo(api, videoId);
      showToast("Video archived", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to archive video: ${err.message}`, "error");
    }
  };

  const handleRestoreVideo = async (videoId: string) => {
    try {
      await trainerApi.studio.restoreVideo(api, videoId);
      showToast("Video restored", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to restore video: ${err.message}`, "error");
    }
  };

  const handleDuplicateVideo = async (videoId: string) => {
    try {
      await trainerApi.studio.duplicateVideo(api, videoId);
      showToast("Video duplicated!", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to duplicate video: ${err.message}`, "error");
    }
  };

  const handleScheduleVideo = async (videoId: string, scheduledAt: string) => {
    try {
      await trainerApi.studio.scheduleVideo(api, videoId, { scheduled_at: scheduledAt });
      showToast("Video scheduled!", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to schedule video: ${err.message}`, "error");
    }
  };

  const handleCancelSchedule = async (videoId: string) => {
    try {
      await trainerApi.studio.cancelSchedule(api, videoId);
      showToast("Schedule cancelled", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to cancel schedule: ${err.message}`, "error");
    }
  };

  const handleMoveToDraft = async (videoId: string) => {
    try {
      await trainerApi.studio.moveToDraft(api, videoId);
      showToast("Moved to draft", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to move to draft: ${err.message}`, "error");
    }
  };

  const handleProcessVideo = async (videoId: string) => {
    try {
      await trainerApi.studio.processVideo(api, videoId);
      showToast("Processing started!", "success");
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Failed to start processing: ${err.message}`, "error");
    }
  };

  const handleBulkArchive = async () => {
    try {
      await trainerApi.studio.bulkArchive(api, selectedVideoIds);
      showToast(`${selectedVideoIds.length} videos archived`, "success");
      setSelectedVideoIds([]);
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Bulk archive failed: ${err.message}`, "error");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await trainerApi.studio.bulkDelete(api, selectedVideoIds);
      showToast(`${selectedVideoIds.length} videos deleted`, "success");
      setSelectedVideoIds([]);
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Bulk delete failed: ${err.message}`, "error");
    }
  };

  const handleBulkAccessType = async (accessType: string) => {
    try {
      await trainerApi.studio.bulkAccessType(api, selectedVideoIds, accessType);
      showToast(`Access type updated for ${selectedVideoIds.length} videos`, "success");
      setSelectedVideoIds([]);
      fetchMyVideos(true);
    } catch (err: any) {
      showToast(`Bulk update failed: ${err.message}`, "error");
    }
  };

  // Video filter/search changes
  const handleVideoStatusFilterChange = (status: string) => {
    setVideoStatusFilter(status);
    setVideoCursor(null);
    setSelectedVideoIds([]);
  };

  const handleVideoSearchChange = (query: string) => {
    setVideoSearch(query);
    setVideoCursor(null);
  };

  const handleVideoSelectToggle = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]
    );
  };

  const handleVideoSelectAll = () => {
    setSelectedVideoIds(myVideos.map((v: any) => v.id));
  };

  const handleVideoDeselectAll = () => {
    setSelectedVideoIds([]);
  };

  // Analytics drill-down
  const handleSelectAnalyticsVideo = useCallback(async (videoId: string | null) => {
    setSelectedAnalyticsVideoId(videoId);
    if (videoId) {
      fetchDailyAnalytics(videoId);
      fetchFunnelAnalytics(videoId);
    } else {
      setDailyAnalytics([]);
      setFunnelAnalytics(null);
    }
  }, [fetchDailyAnalytics, fetchFunnelAnalytics]);

  const handleAnalyticsDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setAnalyticsDateRange({ start_date: startDate, end_date: endDate });
    if (selectedAnalyticsVideoId) {
      fetchDailyAnalytics(selectedAnalyticsVideoId, { start_date: startDate, end_date: endDate });
    }
  }, [selectedAnalyticsVideoId, fetchDailyAnalytics]);

  const handleExportAnalytics = async () => {
    try {
      const params: Record<string, string> = { format: "csv" };
      if (analyticsDateRange.start_date) params.start_date = analyticsDateRange.start_date;
      if (analyticsDateRange.end_date) params.end_date = analyticsDateRange.end_date;
      const data = await trainerApi.videoAnalytics.exportCsv(api, params);
      const csvData = typeof data === "string" ? data : (data as any)?.data || JSON.stringify(data);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video-analytics.csv";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Analytics exported!", "success");
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, "error");
    }
  };

  // Comment handlers
  const handlePinComment = async (videoId: string, commentId: number) => {
    try {
      await trainerApi.studio.pinComment(api, videoId, commentId);
      showToast("Comment pinned!", "success");
      fetchVideoComments();
    } catch (err: any) {
      showToast(`Failed to pin comment: ${err.message}`, "error");
    }
  };

  const handleUnpinComment = async (videoId: string, commentId: number) => {
    try {
      await trainerApi.studio.unpinComment(api, videoId, commentId);
      showToast("Comment unpinned", "success");
      fetchVideoComments();
    } catch (err: any) {
      showToast(`Failed to unpin comment: ${err.message}`, "error");
    }
  };

  const handleDeleteComment = async (videoId: string, commentId: number) => {
    try {
      await trainerApi.studio.deleteComment(api, videoId, commentId);
      showToast("Comment deleted", "success");
      fetchVideoComments();
    } catch (err: any) {
      showToast(`Failed to delete comment: ${err.message}`, "error");
    }
  };

  // Program handlers
  const handleCreateProgram = async (data: any) => {
    try {
      await trainerApi.trainerPrograms.create(api, data);
      showToast("Program created!", "success");
      fetchPrograms();
    } catch (err: any) {
      showToast(`Failed to create program: ${err.message}`, "error");
    }
  };

  const handleUpdateProgram = async (programId: number, data: any) => {
    try {
      await trainerApi.trainerPrograms.update(api, programId, data);
      showToast("Program updated!", "success");
      fetchPrograms();
      if (selectedProgram?.id === programId) fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to update program: ${err.message}`, "error");
    }
  };

  const handleDeleteProgram = async (programId: number) => {
    try {
      await trainerApi.trainerPrograms.delete(api, programId);
      showToast("Program deleted", "success");
      setSelectedProgram(null);
      fetchPrograms();
    } catch (err: any) {
      showToast(`Failed to delete program: ${err.message}`, "error");
    }
  };

  const handlePublishProgram = async (programId: number) => {
    try {
      await trainerApi.trainerPrograms.publish(api, programId);
      showToast("Program published!", "success");
      fetchPrograms();
      if (selectedProgram?.id === programId) fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to publish program: ${err.message}`, "error");
    }
  };

  const handleUnpublishProgram = async (programId: number) => {
    try {
      await trainerApi.trainerPrograms.unpublish(api, programId);
      showToast("Program unpublished", "success");
      fetchPrograms();
      if (selectedProgram?.id === programId) fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to unpublish program: ${err.message}`, "error");
    }
  };

  const handleDuplicateProgram = async (programId: number) => {
    try {
      await trainerApi.trainerPrograms.duplicate(api, programId);
      showToast("Program duplicated!", "success");
      fetchPrograms();
    } catch (err: any) {
      showToast(`Failed to duplicate program: ${err.message}`, "error");
    }
  };

  const handleSelectProgram = async (program: any | null) => {
    if (program) {
      await fetchProgramDetail(program.id);
      fetchProgramAvailableVideos();
    } else {
      setSelectedProgram(null);
    }
  };

  const handleCreateDay = async (programId: number, data: any) => {
    try {
      await trainerApi.trainerPrograms.createDay(api, programId, data);
      showToast("Day added!", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to add day: ${err.message}`, "error");
    }
  };

  const handleUpdateDay = async (programId: number, dayNumber: number, data: any) => {
    try {
      await trainerApi.trainerPrograms.updateDay(api, programId, dayNumber, data);
      showToast("Day updated!", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to update day: ${err.message}`, "error");
    }
  };

  const handleDeleteDay = async (programId: number, dayNumber: number) => {
    try {
      await trainerApi.trainerPrograms.deleteDay(api, programId, dayNumber);
      showToast("Day removed", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to remove day: ${err.message}`, "error");
    }
  };

  const handleAddVideoToDay = async (programId: number, dayNumber: number, data: any) => {
    try {
      await trainerApi.trainerPrograms.addVideoToDay(api, programId, dayNumber, data);
      showToast("Video added to day!", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to add video: ${err.message}`, "error");
    }
  };

  const handleRemoveVideoFromDay = async (programId: number, dayNumber: number, videoId: number) => {
    try {
      await trainerApi.trainerPrograms.removeVideoFromDay(api, programId, dayNumber, videoId);
      showToast("Video removed from day", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to remove video: ${err.message}`, "error");
    }
  };

  const handleReorderDayVideos = async (programId: number, dayNumber: number, order: number[]) => {
    try {
      await trainerApi.trainerPrograms.reorderDayVideos(api, programId, dayNumber, order);
      showToast("Videos reordered!", "success");
      fetchProgramDetail(programId);
    } catch (err: any) {
      showToast(`Failed to reorder: ${err.message}`, "error");
    }
  };

  // ── Computed Values ────────────────────────────────────────────────

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const notificationCount = notifications.filter(
    (n) => !n.read_at && n.status !== "read" && n.status !== "clicked"
  ).length;

  const badges: Record<string, number> = {};
  if (pendingCount > 0) badges.bookings = pendingCount;
  if (unreadCount > 0) badges.notifications = unreadCount;

  // ── Responsive sidebar ────────────────────────────────────────────
  // Always static flex child. Collapsed on smaller screens.

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const update = () => {
      setSidebarCollapsed(!desktop.matches);
    };
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="h-[100dvh] flex overflow-hidden text-slate-200 font-sans selection:bg-purple-600/30" style={{ backgroundColor: BRAND.bg }}>
      {/* SIDEBAR — always static flex child, 280px expanded / 72px collapsed */}
      <Sidebar
        nav={NAV_ITEMS}
        groups={NAV_GROUPS}
        active={activeTab}
        onSelect={(id) => setActiveTab(id as TabId)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        badges={badges}
        mode="static"
      />

      {/* MAIN CONTENT — flex:1, sits next to sidebar */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header
          className="h-14 flex items-center justify-between px-4 sm:px-6 shrink-0"
          style={{
            background: "rgba(21, 9, 38, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          <div className="flex items-center gap-2">
            {/* Collapse/expand toggle */}
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            {/* Page title */}
            <h1 className="text-base font-semibold text-white capitalize hidden sm:block ml-1">
              {activeTab.replace(/-/g, " ")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Search stub */}
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
              style={{ backgroundColor: BRAND.input, border: `1px solid ${BRAND.border}`, color: BRAND.textDim }}
            >
              <Search size={13} />
              <span>Search...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded ml-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: BRAND.textDim }}>⌘K</kbd>
            </div>
            {/* Notifications */}
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 text-[9px] font-bold rounded-full flex items-center justify-center px-1"
                  style={{ backgroundColor: BRAND.error, color: "white" }}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
            {/* User avatar */}
            <button
              onClick={() => setActiveTab("settings")}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-white/25 transition-colors"
            >
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }}>
                  {((profile?.name || profile?.first_name || user?.name) || "T")[0].toUpperCase()}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
            {activeTab === "dashboard" && (
              <DashboardView
                stats={stats}
                profile={profile}
                bookings={bookings}
                payments={payments}
                loading={!!loading.dashboard}
                pendingCount={pendingCount}
                onAcceptBooking={handleAcceptBooking}
                onRejectBooking={handleRejectBooking}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
              />
            )}
            {activeTab === "bookings" && (
              <BookingsView
                bookings={bookings}
                loading={!!loading.bookings}
                bookingFilter={bookingFilter}
                pendingCount={pendingCount}
                onFilterChange={setBookingFilter}
                onAcceptBooking={handleAcceptBooking}
                onRejectBooking={handleRejectBooking}
              />
            )}
            {activeTab === "clients" && (
              <ClientsView
                clients={clients}
                loading={!!loading.clients}
                clientSearch={clientSearch}
                onSearchChange={setClientSearch}
                api={api}
                showToast={showToast}
              />
            )}
            {activeTab === "coaching" && <CoachingPlansView api={api} showToast={showToast} />}
            {activeTab === "messages" && (
              <MessagesView
                communities={communities}
                selectedChat={selectedChat}
                chatMessages={chatMessages}
                messageInput={messageInput}
                profile={profile}
                loading={!!loading.messages}
                onSelectChat={setSelectedChat}
                onMessageInputChange={setMessageInput}
                onSendMessage={handleSendMessage}
                api={api}
                showToast={showToast}
                socket={socket}
                webrtc={webrtc}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsView
                notifications={notifications}
                unreadCount={unreadCount}
                loading={!!loading.notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
              />
            )}
            {activeTab === "availability" && (
              <AvailabilityView
                availability={availability}
                blockedDates={blockedDates}
                loading={!!loading.availability}
                isAddingSlot={isAddingSlot}
                newSlot={newSlot}
                onToggleAddSlot={() => setIsAddingSlot(!isAddingSlot)}
                onNewSlotChange={setNewSlot}
                onAddSlot={handleAddSlot}
                onDeleteSlot={handleDeleteSlot}
                onBlockDate={handleBlockDate}
                onUnblockDate={handleUnblockDate}
              />
            )}
            {activeTab === "finance" && (
              <EarningsView
                api={api}
                showToast={showToast}
                payments={payments}
                invoices={invoices}
                financeLoading={!!loading.finance}
              />
            )}
            {activeTab === "business" && (
              <BusinessView
                plans={plans}
                workoutPlans={workoutPlans}
                mealPlans={mealPlans}
                loading={!!loading.plans}
                onCreatePlan={handleCreatePlan}
                onCreateWorkoutPlan={handleCreateWorkoutPlan}
                onCreateMealPlan={handleCreateMealPlan}
              />
            )}
            {activeTab === "settings" && (
              <ProfileView
                profile={profile}
                isEditingProfile={isEditingProfile}
                onEditToggle={setIsEditingProfile}
                onProfileChange={setProfile}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
              />
            )}
            {activeTab === "studio-dashboard" && (
              <StudioDashboardView
                data={studioDashboardData}
                loading={!!loading.studio}
                onNavigate={(tab) => setActiveTab(tab as TabId)}
                showToast={showToast}
              />
            )}
            {activeTab === "my-videos" && (
              <MyVideosView
                videos={myVideos}
                loading={!!loading.myVideos}
                nextCursor={videoCursor}
                statusFilter={videoStatusFilter}
                searchQuery={videoSearch}
                selectedVideos={selectedVideoIds}
                onStatusFilterChange={handleVideoStatusFilterChange}
                onSearchChange={handleVideoSearchChange}
                onLoadMore={() => fetchMyVideos(false)}
                onSelectVideo={handleVideoSelectToggle}
                onSelectAll={handleVideoSelectAll}
                onDeselectAll={handleVideoDeselectAll}
                onEditVideo={(video) => handleEditVideo(video.id, video)}
                onDeleteVideo={handleDeleteVideo}
                onArchiveVideo={handleArchiveVideo}
                onRestoreVideo={handleRestoreVideo}
                onDuplicateVideo={handleDuplicateVideo}
                onScheduleVideo={handleScheduleVideo}
                onCancelSchedule={handleCancelSchedule}
                onMoveToDraft={handleMoveToDraft}
                onProcessVideo={handleProcessVideo}
                onBulkArchive={handleBulkArchive}
                onBulkDelete={handleBulkDelete}
                onBulkAccessType={handleBulkAccessType}
                onNavigateToUpload={() => setActiveTab("upload-video")}
                showToast={showToast}
                api={api}
              />
            )}
            {activeTab === "upload-video" && (
              <UploadVideoView
                api={api}
                showToast={showToast}
                onComplete={() => { setActiveTab("my-videos"); fetchMyVideos(true); }}
              />
            )}
            {activeTab === "video-analytics" && (
              <VideoAnalyticsView
                analyticsData={videoAnalytics}
                loading={!!loading.analytics}
                selectedVideoId={selectedAnalyticsVideoId}
                dailyData={dailyAnalytics}
                funnelData={funnelAnalytics}
                bestPostingHour={bestPostingHour}
                onSelectVideo={handleSelectAnalyticsVideo}
                onDateRangeChange={handleAnalyticsDateRangeChange}
                onExport={handleExportAnalytics}
                showToast={showToast}
              />
            )}
            {activeTab === "programs" && (
              <ProgramsView
                programs={programs}
                loading={!!loading.programs}
                selectedProgram={selectedProgram}
                availableVideos={programAvailableVideos}
                onCreateProgram={handleCreateProgram}
                onUpdateProgram={handleUpdateProgram}
                onDeleteProgram={handleDeleteProgram}
                onPublishProgram={handlePublishProgram}
                onUnpublishProgram={handleUnpublishProgram}
                onDuplicateProgram={handleDuplicateProgram}
                onSelectProgram={handleSelectProgram}
                onCreateDay={handleCreateDay}
                onUpdateDay={handleUpdateDay}
                onDeleteDay={handleDeleteDay}
                onAddVideoToDay={handleAddVideoToDay}
                onRemoveVideoFromDay={handleRemoveVideoFromDay}
                onReorderDayVideos={handleReorderDayVideos}
                showToast={showToast}
              />
            )}
            {activeTab === "comments" && (
              <CommentsView
                comments={videoComments}
                loading={!!loading.comments}
                onPinComment={handlePinComment}
                onUnpinComment={handleUnpinComment}
                onDeleteComment={handleDeleteComment}
                showToast={showToast}
              />
            )}
          </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </main>

      {/* BLOCK DATE MODAL */}
      {showBlockDateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ WebkitBackdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">Block Date</h3>
              <button onClick={() => setShowBlockDateModal(false)} className="p-1 rounded-lg hover:bg-white/10 transition"><X size={18} style={{ color: BRAND.textMuted }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Date</label>
                <input type="date" value={blockDateForm.date} onChange={e => setBlockDateForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }} />
              </div>
              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Reason (optional)</label>
                <input type="text" value={blockDateForm.reason} onChange={e => setBlockDateForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g., Personal day, Holiday..." className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button onClick={() => setShowBlockDateModal(false)} color="gray">Cancel</Button>
                <Button onClick={handleBlockDateSubmit} style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }}>Block Date</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" style={{ WebkitBackdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border" style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white">
                {showPlanModal === "sub" ? "New Subscription Plan" : showPlanModal === "workout" ? "New Workout Plan" : "New Meal Plan"}
              </h3>
              <button onClick={() => setShowPlanModal(null)} className="p-1 rounded-lg hover:bg-white/10 transition"><X size={18} style={{ color: BRAND.textMuted }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Plan Name</label>
                <input type="text" value={planForm.name || ""} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter plan name..." className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }} />
              </div>
              {(showPlanModal === "workout" || showPlanModal === "meal") && (
                <>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Client</label>
                    <select value={planForm.client || ""} onChange={e => setPlanForm(f => ({ ...f, client: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }}>
                      <option value="">Select a client…</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.client}>{c.client_name || `Client #${c.client}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Description</label>
                    <textarea value={planForm.description || ""} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Plan description..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none resize-none" style={{ backgroundColor: BRAND.input }} />
                  </div>
                </>
              )}
              {showPlanModal === "sub" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Price (QAR)</label>
                      <input type="number" value={planForm.price || ""} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Duration (days)</label>
                      <input type="number" value={planForm.duration_days || ""} onChange={e => setPlanForm(f => ({ ...f, duration_days: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none" style={{ backgroundColor: BRAND.input }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: BRAND.textMuted }}>Description</label>
                    <textarea value={planForm.description || ""} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Plan description..." rows={3} className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none resize-none" style={{ backgroundColor: BRAND.input }} />
                  </div>
                </>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <Button onClick={() => setShowPlanModal(null)} color="gray">Cancel</Button>
                <Button onClick={handlePlanSubmit} style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }}>Create Plan</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* TOAST */}
      <Toast message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
}

