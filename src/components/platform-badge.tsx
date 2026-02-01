import { Platform } from "../types/bj";
import { Youtube, Radio, MonitorPlay } from "lucide-react";

interface PlatformBadgeProps {
  platform: Platform;
  size?: "xs" | "sm";
}

const sizeClasses = {
  xs: "px-1.5 py-[1px] text-[10px]",
  sm: "px-2 py-[3px] text-[11px]",
};

export function PlatformBadge({ platform, size = "sm" }: PlatformBadgeProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full font-medium border border-amber-400/50 bg-zinc-950/80 text-amber-200/90 shadow-[0_0_12px_rgba(250,204,21,0.35)]";

  const Icon = platform === "youtube" ? Youtube : MonitorPlay;

  const label = platform === "youtube" ? "YouTube" : "Unknown";

  return (
    <span className={`${base} ${sizeClasses[size]}`}>
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );
}

