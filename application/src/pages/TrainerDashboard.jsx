import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  CreditCard,
  Settings,
  Bell,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plus,
  MapPin,
  Video,
  Home as HomeIcon,
  Star,
  Activity,
  Briefcase,
  Search,
  Menu,
  Mic,
  Smartphone,
  Power,
  MessageSquare,
  FileText,
  Send,
  Download,
  LogOut
} from 'lucide-react';
import trainerApi from '../services/trainerApi';
import { Toast, LoadingSpinner } from '../components/ui';
import BRAND from '../constants/brand';

// --- LOGIN VIEW ---
function LoginView({ onLogin, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: BRAND.primary }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: BRAND.accent }} />
      <div className="w-full max-w-md rounded-2xl shadow-2xl border border-white/5 p-8 relative z-10" style={{ backgroundColor: BRAND.card }}>
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
            <Activity size={24} strokeWidth={3} />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Holora<span style={{ color: BRAND.accent }}>Pro</span></span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Trainer Login</h1>
        <p className="text-sm text-slate-400 mb-6">Welcome back to your dashboard</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              className="w-full text-white px-4 py-3 rounded-xl focus:outline-none shadow-inner transition border"
              style={{ backgroundColor: '#1a0d2e', borderColor: BRAND.primary + '40', color: 'white' }}
              onFocus={(e) => e.target.style.borderColor = BRAND.primary}
              onBlur={(e) => e.target.style.borderColor = BRAND.primary + '40'}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-white px-4 py-3 rounded-xl focus:outline-none shadow-inner transition border"
              style={{ backgroundColor: '#1a0d2e', borderColor: BRAND.primary + '40', color: 'white' }}
              onFocus={(e) => e.target.style.borderColor = BRAND.primary}
              onBlur={(e) => e.target.style.borderColor = BRAND.primary + '40'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl text-sm font-bold transition shadow-lg disabled:opacity-50"
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Use your trainer account credentials
        </p>
      </div>
    </div>
  );
}

// --- CUSTOM UI COMPONENTS (from provided code) ---
const TypeIcon = ({ type }) => {
  if (type === 'gym') return <MapPin size={16} className="text-yellow-400" />;
  if (type === 'virtual') return <Video size={16} className="text-fuchsia-400" />;
  if (type === 'home') return <HomeIcon size={16} className="text-emerald-400" />;
  return <Activity size={16} className="text-slate-400" />;
};

const CircularProgress = ({ percentage, color, title, subtitle }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full">
      <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r={radius}
            stroke={color} strokeWidth="8" fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray: circumference, strokeDashoffset, filter: `drop-shadow(0 0 8px ${color}80)` }}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg md:text-xl font-black text-white">{percentage}%</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-xs md:text-sm font-bold text-slate-200">{title}</p>
        <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
  );
};

