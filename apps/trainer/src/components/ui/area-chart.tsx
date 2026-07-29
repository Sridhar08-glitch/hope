"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AreaChartProps {
  payments?: any[];
}

export function AreaChart({ payments = [] }: AreaChartProps) {
  // Calculate revenue data from payments
  const calculateRevenueData = () => {
    const today = new Date();
    const revenueByMonth: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      revenueByMonth[key] = 0;
    }

    // Sum payments by month
    payments.forEach((payment) => {
      try {
        const paymentDate = new Date(payment.created_at || payment.date);
        const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`;
        if (Object.prototype.hasOwnProperty.call(revenueByMonth, key)) {
          revenueByMonth[key] += parseFloat(payment.total_amount || payment.amount || 0);
        }
      } catch {
        // Skip invalid dates
      }
    });

    // Normalize to SVG coordinates (0-60)
    const values = Object.values(revenueByMonth);
    const max = Math.max(...values, 1);
    return values.map((v) => {
      const normalized = (v / max) * 50 + 5;
      return Math.min(normalized, 55);
    });
  };

  const data = calculateRevenueData();

  return (
    <div className="h-full w-full relative overflow-hidden min-h-[220px]">
      <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-6 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full border-t border-slate-700/40 border-dashed h-0 flex items-center">
            <span className="text-[9px] text-slate-600 absolute -left-1">
              {100 - i * 25}
            </span>
          </div>
        ))}
      </div>
      <svg
        viewBox="-2 -10 104 70"
        preserveAspectRatio="none"
        className="w-full h-full z-10 relative pt-2"
      >
        <defs>
          <linearGradient id="gradientCyan" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7E22CE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7E22CE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M ${data.map((y, i) => `${i * 16.67},${60 - y}`).join(" L ")} L 100 60 L 0 60 Z`}
          fill="url(#gradientCyan)"
          className="transition-all duration-1000"
        />
        <path
          d={`M ${data.map((y, i) => `${i * 16.67},${60 - y}`).join(" L ")}`}
          fill="none"
          stroke="#7E22CE"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(126,34,206,0.8))" }}
        />
        {data.map((y, i) => (
          <circle
            key={i}
            cx={i * 16.67}
            cy={60 - y}
            r="2"
            fill="#fff"
            className="drop-shadow-[0_0_8px_#7E22CE] hover:r-3 cursor-pointer transition-all"
          />
        ))}
      </svg>
    </div>
  );
}
