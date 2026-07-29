"use client";

import { MapPin, Video, Home as HomeIcon, Activity } from "lucide-react";

interface TypeIconProps {
  type: string;
}

export function TypeIcon({ type }: TypeIconProps) {
  if (type === "gym") return <MapPin size={16} className="text-yellow-400" />;
  if (type === "virtual") return <Video size={16} className="text-fuchsia-400" />;
  if (type === "home") return <HomeIcon size={16} className="text-emerald-400" />;
  return <Activity size={16} className="text-slate-400" />;
}