const BarChart = ({ bookings = [] }) => {
  // Calculate weekly activity from bookings data
  const calculateWeeklyData = () => {
    const today = new Date();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = Array(7).fill(0);

    // Count bookings for last 7 days
    bookings.forEach(booking => {
      try {
        const bookingDate = new Date(booking.booking_date);
        const dayDiff = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < 7) {
          weekData[6 - dayDiff]++;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Normalize to percentages (0-100)
    const max = Math.max(...weekData, 1);
    return weekData.map(val => Math.round((val / max) * 100));
  };

  const data = calculateWeeklyData();

  return (
    <div className="h-full w-full flex items-end justify-between gap-2 sm:gap-4 relative pt-6 pb-2 min-h-[160px]">
      <div className="absolute inset-0 flex flex-col justify-between pt-6 pb-2 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-slate-700/40 border-dashed h-0 flex items-center">
             <span className="text-[9px] text-slate-600 absolute -left-2 sm:-left-4">{100 - (i*25)}</span>
          </div>
        ))}
      </div>
      {data.map((val, i) => (
        <div key={i} className="relative w-full max-w-[32px] h-full flex flex-col justify-end group z-10">
          <div className="relative w-full flex flex-col items-center justify-end transition-all duration-700 ease-out" style={{ height: `${val}%` }}>
            <div className="absolute -top-1.5 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(236,72,153,1)] z-20 transition-all duration-300 group-hover:scale-150 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(236,72,153,1)]"></div>
            <div className="w-full h-full bg-gradient-to-t from-fuchsia-600/20 to-fuchsia-500/80 rounded-t-md z-10 border-t border-fuchsia-400/50 group-hover:from-fuchsia-600/40 transition-colors"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AreaChart = ({ payments = [] }) => {
  // Calculate revenue data from payments
  const calculateRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const today = new Date();
    const revenueByMonth = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = 0;
    }

    // Sum payments by month
    payments.forEach(payment => {
      try {
        const paymentDate = new Date(payment.created_at || payment.date);
        const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (revenueByMonth.hasOwnProperty(key)) {
          revenueByMonth[key] += parseFloat(payment.total_amount || payment.amount || 0);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Normalize to SVG coordinates (0-60)
    const values = Object.values(revenueByMonth);
    const max = Math.max(...values, 1);
    return values.map(v => {
      const normalized = (v / max) * 50 + 5;
      return Math.min(normalized, 55);
    });
  };

  const data = calculateRevenueData();

  // Generate SVG path points
  const points = data.map((y, i) => `${(i * 16.67)},${60 - y}`).join(' ');
  const pathD = `M ${data.map((y, i) => `${(i * 16.67)},${60 - y}`).join(' Q ')} L 100 60 L 0 60 Z`;

  return (
    <div className="h-full w-full relative overflow-hidden min-h-[220px]">
       <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-6 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-slate-700/40 border-dashed h-0 flex items-center">
            <span className="text-[9px] text-slate-600 absolute -left-1">{100 - (i*25)}</span>
          </div>
        ))}
      </div>
      <svg viewBox="-2 -10 104 70" preserveAspectRatio="none" className="w-full h-full z-10 relative pt-2">
        <defs>
          <linearGradient id="gradientCyan" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#7E22CE" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`M ${data.map((y, i) => `${(i * 16.67)},${60 - y}`).join(' L ')} L 100 60 L 0 60 Z`} fill="url(#gradientCyan)" className="transition-all duration-1000" />
        <path d={`M ${data.map((y, i) => `${(i * 16.67)},${60 - y}`).join(' L ')}`} fill="none" stroke="#7E22CE" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(126,34,206,0.8))' }} />
        {data.map((y, i) => (
          <circle key={i} cx={i * 16.67} cy={60 - y} r="2" fill="#fff" className="drop-shadow-[0_0_8px_#7E22CE] hover:r-3 cursor-pointer transition-all"/>
        ))}
      </svg>
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function TrainerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth state
  const [token, setToken] = useState(() => localStorage.getItem('trainer_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('trainer_refresh_token'));
  const [trainerProfileId, setTrainerProfileId] = useState(() => localStorage.getItem('trainer_profile_id'));

  // Application state
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [clientSearch, setClientSearch] = useState('');

  // UI state
  const [bookingFilter, setBookingFilter] = useState('pending');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ day: 'monday', start_time: '09:00', end_time: '10:00' });
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Handle login
  const handleLogin = async (email, password) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await trainerApi.auth.login(email, password);
      const newAccessToken = response.tokens.access_token;
      const newRefreshToken = response.tokens.refresh_token;

      localStorage.setItem('trainer_access_token', newAccessToken);
      localStorage.setItem('trainer_refresh_token', newRefreshToken);
      setToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      // Fetch dashboard to get trainer ID
      const dashboardData = await trainerApi.dashboard.get(newAccessToken);
      if (dashboardData?.trainer?.id) {
        localStorage.setItem('trainer_profile_id', dashboardData.trainer.id);
        setTrainerProfileId(dashboardData.trainer.id);
      }

      showToast('Login successful!', 'success');
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed';
      setLoginError(msg);
      showToast(msg, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      if (token && refreshToken) {
        await trainerApi.auth.logout(token, refreshToken);
      }
    } catch (err) {
      // Logout error is non-critical
    } finally {
      localStorage.removeItem('trainer_access_token');
      localStorage.removeItem('trainer_refresh_token');
      localStorage.removeItem('trainer_profile_id');
      setToken(null);
      setRefreshToken(null);
      setTrainerProfileId(null);
      showToast('Logged out successfully', 'success');
    }
  };

  // Fetch dashboard data
  const fetchDashboard = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }));
      const dashData = await trainerApi.dashboard.get(accessToken);
      // Use trainer-level stats from dashboard response
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

      const profileData = await trainerApi.profile.getMyProfile(accessToken);
      setProfile(profileData || {});

      if (trainerInfo.id) {
        const trainerDetail = await trainerApi.profile.getTrainerDetail(accessToken, trainerInfo.id);
        setProfile(prev => ({ ...prev, ...trainerDetail }));
      }

      // Fetch unread notification count
      trainerApi.notifications.unreadCount(accessToken).then(r => setUnreadCount(r?.unread_count ?? 0)).catch(() => {});
    } catch (err) {
      setError(err.message);
      showToast(`Failed to load dashboard: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false }));
    }
  };

  // Fetch bookings
  const fetchBookings = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, bookings: true }));
      const data = await trainerApi.bookings.list(accessToken);
      setBookings(data?.results || data || []);
    } catch (err) {
      showToast(`Failed to load bookings: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  };

  // Fetch clients
  const fetchClients = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, clients: true }));
      const data = await trainerApi.clients.list(accessToken);
      setClients(data?.results || data || []);
    } catch (err) {
      showToast(`Failed to load clients: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  // Fetch availability + blocked dates
  const fetchAvailability = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, availability: true }));
      const [availData, blockedData] = await Promise.all([
        trainerApi.availability.list(accessToken),
        trainerApi.blockedDates.list(accessToken).catch(() => ({ results: [] })),
      ]);
      setAvailability(availData?.results || availData || []);
      setBlockedDates(blockedData?.results || blockedData || []);
    } catch (err) {
      showToast(`Failed to load availability: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, availability: false }));
    }
  };

  // Fetch plans (subscription + workout + meal)
  const fetchPlans = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, plans: true }));
      const [subPlans, wPlans, mPlans] = await Promise.all([
        trainerApi.plans.list(accessToken).catch(() => []),
        trainerApi.workoutPlans.list(accessToken).catch(() => ({ results: [] })),
        trainerApi.mealPlans.list(accessToken).catch(() => ({ results: [] })),
      ]);
      setPlans(subPlans || []);
      setWorkoutPlans(wPlans?.results || wPlans || []);
      setMealPlans(mPlans?.results || mPlans || []);
    } catch (err) {
      showToast(`Failed to load plans: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, plans: false }));
    }
  };

  // Fetch finance data
  const fetchFinance = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, finance: true }));
      const [paymentData, invoiceData] = await Promise.all([
        trainerApi.finance.payments(accessToken),
        trainerApi.finance.invoices(accessToken)
      ]);
      setPayments(paymentData?.results || paymentData || []);
      setInvoices(invoiceData?.results || invoiceData || []);
    } catch (err) {
      showToast(`Failed to load finance data: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, finance: false }));
    }
  };

  // Fetch communities
  const fetchCommunities = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, messages: true }));
      const data = await trainerApi.chat.communities(accessToken);
      setCommunities(data?.results || data || []);
    } catch (err) {
      showToast(`Failed to load communities: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  // Fetch notifications (try trainer-specific first, fallback to universal)
  const fetchNotifications = async (accessToken) => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      const data = await trainerApi.notifications.list(accessToken);
      let notifs = data?.results || data?.data || data || [];
      // If trainer-specific returns empty, try universal notifications
      if (notifs.length === 0) {
        try {
          const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/HoloraPerformance';
          const uRes = await fetch(`${BASE}/notifications/`, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });
          if (uRes.ok) {
            const uData = await uRes.json();
            notifs = uData?.data?.results || uData?.results || [];
          }
        } catch {} // eslint-disable-line
      }
      setNotifications(notifs);
      // Also refresh unread count
      trainerApi.notifications.unreadCount(accessToken).then(r => setUnreadCount(r?.unread_count ?? 0)).catch(() => {});
    } catch (err) {
      showToast(`Failed to load notifications: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  // Load data when tab changes or token is set
  useEffect(() => {
    if (!token) return;

    if (activeTab === 'dashboard') {
      fetchDashboard(token);
    } else if (activeTab === 'bookings') {
      fetchBookings(token);
    } else if (activeTab === 'clients') {
      fetchClients(token);
    } else if (activeTab === 'availability') {
      fetchAvailability(token);
    } else if (activeTab === 'business') {
      fetchPlans(token);
    } else if (activeTab === 'finance') {
      fetchFinance(token);
    } else if (activeTab === 'messages') {
      fetchCommunities(token);
    } else if (activeTab === 'notifications') {
      fetchNotifications(token);
    }
  }, [activeTab, token]);

  // Initial dashboard load on token change
  useEffect(() => {
    if (token && !stats.total_clients) {
      fetchDashboard(token);
      fetchNotifications(token);
    }
  }, [token]);

  // Action handlers
  const handleAcceptBooking = async (bookingId) => {
    try {
      await trainerApi.bookings.accept(token, bookingId);
      showToast('Booking accepted!', 'success');
      fetchBookings(token);
    } catch (err) {
      showToast(`Failed to accept booking: ${err.message}`, 'error');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await trainerApi.bookings.reject(token, bookingId, '');
      showToast('Booking rejected', 'success');
      fetchBookings(token);
    } catch (err) {
      showToast(`Failed to reject booking: ${err.message}`, 'error');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      await trainerApi.availability.create(token, newSlot);
      showToast('Availability slot added!', 'success');
      setNewSlot({ day: 'monday', start_time: '09:00', end_time: '10:00' });
      setIsAddingSlot(false);
      fetchAvailability(token);
    } catch (err) {
      showToast(`Failed to add slot: ${err.message}`, 'error');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await trainerApi.availability.delete(token, slotId);
      showToast('Availability slot deleted', 'success');
      fetchAvailability(token);
    } catch (err) {
      showToast(`Failed to delete slot: ${err.message}`, 'error');
    }
  };

  const handleAcceptChat = async (roomId) => {
    try {
      await trainerApi.chat.acceptRoom(token, roomId);
      showToast('Chat request accepted!', 'success');
      fetchCommunities(token);
    } catch (err) {
      showToast(`Failed to accept chat: ${err.message}`, 'error');
    }
  };

  const handleRejectChat = async (roomId) => {
    try {
      await trainerApi.chat.rejectRoom(token, roomId);
      showToast('Chat request rejected', 'success');
      setSelectedChat(null);
      fetchCommunities(token);
    } catch (err) {
      showToast(`Failed to reject chat: ${err.message}`, 'error');
    }
  };

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChat || !token) return;
    const loadMessages = async () => {
      try {
        let msgs;
        if (selectedChat.type === 'community') {
          msgs = await trainerApi.chat.communityMessages(token, selectedChat.id);
        } else {
          msgs = await trainerApi.chat.privateMessages(token, selectedChat.id);
        }
        setChatMessages(msgs?.results || msgs || []);
      } catch (err) { /* silent - chat may not have messages yet */ }
    };
    loadMessages();
  }, [selectedChat, token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;

    try {
      if (selectedChat.type === 'community') {
        await trainerApi.chat.sendCommunityMessage(token, selectedChat.id, messageInput);
      } else {
        await trainerApi.chat.sendPrivateMessage(token, selectedChat.id, messageInput);
      }
      setMessageInput('');
      // Reload messages after sending
      const msgs = selectedChat.type === 'community'
        ? await trainerApi.chat.communityMessages(token, selectedChat.id)
        : await trainerApi.chat.privateMessages(token, selectedChat.id);
      setChatMessages(msgs?.results || msgs || []);
      showToast('Message sent!', 'success');
    } catch (err) {
      showToast(`Failed to send message: ${err.message}`, 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await trainerApi.profile.updateProfile(token, profile);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(`Failed to update profile: ${err.message}`, 'error');
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const notificationCount = notifications.filter(n => !n.read_at && n.status !== 'read' && n.status !== 'clicked').length;

  // Show login if not authenticated
  if (!token) {
    return <LoginView onLogin={handleLogin} loading={loginLoading} error={loginError} />;
  }

  // --- DASHBOARD VIEW ---
  const DashboardView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[280px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"></div>
          <h3 className="text-slate-300 font-semibold mb-2 text-sm tracking-wide uppercase shrink-0">Weekly Activity</h3>
          <div className="flex-1 w-full pl-2 sm:pl-4">
             <BarChart bookings={bookings} />
          </div>
        </div>

        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[280px]">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
           <h3 className="text-slate-300 font-semibold mb-2 text-sm tracking-wide uppercase shrink-0">Performance Metrics</h3>
           <div className="flex-1 w-full grid grid-cols-2 gap-4 items-center h-full">
             <CircularProgress percentage={stats.retention_rate ?? 0} color="#7E22CE" title="Retention" subtitle="Last 30 days" />
             <CircularProgress percentage={stats.completion_rate ?? 0} color="#ec4899" title="Completion" subtitle="Overall avg" />
           </div>
        </div>

        <div className="md:col-span-2 2xl:col-span-1 grid grid-cols-2 gap-4 min-h-[280px]">
           <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02),_0_8px_16px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center cursor-pointer hover:bg-[#1a2035] transition group" onClick={() => setActiveTab('bookings')}>
              <div className="w-14 h-14 rounded-full bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="text-yellow-400 drop-shadow-[0_0_5px_rgba(126,34,206,0.8)]" />
              </div>
              <span className="text-3xl font-black text-white mb-1">{pendingCount}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pending Req</span>
           </div>

           <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.02),_0_8px_16px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center group">
              <div className="w-14 h-14 rounded-full bg-slate-800 shadow-[0_0_15px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.05)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
              </div>
              <span className="text-3xl font-black text-white mb-1">{stats.rating || profile.rating || '—'}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg Rating</span>
           </div>

           <div className="col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold text-lg">Total Clients</h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Users size={12}/> Active Members</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 drop-shadow-[0_0_10px_rgba(126,34,206,0.5)]">
                  {stats.total_clients || 0}
                </span>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Clients</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
           <div className="flex justify-between items-center mb-2 z-20 relative shrink-0">
             <h3 className="text-slate-300 font-semibold text-sm tracking-wide uppercase">Revenue Growth</h3>
             <button className="text-xs font-bold bg-slate-800/80 px-4 py-1.5 rounded-full text-slate-300 border border-slate-700 hover:bg-slate-700 transition">This Year</button>
           </div>
           <div className="flex-1 w-full mt-4 pl-1 sm:pl-4">
             <AreaChart payments={payments} />
           </div>
        </div>

        <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col min-h-[400px] max-h-[500px] lg:max-h-[400px]">
          <h3 className="text-slate-300 font-semibold mb-6 text-sm tracking-wide uppercase flex justify-between items-center shrink-0">
            Pending Actions
            {pendingCount > 0 && <span className="w-6 h-6 bg-fuchsia-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-[0_0_8px_rgba(236,72,153,0.8)]">{pendingCount}</span>}
          </h3>

          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {bookings.filter(b => b.status === 'pending').slice(0, 3).map((booking) => (
              <div key={booking.id} className="bg-purple-900/40 rounded-2xl p-4 border border-slate-800 hover:border-purple-500/30 transition-all duration-300 group shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center font-bold text-white shadow-[0_0_10px_rgba(126,34,206,0.4)]">
                      {booking.client_name?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{booking.client_name || 'Unknown Client'}</h4>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">{booking.booking_date} • {booking.start_time?.substring(0, 5)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAcceptBooking(booking.id)} className="flex-1 bg-purple-600/10 hover:bg-purple-600/20 border border-cyan-500/30 text-yellow-400 py-2 rounded-xl text-xs font-bold transition">Accept</button>
                  <button onClick={() => handleRejectBooking(booking.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-bold transition border border-slate-700/50">Reject</button>
                </div>
              </div>
            ))}
            {pendingCount === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm h-full flex flex-col items-center justify-center">
                <CheckCircle2 size={32} className="text-slate-600 mb-3" />
                <p>You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // --- BOOKINGS VIEW ---
  const BookingsView = () => {
    const filteredBookings = bookings.filter(b => {
      if (bookingFilter === 'history') return ['completed', 'rejected', 'cancelled'].includes(b.status);
      return b.status === bookingFilter;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
          <h2 className="text-xl font-bold text-white px-2">Bookings</h2>
          <div className="flex bg-purple-900/40 p-1 rounded-2xl border border-slate-800">
            {['pending', 'confirmed', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setBookingFilter(tab)}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  bookingFilter === tab
                  ? 'bg-purple-600 text-slate-900 shadow-[0_0_15px_rgba(126,34,206,0.5)]'
                  : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab} {tab === 'pending' && pendingCount > 0 && `(${pendingCount})`}
              </button>
            ))}
          </div>
        </div>

        {loading.bookings ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                {booking.status === 'pending' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"></div>}
                {booking.status === 'confirmed' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>}

                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                      booking.status === 'pending' ? 'bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.4)]' :
                      'bg-gradient-to-br from-purple-600 to-purple-700 shadow-[0_0_15px_rgba(126,34,206,0.4)]'
                    }`}>
                      {booking.client_name?.split(' ').map((n, i) => i < 2 ? n[0] : '').join('') || 'C'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white leading-tight">{booking.client_name || 'Unknown'}</h4>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                        {booking.session_type || 'session'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-purple-900/40/50 p-4 rounded-2xl border border-purple-900/40 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><CalendarDays size={14}/> Date</span>
                    <span className="text-slate-200 font-medium">{booking.booking_date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Time</span>
                    <span className="text-slate-200 font-medium">{booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-2"><CreditCard size={14}/> Price</span>
                    <span className="text-yellow-400 font-bold">QAR {booking.total_amount}</span>
                  </div>
                </div>

                {booking.status === 'pending' && (
                  <div className="flex gap-3">
                    <button onClick={() => handleAcceptBooking(booking.id)} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 px-4 py-3 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(126,34,206,0.4)] hover:shadow-[0_0_20px_rgba(126,34,206,0.6)]">
                      Accept
                    </button>
                    <button onClick={() => handleRejectBooking(booking.id)} className="flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
                      <XCircle size={20} />
                    </button>
                  </div>
                )}

                {booking.status === 'confirmed' && (
                  <div className="w-full flex items-center justify-center gap-2 bg-purple-600/10 text-yellow-400 border border-cyan-500/20 py-3 rounded-xl font-semibold">
                     <CheckCircle2 size={18} /> Confirmed
                  </div>
                )}

                {['completed', 'rejected', 'cancelled'].includes(booking.status) && (
                  <div className="w-full flex items-center justify-center py-3 rounded-xl font-semibold bg-slate-800 text-slate-400 capitalize">
                     {booking.status}
                  </div>
                )}
              </div>
            ))}
            {filteredBookings.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-500">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CalendarDays size={24} className="text-slate-600"/>
                 </div>
                 <p>No bookings found in this category.</p>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- CLIENTS VIEW ---
  const ClientsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <h2 className="text-xl font-bold text-white px-2">Client Roster</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Search clients..." className="w-full bg-purple-900/40 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-purple-500 transition-colors shadow-inner" />
        </div>
      </div>

      {loading.clients ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.filter(c => !clientSearch || (c.first_name + ' ' + c.last_name + ' ' + (c.email || '')).toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
            <div key={client.id} className="bg-[#281247] border border-purple-900/40 p-6 rounded-3xl shadow-xl hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition"></div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-yellow-400 border border-slate-700 group-hover:border-purple-500/50 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors">
                    {client.client_name?.split(' ').map(n => n[0]).join('') || 'C'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{client.client_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-cyan-400 shadow-[0_0_5px_rgba(126,34,206,0.8)]' : 'bg-slate-600'}`}></span>
                      <span className="text-xs text-slate-400 capitalize">{client.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-purple-900/40/50 p-4 rounded-2xl border border-purple-900/40">
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Joined</div>
                   <div className="text-sm text-slate-200 font-semibold">{client.joined_at?.substring(0, 10)}</div>
                 </div>
                 <div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Category</div>
                   <div className="text-sm text-yellow-400 font-bold">{client.category}</div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- AVAILABILITY VIEW ---
  const AvailabilityView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Manage Schedule</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">Set your weekly recurring hours.</p>
        </div>
        <button
          onClick={() => setIsAddingSlot(!isAddingSlot)}
          className="flex items-center justify-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(236,72,153,0.5)]"
        >
          {isAddingSlot ? <XCircle size={18} /> : <Plus size={18} />}
          {isAddingSlot ? 'Cancel' : 'Add Slot'}
        </button>
      </div>

      {isAddingSlot && (
        <form onSubmit={handleAddSlot} className="bg-[#281247] border border-fuchsia-500/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(236,72,153,0.1)] mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-white font-bold mb-4">Create New Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Day of Week</label>
              <select
                value={newSlot.day}
                onChange={e => setNewSlot({...newSlot, day: e.target.value})}
                className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none"
              >
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Time</label>
              <input type="time" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Time</label>
              <input type="time" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} className="w-full bg-purple-900/40 border border-slate-700 text-white p-3 rounded-xl focus:border-fuchsia-500 focus:outline-none" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.4)]">Save Slot</button>
        </form>
      )}

      {loading.availability ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
            const daySlots = availability.filter(s => s.day === day);
            if(daySlots.length === 0) return null;

            return (
              <div key={day} className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center gap-4">
                 <div className="w-32">
                   <h4 className="text-white font-bold capitalize text-lg flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(126,34,206,0.8)]"></div>
                     {day}
                   </h4>
                 </div>
                 <div className="flex-1 flex flex-wrap gap-3">
                   {daySlots.map(slot => (
                     <div key={slot.id} className="bg-purple-900/40 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 group hover:border-fuchsia-500/50 transition">
                        <span className="text-slate-300 font-medium text-sm">{slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}</span>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="text-slate-600 hover:text-fuchsia-500 transition">
                          <XCircle size={16} />
                        </button>
                     </div>
                   ))}
                 </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Blocked Dates Section */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Blocked Dates</h3>
            <p className="text-xs text-slate-500 mt-1">Days you're unavailable for bookings.</p>
          </div>
          <button onClick={async () => {
            const date = prompt('Enter date to block (YYYY-MM-DD):');
            if (!date) return;
            const reason = prompt('Reason (optional):', '');
            try {
              await trainerApi.blockedDates.create(token, { date, reason: reason || '' });
              showToast('Date blocked', 'success');
              fetchAvailability(token);
            } catch (err) { showToast(err.message, 'error'); }
          }} className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-sm font-bold transition">
            <Plus size={16} /> Block Date
          </button>
        </div>
        {blockedDates.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No blocked dates</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {blockedDates.map(bd => (
              <div key={bd.id} className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 flex items-center gap-3 group">
                <span className="text-red-400 font-medium text-sm">{bd.date}</span>
                {bd.reason && <span className="text-xs text-slate-500">({bd.reason})</span>}
                <button onClick={async () => {
                  try {
                    await trainerApi.blockedDates.delete(token, bd.id);
                    showToast('Date unblocked', 'success');
                    fetchAvailability(token);
                  } catch (err) { showToast(err.message, 'error'); }
                }} className="text-slate-600 hover:text-red-400 transition">
                  <XCircle size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // --- BUSINESS VIEW (Plans) ---
  const BusinessView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Subscription Plans</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">Manage your training packages and subscriptions.</p>
        </div>
        <button onClick={async () => {
          const name = prompt('Plan name:');
          if (!name) return;
          const price = prompt('Price (QAR):', '0');
          const duration = prompt('Duration (days):', '30');
          const description = prompt('Description:', '');
          try {
            await trainerApi.plans.create(token, { name, price: parseFloat(price) || 0, duration_days: parseInt(duration) || 30, description });
            showToast('Plan created!', 'success');
            fetchPlans(token);
          } catch (err) { showToast(err.message, 'error'); }
        }} className="flex items-center justify-center gap-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(236,72,153,0.5)]">
          <Plus size={18} /> Create Plan
        </button>
      </div>

      {loading.plans ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-[#281247] border border-purple-900/40 p-6 rounded-3xl shadow-xl hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition"></div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-fuchsia-400 mb-1 block">{plan.plan_type} PLAN</span>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${plan.is_active ? 'bg-purple-600/10 text-yellow-400 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-6 flex-1 relative z-10">{plan.description}</p>

              <div className="flex items-end justify-between mt-auto pt-4 border-t border-purple-900/40 relative z-10">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm text-slate-200 font-semibold">{plan.duration_days} Days</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Price</p>
                  <p className="text-lg text-yellow-400 font-bold">QAR {plan.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workout Plans */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Workout Plans</h3>
            <p className="text-xs text-slate-500 mt-1">Your created workout programs.</p>
          </div>
          <button onClick={async () => {
            const name = prompt('Workout plan name:');
            if (!name) return;
            try {
              await trainerApi.workoutPlans.create(token, { name });
              showToast('Workout plan created!', 'success');
              fetchPlans(token);
            } catch (err) { showToast(err.message, 'error'); }
          }} className="flex items-center gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-4 py-2 rounded-xl text-sm font-bold transition">
            <Plus size={16} /> New Workout
          </button>
        </div>
        {workoutPlans.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No workout plans yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workoutPlans.map(wp => (
              <div key={wp.id} className="bg-purple-900/20 border border-purple-900/40 rounded-xl p-4">
                <h4 className="text-white font-bold">{wp.name || wp.title || `Plan #${wp.id}`}</h4>
                <p className="text-xs text-slate-500 mt-1">{wp.description || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meal Plans */}
      <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-lg">Meal Plans</h3>
            <p className="text-xs text-slate-500 mt-1">Your nutrition programs.</p>
          </div>
          <button onClick={async () => {
            const name = prompt('Meal plan name:');
            if (!name) return;
            try {
              await trainerApi.mealPlans.create(token, { name });
              showToast('Meal plan created!', 'success');
              fetchPlans(token);
            } catch (err) { showToast(err.message, 'error'); }
          }} className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-xl text-sm font-bold transition">
            <Plus size={16} /> New Meal Plan
          </button>
        </div>
        {mealPlans.length === 0 ? (
          <p className="text-center py-4 text-slate-500 text-sm">No meal plans yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mealPlans.map(mp => (
              <div key={mp.id} className="bg-purple-900/20 border border-purple-900/40 rounded-xl p-4">
                <h4 className="text-white font-bold">{mp.name || mp.title || `Plan #${mp.id}`}</h4>
                <p className="text-xs text-slate-500 mt-1">{mp.description || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // --- FINANCE VIEW ---
  const FinanceView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Finances & Invoices</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">Track your earnings and payment history.</p>
        </div>
        <button onClick={() => {
          try {
            const csvRows = ['Client,Date,Status,Amount,Currency'];
            payments.forEach(p => csvRows.push(`${p.client_name || p.user || ''},${p.created_at || p.date || ''},${p.status || ''},${p.amount || ''},${p.currency || 'QAR'}`));
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'finance_report.csv'; a.click();
            URL.revokeObjectURL(url);
            showToast('Report exported!', 'success');
          } catch (err) { showToast(err.message, 'error'); }
        }} className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(126,34,206,0.4)] hover:shadow-[0_0_20px_rgba(126,34,206,0.6)]">
          <Download size={18} /> Export Report
        </button>
      </div>

      {loading.finance ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-[#281247] border border-purple-900/40 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl transition"></div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total Earnings</p>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600 drop-shadow-[0_0_10px_rgba(126,34,206,0.3)] mb-4">
               QAR {(payments.reduce((sum, p) => sum + parseFloat(p.converted_amount || 0), 0)).toFixed(2)}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-yellow-400 bg-purple-600/10 px-2 py-0.5 rounded flex items-center gap-1">+12%</span>
              from last month
            </div>
          </div>

          <div className="md:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-purple-900/40 flex justify-between items-center relative z-10">
              <h3 className="text-white font-bold">Recent Payments</h3>
            </div>
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-400 min-w-[600px]">
                 <thead className="bg-purple-900/40/50 text-xs uppercase text-slate-500 border-b border-purple-900/40">
                   <tr>
                     <th className="px-6 py-4 font-bold">Client</th>
                     <th className="px-6 py-4 font-bold">Date</th>
                     <th className="px-6 py-4 font-bold">Status</th>
                     <th className="px-6 py-4 font-bold text-right">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                   {payments.slice(0, 5).map(payment => (
                     <tr key={payment.id} className="hover:bg-purple-900/30 transition cursor-pointer">
                       <td className="px-6 py-4 font-medium text-slate-300">{payment.client_name || 'Unknown'}</td>
                       <td className="px-6 py-4">{payment.created_at?.substring(0, 10)}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${payment.payment_status === 'paid' ? 'bg-purple-600/10 text-yellow-400 border border-cyan-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'}`}>
                           {payment.payment_status}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-yellow-400">{payment.currency} {payment.converted_amount}</td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- NOTIFICATIONS VIEW ---
  const NotificationsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">Notifications {unreadCount > 0 && <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full ml-2">{unreadCount} unread</span>}</h2>
          <p className="text-xs text-slate-500 px-2 mt-1">All your alerts and updates in one place.</p>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button onClick={async () => {
              try {
                await trainerApi.notifications.markAllRead(token);
                showToast('All marked as read', 'success');
                setUnreadCount(0);
                fetchNotifications(token);
              } catch (err) { showToast(err.message, 'error'); }
            }} className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-xl text-sm font-bold transition">
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading.notifications ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-12 shadow-xl text-center">
          <Bell size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No notifications yet</p>
          <p className="text-slate-500 text-sm mt-2">You'll see updates about bookings, payments, and more here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} onClick={async () => {
              if (!notif.read_at && notif.status !== 'read' && notif.status !== 'clicked') {
                try { await trainerApi.notifications.markRead(token, notif.id); setUnreadCount(c => Math.max(0, c - 1)); } catch {}
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString(), status: 'read' } : n));
              }
            }} className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl hover:border-purple-600/60 transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600/20 rounded-2xl flex-shrink-0">
                  <Bell size={20} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-bold text-base mb-1">{notif.title}</h3>
                      <p className="text-slate-400 text-sm">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-slate-500 bg-purple-900/40 px-3 py-1 rounded-full">
                          {notif.notification_type?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!notif.read_at && notif.status !== 'read' && notif.status !== 'clicked' && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- MESSAGES VIEW ---
  const MessagesView = () => (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      <div className={`w-full md:w-80 flex flex-col bg-[#281247] rounded-3xl border border-purple-900/40 shadow-xl overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-purple-900/40 bg-purple-900/40/40">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Search chats..." className="w-full bg-purple-900/40 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-colors shadow-inner" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading.messages ? (
            <LoadingSpinner />
          ) : (
            communities.map(chat => (
              <div key={chat.id} onClick={() => setSelectedChat(chat)} className={`p-3 rounded-2xl mb-1 cursor-pointer transition-all flex items-start gap-3 ${selectedChat?.id === chat.id ? 'bg-purple-600/10 border border-cyan-500/20' : 'hover:bg-slate-800/50 border border-transparent'}`}>
                 <div className="relative">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg bg-gradient-to-br from-fuchsia-600 to-purple-600`}>
                     {chat.name?.[0] || 'C'}
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-center mb-1">
                     <h4 className="text-sm font-bold text-white truncate">{chat.name}</h4>
                   </div>
                   <p className="text-xs text-slate-400 truncate">{chat.description}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[#281247] rounded-3xl border border-purple-900/40 shadow-xl overflow-hidden relative ${!selectedChat ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
         {!selectedChat ? (
           <div className="text-center text-slate-500">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
               <MessageSquare size={32} className="text-slate-600" />
             </div>
             <p className="text-lg font-medium text-slate-400">Select a conversation</p>
             <p className="text-sm mt-2">Choose a community to start chatting.</p>
           </div>
         ) : (
           <>
             <div className="p-4 md:p-6 border-b border-purple-900/40 bg-purple-900/40/40 flex justify-between items-center z-10 backdrop-blur-md">
               <div className="flex items-center gap-4">
                 <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSelectedChat(null)}>
                   <ChevronRight size={24} className="rotate-180" />
                 </button>
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-[0_0_10px_rgba(126,34,206,0.4)] bg-gradient-to-br from-fuchsia-600 to-purple-600`}>
                   {selectedChat.name?.[0]}
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-white">{selectedChat.name}</h3>
                   <p className="text-xs text-yellow-400">Active</p>
                 </div>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative">
                {chatMessages.length === 0 ? (
                  <div className="flex justify-center">
                    <div className="bg-slate-800/50 text-slate-400 p-4 rounded-2xl text-sm text-center">
                      <p>No messages yet in {selectedChat.name}</p>
                      <p className="text-xs mt-1 text-slate-500">Start the conversation!</p>
                    </div>
                  </div>
                ) : chatMessages.map((msg, i) => {
                  const isMine = msg.sender?.email === profile?.email || msg.sender?.id === profile?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-2xl max-w-[80%] md:max-w-[70%] border shadow-md ${isMine ? 'bg-purple-600/30 border-purple-500/30 rounded-tr-sm' : 'bg-slate-800 border-slate-700 rounded-tl-sm'}`}>
                        {!isMine && <p className="text-xs font-bold text-yellow-400 mb-1">{msg.sender?.name || msg.sender?.first_name || 'User'}</p>}
                        <p className="text-sm text-slate-200">{msg.content || msg.text || ''}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  );
                })}
             </div>

             <div className="p-4 bg-purple-900/40 border-t border-purple-900/40 z-10 backdrop-blur-md">
               <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                 <button type="button" className="p-3 text-slate-400 hover:text-yellow-400 bg-slate-800 rounded-xl transition">
                   <Plus size={20} />
                 </button>
                 <input
                   type="text"
                   value={messageInput}
                   onChange={(e) => setMessageInput(e.target.value)}
                   placeholder="Type a message..."
                   className="flex-1 bg-[#281247] border border-slate-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition shadow-inner"
                 />
                 <button
                   type="submit"
                   className="p-3 bg-purple-600 text-slate-900 rounded-xl hover:bg-cyan-400 transition shadow-[0_0_10px_rgba(126,34,206,0.4)]"
                 >
                   <Send size={20} />
                 </button>
               </form>
             </div>
           </>
         )}
      </div>
    </div>
  );

  // --- SETTINGS VIEW ---
  const ProfileView = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {!isEditingProfile ? (
        <>
          {/* Profile Details View */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
            <div>
              <h2 className="text-xl font-bold text-white px-2">My Profile</h2>
              <p className="text-xs text-slate-500 px-2 mt-1">View and manage your profile information.</p>
            </div>
            <button onClick={() => setIsEditingProfile(true)} className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(126,34,206,0.4)] hover:shadow-[0_0_20px_rgba(126,34,206,0.6)]">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
              <h3 className="text-white font-bold mb-6">Personal Information</h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Full Name</p>
                  <p className="text-white text-lg">{profile.name || profile.full_name || '—'}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Email Address</p>
                  <p className="text-white">{profile.email || '—'}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Phone Number</p>
                  <p className="text-white">{profile.phone || '—'}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Primary Specialty</p>
                  <p className="text-white">{profile.specialty || profile.specialization || '—'}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
              <h3 className="text-white font-bold mb-6">Business Details</h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Hourly Rate (QAR)</p>
                  <p className="text-white text-lg font-bold">{profile.hourly_rate || '—'}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Experience (Years)</p>
                  <p className="text-white text-lg">{profile.experience || '—'}</p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Verification Status</p>
                  <p className={`text-lg font-bold ${profile.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {profile.is_verified ? '✓ Verified' : 'Pending Verification'}
                  </p>
                </div>
                <div className="border-t border-purple-900/40 pt-4">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Edit Profile Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
            <div>
              <h2 className="text-xl font-bold text-white px-2">Edit Profile</h2>
              <p className="text-xs text-slate-500 px-2 mt-1">Update your profile information.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditingProfile(false)} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
                Cancel
              </button>
              <button onClick={handleUpdateProfile} className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-400 text-slate-900 px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-[0_0_15px_rgba(244,190,105,0.4)] hover:shadow-[0_0_20px_rgba(244,190,105,0.6)]">
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
              <h3 className="text-white font-bold mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
                  <input type="text" value={profile.name || profile.full_name || ''} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                  <input type="email" value={profile.email || ''} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Phone Number</label>
                  <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Primary Specialty</label>
                  <input type="text" value={profile.specialty || profile.specialization || ''} onChange={(e) => setProfile({...profile, specialty: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-400"></div>
              <h3 className="text-white font-bold mb-6">Business Details</h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Hourly Rate (QAR)</label>
                  <input type="number" value={profile.hourly_rate || ''} onChange={(e) => setProfile({...profile, hourly_rate: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Experience (Years)</label>
                  <input type="number" value={profile.experience || ''} onChange={(e) => setProfile({...profile, experience: e.target.value})} className="w-full bg-purple-900/40 border border-purple-900/60 text-white p-3 rounded-xl focus:border-purple-500 focus:outline-none shadow-inner transition" />
                </div>
                <div className="pt-4 border-t border-purple-900/40">
                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#150926] text-slate-200 font-sans selection:bg-purple-600/30 flex overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-[#1a0d2e] border-r border-purple-900/40 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-30">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(126,34,206,0.5)]">
             <Activity className="text-[#0b0e14]" size={24} strokeWidth={3} />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">Holora<span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(126,34,206,0.5)]">Pro</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4 mt-2">Main Menu</div>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'bookings', icon: CalendarDays, label: 'Bookings', badge: pendingCount },
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'messages', icon: MessageSquare, label: 'Chat & Community' },
            { id: 'availability', icon: Clock, label: 'Availability' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                ? 'bg-gradient-to-r from-purple-600/20 to-transparent border-l-4 border-yellow-400 text-yellow-400 font-bold shadow-[inset_0_2px_10px_rgba(126,34,206,0.05)]'
                : 'text-slate-400 hover:bg-purple-900/30 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={`${activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(126,34,206,0.8)]' : 'group-hover:scale-110 transition-transform'}`} />
                {item.label}
              </div>
              {item.badge > 0 && (
                <span className="bg-fuchsia-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4 mt-8">Business</div>
          {[
            { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
            { id: 'finance', icon: FileText, label: 'Earnings & Invoices' },
            { id: 'business', icon: Briefcase, label: 'Subscriptions' },
            { id: 'settings', icon: Settings, label: 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                ? 'bg-gradient-to-r from-purple-600/20 to-transparent border-l-4 border-yellow-400 text-yellow-400 font-bold shadow-[inset_0_2px_10px_rgba(126,34,206,0.05)]'
                : 'text-slate-400 hover:bg-purple-900/30 hover:text-slate-200 border-l-4 border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={`${activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(126,34,206,0.8)]' : 'group-hover:scale-110 transition-transform'}`} />
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        {/* User Profile Box */}
        <div className="p-6 m-4 bg-[#281247] rounded-3xl border border-purple-900/40 shadow-xl flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full border-2 border-yellow-400/50 p-0.5 overflow-hidden shadow-[0_0_10px_rgba(126,34,206,0.3)] bg-purple-900/50 flex items-center justify-center">
                {profile.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold">
                    {(profile.name || profile.first_name || 'T')?.[0]?.toUpperCase()}
                  </div>
                )}
             </div>
             <div className="overflow-hidden flex-1">
               <div className="text-sm font-bold text-white truncate">
                 {profile.name || profile.first_name || 'Trainer'}
               </div>
               <div className="text-xs text-yellow-400 truncate">
                 {profile.is_verified && '✓ Verified'}
                 {profile.rating && profile.is_verified && ' • '}
                 {profile.rating && `${profile.rating}★`}
                 {!profile.is_verified && !profile.rating && 'Trainer'}
               </div>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2 bg-purple-900/40 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition">
             <Power size={14}/> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Top Header */}
        <header className="h-20 md:h-24 bg-[#150926]/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6 md:px-10 border-b border-purple-900/40">
          <div className="md:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(126,34,206,0.5)]">
              <Activity className="text-[#0b0e14]" size={18} strokeWidth={3} />
            </div>
            <span className="text-xl font-black text-white tracking-tight">HoloraPro</span>
          </div>

          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
               <span className="w-2 h-8 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(126,34,206,0.8)] inline-block"></span>
               {activeTab.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('notifications')} className={`relative p-3 transition rounded-2xl border shadow-lg group ${activeTab === 'notifications' ? 'text-yellow-400 bg-purple-600/10 border-purple-600/60 shadow-purple-500/20' : 'text-slate-400 hover:text-white bg-[#281247] border-purple-900/40 hover:shadow-cyan-500/20'}`}>
              <Bell size={20} className="group-hover:scale-110 transition-transform"/>
              {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-fuchsia-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(236,72,153,1)]">{notificationCount}</span>}
            </button>
            <div className="md:hidden w-10 h-10 rounded-full border border-yellow-400/50 p-0.5 overflow-hidden shadow-[0_0_10px_rgba(126,34,206,0.3)]">
                <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar relative">

          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'bookings' && <BookingsView />}
            {activeTab === 'clients' && <ClientsView />}
            {activeTab === 'messages' && <MessagesView />}
            {activeTab === 'notifications' && <NotificationsView />}
            {activeTab === 'availability' && <AvailabilityView />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'business' && <BusinessView />}
            {activeTab === 'settings' && <ProfileView />}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#281247]/90 backdrop-blur-xl border border-slate-800 rounded-3xl z-30 pb-safe shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-around p-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
              { id: 'bookings', icon: CalendarDays, label: 'Pending', badge: pendingCount },
              { id: 'notifications', icon: Bell, label: 'Alerts', badge: notificationCount },
              { id: 'messages', icon: MessageSquare, label: 'Chat' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                  activeTab === item.id ? 'text-yellow-400 bg-purple-600/10 shadow-[inset_0_0_15px_rgba(126,34,206,0.1)]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`mb-1 transition-transform ${activeTab === item.id ? '-translate-y-1' : ''}`}>
                  <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(126,34,206,0.8)]' : ''} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider transition-all ${activeTab === item.id ? 'opacity-100' : 'opacity-0 absolute bottom-2'}`}>
                  {item.label}
                </span>

                {item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-fuchsia-500 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </main>

      {/* TOASTS */}
      <div className="fixed bottom-24 md:bottom-6 right-6 space-y-2 z-40">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}} />
    </div>
  );
}
