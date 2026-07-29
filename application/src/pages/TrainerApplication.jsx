/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect, useMemo } from "react";

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

// ─── CONFIG & AUTH ───────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_BASE_URL || "";

function getAuthToken() {
  return localStorage.getItem("access_token") || "";
}

// ─── WORLD DATA & MOCK CITIES ────────────────────────────────────────────────
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

// ─── BRAND TOKENS ────────────────────────────────────────────────────────────
const P = {
  yellow: "#f4be69",
  yellowGlow: "rgba(244, 190, 105, 0.2)",
  purple: "#7e22ce",
  purpleDark: "#600782",
  bg: "#150926",
  surface: "#1D0E35",
  inputBg: "#110720",
  border: "rgba(126, 34, 206, 0.3)",
  borderFocus: "#f4be69",
  text: "#F7F7F7",
  textMuted: "rgba(247, 247, 247, 0.6)",
  textDim: "rgba(247, 247, 247, 0.3)",
};

const SPECIALTIES = [
  "Gym Workout", "Weight Loss", "Muscle Building", "Swimming", "Yoga",
  "Boxing", "Football Fitness", "Cardio", "Nutrition", "Rehabilitation",
  "CrossFit", "HIIT", "Running", "Martial Arts",
];
const LANGUAGES = ["English", "Arabic", "Hindi", "Urdu", "French", "Spanish", "Filipino", "Bengali", "Malayalam", "Tamil"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const STEPS = [
  { id: 1, label: "Identity" },
  { id: 2, label: "Expertise" },
  { id: 3, label: "Services" },
  { id: 4, label: "Schedule" },
  { id: 5, label: "Review" },
];

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const Icons = {
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  ChevronDown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Phone: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Star: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
};

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ width: '100%', marginBottom: 24, position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700, color: P.textMuted,
        marginBottom: hint ? 4 : 8, letterSpacing: '0.05em', fontFamily: 'Helvetica, Arial, sans-serif', textTransform: 'uppercase',
      }}>
        {label} {required && <span style={{ color: P.yellow }}>*</span>}
      </label>
      {hint && <p style={{ margin: '0 0 8px', fontSize: 13, color: P.textDim, fontFamily: '"Figtree", sans-serif', lineHeight: 1.4 }}>{hint}</p>}
      {children}
      {error && <div style={{ fontSize: 13, color: '#ef4444', marginTop: 8, fontWeight: 600, fontFamily: '"Figtree", sans-serif' }}>{error}</div>}
    </div>
  );
}

function FInput({ value, onChange, placeholder, type = 'text', min, step, icon: Icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: focused ? P.yellow : P.textMuted, transition: 'color 0.3s' }}>
          <Icon />
        </span>
      )}
      <input
        type={type} value={value ?? ''} min={min} step={step}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%', background: P.inputBg, border: `1px solid ${focused ? P.borderFocus : P.border}`,
          borderRadius: 12, padding: `16px 16px 16px ${Icon ? 44 : 16}px`, color: P.text, fontSize: 15,
          outline: 'none', boxSizing: 'border-box', fontFamily: '"Figtree", sans-serif', transition: 'all 0.3s ease',
          boxShadow: focused ? `0 0 0 3px ${P.yellowGlow}` : 'none',
        }}
      />
    </div>
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
        width: '100%', background: P.inputBg, border: `1px solid ${focused ? P.borderFocus : P.border}`,
        borderRadius: 12, padding: 16, color: P.text, fontSize: 15,
        outline: 'none', boxSizing: 'border-box', fontFamily: '"Figtree", sans-serif', transition: 'all 0.3s ease',
        boxShadow: focused ? `0 0 0 3px ${P.yellowGlow}` : 'none', resize: 'vertical',
      }}
    />
  );
}

