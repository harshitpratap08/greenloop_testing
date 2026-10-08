/**
 * GreenLoop domain types — shared by the operational platform and the
 * public site's capacity ledger. Pure data, no React imports.
 *
 * Core workflow: SURVEY → MATCH → RESERVE → DISPATCH → VERIFY
 */

export type ProjectStatus = "active" | "demolition" | "complete";
export type MaterialCondition = "good" | "fair" | "poor";
export type MaterialGrade = "A" | "B" | "C";
/** The six surveyed catalogue types, plus provider-defined custom materials
 * (free-form labels, e.g. "roof tiles"), which flow through the same backend. */
export type MaterialTypeKey =
  | "concrete"
  | "brick"
  | "steel"
  | "timber"
  | "plasterboard"
  | "glass"
  | (string & {});

export type MaterialStatus =
  | "surveyed"
  | "passport-ready"
  | "allocated"
  | "reserved"
  | "dispatched"
  | "verified"
  | "cancelled";

export type AllocationStatus = "confirmed" | "hold" | "pending" | "cancelled";
export type BookingStatus = "confirmed" | "hold" | "pending" | "cancelled";
export type VerificationStatus = "verified" | "rejected" | "pending";
export type DemandStatus = "DRAFT" | "OPEN" | "PARTIALLY_COVERED" | "COVERED" | "PAUSED" | "CANCELLED";

export type ActorKind = "system" | "contractor" | "receiver";

export interface Actor {
  kind: ActorKind;
  name: string;
}

/** Every state transition is appended here; drives app timelines + site ledger. */
export interface DomainEvent {
  id: string;
  at: string; // ISO timestamp
  kind: string; // e.g. "allocation.confirmed", "capacity.released"
  actor: Actor;
  summary: string;
  detail?: string;
  /** Identifiers touched, so views can filter events per entity. */
  subjectIds: string[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  /** Earliest of any material's survey timestamp; demo seed only. */
  surveyedAt: string;
  lastActivityAt: string;
  geo?: GeoPoint;
}

export interface MaterialPassport {
  id: string;
  projectId: string;
  type: MaterialTypeKey;
  /** Best-estimate recoverable quantity, tonnes. */
  quantityT: number;
  /** Original unit type if not surveyed in tonnes (e.g. cubic meters, pallets). */
  originalUnit?: string;
  /** Original quantity in the original unit. */
  originalQuantity?: number;
  /** Conversion factor applied (tonnes per unit). */
  conversionFactor?: number;
  /** Survey uncertainty band in tonnes [min, max]. */
  quantityRangeT: [number, number];
  condition: MaterialCondition;
  grade: MaterialGrade;
  surveyedAt: string;
  status: MaterialStatus;
  /** Confidence in the estimate, 0–1. */
  confidence: number;
  surveyNotes?: string;
  evidence: Evidence[];
  pricePerT?: number;
  availableFrom?: string;
  geo?: GeoPoint;
  archivedAt?: string;
}

export type MaterialUpdate = Pick<MaterialPassport, "type" | "quantityT" | "condition" | "grade"> & { surveyNotes: string; pricePerT: number | null; availableFrom: string | null };
export type DemandUpdate = Pick<DemandRecord, "materialType" | "requiredT" | "period" | "location"> & { notes: string; budgetPerT: number | null };

export interface Evidence {
  kind: "survey-sheet" | "site-photo" | "lab-report" | "weighbridge-ticket";
  label: string;
  /** Present when evidence is a document artifact; demo uses slugs. */
  ref?: string;
  recordedAt: string;
}

export interface ProviderMaterialListing {
  materialId: string;
  providerId?: string;
  providerName: string;
  organization: string;
  location: string;
  projectId: string;
  projectName: string;
  projectLocation: string;
  materialType: MaterialTypeKey;
  quantityT: number;
  availableT: number;
  condition: MaterialCondition;
  grade: MaterialGrade;
  premium?: boolean;
  premiumExpiresAt?: string;
  sponsored?: boolean;
  sponsoredExpiresAt?: string;
  pricePerT?: number;
  availableFrom?: string;
  geo?: GeoPoint;
}

export interface TransactionContact {
  materialId: string;
  receiverId: string;
  name: string;
  organization: string;
  email: string;
  phone?: string;
}

export interface ReceiverFacility {
  geo?: GeoPoint;
  distanceKnown?: boolean;
  id: string;
  name: string;
  location: string;
  /** Tonnes of inbound material the yard can take per operating day. */
  dailyIntakeT: number;
  /** Tonnes of recovered material currently stockpiled. */
  currentStockT: number;
  acceptedTypes: MaterialTypeKey[];
  /** Distance in km from the demo project cluster. */
  distanceKm: number;
}

/** A one-day intake slot at a receiver, per material class. */
export interface ReceiverDaySlot {
  /** Reservations owned by other providers, supplied by the server ledger. */
  reservedT?: number;
  id: string;
  receiverId: string;
  /** ISO date for this slot. */
  date: string;
  materialType: MaterialTypeKey;
  /** Total tonnage the slot can accept. */
  capacityT: number;
}

export interface Allocation {
  id: string;
  materialId: string;
  receiverId: string;
  slotId: string;
  requestedT: number;
  status: AllocationStatus;
  /** For holds: why capacity could not be confirmed. */
  holdReason?: string;
  /** Point-in-time figures captured when the allocation was decided. */
  capacityBeforeT: number;
  capacityAfterT: number;
  decidedAt?: string;
  updatedAt: string;
  /** Ranked candidate receivers from matching, best first. */
  candidates: AllocationCandidate[];
}

export interface AllocationCandidate {
  distanceKnown?: boolean;
  receiverId: string;
  providerId?: string; // added for reverse matching
  materialId?: string;
  demandId?: string;
  offerId?: string;
  /** 0–1 suitability of the material for this receiver's process. */
  suitability: number;
  /** Receiver's current demand signal for this material, 0–1. */
  demand: number;
  distanceKm: number;
  /** Free tonnage in the candidate slot at scoring time. */
  availableT: number;
  /** Indicative transport cost, £/t. */
  transportCostPerT: number;
  /** Indicative handling cost, £/t. */
  handlingCostPerT: number;
  /** Deterministic composite score; higher is better. */
  score: number;
  recommended: boolean;
  
