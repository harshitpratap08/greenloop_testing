import Badge from "@/components/ui/badge/Badge";
import type { AllocationStatus, BookingStatus, MaterialStatus, VerificationStatus, DemandStatus, MaterialOffer } from "@/domain/types";

type AnyStatus = AllocationStatus | BookingStatus | MaterialStatus | VerificationStatus | DemandStatus | MaterialOffer["status"];

const COLOR: Record<AnyStatus, "success" | "warning" | "error" | "info" | "primary" | "light"> = {
  confirmed: "success",
  accepted: "success",
  verified: "success",
  reserved: "success",
  allocated: "success",
  hold: "warning",
  pending: "info",
  "passport-ready": "info",
  surveyed: "light",
  dispatched: "primary",
  cancelled: "light",
  rejected: "error",
  declined: "error",
  withdrawn: "light",
  OPEN: "info",
  PARTIALLY_COVERED: "warning",
  COVERED: "success",
  PAUSED: "light",
};

const LABEL: Record<AnyStatus, string> = {
  confirmed: "Confirmed",
  accepted: "Accepted",
  verified: "Verified",
  reserved: "Reserved",
  allocated: "Matched",
  hold: "Waiting on Capacity",
  pending: "Waiting for review",
  "passport-ready": "Ready for receiver",
  surveyed: "Surveyed",
  dispatched: "On the road",
  cancelled: "Cancelled",
  rejected: "Rejected",
  declined: "Declined",
  withdrawn: "Withdrawn",
  OPEN: "Open",
  PARTIALLY_COVERED: "Partially covered",
  COVERED: "Covered",
  PAUSED: "Paused",
};

/** One mapping for every status pill in the product — no ad-hoc colors. */
export default function StatusBadge({
  status,
  size = "sm",
}: {
  status: AnyStatus;
  size?: "sm" | "md";
}) {
  return (
    <Badge color={COLOR[status]} size={size}>
      {LABEL[status]}
    </Badge>
  );
}