// ─── SEARCHABLE DROPDOWN ──────────────────────────────────────────────────────
// IMPORTANT: Do NOT use `useEffect([open])` to call setQ — that causes infinite
// re-renders in React 19. Reset q in click handlers only.
// Do NOT use `autoFocus` — in React 19 StrictMode double-invocation it triggers
// browser focus events during commit phase. Use imperative ref.focus() in an
// effect that calls NO setState.
function SearchSelect({ value, onChange, options, placeholder, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click — resets q in handler, NOT in a [open] setState effect
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

  // Imperatively focus the search input when dropdown opens — NO setState here
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const displayVal = options.find(o => (o.value ?? o) === value);
  const filtered = options.filter(o => (o.label ?? o).toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: '100%', background: disabled ? 'rgba(255,255,255,0.02)' : P.inputBg,
          border: `1px solid ${open ? P.borderFocus : P.border}`, borderRadius: 12,
          padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
          boxShadow: open ? `0 0 0 3px ${P.yellowGlow}` : 'none', opacity: disabled ? 0.5 : 1,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ color: displayVal ? P.text : P.textMuted, fontSize: 15, fontFamily: '"Figtree", sans-serif' }}>
          {displayVal ? (displayVal.label ?? displayVal) : placeholder}
        </span>
        <span style={{ color: P.textMuted, transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <Icons.ChevronDown />
        </span>
      </div>

      {open && !disabled && (
        <div style={{
          position: 'absolute', zIndex: 999, top: 'calc(100% + 8px)', left: 0, right: 0,
          background: P.surface, border: `1px solid ${P.border}`, borderRadius: 16,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${P.border}`, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: P.textMuted, pointerEvents: 'none' }}>
              <Icons.Search />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search..."
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', background: P.inputBg, border: 'none', borderRadius: 8,
                padding: '12px 16px 12px 40px', color: P.text, fontSize: 14, outline: 'none',
                fontFamily: '"Figtree", sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', padding: 8 }} className="custom-scroll">
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: P.textMuted, textAlign: 'center', fontSize: 14, fontFamily: '"Figtree", sans-serif' }}>
                No results found.
              </div>
            ) : filtered.map(o => {
              const v = o.value ?? o;
              const l = o.label ?? o;
              const isSel = value === v;
              return (
                <div
                  key={v}
                  onClick={() => { onChange(v); setOpen(false); setQ(''); }}
                  style={{
                    padding: '12px 16px', fontSize: 15, cursor: 'pointer', borderRadius: 8,
                    background: isSel ? 'rgba(244,190,105,0.1)' : 'transparent',
                    color: isSel ? P.yellow : P.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontFamily: '"Figtree", sans-serif', fontWeight: isSel ? 600 : 400, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  {l}
                  {isSel && <Icons.Check />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAG SELECTOR ─────────────────────────────────────────────────────────────
function TagGrid({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <button key={o} type="button" onClick={() => onToggle(o)} style={{
            padding: '10px 18px', borderRadius: 999,
            border: active ? `1px solid ${P.yellow}` : `1px solid ${P.border}`,
            background: active ? P.yellowGlow : P.inputBg,
            color: active ? P.yellow : P.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s ease', fontFamily: "'Figtree', sans-serif",
          }}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

// ─── TOGGLE CARD ──────────────────────────────────────────────────────────────
function ToggleCard({ label, checked, onChange, desc }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderRadius: 16, cursor: 'pointer', transition: 'all 0.3s ease', gap: 16,
      background: checked ? 'rgba(126, 34, 206, 0.15)' : P.inputBg,
      border: `1px solid ${checked ? P.purple : P.border}`,
    }}>
      <div>
        <div style={{ color: checked ? P.yellow : P.text, fontSize: 16, fontWeight: 700, fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '0.02em', marginBottom: 4 }}>{label}</div>
        <div style={{ color: P.textMuted, fontSize: 14, fontFamily: "'Figtree', sans-serif", lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div style={{
        width: 48, height: 26, borderRadius: 13, position: 'relative', transition: 'background 0.3s', flexShrink: 0,
        background: checked ? P.yellow : 'rgba(255,255,255,0.1)',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', background: checked ? '#150926' : P.text,
          position: 'absolute', top: 3, left: checked ? 25 : 3, transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

// ─── FILE UPLOAD BOX ──────────────────────────────────────────────────────────
function FileUploadBox({ label, hint, file, onFile, accept }) {
  return (
    <div style={{ width: '100%', marginBottom: 24, position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700, color: P.textMuted,
        marginBottom: hint ? 4 : 8, letterSpacing: '0.05em', fontFamily: 'Helvetica, Arial, sans-serif', textTransform: 'uppercase',
      }}>{label}</label>
      {hint && <p style={{ margin: '0 0 8px', fontSize: 13, color: P.textDim, fontFamily: '"Figtree", sans-serif', lineHeight: 1.4 }}>{hint}</p>}
      <label style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '32px 20px', borderRadius: 16, cursor: 'pointer',
        border: `1px dashed ${file ? P.yellow : P.border}`,
        background: file ? P.yellowGlow : P.inputBg,
        color: file ? P.yellow : P.textMuted,
        transition: 'all 0.3s ease', textAlign: 'center',
      }}>
        <Icons.Upload />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: '"Figtree", sans-serif', color: file ? P.yellow : P.text, marginBottom: 4 }}>
            {file ? file.name : 'Click to browse files'}
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Figtree', sans-serif" }}>
            {file ? 'Attached securely' : 'PDF, JPG, PNG (Max 10MB)'}
          </div>
        </div>
        <input type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFile(e.target.files[0])} />
      </label>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TrainerApplication() {
  const vw = useWindowWidth();
  const isMobile = vw < 640;
  const isTablet = vw < 900;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', experience: '', primary_specialty: '',
    secondary_specialties: [], languages: [], bio: '', profile_image: null, certificates: null,
    nationality: '', country: '', city: '',
    supports_virtual_training: true, supports_home_training: false,
    supports_gym_training: true, supports_training_plan: true,
    gym_session_price: '', virtual_session_price: '', home_training_price: '', training_plan_price: '',
    schedule: {},
  });

  const availableCities = useMemo(() => {
    if (!form.country) return [];
    if (COUNTRY_CITY_MAP[form.country]) return COUNTRY_CITY_MAP[form.country].map(c => ({ label: c, value: c }));
    return [
      { label: `${form.country} City 1`, value: `${form.country} City 1` },
      { label: `${form.country} City 2`, value: `${form.country} City 2` },
      { label: 'Other (Type manually)', value: 'Other' },
    ];
  }, [form.country]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const togList = (field, val) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(x => x !== val) : [...p[field], val],
    }));
  };

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.full_name.trim()) e.full_name = 'Name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      if (!form.phone.trim()) e.phone = 'Phone is required';
      if (!form.nationality) e.nationality = 'Nationality is required';
      if (!form.country) e.country = 'Residence country is required';
      if (!form.city) e.city = 'City is required';
    }
    if (step === 2 && !form.primary_specialty) e.primary_specialty = 'Primary specialty is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) {
      setStep(s => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const prev = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      // Convert schedule: {day:{enabled,start,end}} → {day:[start,end]} (enabled days only)
      const schedule = {};
      Object.entries(form.schedule).forEach(([day, data]) => {
        if (data.enabled) schedule[day] = [data.start, data.end];
      });

      // Build FormData — backend requires multipart/form-data (has file fields)
      const formData = new FormData();
      formData.append('full_name', form.full_name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('experience', form.experience || 0);
      formData.append('primary_specialty', form.primary_specialty);
      formData.append('bio', form.bio || '');
      formData.append('nationality', form.nationality || '');
      formData.append('country', form.country || '');
      formData.append('city', form.city || '');
      formData.append('supports_virtual_training', form.supports_virtual_training);
      formData.append('supports_home_training', form.supports_home_training);
      formData.append('supports_gym_training', form.supports_gym_training);
      formData.append('supports_training_plan', form.supports_training_plan);
      formData.append('gym_session_price', form.gym_session_price || '0');
      formData.append('virtual_session_price', form.virtual_session_price || '0');
      formData.append('home_training_price', form.home_training_price || '0');
      formData.append('training_plan_price', form.training_plan_price || '0');
      // JSONField values must be sent as JSON strings in multipart
      formData.append('secondary_specialties', JSON.stringify(form.secondary_specialties || []));
      formData.append('locations', JSON.stringify([form.city, form.country].filter(Boolean)));
      formData.append('languages', JSON.stringify(form.languages || []));
      formData.append('schedule', JSON.stringify(schedule));
      // Files
      if (form.profile_image) formData.append('profile_image', form.profile_image);
      if (form.certificates) formData.append('certificates', form.certificates);

      // File size validation (10MB max)
      if (form.profile_image && form.profile_image.size > 10 * 1024 * 1024) {
        setErrors({ submit: 'Profile image must be under 10MB' });
        setSubmitting(false);
        return;
      }
      if (form.certificates && form.certificates.size > 10 * 1024 * 1024) {
        setErrors({ submit: 'Certificate file must be under 10MB' });
        setSubmitting(false);
        return;
      }

      const token = getAuthToken();
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/trainer/trainer-application/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.status === 400) {
        const data = await res.json();
        const msg = data.detail || data.error ||
          (data.errors
            ? Object.entries(data.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
            : 'Submission failed. Please check your details.');
        setErrors({ submit: msg });
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message || 'Connection error. Please try again.' });
    }
    setSubmitting(false);
  };

  const schToggle = day => {
    setForm(p => {
      const s = { ...p.schedule };
      if (!s[day]) s[day] = { enabled: false, start: '06:00', end: '22:00' };
      s[day] = { ...s[day], enabled: !s[day].enabled };
      return { ...p, schedule: s };
    });
  };
  const schTime = (day, field, val) => {
    setForm(p => {
      const s = { ...p.schedule };
      if (!s[day]) s[day] = { enabled: false, start: '06:00', end: '22:00' };
      s[day] = { ...s[day], [field]: val };
      return { ...p, schedule: s };
    });
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bg, fontFamily: "'Figtree', sans-serif", padding: 16 }}>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}` }} />
        <div style={{
          textAlign: 'center', padding: isMobile ? '40px 24px' : '64px 48px', background: P.surface, borderRadius: 24,
          border: `1px solid ${P.border}`, maxWidth: 520, width: '100%',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)', animation: 'fadeUp 0.6s ease-out',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 32px',
            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: 40,
          }}>✓</div>
          <h1 style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: isMobile ? 22 : 28, color: P.text, fontWeight: 700, margin: '0 0 16px' }}>
            Application Sent
          </h1>
          <p style={{ color: P.textMuted, fontSize: 16, lineHeight: 1.6, margin: 0 }}>
            Thank you for applying. The <strong style={{ color: P.yellow }}>Holora Performance</strong> team will review your profile and contact you within 48 hours.
          </p>
        </div>
      </div>
    );
  }

  const col2 = isMobile ? '1fr' : '1fr 1fr';

  const stepContent = {
    1: (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 20 }}>
          <Field label="Full Name" required error={errors.full_name}>
            <FInput value={form.full_name} onChange={v => set('full_name', v)} placeholder="Legal name" icon={Icons.User} />
          </Field>
          <Field label="Email Address" required error={errors.email} >
            <FInput type="email" value={form.email} onChange={v => set('email', v)} placeholder="your@email.com" icon={Icons.Mail} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 20 }}>
          <Field label="Phone Number" required error={errors.phone}>
            <FInput type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+1 555..." icon={Icons.Phone} />
          </Field>
          <Field label="Experience (Years)" error={errors.experience}>
            <FInput type="number" min="0" value={form.experience} onChange={v => set('experience', v)} placeholder="0" icon={Icons.Star} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 20, marginTop: 16, paddingTop: 32, borderTop: `1px solid ${P.border}` }}>
          <Field label="Nationality" required error={errors.nationality}>
            <SearchSelect value={form.nationality} onChange={v => set('nationality', v)} options={ALL_COUNTRIES} placeholder="Select nationality" />
          </Field>
          <Field label="Country of Residence" required error={errors.country}>
            <SearchSelect value={form.country} onChange={v => setForm(p => ({ ...p, country: v, city: '' }))} options={ALL_COUNTRIES} placeholder="Select country" />
          </Field>
        </div>
        <Field label="City" required error={errors.city}>
          {COUNTRY_CITY_MAP[form.country] ? (
            <SearchSelect value={form.city} onChange={v => set('city', v)} options={COUNTRY_CITY_MAP[form.country]} placeholder="Select city" />
          ) : (
            <FInput value={form.city} onChange={v => set('city', v)} placeholder="Enter your city" />
          )}
        </Field>

        <div style={{ marginTop: 16, paddingTop: 32, borderTop: `1px solid ${P.border}` }}>
          <Field label="Professional Bio">
            <FTextarea value={form.bio} onChange={v => set('bio', v)} rows={4} placeholder="Summarize your training philosophy, background, and achievements..." />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 20 }}>
          <FileUploadBox label="Profile Photo" file={form.profile_image} onFile={f => set('profile_image', f)} accept="image/*" />
          <FileUploadBox label="Certificates" file={form.certificates} onFile={f => set('certificates', f)} accept=".pdf,.jpg,.png" />
        </div>
      </div>
    ),

    2: (
      <div>
        <Field label="Select Primary Specialty" required error={errors.primary_specialty} >
          <TagGrid
            options={SPECIALTIES}
            selected={[form.primary_specialty]}
            onToggle={v => set('primary_specialty', v)}
          />
        </Field>
        <div style={{ margin: '32px 0', height: 1, background: P.border }} />
        <Field label="Secondary Specialties (Optional)">
          <TagGrid
            options={SPECIALTIES.filter(s => s !== form.primary_specialty)}
            selected={form.secondary_specialties}
            onToggle={v => togList('secondary_specialties', v)}
          />
        </Field>
        <div style={{ margin: '32px 0', height: 1, background: P.border }} />
        <Field label="Languages Spoken">
          <TagGrid
            options={LANGUAGES}
            selected={form.languages}
            onToggle={v => togList('languages', v)}
          />
        </Field>
      </div>
    ),

    3: (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, fontFamily: 'Helvetica, Arial, sans-serif' }}>
          Training Environments
        </div>
        <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
          <ToggleCard label="Gym Training" desc="In-person sessions at gym facilities." checked={form.supports_gym_training} onChange={() => set('supports_gym_training', !form.supports_gym_training)} />
          <ToggleCard label="Virtual Training" desc="1-on-1 online video coaching." checked={form.supports_virtual_training} onChange={() => set('supports_virtual_training', !form.supports_virtual_training)} />
          <ToggleCard label="Home Training" desc="Travel to clients' homes for sessions." checked={form.supports_home_training} onChange={() => set('supports_home_training', !form.supports_home_training)} />
          <ToggleCard label="Custom Training Plans" desc="Build asynchronous routines." checked={form.supports_training_plan} onChange={() => set('supports_training_plan', !form.supports_training_plan)} />
        </div>

        <div style={{ background: P.inputBg, padding: 24, borderRadius: 16, border: `1px solid ${P.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: P.yellow, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24, fontFamily: 'Helvetica, Arial, sans-serif' }}>
            Session Base Pricing (QAR)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 20 }}>
            {form.supports_gym_training && <Field label="Gym Session Rate">    <FInput type="number" min="0" step="0.01" value={form.gym_session_price} onChange={v => set('gym_session_price', v)} /></Field>}
            {form.supports_virtual_training && <Field label="Virtual Session Rate"><FInput type="number" min="0" step="0.01" value={form.virtual_session_price} onChange={v => set('virtual_session_price', v)} /></Field>}
            {form.supports_home_training && <Field label="Home Training Rate">  <FInput type="number" min="0" step="0.01" value={form.home_training_price} onChange={v => set('home_training_price', v)} /></Field>}
            {form.supports_training_plan && <Field label="Training Plan Rate">  <FInput type="number" min="0" step="0.01" value={form.training_plan_price} onChange={v => set('training_plan_price', v)} /></Field>}
          </div>
        </div>
      </div>
    ),

    4: (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, fontFamily: 'Helvetica, Arial, sans-serif' }}>
          Standard Weekly Availability
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: P.textDim, fontFamily: '"Figtree", sans-serif', lineHeight: 1.4 }}>
          Toggle the days you are available and set your working hours for each day
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {DAYS.map(day => {
            const s = form.schedule[day] || { enabled: false, start: '06:00', end: '22:00' };
            return (
              <div key={day} style={{
                display: 'flex', alignItems: 'center', gap: 20, padding: '20px', borderRadius: 16,
                background: s.enabled ? 'rgba(126, 34, 206, 0.1)' : P.inputBg,
                border: `1px solid ${s.enabled ? P.purple : P.border}`,
                transition: 'all 0.3s',
              }}>
                <div onClick={() => schToggle(day)} style={{
                  width: 48, height: 26, borderRadius: 13, cursor: 'pointer', position: 'relative', flexShrink: 0,
                  background: s.enabled ? P.yellow : 'rgba(255,255,255,0.1)', transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: s.enabled ? '#150926' : P.text,
                    position: 'absolute', top: 3, left: s.enabled ? 25 : 3, transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <span style={{ width: 100, fontWeight: 700, fontSize: 15, textTransform: 'capitalize', color: s.enabled ? P.text : P.textMuted, fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  {day}
                </span>
                {s.enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                    <input type="time" value={s.start} onChange={e => schTime(day, 'start', e.target.value)}
                      style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, padding: '10px 12px', color: P.text, fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: 'none' }} />
                    <span style={{ color: P.textMuted, fontSize: 14, fontWeight: 600 }}>to</span>
                    <input type="time" value={s.end} onChange={e => schTime(day, 'end', e.target.value)}
                      style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, padding: '10px 12px', color: P.text, fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: 'none' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),

    5: (
      <div style={{ display: 'grid', gap: 24 }}>
        {[
          {
            title: 'Personal Information', items: [
              ['Name', form.full_name],
              ['Email', form.email],
              ['Phone', form.phone],
              ['Experience', `${form.experience || 0} years`],
              ['Nationality', form.nationality],
              ['Location', [form.city, form.country].filter(Boolean).join(', ')],
            ]
          },
          {
            title: 'Expertise', items: [
              ['Primary', form.primary_specialty],
              ['Secondary', form.secondary_specialties.join(', ') || '—'],
              ['Languages', form.languages.join(', ') || '—'],
            ]
          },
          {
            title: 'Services & Pricing', items: [
              form.supports_gym_training && ['Gym Session', `${form.gym_session_price || 0} QAR`],
              form.supports_virtual_training && ['Virtual', `${form.virtual_session_price || 0} QAR`],
              form.supports_home_training && ['Home Training', `${form.home_training_price || 0} QAR`],
              form.supports_training_plan && ['Training Plan', `${form.training_plan_price || 0} QAR`],
            ].filter(Boolean)
          },
        ].map((sec, i) => (
          <div key={i} style={{ background: P.inputBg, borderRadius: 16, border: `1px solid ${P.border}`, padding: '24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.yellow, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, fontFamily: 'Helvetica, Arial, sans-serif' }}>
              {sec.title}
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {sec.items.map(([k, v], j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: 10 }}>
                  <span style={{ color: P.textMuted, fontSize: 14, fontFamily: "'Figtree', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: P.text, fontSize: 15, fontWeight: 700, fontFamily: "'Figtree', sans-serif", textAlign: 'right', maxWidth: '60%' }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {errors.submit && (
          <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', color: '#ef4444', fontSize: 14, fontFamily: "'Figtree', sans-serif", fontWeight: 600 }}>
            {errors.submit}
          </div>
        )}
      </div>
    ),
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; background: ${P.bg}; min-height: 100vh; font-family: 'Figtree', sans-serif; overflow-x: hidden; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${P.border}; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* ── HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: P.bg, borderBottom: `1px solid ${P.border}` }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Holora Performance" style={{ height: isMobile ? 32 : 40, width: isMobile ? 32 : 40, objectFit: 'contain', borderRadius: 6 }} />
            <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, fontFamily: 'Helvetica, Arial, sans-serif', color: P.text }}>
              Holora <span style={{ color: P.yellow }}>Trainer</span>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Application
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: isMobile ? '16px auto' : '40px auto', padding: isMobile ? '0 12px 80px' : '0 24px 100px' }}>

        {/* ── PROGRESS ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 28 : 48, position: 'relative', padding: '0 8px' }}>
          <div style={{ position: 'absolute', top: 14, left: 24, right: 24, height: 2, background: P.border, zIndex: 0 }} />
          <div style={{
            position: 'absolute', top: 14, left: 24, height: 2, background: P.yellow, zIndex: 0,
            transition: 'width 0.4s ease',
            width: `calc(${(step - 1) / (STEPS.length - 1) * 100}% - 48px)`,
          }} />

          {STEPS.map(s => {
            const isActive = s.id === step;
            const isPast = s.id < step;
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 }}>
                <div style={{
                  width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? 11 : 13, fontWeight: 700, transition: 'all 0.3s ease',
                  background: isActive ? P.yellow : isPast ? P.yellow : P.surface,
                  border: `2px solid ${isActive || isPast ? P.yellow : P.border}`,
                  color: isActive || isPast ? '#150926' : P.textMuted,
                }}>
                  {isPast ? '✓' : s.id}
                </div>
                {!isMobile && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? P.yellow : P.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Helvetica, Arial, sans-serif', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── CARD ── */}
        <div style={{
          background: P.surface, borderRadius: isMobile ? 16 : 24, border: `1px solid ${P.border}`,
          padding: isMobile ? '28px 20px' : isTablet ? '36px 32px' : '48px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ marginBottom: isMobile ? 28 : 40 }}>
            <h2 style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: isMobile ? 22 : 28, fontWeight: 700, color: P.text, margin: '0 0 8px' }}>
              {STEPS[step - 1].label}
            </h2>
            <div style={{ height: 3, width: 48, borderRadius: 2, background: P.yellow }} />
          </div>

          {stepContent[step]}

          {/* ── NAV BUTTONS ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isMobile ? 32 : 48, paddingTop: isMobile ? 20 : 32, borderTop: `1px solid ${P.border}`, gap: 12 }}>
            <button
              type="button" onClick={prev} disabled={step === 1}
              style={{
                padding: isMobile ? '12px 20px' : '14px 28px', borderRadius: 12, border: `1px solid ${P.border}`,
                background: 'transparent', color: step === 1 ? P.textDim : P.text,
                fontSize: isMobile ? 14 : 15, fontWeight: 700, cursor: step === 1 ? 'not-allowed' : 'pointer',
                opacity: step === 1 ? 0.4 : 1, transition: 'all 0.3s', fontFamily: '"Figtree", sans-serif', flexShrink: 0,
              }}
            >
              ← Back
            </button>

            {step < 5 ? (
              <button
                type="button" onClick={next}
                style={{
                  padding: isMobile ? '12px 24px' : '14px 32px', borderRadius: 12, border: 'none',
                  background: `linear-gradient(135deg, ${P.yellow}, #e8a84a)`,
                  color: '#150926', fontSize: isMobile ? 14 : 15, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.3s', fontFamily: '"Figtree", sans-serif',
                  boxShadow: `0 8px 24px rgba(244,190,105,0.3)`, flex: 1,
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button" onClick={handleSubmit} disabled={submitting}
                style={{
                  padding: isMobile ? '12px 24px' : '14px 32px', borderRadius: 12, border: 'none',
                  background: submitting ? P.border : `linear-gradient(135deg, ${P.yellow}, #e8a84a)`,
                  color: '#150926', fontSize: isMobile ? 14 : 15, fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s', fontFamily: '"Figtree", sans-serif',
                  boxShadow: submitting ? 'none' : `0 8px 24px rgba(244,190,105,0.3)`, flex: 1,
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
