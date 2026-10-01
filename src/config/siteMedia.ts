/**
 * Central media configuration for the public homepage story.
 *
 * Every video beat on the landing page resolves through this file, so
 * footage can be swapped, re-encoded or extended without touching any
 * section component. Posters double as reduced-motion and offline
 * fallbacks — a video section never degrades to a different composition.
 */

export interface SiteVideo {
  /** Public video URL (served from /public). */
  src: string;
  /** Poster frame shown before/if the video renders. */
  poster: string;
  /** Non-visual description of the footage. */
  alt: string;
}

export const siteVideos = {
  /** Hero — excavator demolishing a structure (full-viewport cinematic). */
  hero: {
    src: "/videos/hero-demolition.mp4",
    poster: "/images/site/hero-demolition.jpg",
    alt: "Excavator demolishing a structure on an active construction site",
  },
  /** Two worlds — provider side: urban demolition in progress. */
  providerWorld: {
    src: "/videos/demolition-urban.mp4",
    poster: "/images/site/hero-demolition.jpg",
    alt: "Building demolition underway in an urban area",
  },
  /** Two worlds — receiver side: intake of recoverable material. */
  receiverWorld: {
    src: "/videos/concrete-excavation.mp4",
    poster: "/images/site/yard-wide.jpg",
    alt: "Excavator handling recoverable material at an intake point",
  },
  /** Material passport — recovered material being handled in daylight. */
  passport: {
    src: "/videos/material-loading.mp4",
    poster: "/images/site/brick-pallets.jpg",
    alt: "Recovered material being loaded and sorted for recovery",
  },
  /** Match system — sorted material being loaded for placement. */
  match: {
    src: "/videos/material-loading.mp4",
    poster: "/images/site/sorting-facility.jpg",
    alt: "Sorted recovered material being loaded for transport",
  },
  /** Problem section — demolition work happening between the sites. */
  problem: {
    src: "/videos/demolition-urban.mp4",
    poster: "/images/site/hero-demolition.jpg",
    alt: "Demolition machinery working on site",
  },
  /** Capacity — receiving yard in operation. */
  capacity: {
    src: "/videos/verification-yard.mp4",
    poster: "/images/site/auth-yard.jpg",
    alt: "Receiving yard in operation with space allocated for arrivals",
  },
  /** Delivery — truck being loaded before dispatch. */
  delivery: {
    src: "/videos/truck-dispatch.mp4",
    poster: "/images/site/auth-truck.jpg",
    alt: "Dump truck being loaded ahead of a booked dispatch",
  },
  /** Verification — arrival and acceptance at the receiving yard. */
  verification: {
    src: "/videos/verification-yard.mp4",
    poster: "/images/site/auth-yard.jpg",
    alt: "Truck arriving at the receiving yard for verification",
  },
} satisfies Record<string, SiteVideo>;
