/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useMemo } from 'react';

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

// ─── WORLD DATA ───────────────────────────────────────────────────────────────
const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji",
  "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const COUNTRY_CITY_MAP = {
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Miami", "San Francisco", "Las Vegas"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Liverpool", "Bristol"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Dhahran"],
  "Qatar": ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Stuttgart"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes"],
};

const ALL_TIMEZONES = [
  { label: "UTC−12:00 — Baker Island", value: "Etc/GMT+12" },
  { label: "UTC−11:00 — American Samoa", value: "Pacific/Pago_Pago" },
  { label: "UTC−10:00 — Hawaii", value: "Pacific/Honolulu" },
  { label: "UTC−09:00 — Alaska", value: "America/Anchorage" },
  { label: "UTC−08:00 — Los Angeles / Vancouver", value: "America/Los_Angeles" },
  { label: "UTC−07:00 — Denver / Phoenix", value: "America/Denver" },
  { label: "UTC−06:00 — Chicago / Mexico City", value: "America/Chicago" },
  { label: "UTC−05:00 — New York / Bogotá", value: "America/New_York" },
  { label: "UTC−03:00 — São Paulo / Buenos Aires", value: "America/Sao_Paulo" },
  { label: "UTC+00:00 — London / Reykjavik", value: "Europe/London" },
  { label: "UTC+01:00 — Paris / Berlin / Lagos", value: "Europe/Paris" },
  { label: "UTC+02:00 — Cairo / Johannesburg", value: "Africa/Cairo" },
  { label: "UTC+03:00 — Moscow / Nairobi / Riyadh", value: "Asia/Riyadh" },
  { label: "UTC+03:30 — Tehran", value: "Asia/Tehran" },
  { label: "UTC+04:00 — Dubai / Baku", value: "Asia/Dubai" },
  { label: "UTC+05:00 — Karachi / Tashkent", value: "Asia/Karachi" },
  { label: "UTC+05:30 — Mumbai / New Delhi", value: "Asia/Kolkata" },
  { label: "UTC+07:00 — Bangkok / Jakarta", value: "Asia/Bangkok" },
  { label: "UTC+08:00 — Beijing / Singapore / Perth", value: "Asia/Singapore" },
  { label: "UTC+09:00 — Tokyo / Seoul", value: "Asia/Tokyo" },
  { label: "UTC+10:00 — Sydney / Port Moresby", value: "Australia/Sydney" },
  { label: "UTC+12:00 — Auckland / Fiji", value: "Pacific/Auckland" },
];

const ALL_CURRENCIES = [
  { value: "AED", label: "AED — UAE Dirham" }, { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" }, { value: "GBP", label: "GBP — British Pound" },
  { value: "SAR", label: "SAR — Saudi Riyal" }, { value: "QAR", label: "QAR — Qatari Rial" },
  { value: "AUD", label: "AUD — Australian Dollar" }, { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "INR", label: "INR — Indian Rupee" }, { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CNY", label: "CNY — Chinese Yuan" }, { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "MYR", label: "MYR — Malaysian Ringgit" }, { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "BDT", label: "BDT — Bangladeshi Taka" }, { value: "EGP", label: "EGP — Egyptian Pound" },
  { value: "TRY", label: "TRY — Turkish Lira" }, { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "BRL", label: "BRL — Brazilian Real" }, { value: "MXN", label: "MXN — Mexican Peso" },
];

// Values match the API enum exactly
const CATEGORIES = [
  { value: "fitness", label: "💪 Fitness" },
  { value: "yoga", label: "🧘 Yoga" },
  { value: "martial_arts", label: "🥋 Martial Arts" },
  { value: "running", label: "🏃 Running" },
  { value: "cycling", label: "🚴 Cycling" },
  { value: "dance", label: "💃 Dance" },
  { value: "wellness", label: "🌿 Wellness" },
  { value: "sports", label: "⚽ Sports" },
  { value: "workshop", label: "📋 Workshop / Retreat" },
  { value: "other", label: "✨ Other" },
];

const STEPS = [
  { id: 1, label: "Organizer" }, { id: 2, label: "Details" }, { id: 3, label: "Location" },
  { id: 4, label: "Date & Time" }, { id: 5, label: "Pricing" }, { id: 6, label: "Media" },
  { id: 7, label: "Visibility" }, { id: 8, label: "Review" },
];

const VISIBILITY_PACKS = [
  {
    id: "event_none", name: "Standard", price: 0, label: "Free — included",
    desc: "Listed in Holora feed after approval. Visible to all community members.",
    color: "#cbd5e1", accent: "rgba(203,213,225,0.1)"
  },
  {
    id: "event_boost_starter", name: "BOOST", price: 19, label: "€19 one-time",
    desc: "Priority placement in feed for 7 days. 3× more views on average.",
    color: "#7e22ce", accent: "rgba(126,34,206,0.15)"
  },
  {
    id: "event_boost_featured", name: "FEATURED", price: 49, label: "€49 one-time",
    desc: "Top of feed + spotlight for 14 days. Push notification to nearby members.",
    color: "#f4be69", accent: "rgba(244,190,105,0.15)", popular: true
  },
];

function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#150926', surface: 'rgba(40,18,71,0.5)', inputBg: 'rgba(255,255,255,0.02)',
  border: 'rgba(126,34,206,0.3)', borderFocus: '#f4be69',
  yellow: '#f4be69', yellowGlow: 'rgba(244,190,105,0.15)',
  text: '#F7F7F7', textMuted: 'rgba(247,247,247,0.55)', textDim: 'rgba(247,247,247,0.3)',
  purple: '#7e22ce', green: '#10b981',
};

const inputStyle = {
  width: '100%', background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 12,
  padding: '14px 16px', color: C.text, fontSize: 15, outline: 'none',
  boxSizing: 'border-box', fontFamily: '"Figtree",sans-serif', transition: 'all 0.3s',
};

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700, color: C.textMuted, marginBottom: 8,
        letterSpacing: '0.05em', fontFamily: 'Helvetica,Arial,sans-serif', textTransform: 'uppercase'
      }}>
        {label}{required && <span style={{ color: C.yellow, marginLeft: 4 }}>*</span>}
      </label>
      {hint && <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 8, fontFamily: '"Figtree",sans-serif' }}>{hint}</p>}
      {children}
      {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 6, fontWeight: 600, fontFamily: '"Figtree",sans-serif' }}>⚠ {error}</p>}
    </div>
  );
}

