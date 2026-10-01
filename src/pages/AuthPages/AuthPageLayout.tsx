import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ambientVideo, ambientMedia, type AppVideo, type AppMedia } from "@/config/appMedia";

/**
 * Auth layout — one cinematic media half + one focused form half.
 *
 * The media half runs slow, muted, looping recovery footage (reduced motion:
 * the poster frame) under a charcoal scrim, with the GreenLoop identity and
 * three live operational proof chips from the demo scenario. Forms receive
 * a staggered entrance. Any-input demo auth is preserved downstream.
 */

const PROOF_CHIPS = [
  { value: "15 t", label: "slot confirmed" },
  { value: "24.0 t", label: "surveyed" },
  { value: "7.4 t", label: "verified" },
];

function AuthMediaHalf({ video, image, tagline }: { video: AppVideo; image: AppMedia; tagline: string }) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const media = videoRef.current;
    if (!frame || !media || reduce) return;
    let visible = true;
    const tryPlay = () => {
      if (visible && media.paused) media.play().catch(() => {});
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) tryPlay();
        else media.pause();
      },
      { threshold: 0.2 },
    );
    observer.observe(frame);
    const keepalive = window.setInterval(tryPlay, 4000);
    return () => {
      observer.disconnect();
      window.clearInterval(keepalive);
    };
  }, [reduce]);

  const children = [
    <motion.p key="p0" variants={item} className="eyebrow-label text-white/60">Construction material recovery network</motion.p>,
    <motion.h1 key="p1" variants={item} className="mt-5 font-archivo text-4xl font-bold leading-tight tracking-tight text-white">
      GREEN<span className="text-loop-400">LOOP</span>
    </motion.h1>,
    <motion.p key="p2" variants={item} className="mt-5 font-archivo text-xl font-medium leading-7 text-white/90">{tagline}</motion.p>,
    <motion.p key="p3" variants={item} className="mt-3 max-w-sm text-sm leading-6 text-white/60">
      Survey materials, match receivers, reserve capacity and verify every recovered tonne.
    </motion.p>,
    <motion.div key="p4" variants={item} className="mt-8 flex flex-wrap gap-2">
      {PROOF_CHIPS.map((chip) => (
        <span key={chip.label} className="border border-white/20 bg-white/[0.06] px-3 py-1.5 backdrop-blur-sm">
          <span className="ledger-numeral text-sm font-semibold text-white">{chip.value}</span>
          <span className="ms-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">{chip.label}</span>
        </span>
      ))}
    </motion.div>,
  ];

  return (
    <div ref={frameRef} className="relative hidden h-full w-full items-center overflow-hidden lg:grid lg:w-1/2">
      {reduce ? (
        <img src={image.src} alt={image.alt} className="absolute inset-0 size-full object-cover" />
      ) : (
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            className={ready ? "size-full object-cover opacity-100 transition-opacity duration-700" : "size-full object-cover opacity-0 transition-opacity duration-700"}
            src={video.src}
            poster={image.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            onCanPlay={() => setReady(true)}
          />
        </motion.div>
      )}
      <div className="absolute inset-0 bg-ink-950/70" aria-hidden="true" />
      {/* Fine construction-line grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:120px_120px]" />
      </div>

      <motion.div
        className="relative z-1 mx-auto flex max-w-md flex-col px-8"
        initial={reduce ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }}
      >
        <Link to="/" className="mb-8 block w-fit">
          <img width={180} height={40} src="/images/logo/auth-logo.svg" alt="GreenLoop" />
        </Link>
        {children}
      </motion.div>
    </div>
  );
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function AuthLayout({
  children,
  tone = "demolition",
}: {
  children: ReactNode;
  /** Which footage family this auth page uses. */
  tone?: "demolition" | "dispatch" | "receiving";
}) {
  const video = tone === "dispatch" ? ambientVideo.dispatch : tone === "receiving" ? ambientVideo.receiving : ambientVideo.demolition;
  const image =
    tone === "dispatch" ? ambientMedia.authTruck : tone === "receiving" ? ambientMedia.authYard : ambientMedia.authConcrete;

  return (
    <div className="relative z-1 flex min-h-screen bg-white dark:bg-black">
      <AuthMediaHalf video={video} image={image} tagline={tone === "dispatch" ? "Plan where recoverable materials go — before the truck leaves." : tone === "receiving" ? "Every received tonne, checked and on the record." : "Plan where recoverable materials go — before the truck leaves."} />
      <div className="relative flex w-full flex-col lg:w-1/2">{children}</div>
      <div className="fixed end-6 bottom-6 z-50">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}
