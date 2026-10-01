import type { ReactNode } from "react";
import { cn } from "@/utils";
import VideoBackground from "./VideoBackground";

export default function MaterialPassportReveal({
  video,
  children,
  className,
}: {
  video: { src: string; poster: string; alt: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12", className)}>
      <div>
        <div className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-ink-900 sm:aspect-video">
          <VideoBackground
            video={video}
            className="!absolute"
            objectPosition="center 35%"
            overlayClassName="bg-gradient-to-t from-ink-950/50 via-transparent to-ink-950/10"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-gradient-to-t from-ink-950/90 to-transparent px-4 pb-3 pt-10">
            {["PHYSICAL MATERIAL", "SURVEY", "EVIDENCE", "DIGITAL RECORD"].map((label, index) => (
              <span key={label} className="font-mono text-[10px] uppercase tracking-[0.18em]">
                <span className={index === 3 ? "text-loop-300" : "text-white/60"}>{label}</span>
                {index < 3 && <span className="ms-4 text-white/25">→</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
