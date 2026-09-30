import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";

const providerSteps = ["Survey", "Material Passport", "Find Receiver", "Request Capacity", "Book", "Send Load", "Verify"];
const receiverSteps = ["Material Request", "Receive Offers", "Review Passport", "Accept", "Capacity", "Receive", "Verify"];
const workflowSteps = ["Survey", "Passport", "Match", "Capacity", "Book", "Send", "Receive", "Verify"];

export default function Landing() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <PageMeta
        title="GreenLoop — The operating layer for construction material recovery"
        description="Connect recovered construction materials with organizations that need them. Coordinate demand, receiving capacity, bookings, delivery, and verification in one network."
      />
      <SiteNav />
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-ink-950">
          <div className="absolute inset-0 -z-10">
            <img src="/images/site/hero-demolition.jpg" alt="Construction recovery work at an active demolition site" className="h-full min-h-[700px] w-full object-cover object-center opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30" />
          </div>
          <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div className="max-w-3xl">
              <p className="eyebrow-label flex items-center gap-3 text-white/65"><span className="size-2 bg-loop-400" />Construction material recovery network</p>
              <h1 className="mt-7 font-archivo text-6xl font-bold leading-[0.92] tracking-[-0.055em] sm:text-8xl">GREEN<span className="text-loop-400">LOOP</span></h1>
              <p className="mt-6 max-w-2xl font-archivo text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">The operating layer for construction material recovery.</p>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">Connect recovered materials with the organizations that need them — while coordinating capacity, bookings, delivery and verification.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#network" className="inline-flex min-h-12 items-center justify-center bg-loop-500 px-6 text-sm font-bold text-ink-950 transition-colors hover:bg-loop-400">Explore GreenLoop</a>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10">See how it works</a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg lg:ms-auto">
              <div className="absolute -inset-3 border border-white/15" aria-hidden="true" />
              <div className="relative border border-white/20 bg-ink-950/90 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <p className="eyebrow-label text-white/55">One network · two sides</p>
                  <span className="ledger-numeral text-xs text-loop-300">GREENLOOP</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-6 sm:gap-4">
                  <div className="border border-white/15 bg-white/[0.04] p-3 sm:p-4">
                    <p className="eyebrow-label text-white/45">Provider</p>
                    <p className="mt-2 font-archivo text-base font-semibold sm:text-lg">Material</p>
                    <p className="ledger-numeral mt-1 text-xs text-white/55">15 t concrete</p>
                  </div>
                  <span className="text-loop-400" aria-hidden="true">→</span>
                  <div className="border border-white/15 bg-white/[0.04] p-3 sm:p-4">
                    <p className="eyebrow-label text-white/45">Receiver</p>
                    <p className="mt-2 font-archivo text-base font-semibold sm:text-lg">Demand</p>
                    <p className="ledger-numeral mt-1 text-xs text-white/55">50 t requested</p>
                  </div>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-white/60"><span>DEMAND</span><span className="h-px flex-1 bg-white/20" /><span className="text-loop-300">CAPACITY-AWARE MATCH</span><span className="h-px flex-1 bg-white/20" /><span>DELIVERY</span></div>
                  <p className="mt-3 text-sm leading-6 text-white/70">Material, receiving space and a real delivery plan — connected before the load moves.</p>
                </div>
              </div>
              <p className="mt-4 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Material → GreenLoop → Receiver</p>
            </div>
          </div>
        </section>

        <section id="product" className="scroll-mt-24 border-b border-white/10 bg-[#171a17]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
            <div className="mb-10 max-w-3xl">
              <p className="eyebrow-label text-loop-300">One network. Two sides.</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Different work. A shared recovery flow.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Providers structure available material. Receivers describe what they need and when they can take it. GreenLoop coordinates the steps between them.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <WorkflowSide id="providers" title="I have material." label="Provider workflow" steps={providerSteps} action="I have material" />
              <WorkflowSide id="receivers" title="I need material." label="Receiver workflow" steps={receiverSteps} action="I need material" />
            </div>
          </div>
        </section>

        <section id="network" className="scroll-mt-24 overflow-hidden border-b border-white/10 bg-ink-950">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="eyebrow-label text-loop-300">The coordination layer</p>
                <h2 className="mt-4 max-w-xl font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Recovery is a chain. GreenLoop keeps it connected.</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-white/65">Material supply and receiver demand meet through a capacity-aware match. From there, a dated booking connects the load to delivery and evidence of what was accepted.</p>
            </div>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {["MATERIAL", "DEMAND", "GREENLOOP MATCH", "CAPACITY", "BOOKING", "DELIVERY", "VERIFIED RECOVERY"].map((step, index) => (
                <motion.div key={step} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : index * 0.07, duration: 0.35 }} className={`relative flex min-h-24 items-center border p-4 ${step === "GREENLOOP MATCH" ? "border-loop-400/60 bg-loop-500/10 text-loop-300 sm:col-span-2 lg:col-span-1" : "border-white/15 bg-white/[0.03] text-white"}`}>
                  <span className="ledger-numeral absolute right-3 top-3 text-[10px] text-white/35">{String(index + 1).padStart(2, "0")}</span>
                  <span className="max-w-[10rem] font-archivo text-sm font-bold tracking-wide">{step}</span>
                  {index < 6 && <span className="absolute -right-2 z-10 hidden text-loop-300 lg:block" aria-hidden="true">→</span>}
                </motion.div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 text-xs text-white/45"><span className="size-2 bg-loop-400" />Material + demand → match → capacity → booking → delivery → verified recovery</div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-b border-white/10 bg-[#20231f]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow-label text-amber-300">The gap between sites</p>
              <h2 className="mt-4 max-w-xl font-archivo text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Recovery fails between the sites, not on them.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70">Material may exist. Demand may exist. But moving one to the other takes coordination that a listing alone cannot provide.</p>
              <p className="mt-7 border-l-2 border-loop-400 pl-4 font-archivo text-xl font-semibold text-white">GreenLoop coordinates the movement.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
              <div className="relative min-h-72 overflow-hidden border border-white/10">
                <img src="/images/site/sorting-facility.jpg" alt="Material stockpiles awaiting a planned receiving slot" className="absolute inset-0 size-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 font-archivo text-lg font-semibold">Material and demand need a workable route between them.</p>
              </div>
              <ul className="flex flex-col justify-center divide-y divide-white/10 border-y border-white/10 text-sm text-white/75">
                {["Quantities are uncertain", "Suitable receivers are unclear", "Capacity is limited by date", "Arrivals compete for space", "Delivery evidence can be incomplete", "Accepted quantities can differ"].map((item) => <li key={item} className="flex gap-3 py-3"><span className="text-amber-300" aria-hidden="true">—</span>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#111411]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
            <div className="relative min-h-80 overflow-hidden border border-white/10">
              <img src="/images/site/brick-pallets.jpg" alt="Recovered construction materials sorted and ready for a new use" className="absolute inset-0 size-full object-cover opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-white/80"><span className="size-2 bg-loop-400" />SITE EVIDENCE · HARROW ROAD</div>
            </div>
            <div>
              <p className="eyebrow-label text-loop-300">Material Passport</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Your material’s digital record.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/65">A Material Passport brings the basic facts, condition and supporting evidence together so both sides can make a grounded decision.</p>
              <div className="mt-8 border border-white/15 bg-[#1a1e1a]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-5">
                  <div><p className="eyebrow-label text-white/45">Material Passport · MP-014</p><h3 className="mt-2 font-archivo text-2xl font-bold">Concrete</h3><p className="mt-1 text-sm text-white/55">Harrow Road · Site evidence attached</p></div>
                  <p className="ledger-numeral text-3xl font-semibold text-loop-300">15 t</p>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 text-sm"><Record label="Condition" value="Good" /><Record label="Evidence" value="Site photos · survey sheet" /><Record label="Location" value="Harrow Road" /><Record label="Status" value="Ready to match" /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#1c201c]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow-label text-amber-300">Capacity-aware by design</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">A match isn’t enough.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/70">A receiver may want the material but not have enough room that day. GreenLoop checks the dated capacity before the booking is confirmed.</p>
              <p className="mt-5 text-sm leading-6 text-white/55">If the full amount will not fit, providers can book the available tonnes, try another receiver, or choose another date.</p>
            </div>
            <div className="border border-white/15 bg-ink-950 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4"><div><p className="eyebrow-label text-white/45">Receiving slot · Tuesday</p><h3 className="mt-2 font-archivo text-xl font-bold">Riverstone Aggregates</h3></div><span className="border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-xs font-bold text-amber-200">WAITING ON CAPACITY</span></div>
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="border-l-2 border-white/20 pl-4"><p className="eyebrow-label text-white/45">Requested</p><p className="ledger-numeral mt-2 text-3xl font-semibold">8 t</p></div>
                <div className="border-l-2 border-loop-400 pl-4"><p className="eyebrow-label text-white/45">Available</p><p className="ledger-numeral mt-2 text-3xl font-semibold text-loop-300">5 t</p></div>
              </div>
              <div className="h-2 bg-white/10"><div className="h-full w-[62.5%] bg-loop-400" /></div>
              <div className="mt-6 flex flex-wrap gap-2"><Link to="/sign-up" className="inline-flex min-h-11 items-center bg-loop-500 px-4 text-sm font-bold text-ink-950 hover:bg-loop-400">Book 5 t</Link><Link to="/sign-up" className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">Another receiver</Link><Link to="/sign-up" className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">Another date</Link></div>
              <p className="mt-4 text-xs text-white/45">The remaining 3 t stays visible to book elsewhere.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-ink-950">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="eyebrow-label text-loop-300">One connected physical + digital workflow</p>
                <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">From request to verified recovery.</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/65">A request becomes an offer. An offer becomes a capacity-checked booking. A delivered load closes with the quantity the receiver actually accepts.</p>
              </div>
              <div className="border-y border-white/15">
                <StoryRow number="01" title="A receiver asks" detail="Riverstone needs 50 t of concrete." state="MATERIAL REQUEST" />
                <StoryRow number="02" title="A provider offers" detail="15 t from a Material Passport, with site evidence." state="OFFER SENT" />
                <StoryRow number="03" title="The receiver accepts" detail="The offer is reviewed and receiving capacity is checked." state="CAPACITY CONFIRMED" />
                <StoryRow number="04" title="The load moves" detail="A dated booking connects the material to delivery." state="BOOKING · ON THE ROAD" />
                <StoryRow number="05" title="Recovery is verified" detail="The receiver records actual and accepted tonnes." state="EVIDENCE RECORDED" last />
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
              {workflowSteps.map((step, index) => <div key={step} className="bg-ink-950 p-4 sm:p-5"><p className="ledger-numeral text-xs text-loop-300">{String(index + 1).padStart(2, "0")}</p><p className="mt-2 font-archivo text-sm font-bold uppercase tracking-wide">{step}</p></div>)}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 border-b border-white/10 bg-[#20231f]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:py-16">
            <div><p className="eyebrow-label text-loop-300">GreenLoop · construction recovery infrastructure</p><h2 className="mt-4 max-w-3xl font-archivo text-3xl font-bold leading-tight sm:text-4xl">Providers turn recovered material into structured supply. Receivers express demand and available capacity. GreenLoop connects the movement between them.</h2><p className="mt-4 text-sm text-white/55">Coordination for material, demand, capacity, booking, delivery and verification — not another standalone listing.</p></div>
            <Link to="/sign-up" className="inline-flex min-h-12 items-center justify-center bg-loop-500 px-6 text-sm font-bold text-ink-950 hover:bg-loop-400">Create account</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function WorkflowSide({ id, title, label, steps, action }: { id: string; title: string; label: string; steps: string[]; action: string }) {
  return (
    <article id={id} className="scroll-mt-24 border border-white/15 bg-[#101310] p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-4"><h3 className="font-archivo text-2xl font-bold sm:text-3xl">{title}</h3><span className="eyebrow-label text-white/40">{label}</span></div>
      <ol className="mt-5 grid gap-x-4 sm:grid-cols-2">
        {steps.map((step, index) => <li key={step} className="flex min-h-12 items-center gap-3 border-b border-white/[0.07] py-2 text-sm text-white/75"><span className="ledger-numeral w-6 text-xs text-loop-300">{String(index + 1).padStart(2, "0")}</span><span>{step}</span>{index < steps.length - 1 && <span className="ms-auto text-white/25" aria-hidden="true">→</span>}</li>)}
      </ol>
      <Link to="/sign-up" className="mt-6 inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold transition-colors hover:border-loop-300 hover:bg-loop-500/10">{action}<span className="ms-3 text-loop-300" aria-hidden="true">→</span></Link>
    </article>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return <div className="border-l border-white/15 pl-3"><p className="eyebrow-label text-white/40">{label}</p><p className="mt-1 text-sm font-medium text-white/85">{value}</p></div>;
}

function StoryRow({ number, title, detail, state, last = false }: { number: string; title: string; detail: string; state: string; last?: boolean }) {
  return <div className={`grid gap-3 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center ${last ? "" : "border-b border-white/10"}`}><span className="ledger-numeral text-xs text-loop-300">{number}</span><div><h3 className="font-archivo text-lg font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-white/55">{detail}</p></div><span className="w-fit border border-white/15 px-2 py-1 font-mono text-[10px] tracking-wide text-white/55">{state}</span></div>;
}
