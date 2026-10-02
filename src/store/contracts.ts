import type { GreenLoopDataset, MaterialPassport, DemandRecord, Project, ReceiverDaySlot, SupportRequest, MaterialOffer, Evidence } from "@/domain/types";
import type { DeliveryInput } from "@/domain/capacity";
type RequestCapacityAction = (input: {
  materialId: string;
  receiverId: string;
  slotId: string;
  tonnesT: number;
}) => Promise<boolean>;
type CancelBookingAction = (input: { bookingId: string; reason?: string }) => Promise<boolean>;
type DispatchAction = (input: { bookingId: string }) => Promise<boolean>;
type VerifyAction = (input: { bookingId: string } & Omit<DeliveryInput, "bookingId" | "actor" | "at">) => Promise<boolean>;
type AddMaterialAction = (input: Omit<MaterialPassport, "id" | "status" | "surveyedAt">) => Promise<MaterialPassport | null>;
type AddDemandInput = Omit<DemandRecord, "id" | "status" | "createdAt" | "receiverId"> & { receiverId?: string };
type AddDemandAction = (input: AddDemandInput) => Promise<DemandRecord | null>;
type AddProjectAction = (input: Pick<Project, "name" | "location" | "status">) => Promise<Project | null>;
type AddCapacityAction = (input: Omit<ReceiverDaySlot, "id">) => Promise<ReceiverDaySlot | null>;
type UpdateCapacityAction = (slotId: string, capacityT: number) => Promise<boolean>;

export interface GreenLoopStoreValue {
  dataset: GreenLoopDataset;
  requestCapacityAction: RequestCapacityAction;
  cancelBookingAction: CancelBookingAction;
  dispatchAction: DispatchAction;
  verifyAction: VerifyAction;
  addMaterialAction: AddMaterialAction;
  addDemandAction: AddDemandAction;
  addProjectAction: AddProjectAction;
  addCapacityAction: AddCapacityAction;
  updateCapacityAction: UpdateCapacityAction;
  addSupportRequestAction: (input: Omit<SupportRequest, "id" | "submittedAt">) => Promise<SupportRequest | null>;
  addOfferAction: (offer: Omit<MaterialOffer, "id" | "status" | "createdAt">) => Promise<boolean>;
  acceptOfferAction: (offerId: string) => Promise<boolean>;
  declineOfferAction: (offerId: string) => Promise<boolean>;
  acceptRequestAction: (bookingId: string, acceptedT?: number) => Promise<boolean>;
  rejectRequestAction: (bookingId: string) => Promise<boolean>;
  rescheduleRequestAction: (bookingId: string, slotId: string) => Promise<boolean>;
  receiveLoadAction: (bookingId: string, actualT: number, evidence: Evidence[]) => Promise<boolean>;
  verifyLoadAction: (verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => Promise<boolean>;
}

