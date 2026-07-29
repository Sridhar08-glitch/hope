"use client";

import { Component } from "react";
import { BRAND } from "@holora/ui";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div
            className="text-center max-w-md w-full rounded-2xl p-8 border border-white/5"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: `${BRAND.error}15` }}
            >
              <AlertTriangle size={28} style={{ color: BRAND.error }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.textMain }}>
              Something went wrong
            </h3>
            <p className="text-sm mb-6" style={{ color: BRAND.textMuted }}>
              {this.props.fallbackMessage || "An unexpected error occurred. Please try refreshing."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: BRAND.primary }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
