// ─── BRAND TOKENS ────────────────────────────────────────────────────────────
export const P = {
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
  green: "#10b981",
} as const;

// ─── STEPS ───────────────────────────────────────────────────────────────────
export const STEPS = [
  { id: 1, label: "Organizer" },
  { id: 2, label: "Details" },
  { id: 3, label: "Location" },
  { id: 4, label: "Date & Time" },
  { id: 5, label: "Pricing" },
  { id: 6, label: "Media" },
  { id: 7, label: "Visibility" },
  { id: 8, label: "Review" },
];

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { value: "fitness", label: "\u{1F4AA} Fitness" },
  { value: "yoga", label: "\u{1F9D8} Yoga" },
  { value: "martial_arts", label: "\u{1F94B} Martial Arts" },
  { value: "running", label: "\u{1F3C3} Running" },
  { value: "cycling", label: "\u{1F6B4} Cycling" },
  { value: "dance", label: "\u{1F483} Dance" },
  { value: "wellness", label: "\u{1F33F} Wellness" },
  { value: "sports", label: "\u26BD Sports" },
  { value: "workshop", label: "\u{1F4CB} Workshop / Retreat" },
  { value: "other", label: "\u2728 Other" },
];

// ─── WORLD DATA ──────────────────────────────────────────────────────────────
export const ALL_COUNTRIES = [
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
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

export const COUNTRY_CITY_MAP: Record<string, string[]> = {
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

// ─── TIMEZONES ───────────────────────────────────────────────────────────────
export const ALL_TIMEZONES = [
  { label: "UTC-12:00 -- Baker Island", value: "Etc/GMT+12" },
  { label: "UTC-11:00 -- American Samoa", value: "Pacific/Pago_Pago" },
  { label: "UTC-10:00 -- Hawaii", value: "Pacific/Honolulu" },
  { label: "UTC-09:00 -- Alaska", value: "America/Anchorage" },
  { label: "UTC-08:00 -- Los Angeles / Vancouver", value: "America/Los_Angeles" },
  { label: "UTC-07:00 -- Denver / Phoenix", value: "America/Denver" },
  { label: "UTC-06:00 -- Chicago / Mexico City", value: "America/Chicago" },
  { label: "UTC-05:00 -- New York / Bogota", value: "America/New_York" },
  { label: "UTC-03:00 -- Sao Paulo / Buenos Aires", value: "America/Sao_Paulo" },
  { label: "UTC+00:00 -- London / Reykjavik", value: "Europe/London" },
  { label: "UTC+01:00 -- Paris / Berlin / Lagos", value: "Europe/Paris" },
  { label: "UTC+02:00 -- Cairo / Johannesburg", value: "Africa/Cairo" },
  { label: "UTC+03:00 -- Moscow / Nairobi / Riyadh", value: "Asia/Riyadh" },
  { label: "UTC+03:30 -- Tehran", value: "Asia/Tehran" },
  { label: "UTC+04:00 -- Dubai / Baku", value: "Asia/Dubai" },
  { label: "UTC+05:00 -- Karachi / Tashkent", value: "Asia/Karachi" },
  { label: "UTC+05:30 -- Mumbai / New Delhi", value: "Asia/Kolkata" },
  { label: "UTC+07:00 -- Bangkok / Jakarta", value: "Asia/Bangkok" },
  { label: "UTC+08:00 -- Beijing / Singapore / Perth", value: "Asia/Singapore" },
  { label: "UTC+09:00 -- Tokyo / Seoul", value: "Asia/Tokyo" },
  { label: "UTC+10:00 -- Sydney / Port Moresby", value: "Australia/Sydney" },
  { label: "UTC+12:00 -- Auckland / Fiji", value: "Pacific/Auckland" },
];

// ─── CURRENCIES ──────────────────────────────────────────────────────────────
export const ALL_CURRENCIES = [
  { value: "AED", label: "AED -- UAE Dirham" },
  { value: "USD", label: "USD -- US Dollar" },
  { value: "EUR", label: "EUR -- Euro" },
  { value: "GBP", label: "GBP -- British Pound" },
  { value: "SAR", label: "SAR -- Saudi Riyal" },
  { value: "QAR", label: "QAR -- Qatari Rial" },
  { value: "AUD", label: "AUD -- Australian Dollar" },
  { value: "CAD", label: "CAD -- Canadian Dollar" },
  { value: "INR", label: "INR -- Indian Rupee" },
  { value: "JPY", label: "JPY -- Japanese Yen" },
  { value: "CNY", label: "CNY -- Chinese Yuan" },
  { value: "SGD", label: "SGD -- Singapore Dollar" },
  { value: "MYR", label: "MYR -- Malaysian Ringgit" },
  { value: "PKR", label: "PKR -- Pakistani Rupee" },
  { value: "BDT", label: "BDT -- Bangladeshi Taka" },
  { value: "EGP", label: "EGP -- Egyptian Pound" },
  { value: "TRY", label: "TRY -- Turkish Lira" },
  { value: "ZAR", label: "ZAR -- South African Rand" },
  { value: "BRL", label: "BRL -- Brazilian Real" },
  { value: "MXN", label: "MXN -- Mexican Peso" },
];

// ─── VISIBILITY PACKS ────────────────────────────────────────────────────────
export interface VisibilityPack {
  id: string;
  name: string;
  price: number;
  label: string;
  desc: string;
  color: string;
  accent: string;
  popular?: boolean;
}

export const VISIBILITY_PACKS: VisibilityPack[] = [
  {
    id: "event_none",
    name: "Standard",
    price: 0,
    label: "Free -- included",
    desc: "Listed in Holora feed after approval. Visible to all community members.",
    color: "#cbd5e1",
    accent: "rgba(203,213,225,0.1)",
  },
  {
    id: "event_boost_starter",
    name: "BOOST",
    price: 19,
    label: "\u20AC19 one-time",
    desc: "Priority placement in feed for 7 days. 3x more views on average.",
    color: "#7e22ce",
    accent: "rgba(126,34,206,0.15)",
  },
  {
    id: "event_boost_featured",
    name: "FEATURED",
    price: 49,
    label: "\u20AC49 one-time",
    desc: "Top of feed + spotlight for 14 days. Push notification to nearby members.",
    color: "#f4be69",
    accent: "rgba(244,190,105,0.15)",
    popular: true,
  },
];
