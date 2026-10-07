import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/context/AuthContext.helpers";
import type { ProviderMaterialListing } from "@shared/domain/types";
import { useModal } from "@/hooks/useModal";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { materialTypeLabel } from "@/utils";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function DirectMaterialRequest({ listing }: { listing: ProviderMaterialListing }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addDemandAction } = useGreenLoopStore();
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(String(listing.availableT));
  const [date, setDate] = useState("");
  const [location, setLocation] = useState(user?.location ?? user?.organization ?? "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const minDate = listing.availableFrom && listing.availableFrom > today ? listing.availableFrom : today;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || Number(quantity) > listing.availableT || !date || date < minDate || !location.trim()) {
      setError(t("directRequest.invalid"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const request = await addDemandAction({ receiverId: user?.receiverId, materialType: listing.materialType, requiredT: Number(quantity), period: date, location: location.trim(), notes: notes.trim(), targetMaterialId: listing.materialId });
      if (!request) { setError(t("directRequest.failed")); return; }
      closeModal();
      navigate(`/app/receiver/demand?demand=${encodeURIComponent(request.id)}`);
    } finally { setSaving(false); }
  };
  const field = "mt-1 min-h-11 w-full rounded-control border border-steel-300 bg-white px-3 text-sm text-ink-900 dark:border-steel-700 dark:bg-ink-900 dark:text-white";
  return <>
    <button type="button" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-loop-700 px-5 text-sm font-semibold text-white hover:bg-loop-800 disabled:opacity-50" disabled={listing.availableT <= 0} onClick={() => { setQuantity(String(listing.availableT)); setError(""); openModal(); }}>{t("directRequest.open")}</button>
    <Modal isOpen={isOpen} onClose={() => { if (!saving) closeModal(); }} className="mx-4 max-w-lg gl-card-pad" showCloseButton={false}>
      <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("directRequest.title", { provider: listing.organization })}</h2>
      <p className="mt-2 text-sm text-steel-600 dark:text-steel-300">{t("directRequest.linked", { material: materialTypeLabel(listing.materialType), reference: listing.materialId, quantity: listing.availableT })}</p>
      <form onSubmit={submit} className="mt-card space-y-detail">
        <div className="grid gap-detail sm:grid-cols-2">
          <label className="text-sm text-steel-700 dark:text-steel-300">{t("directRequest.quantity")}<input type="number" min="0.1" step="0.1" max={listing.availableT} required value={quantity} onChange={event => setQuantity(event.target.value)} className={field} /></label>
          <label className="text-sm text-steel-700 dark:text-steel-300">{t("directRequest.date")}<input type="date" min={minDate} required value={date} onChange={event => setDate(event.target.value)} className={field} /></label>
        </div>
        <label className="block text-sm text-steel-700 dark:text-steel-300">{t("directRequest.location")}<input required value={location} maxLength={250} onChange={event => setLocation(event.target.value)} className={field} /></label>
        <label className="block text-sm text-steel-700 dark:text-steel-300">{t("directRequest.notes")}<textarea value={notes} maxLength={5000} onChange={event => setNotes(event.target.value)} className={`${field} min-h-24 py-3`} /></label>
        <p className="text-xs text-steel-600 dark:text-steel-300">{t("directRequest.flow")}</p>
        {error && <p role="alert" className="text-sm text-error-600 dark:text-error-300">{error}</p>}
        <div className="flex justify-end gap-detail pt-detail"><Button variant="outline" disabled={saving} onClick={closeModal}>{t("directRequest.cancel")}</Button><Button type="submit" disabled={saving}>{t(saving ? "directRequest.sending" : "directRequest.send")}</Button></div>
      </form>
    </Modal>
  </>;
}
