import Badge from "@/components/ui/badge/Badge";
import type { AllocationStatus, BookingStatus, MaterialStatus, VerificationStatus } from "@/domain/types";

type AnyStatus = AllocationStatus | BookingStatus | MaterialStatus | VerificationStatus;

const COLOR: Record<AnyStatus, "success" | "warning" | "error" | "info" | "primary" | "light"> = {
  confirmed: "success",
  verified: "success",
  reserved: "success",
  allocated: "success",
  hold: "warning",
  pending: "info",
"passport-ready": "info",
  surveyed: "light",
  dispatched: "primary",
  cancelled: "error",
  rejected: "error",
};

const LABEL: Record<AnyStatus, string> = {
  confirmed: "Confirmed",
  verified: "Verified",
  reserved: "Reserved",
  allocated: "Allocated",
  hold: "Hold",
  pending: "Pending",
  "passport-ready": "Passport ready",
  surveyed: "Surveyed",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
  rejected: "Rejected",
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
