import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

/**
 * Full-bleed cinematic video layer for landing-page story beats.
 *
 * - autoplay / muted / loop / playsInline, object-cover behind content
 * - plays only while visible (IntersectionObserver gates decoding)
 * - poster frame is the fallback for reduced-motion users and while the
 *   first frame loads — the section composition never changes, only motion
 * - overlay tuning happens through `overlayClassName` so each beat keeps
 *   its own grade without extra wrappers
 */
export default function VideoBackground({
  video,
  overlayClassName,
  className,
  videoClassName,
  objectPosition = "center",
}: {
  video: { src: string; poster: string; alt: string };
  /** Gradient/scrim layer stacked above the video, below section content. */
  overlayClassName?: string;
  className?: string;
  videoClassName?: string;
  /** object-position tuning, e.g. "center bottom" for tall machinery. */
  objectPosition?: string;
}) {
  const reduceMotion = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const media = videoRef.current;
    if (!frame || !media || reduceMotion) return;

    let visible = false;

    const tryPlay = () => {
      if (visible && media.paused) {
        media.play().catch(() => {
          /* Autoplay refusal — the poster frame stays as the fallback. */
        });
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          tryPlay();
        } else {
          media.pause();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(frame);
    // Some browsers pause background media "to save power" or drop play
    // state across HMR remounts; a slow keepalive re-syncs without fighting
    // the observer (it only ever resumes videos the observer marked visible).
    const keepalive = window.setInterval(tryPlay, 4000);

    return () => {
      observer.disconnect();
      window.clearInterval(keepalive);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={frameRef}
      className={cn("absolute inset-0 overflow-hidden bg-ink-950", className)}
      role="img"
      aria-label={video.alt}
    >
      <video
        ref={videoRef}
        className={cn(
          "size-full object-cover transition-opacity duration-700",
          videoClassName,
          ready ? "opacity-100" : "opacity-0",
        )}
        style={{ objectPosition }}
        src={video.src}
        poster={video.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
      />
      {/* Base veil so poster→video handover and bright frames stay cinematic. */}
      <div className="pointer-events-none absolute inset-0 bg-ink-950/20" />
      {overlayClassName && (
        <div className={cn("pointer-events-none absolute inset-0", overlayClassName)} />
      )}
    </div>
  );
}
