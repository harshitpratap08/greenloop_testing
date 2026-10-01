import { motion, useReducedMotion } from "motion/react";

/**
 * Final network visualization: provider-side stages and receiver-side stages
 * converge through the GreenLoop coordination spine into one verified
 * recovery flow. Packets travel the rails while the whole system resolves
 * into a single connection; reduced motion shows the resolved network.
 */
export default function NetworkFlow({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  const providerStages = ["PROVIDER", "MATERIAL", "PASSPORT"];
  const receiverStages = ["RECEIVER", "CAPACITY", "BOOKING"];
  const spine = ["MATCH", "DELIVERY", "VERIFICATION"];

  const rail =
    "relative h-px flex-1 min-w-10 bg-steel-300 overflow-visible site-dark:bg-white/15";
  const draw = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { scaleX: 0 },
          whileInView: { scaleX: 1 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  const pulse = (delay: number, duration = 3.2) =>
    reduceMotion ? null : (
      <motion.span
        className="absolute -top-[3px] size-1.5 bg-loop-300"
        animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />
    );

  return (
    <div className={className} aria-label="GreenLoop network: provider stages and receiver stages converging through the coordination layer into verified recovery">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        {/* Provider side */}
        <ul className="space-y-3" aria-hidden="true">
          {providerStages.map((label, index) => (
            <li key={label} className="flex items-center gap-3">
              <span className="w-full border border-steel-300 bg-white px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-steel-700 site-dark:border-white/12 site-dark:bg-white/[0.03] site-dark:text-white/70">
                {label}
              </span>
              <span className="relative hidden h-px w-14 bg-steel-300 sm:block site-dark:bg-white/15">
                <motion.span
                  className="absolute inset-0 origin-left bg-loop-400/80 rtl:origin-right"
                  {...draw(0.2 + index * 0.18)}
                />
                {pulse(index * 0.9)}
              </span>
            </li>
          ))}
        </ul>

        {/* Coordination spine */}
        <div className="relative mx-auto flex flex-col items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel-500 site-dark:text-white/40">GREENLOOP</span>
          <div className="border border-loop-400/50 bg-loop-500/10 px-6 py-5 text-center">
            <p className="eyebrow-label text-loop-700 site-dark:text-loop-300">The connection</p>
            <p className="mt-2 font-archivo text-xl font-bold tracking-wide text-ink-900 site-dark:text-white sm:text-2xl">GREENLOOP MATCH</p>
          </div>
          <div className={rail}>
            <motion.span
              className="absolute inset-0 origin-left bg-loop-400/80 rtl:origin-right"
              {...draw(0.4)}
            />
            {pulse(0.4)}
          </div>
          <ul className="flex gap-2">
            {spine.map((label, index) => (
              <motion.li
                key={label}
                className="border border-steel-300 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-700 site-dark:border-white/12 site-dark:bg-ink-950/80 site-dark:text-white/70"
                {...draw(index * 0.15)}
              >
                {label}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Receiver side */}
        <ul className="space-y-3" aria-hidden="true">
          {receiverStages.map((label, index) => (
            <li key={label} className="flex items-center gap-3">
              <span className="relative hidden h-px w-14 bg-steel-300 sm:block site-dark:bg-white/15">
                <motion.span
                  className="absolute inset-0 origin-right bg-loop-400/80 rtl:origin-left"
                  {...draw(0.2 + index * 0.18)}
                />
                {pulse(index * 0.9 + 0.45)}
              </span>
              <span className="w-full border border-steel-300 bg-white px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-steel-700 site-dark:border-white/12 site-dark:bg-white/[0.03] site-dark:text-white/70">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Converged result */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="relative h-10 w-px bg-steel-300 site-dark:bg-white/15">
          <div className="absolute inset-0 bg-loop-400/80" />
          {reduceMotion ? (
            <span className="absolute -bottom-1 -start-[2.5px] size-1.5 bg-loop-300" />
          ) : (
            <motion.span
              className="absolute -start-[2.5px] size-1.5 bg-loop-300"
              animate={{ top: ["0%", "92%"], opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}
        </div>
        <motion.p
          className="border border-loop-600/50 bg-loop-100 px-5 py-3 text-center font-archivo text-lg font-bold text-loop-800 sm:text-xl site-dark:border-loop-400/60 site-dark:bg-loop-500/15 site-dark:text-loop-200"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 18 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: "-40px" },
                transition: { duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] as const },
              })}
        >
          ONE NETWORK · TWO SIDES · ONE COORDINATED RECOVERY FLOW
        </motion.p>
      </div>
    </div>
  );
}