  // Advanced Matching Engine fields
  isEligible?: boolean;
  requestedQuantityT?: number;
  availableQuantityT?: number;
  coveragePercent?: number;
  remainingQuantityT?: number;
  isFullMatch?: boolean;
  isPartialMatch?: boolean;
  summary?: string;
  advantages?: string[];
  drawbacks?: string[];
  nonMatchReasons?: string[];
  missingDataNotes?: string[];
  factors?: Record<string, {
    value: string | number;
    score: number;
    impact: "positive" | "negative" | "neutral" | "unknown";
    reason: string;
  }>;
}

export interface Booking {
  id: string;
  allocationId: string;
  slotId: string;
  receiverId: string;
  materialId: string;
  tonnesT: number;
  status: BookingStatus;
  holdReason?: string;
  capacityBeforeT: number;
  capacityAfterT: number;
  createdAt: string;
  updatedAt: string;
  /** Demand fulfilled by an accepted provider offer, when applicable. */
  demandId?: string;
  receiverAcceptedAt?: string;
  /** Unique reference assigned when this booking is dispatched. */
  loadRef?: string;
  /** Populated when a confirmed booking is released. */
  cancelledAt?: string;
  cancelledReason?: string;
  agreedPricePerT?: number;
  offerId?: string;
  agreementVersionId?: string;
  archivedAt?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "adjustment" | "disputed";
export type PaymentRefundStatus = "not_required" | "pending" | "refunded" | "failed";
export type ProviderPayoutStatus = "held" | "pending" | "settled" | "failed" | "disputed" | "not_eligible";

/** Safe payment projection returned to the Receiver and Provider workspaces. */
export interface BookingPayment {
  bookingId: string;
  attemptId: string;
  provider: string;
  providerReference: string;
  amountMinor: number;
  currency: "INR";
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  acceptedT?: number;
  acceptedValueMinor: number;
  commissionMinor: number;
  providerFeeMinor: number;
  refundAmountMinor: number;
  refundStatus: PaymentRefundStatus;
  payoutAmountMinor: number;
  payoutStatus: ProviderPayoutStatus;
  payoutReference?: string;
  settledAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  /** Only included for the Receiver while payment is pending. */
  qrPayload?: string;
}

export interface MaterialOffer {
  id: string;
  demandId: string;
  providerId: string;
  passportId: string;
  offeredQuantityT: number;
  status: "draft" | "pending" | "accepted" | "declined" | "withdrawn";
  createdAt: string;
  pricePerT?: number;
  agreedPricePerT?: number;
  counters?: OfferCounter[];
  archivedAt?: string;
  /** Present only for the negotiation seeded by an auction award. */
  auctionId?: string;
}

export interface OfferCounter {
  actor: "provider" | "receiver";
  pricePerT: number;
  at: string;
}

export type NegotiationStatus =
  | "negotiating"
  | "awaiting_provider_approval"
  | "awaiting_receiver_approval"
  | "approved"
  | "confirmed"
  | "declined"
  | "withdrawn";

export interface NegotiationMessage {
  id: string;
  senderRole: "provider" | "receiver";
  senderName: string;
  body: string;
  createdAt: string;
}

export interface FinalTermsProposal {
  id: string;
  version: number;
  proposedBy: "provider" | "receiver";
  status: "awaiting_provider_approval" | "awaiting_receiver_approval" | "approved" | "confirmed" | "superseded";
  quantityT: number;
  pricePerT: number;
  destination: string;
  slotId: string;
  providerApprovedAt?: string;
  receiverApprovedAt?: string;
  createdAt: string;
  bookingId?: string;
}

export interface NegotiationConversation {
  offerId: string;
  status: NegotiationStatus;
  messages: NegotiationMessage[];
  proposals: FinalTermsProposal[];
}

export interface VerificationRecord {
  id: string;
  bookingId: string;
  loadRef: string;
  materialId: string;
  receiverId: string;
  /** Tonnes on the dispatch paperwork. */
  plannedT: number;
  /** Tonnes measured on the weighbridge. */
  actualT: number;
  acceptedT: number;
  rejectedT: number;
  rejectReason?: string;
  status: VerificationStatus;
  verifiedAt?: string;
  evidence: Evidence[];
}

export interface DemandRecord {
  /** Confirmed coverage from the shared server ledger. */
  coveredT?: number;
  id: string;
  receiverId: string;
  materialType: MaterialTypeKey;
  requiredT: number;
  period: string;
  location: string;
  status: DemandStatus;
  createdAt: string;
  notes?: string;
  budgetPerT?: number;
  geo?: GeoPoint;
  targetProviderId?: string;
  targetProviderName?: string;
  targetMaterialId?: string;
  archivedAt?: string;
  /** Hidden backing request for an auction winner's ordinary negotiation. */
  auctionId?: string;
}

export interface SupportRequest {
  id: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
  status?: "open" | "in_review" | "waiting" | "resolved";
  updatedAt?: string;
  resolvedAt?: string;
}

export interface GreenLoopDataset {
  readEventIds?: string[];
  providerListings?: ProviderMaterialListing[];
  transactionContacts?: TransactionContact[];
  supportRequests?: SupportRequest[];
  projects: Project[];
  materials: MaterialPassport[];
  receivers: ReceiverFacility[];
  slots: ReceiverDaySlot[];
  allocations: Allocation[];
  bookings: Booking[];
  verifications: VerificationRecord[];
  events: DomainEvent[];
  demands: DemandRecord[];
  offers?: MaterialOffer[];
  negotiations?: NegotiationConversation[];
  payments?: BookingPayment[];
}

export interface EngineResult<T> {
  data: T;
  events: DomainEvent[];
}

export type ConfirmOutcome = "confirmed" | "hold";