function FInput({ value, onChange, placeholder, type = 'text', min, max, step, readOnly }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value ?? ''} min={min} max={max} step={step} readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        borderColor: focused ? C.borderFocus : C.border,
        boxShadow: focused ? `0 0 0 3px ${C.yellowGlow}` : 'none',
      }}
    />
  );
}

function FTextarea({ value, onChange, placeholder, rows = 4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value ?? ''} rows={rows}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        ...inputStyle, resize: 'vertical',
        borderColor: focused ? C.borderFocus : C.border,
        boxShadow: focused ? `0 0 0 3px ${C.yellowGlow}` : 'none',
      }}
    />
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
      transition: 'all 0.2s', cursor: 'pointer', flex: 1,
      border: active ? `1px solid ${C.yellow}` : `1px solid ${C.border}`,
      background: active ? C.yellowGlow : C.inputBg,
      color: active ? C.yellow : C.textMuted,
      fontFamily: '"Figtree",sans-serif',
    }}>{children}</button>
  );
}

// ─── SEARCHABLE DROPDOWN ──────────────────────────────────────────────────────
// IMPORTANT: Do NOT use `useEffect([open])` calling setQ — causes infinite re-renders
// in React 19. Reset q in click handlers only.
// Do NOT use `autoFocus` — triggers browser focus events during React 19 StrictMode
// double-invocation. Use imperative ref.focus() in an effect that calls NO setState.
function SearchSelect({ value, onChange, options, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click — q reset in handler, NOT in a [open] setState effect
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQ('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Imperatively focus search input when dropdown opens — NO setState here
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const displayVal = options.find(o => (o.value ?? o) === value);
  const filtered = options.filter(o => (o.label ?? o).toLowerCase().includes(q.toLowerCase())).slice(0, 80);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        style={{
          ...inputStyle,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderColor: open ? C.borderFocus : C.border,
          boxShadow: open ? `0 0 0 3px ${C.yellowGlow}` : 'none',
          opacity: disabled ? 0.5 : 1,
          background: disabled ? 'rgba(255,255,255,0.01)' : C.inputBg,
        }}
      >
        <span style={{ color: displayVal ? C.text : C.textMuted, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayVal ? (displayVal.label ?? displayVal) : placeholder}
        </span>
        <span style={{ color: C.textDim, fontSize: 12, marginLeft: 8, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && !disabled && (
        <div style={{
          position: 'absolute', zIndex: 999, top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#1e0d33', border: `1px solid ${C.border}`, borderRadius: 14,
          maxHeight: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}` }}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search..."
              onClick={e => e.stopPropagation()}
              style={{ ...inputStyle, padding: '10px 14px', borderRadius: 10, fontSize: 14 }}
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {filtered.length === 0
              ? <div style={{ padding: 16, color: C.textMuted, fontSize: 14, fontFamily: '"Figtree",sans-serif' }}>No results</div>
              : filtered.map(o => {
                const v = o.value ?? o;
                const l = o.label ?? o;
                const sel = value === v;
                return (
                  <div
                    key={v}
                    onClick={() => { onChange(v); setOpen(false); setQ(''); }}
                    style={{
                      padding: '12px 16px', fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
                      background: sel ? C.yellowGlow : 'transparent',
                      color: sel ? C.yellow : C.text,
                      fontFamily: '"Figtree",sans-serif', fontWeight: sel ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(126,34,206,0.2)'; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                  >{l}</div>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 15, left: 16, right: 16, height: 2, background: C.border, zIndex: 0 }} />
      <div style={{
        position: 'absolute', top: 15, left: 16, height: 2, background: C.yellow, zIndex: 0,
        transition: 'width 0.4s ease',
        width: `calc(${(current - 1) / (STEPS.length - 1) * 100}% - 32px)`,
      }} />
      {STEPS.map(s => {
        const active = s.id === current;
        const past = s.id < current;
        return (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, width: 40 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, fontFamily: 'Helvetica,Arial,sans-serif', transition: 'all 0.3s',
              background: active ? C.yellow : past ? C.green : '#1e0d33',
              color: active || past ? '#150926' : C.textDim,
              border: active || past ? 'none' : `1px solid ${C.border}`,
              boxShadow: active ? `0 0 16px ${C.yellowGlow}` : 'none',
            }}>
              {past ? '✓' : s.id}
            </div>
            {active && (
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: C.yellow, whiteSpace: 'nowrap', position: 'absolute', top: 44, fontFamily: '"Figtree",sans-serif',
              }}>{s.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SubmitEvent() {
  const vw = useWindowWidth();
  const isMobile = vw < 640;
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'Asia/Dubai'; }
  }, []);

  const [form, setForm] = useState({
    // Step 1 — Organizer
    organizer_type: 'private',
    organizer_display_name: '', organizer_email: '', organizer_phone: '',
    nationality: '', country: '',
    legal_name: '', registration_number: '', registered_address: '',
    representative_name: '', representative_role: '',
    // Step 2 — Event Details
    title: '', category: '', summary: '', description: '', languages: '', tags: '',
    // Step 3 — Location
    event_type: 'in_person',
    event_country: '', event_city: '', venue_name: '', venue_address: '', google_maps_link: '',
    online_url: '', online_platform: '',
    // Step 4 — Date & Time
    timezone: detectedTz, start_date: '', start_time: '', end_date: '', end_time: '',
    // Step 5 — Pricing
    price_type: 'free', price_per_person: '', currency: 'USD',
    ticket_required: false, ticket_url: '',
    // Step 6 — Media
    cover_image_url: '',
    // Step 7 — Visibility
    visibility_pack: 'event_none',
    // Step 8 — Confirm
    confirm_rights: false, confirm_lawful: false,
  });

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const toggle = k => () => setForm(f => ({ ...f, [k]: !f[k] }));
  const isCompany = form.organizer_type === 'company';
  const isInPerson = form.event_type === 'in_person' || form.event_type === 'hybrid';
  const isOnline = form.event_type === 'online' || form.event_type === 'hybrid';

  const availableCities = useMemo(() => {
    if (!form.event_country) return [];
    const known = COUNTRY_CITY_MAP[form.event_country];
    if (known) return known.map(c => ({ label: c, value: c }));
    return [{ label: `${form.event_country} City`, value: `${form.event_country} City` }];
  }, [form.event_country]);

  const handleEventCountryChange = v => {
    setForm(f => ({ ...f, event_country: v, event_city: '' }));
  };

  const validate = s => {
    const e = {};
    if (s === 1) {
      if (!form.organizer_display_name.trim()) e.organizer_display_name = 'Required';
      if (!form.organizer_email.trim() || !/\S+@\S+\.\S+/.test(form.organizer_email)) e.organizer_email = 'Valid email required';
      if (!form.nationality) e.nationality = 'Required';
      if (!form.country) e.country = 'Required';
      if (isCompany) {
        if (!form.legal_name.trim()) e.legal_name = 'Required for companies';
        if (!form.registration_number.trim()) e.registration_number = 'Required';
        if (!form.registered_address.trim()) e.registered_address = 'Required';
      }
    }
    if (s === 2) {
      if (!form.title.trim()) e.title = 'Required';
      if (!form.category) e.category = 'Required';
      if (!form.description.trim()) e.description = 'Required — describe your event';
    }
    if (s === 3) {
      if (isInPerson) {
        if (!form.event_country) e.event_country = 'Required';
        if (!form.event_city) e.event_city = 'Required';
        if (!form.venue_address.trim()) e.venue_address = 'Full address required';
      }
      if (isOnline) {
        if (!form.online_url.trim() || !form.online_url.startsWith('https://')) e.online_url = 'Valid https:// URL required';
      }
    }
    if (s === 4) {
      if (!form.start_date || !form.start_time) e.start_at = 'Start date & time required';
      if (!form.end_date || !form.end_time) e.end_at = 'End date & time required';
      if (form.start_date && form.end_date && form.start_time && form.end_time) {
        if (new Date(`${form.end_date}T${form.end_time}`) <= new Date(`${form.start_date}T${form.start_time}`))
          e.end_at = 'End must be after start';
      }
    }
    if (s === 5) {
      if (form.price_type === 'paid') {
        if (!form.price_per_person || parseFloat(form.price_per_person) <= 0) e.price_per_person = 'Must be > 0';
      }
      if (form.ticket_required && form.ticket_url && !form.ticket_url.startsWith('https://')) e.ticket_url = 'Must start with https://';
    }
    if (s === 6) {
      if (!form.cover_image_url.trim()) e.cover_image_url = 'Cover image is required';
    }
    if (s === 8) {
      if (!form.confirm_rights) e.confirm_rights = 'Required';
      if (!form.confirm_lawful) e.confirm_lawful = 'Required';
    }
    return e;
  };

  const nextStep = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); window.scrollTo(0, 0); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };
  const prevStep = () => { setErrors({}); setStep(s => s - 1); window.scrollTo(0, 0); };

  const handleUpload = (file, field, setLoading) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Max 10MB.'); return; }
    setLoading(true);
    const localUrl = URL.createObjectURL(file);
    setTimeout(() => { set(field)(localUrl); setLoading(false); }, 600);
  };

  const handleSubmit = async () => {
    const e = validate(8);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    try {
      // Combine separate date + time fields into ISO datetime strings
      const start_at = `${form.start_date}T${form.start_time}:00`;
      const end_at = `${form.end_date}T${form.end_time}:00`;

      const payload = {
        organizer_type: form.organizer_type,
        organizer_display_name: sanitize(form.organizer_display_name.trim()),
        organizer_email: form.organizer_email.trim().toLowerCase(),
        organizer_phone: form.organizer_phone || '',
        country: form.country || '',
        title: sanitize(form.title.trim()),
        category: form.category,
        summary: form.summary || '',
        description: sanitize(form.description.trim()),
        languages: form.languages || '',
        tags: form.tags || '',
        event_type: form.event_type,
        city: form.event_city || '',
        venue_name: form.venue_name || '',
        venue_address: form.venue_address || '',
        google_maps_link: form.google_maps_link || '',
        online_url: form.online_url || '',
        online_platform: form.online_platform || '',
        timezone: form.timezone,
        start_at,
        end_at,
        price_type: form.price_type,
        price_per_person: form.price_per_person || '0',
        currency: form.currency,
        ticket_required: form.ticket_required,
        ticket_url: form.ticket_url || '',
        cover_image_url: form.cover_image_url || '',
        visibility_pack: form.visibility_pack,
        confirm_rights: form.confirm_rights,
        confirm_lawful: form.confirm_lawful,
      };

      // Company-specific fields
      if (form.organizer_type === 'company') {
        payload.legal_name = form.legal_name || '';
        payload.registration_number = form.registration_number || '';
        payload.registered_address = form.registered_address || '';
        payload.representative_name = form.representative_name || '';
        payload.representative_role = form.representative_role || '';
      }

      const res = await fetch(`${API_BASE}/events/events/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = await res.json();
        const msg = data.non_field_errors?.[0]
          || Object.values(data).flat().join(' ')
          || 'Validation error.';
        setErrors({ submit: msg });
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();
      setRefId(data.ref_id || 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Connection error. Please try again.' });
    }
    setSubmitting(false);
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: '"Figtree",sans-serif' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');`}</style>
        <div style={{
          maxWidth: 480, width: '100%', background: C.surface, borderRadius: 28, padding: 48,
          border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', boxShadow: '0 32px 64px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 24px', fontSize: 36
          }}>✅</div>
          <h2 style={{ color: C.text, fontWeight: 700, fontSize: 28, margin: '0 0 12px', fontFamily: 'Helvetica,Arial,sans-serif' }}>
            Event Submitted!
          </h2>
          <p style={{ color: C.textMuted, fontSize: 16, margin: '0 0 24px', lineHeight: 1.6 }}>
            Hey <strong style={{ color: C.yellow }}>{form.organizer_display_name || 'there'}</strong> 👋<br />
            Your event is under review. Confirmation sent to <span style={{ color: C.yellow }}>{form.organizer_email}</span>.
          </p>
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: '20px 24px',
            border: `1px solid ${C.border}`, marginBottom: 16
          }}>
            <p style={{ color: C.textDim, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>Reference ID</p>
            <p style={{ color: C.yellow, fontWeight: 700, fontSize: 28, letterSpacing: '0.15em', margin: 0, fontFamily: 'Helvetica,Arial,sans-serif' }}>{refId}</p>
          </div>
          <p style={{ color: 'rgba(244,190,105,0.8)', fontSize: 14, margin: 0 }}>
            ⏱ Decision within <strong>24–48 hours</strong>. Approved events go live on the Holora app.
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN FORM ───────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');
        html,body{margin:0;padding:0;background:${C.bg};min-height:100vh;font-family:'Figtree',sans-serif;overflow-x:hidden;}
        .glass-wrap{position:relative;z-index:1;max-width:800px;width:100%;margin:48px auto;
          background:rgba(40,18,71,0.45);backdrop-filter:blur(20px);
          border:1px solid rgba(244,190,105,0.12);border-radius:28px;padding:48px 52px;
          box-shadow:0 32px 80px rgba(0,0,0,0.5);}
        @media(max-width:900px){.glass-wrap{margin:24px 16px;padding:32px 28px;border-radius:22px;}}
        @media(max-width:640px){.glass-wrap{margin:12px 8px;padding:24px 16px;border-radius:16px;}}
        .bg-glow-a{position:fixed;top:-10%;left:-10%;width:60vw;height:60vw;border-radius:50%;
          background:radial-gradient(circle,rgba(126,34,206,0.22) 0%,transparent 70%);
          z-index:0;filter:blur(60px);pointer-events:none;}
        .bg-glow-b{position:fixed;bottom:-10%;right:-10%;width:50vw;height:50vw;border-radius:50%;
          background:radial-gradient(circle,rgba(244,190,105,0.12) 0%,transparent 70%);
          z-index:0;filter:blur(60px);pointer-events:none;}
      `}} />
      <div className="bg-glow-a" />
      <div className="bg-glow-b" />

      <div className="glass-wrap">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '8px 18px',
            background: 'rgba(0,0,0,0.25)', borderRadius: 100, border: `1px solid ${C.border}`
          }}>
            <img src="/logo.png" alt="Holora Performance" style={{ height: isMobile ? 24 : 32, width: isMobile ? 24 : 32, objectFit: 'contain', borderRadius: 4 }} />
            <span style={{ color: C.text, fontWeight: 600, fontSize: isMobile ? 12 : 14, letterSpacing: '0.05em' }}>EVENT CREATOR</span>
          </div>
          <h1 style={{
            fontFamily: 'Helvetica,Arial,sans-serif', color: C.text, fontSize: isMobile ? 22 : 30, fontWeight: 700,
            margin: '0 0 8px', letterSpacing: '-0.02em'
          }}>
            {STEPS[step - 1].label}
          </h1>
        </div>

        <ProgressBar current={step} />

        {Object.keys(errors).length > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '14px 20px', marginBottom: 28, color: '#ef4444', fontWeight: 600, fontSize: 14
          }}>
            ⚠ Please fix the highlighted errors below to continue.
          </div>
        )}

        {/* ── STEP 1: Organizer ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Field label="Organizer Type" required hint="Choose 'Private / Coach' for individuals, or 'Company / Studio' for businesses">
              <div style={{ display: 'flex', gap: 12 }}>
                <Chip active={form.organizer_type === 'private'} onClick={() => set('organizer_type')('private')}>Private / Coach</Chip>
                <Chip active={form.organizer_type === 'company'} onClick={() => set('organizer_type')('company')}>Company / Studio</Chip>
              </div>
            </Field>

            <Field label={isCompany ? 'Brand / Company Name' : 'Your Name or Alias'} required error={errors.organizer_display_name}
              hint="This is the name attendees will see on the event listing">
              <FInput value={form.organizer_display_name} onChange={set('organizer_display_name')} placeholder="Publicly displayed name" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Field label="Contact Email" required error={errors.organizer_email} hint="Used for approval notifications — not shown publicly">
                <FInput type="email" value={form.organizer_email} onChange={set('organizer_email')} placeholder="Will remain private" />
              </Field>
              <Field label="Phone Number" hint="Include country code, e.g. +971 50 123 4567">
                <FInput value={form.organizer_phone} onChange={set('organizer_phone')} placeholder="+1 555 000 0000" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Field label="Nationality" required error={errors.nationality} hint="Your country of citizenship">
                <FInput value={form.nationality} onChange={set('nationality')} placeholder="e.g. United States" />
              </Field>
              <Field label="Country of Residence" required error={errors.country} hint="The country where you currently live and operate">
                <FInput value={form.country} onChange={set('country')} placeholder="e.g. United Arab Emirates" />
              </Field>
            </div>

            {isCompany && (
              <div style={{ marginTop: 8, padding: 28, background: 'rgba(0,0,0,0.2)', borderRadius: 16, border: `1px solid ${C.border}` }}>
                <h3 style={{ color: C.yellow, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px', fontFamily: 'Helvetica,Arial,sans-serif' }}>
                  Legal Details (Private)
                </h3>
                <Field label="Legal Company Name" required error={errors.legal_name} hint="Official registered company name — kept private">
                  <FInput value={form.legal_name} onChange={set('legal_name')} placeholder="Registered name" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <Field label="Trade License / Registration No." required error={errors.registration_number} hint="Your commercial registration or license number">
                    <FInput value={form.registration_number} onChange={set('registration_number')} placeholder="CR / License ID" />
                  </Field>
                  <Field label="Registered Address" required error={errors.registered_address} hint="Official business address as registered">
                    <FInput value={form.registered_address} onChange={set('registered_address')} placeholder="Business address" />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <Field label="Representative Name" hint="Person authorized to act on behalf of the company">
                    <FInput value={form.representative_name} onChange={set('representative_name')} placeholder="Full name" />
                  </Field>
                  <Field label="Representative Role" hint="Their job title or position in the company">
                    <FInput value={form.representative_role} onChange={set('representative_role')} placeholder="e.g. CEO, Manager" />
                  </Field>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Event Details ─────────────────────────────────────── */}
        {step === 2 && (
          <>
            <Field label="Event Title" required error={errors.title} hint="Keep it short and compelling — this is the first thing attendees see">
              <FInput value={form.title} onChange={set('title')} placeholder="e.g. Sunset HIIT Session" />
            </Field>
            <Field label="Category" required error={errors.category} hint="Choose the category that best describes your event type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.value} type="button" onClick={() => set('category')(cat.value)}
                    style={{
                      padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                      backgroundColor: form.category === cat.value ? C.yellow : C.inputBg,
                      color: form.category === cat.value ? C.bg : C.text,
                      border: `1px solid ${form.category === cat.value ? C.yellow : C.border}`,
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Short Summary" hint="One sentence shown in the feed card — keep it under 120 characters">
              <FInput value={form.summary} onChange={set('summary')} placeholder="A quick overview of your event" />
            </Field>
            <Field label="Full Description" required error={errors.description} hint="Tell attendees what to expect, what to bring, fitness level required, and any other relevant details">
              <FTextarea value={form.description} onChange={set('description')} rows={6}
                placeholder="What should attendees expect? What to bring? Any requirements?" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Field label="Languages" hint="e.g. English, Arabic">
                <FInput value={form.languages} onChange={set('languages')} placeholder="English, Arabic..." />
              </Field>
              <Field label="Tags" hint="Comma-separated">
                <FInput value={form.tags} onChange={set('tags')} placeholder="outdoor, beginner, morning" />
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 3: Location ──────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Field label="Event Format" required>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[{ v: 'in_person', l: '📍 In-Person' }, { v: 'online', l: '💻 Online' }, { v: 'hybrid', l: '🌐 Hybrid' }].map(o => (
                  <Chip key={o.v} active={form.event_type === o.v} onClick={() => set('event_type')(o.v)}>{o.l}</Chip>
                ))}
              </div>
            </Field>

            {isInPerson && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                  <Field label="Event Country" required error={errors.event_country}>
                    <SearchSelect value={form.event_country} onChange={v => handleEventCountryChange(v)} options={ALL_COUNTRIES} placeholder="Select country" />
                  </Field>
                  <Field label="Event City" required error={errors.event_city}>
                    {COUNTRY_CITY_MAP[form.event_country] ? (
                      <SearchSelect value={form.event_city} onChange={set('event_city')} options={COUNTRY_CITY_MAP[form.event_country]} placeholder="Select city" />
                    ) : (
                      <FInput value={form.event_city} onChange={set('event_city')} placeholder="Enter city" />
                    )}
                  </Field>
                </div>
                <Field label="Venue Name">
                  <FInput value={form.venue_name} onChange={set('venue_name')} placeholder="e.g. Fitness First Dubai Marina" />
                </Field>
                <Field label="Venue Address" required error={errors.venue_address}>
                  <FInput value={form.venue_address} onChange={set('venue_address')} placeholder="Full street address" />
                </Field>
                <Field label="Google Maps Link" hint="Optional">
                  <FInput value={form.google_maps_link} onChange={set('google_maps_link')} placeholder="https://maps.google.com/..." />
                </Field>
              </>
            )}

            {isOnline && (
              <>
                <Field label="Stream URL" required error={errors.online_url}>
                  <FInput value={form.online_url} onChange={set('online_url')} placeholder="https://zoom.us/..." />
                </Field>
                <Field label="Platform" hint="e.g. Zoom, Google Meet, YouTube Live">
                  <FInput value={form.online_platform} onChange={set('online_platform')} placeholder="Zoom" />
                </Field>
              </>
            )}
          </>
        )}

        {/* ── STEP 4: Date & Time ───────────────────────────────────────── */}
        {step === 4 && (
          <>
            <Field label="Timezone" required>
              <SearchSelect value={form.timezone} onChange={set('timezone')} options={ALL_TIMEZONES.map(t => t.value)} placeholder="Select timezone" />
            </Field>
            {errors.start_at && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12, fontWeight: 600 }}>⚠ {errors.start_at}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Field label="Start Date" required><FInput type="date" value={form.start_date} onChange={set('start_date')} /></Field>
              <Field label="Start Time" required><FInput type="time" value={form.start_time} onChange={set('start_time')} /></Field>
            </div>
            {errors.end_at && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12, fontWeight: 600 }}>⚠ {errors.end_at}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              <Field label="End Date" required><FInput type="date" value={form.end_date} onChange={set('end_date')} /></Field>
              <Field label="End Time" required><FInput type="time" value={form.end_time} onChange={set('end_time')} /></Field>
            </div>
          </>
        )}

        {/* ── STEP 5: Pricing ───────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <Field label="Pricing Model" required>
              <div style={{ display: 'flex', gap: 12 }}>
                <Chip active={form.price_type === 'free'} onClick={() => set('price_type')('free')}>Free Event</Chip>
                <Chip active={form.price_type === 'paid'} onClick={() => set('price_type')('paid')}>Paid Tickets</Chip>
              </div>
            </Field>
            {form.price_type === 'paid' && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16 }}>
                <Field label="Price per Person" required error={errors.price_per_person}>
                  <FInput type="number" value={form.price_per_person} onChange={set('price_per_person')} placeholder="0.00" min="0" step="0.01" />
                </Field>
                <Field label="Currency">
                  <SearchSelect value={form.currency} onChange={set('currency')} options={ALL_CURRENCIES.map(c => c.value)} placeholder="Select currency" />
                </Field>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '16px 20px',
                borderRadius: 12, background: form.ticket_required ? C.yellowGlow : C.inputBg,
                border: `1px solid ${form.ticket_required ? C.yellow : C.border}`, transition: 'all 0.2s'
              }}>
                <input type="checkbox" checked={form.ticket_required} onChange={toggle('ticket_required')}
                  style={{ width: 18, height: 18, accentColor: C.yellow }} />
                <span style={{ color: C.text, fontSize: 15, fontFamily: '"Figtree",sans-serif', fontWeight: 600 }}>
                  External ticket required (Eventbrite, etc.)
                </span>
              </label>
              {form.ticket_required && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Ticket URL" error={errors.ticket_url}>
                    <FInput value={form.ticket_url} onChange={set('ticket_url')} placeholder="https://eventbrite.com/..." />
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP 6: Media ─────────────────────────────────────────────── */}
        {step === 6 && (
          <>
            <Field label="Cover Image" required error={errors.cover_image_url}>
              {form.cover_image_url ? (
                <div style={{ position: 'relative' }}>
                  <img src={form.cover_image_url} alt="Cover" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 14, border: `1px solid ${C.border}` }} />
                  <button onClick={() => set('cover_image_url')('')}
                    style={{
                      position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff',
                      border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: '"Figtree",sans-serif'
                    }}>
                    Replace
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  padding: '56px 24px', background: C.inputBg,
                  border: `2px dashed ${uploadingCover ? C.yellow : C.border}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.3s'
                }}>
                  <span style={{ fontSize: 36 }}>{uploadingCover ? '⏳' : '📸'}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{uploadingCover ? 'Uploading...' : 'Click to browse image'}</span>
                  <span style={{ color: C.textMuted, fontSize: 13 }}>JPG, PNG, WebP — Max 10MB</span>
                  <input type="file" style={{ display: 'none' }} accept="image/*"
                    onChange={e => handleUpload(e.target.files[0], 'cover_image_url', setUploadingCover)} />
                </label>
              )}
            </Field>
          </>
        )}

        {/* ── STEP 7: Visibility ────────────────────────────────────────── */}
        {step === 7 && (
          <div style={{ display: 'grid', gap: 14 }}>
            {VISIBILITY_PACKS.map(pack => (
              <div key={pack.id}
                onClick={() => set('visibility_pack')(pack.id)}
                style={{
                  padding: '22px 24px', borderRadius: 16, cursor: 'pointer', transition: 'all 0.25s', position: 'relative',
                  background: form.visibility_pack === pack.id ? pack.accent : C.inputBg,
                  border: `2px solid ${form.visibility_pack === pack.id ? pack.color : C.border}`,
                }}>
                {pack.popular && (
                  <span style={{
                    position: 'absolute', top: 12, right: 16, background: C.yellow, color: '#150926',
                    fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100, fontFamily: '"Figtree",sans-serif'
                  }}>
                    POPULAR
                  </span>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ color: pack.color, fontWeight: 800, fontSize: 18, letterSpacing: '0.04em', fontFamily: 'Helvetica,Arial,sans-serif' }}>{pack.name}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{pack.label}</span>
                </div>
                <p style={{ color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5, fontFamily: '"Figtree",sans-serif' }}>{pack.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 8: Review & Submit ───────────────────────────────────── */}
        {step === 8 && (
          <>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 28, marginBottom: 28, border: `1px solid ${C.border}` }}>
              <h3 style={{ color: C.yellow, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 13, marginTop: 0, marginBottom: 20, fontFamily: 'Helvetica,Arial,sans-serif' }}>
                Event Summary
              </h3>
              {[
                ['Event', form.title || '—'],
                ['Organizer', form.organizer_display_name || '—'],
                ['Format', form.event_type.replace('_', ' ').toUpperCase()],
                ['Location', [form.event_city, form.event_country].filter(Boolean).join(', ') || (form.online_url ? 'Online' : '—')],
                ['Date', form.start_date || '—'],
                ['Pricing', form.price_type === 'paid' ? `${form.price_per_person} ${form.currency}` : 'Free'],
                ['Visibility', VISIBILITY_PACKS.find(p => p.id === form.visibility_pack)?.name || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: 10, marginBottom: 10
                }}>
                  <span style={{ color: C.textMuted, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 14, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{
                display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer',
                padding: '16px 20px', borderRadius: 12, border: `1px solid ${form.confirm_rights ? C.yellow : C.border}`,
                background: form.confirm_rights ? C.yellowGlow : C.inputBg, transition: 'all 0.2s'
              }}>
                <input type="checkbox" checked={form.confirm_rights} onChange={toggle('confirm_rights')}
                  style={{ width: 18, height: 18, accentColor: C.yellow, marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: C.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"Figtree",sans-serif' }}>
                  I confirm I hold all necessary rights to the media and content provided in this submission.
                </span>
              </label>
              {errors.confirm_rights && <p style={{ fontSize: 13, color: '#ef4444', margin: '0 0 4px', fontWeight: 600 }}>⚠ {errors.confirm_rights}</p>}
              <label style={{
                display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer',
                padding: '16px 20px', borderRadius: 12, border: `1px solid ${form.confirm_lawful ? C.yellow : C.border}`,
                background: form.confirm_lawful ? C.yellowGlow : C.inputBg, transition: 'all 0.2s'
              }}>
                <input type="checkbox" checked={form.confirm_lawful} onChange={toggle('confirm_lawful')}
                  style={{ width: 18, height: 18, accentColor: C.yellow, marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: C.text, fontSize: 14, lineHeight: 1.5, fontFamily: '"Figtree",sans-serif' }}>
                  I confirm this event complies with Holora's safety guidelines and applicable local laws.
                </span>
              </label>
              {errors.confirm_lawful && <p style={{ fontSize: 13, color: '#ef4444', margin: '0 0 4px', fontWeight: 600 }}>⚠ {errors.confirm_lawful}</p>}
            </div>
            {errors.submit && (
              <div style={{
                marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.1)',
                borderLeft: '4px solid #ef4444', color: '#ef4444', fontSize: 14, fontFamily: '"Figtree",sans-serif', fontWeight: 600
              }}>
                ⚠ {errors.submit}
              </div>
            )}
          </>
        )}

        {/* ── NAVIGATION ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginTop: isMobile ? 32 : 48, paddingTop: isMobile ? 20 : 28, borderTop: `1px solid rgba(255,255,255,0.08)` }}>
          {step > 1 && (
            <button onClick={prevStep}
              style={{
                padding: isMobile ? '13px 20px' : '15px 28px', borderRadius: 12, background: 'transparent',
                border: '1px solid rgba(247,247,247,0.25)', color: C.text, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: '"Figtree",sans-serif',
                fontSize: isMobile ? 14 : 15, flexShrink: 0
              }}>
              Back
            </button>
          )}
          <button
            onClick={step < STEPS.length ? nextStep : handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: isMobile ? '13px' : '15px', borderRadius: 12, background: C.yellow, border: 'none',
              color: '#150926', fontWeight: 800, fontSize: isMobile ? 14 : 16, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 24px ${C.yellowGlow}`, transition: 'all 0.2s',
              fontFamily: '"Figtree",sans-serif', opacity: submitting ? 0.7 : 1
            }}>
            {submitting ? 'Processing...' : step < STEPS.length ? 'Continue →' : '🚀 Submit Event'}
          </button>
        </div>

      </div>
    </>
  );
}
