import PageMeta from "@/components/common/PageMeta";
import AddressLocation from "@/components/greenloop/AddressLocation";
import { materialMediaFor } from "@/config/appMedia";
import type { Evidence, GeoPoint, MaterialCondition, MaterialGrade, MaterialPassport, MaterialTypeKey } from "@shared/domain/types";
import { uploadFile } from "@/lib/api";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, materialTypeLabel } from "@/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

const CUSTOM_TYPE = "__custom__";
const normalizeCustomType = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export default function NewSurvey() {
  const { t } = useTranslation();
  const { dataset, addMaterialAction, addProjectAction } = useGreenLoopStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState(location.state?.projectId || params.get("project") || dataset.projects[0]?.id || "");
  const [projectGeo, setProjectGeo] = useState<GeoPoint | undefined>(() => dataset.projects.find((project) => project.id === (location.state?.projectId || params.get("project") || dataset.projects[0]?.id))?.geo);
  const [type, setType] = useState<MaterialTypeKey>("concrete");
  const [customName, setCustomName] = useState("");
  const [unit, setUnit] = useState("tonnes");
  const [conversionFactor, setConversionFactor] = useState("1");
  const [quantity, setQuantity] = useState("10");
  const [rangeMin, setRangeMin] = useState("8");
  const [rangeMax, setRangeMax] = useState("12");
  const [condition, setCondition] = useState<MaterialCondition>("good");
  const [grade, setGrade] = useState<MaterialGrade>("A");
  const [availableFrom, setAvailableFrom] = useState("");
  const [pricePerT, setPricePerT] = useState("");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [confidence] = useState("0.85");
  const [showProjectForm, setShowProjectForm] = useState(dataset.projects.length === 0);
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState(() => dataset.projects.find(project => project.id === (location.state?.projectId || params.get("project") || dataset.projects[0]?.id))?.location ?? "");
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [validationError, setValidationError] = useState("");

  const [createdPassport, setCreatedPassport] = useState<MaterialPassport | null>(null);
  const typeValue = type === CUSTOM_TYPE ? normalizeCustomType(customName) : type;
  const isTonnes = unit.toLowerCase() === 'tonnes' || unit.toLowerCase() === 't';
  const cFactor = isTonnes ? 1 : Number(conversionFactor) || 1;
  const quantityTValue = (Number(quantity) || 0) * cFactor;
  
  const rangeIsValid = Number.isFinite(Number(rangeMin)) && Number.isFinite(Number(rangeMax)) && Number(rangeMin) >= 0 && Number(rangeMax) >= Number(rangeMin) && Number(rangeMin) <= Number(quantity) && Number(rangeMax) >= Number(quantity);
  const estimateRange: [number, number] = rangeIsValid ? [Number(rangeMin) * cFactor, Number(rangeMax) * cFactor] : [quantityTValue, quantityTValue];

  const [uploading, setUploading] = useState(false);
  const handleFiles = async (files: FileList | null) => {
    if (!files || uploading) return;
    setUploadError(""); setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ref = await uploadFile(file);
        const kind: Evidence["kind"] = file.type.startsWith("image/") ? "site-photo" : "survey-sheet";
        setEvidence(current => [...current, { kind, label: file.name, ref, recordedAt: new Date().toISOString() }]);
      }
    } catch (cause) { setUploadError(cause instanceof Error ? cause.message : t("backend.uploadFailed")); }
    finally { setUploading(false); }
  };

  const handleCreateProject = async () => {
    if (creatingProject) return;
    if (!projectName.trim() || !projectLocation.trim()) {
      setProjectError(t("projectLocationForm.required"));
      return;
    }
    setCreatingProject(true);
    setProjectError("");
    try {
      const project = await addProjectAction({ name: projectName.trim(), location: projectLocation.trim(), status: "active", ...(projectGeo ? { geo: projectGeo } : {}) });
      if (!project) { setProjectError(t("projectLocationForm.failed")); return; }
      setProjectId(project.id);
      setProjectGeo(project.geo);
      setProjectName("");
      setProjectLocation(project.location);
      setShowProjectForm(false);
    } finally { setCreatingProject(false); }
  };

  const handleSubmit = async () => {
    if (uploading) return;
    const quantityValue = Number(quantity);
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setValidationError("Enter a quantity greater than zero.");
      setStep(2);
      return;
    }
    if (typeValue.length < 2) {
      setValidationError("Enter a material name for the custom material.");
      setStep(1);
      return;
    }
    if (!projectId) {
      setValidationError("Choose or create the project location for this material.");
      setStep(3);
      return;
    }
    setValidationError("");
    const passport = await addMaterialAction({
      projectId,
      type: typeValue,
      quantityT: quantityTValue,
      quantityRangeT: estimateRange,
      ...(isTonnes ? {} : {
        originalUnit: unit,
        originalQuantity: Number(quantity),
        conversionFactor: cFactor,
      }),
      condition,
      grade,
      confidence: parseFloat(confidence) || 0,
      surveyNotes: surveyNotes.trim() || undefined,
      evidence,
      ...(availableFrom ? { availableFrom } : {}),
      ...(pricePerT !== "" ? { pricePerT: Number(pricePerT) } : {}),
      ...(projectGeo ? { geo: projectGeo } : {}),
    });
    if (!passport) return;
    setCreatedPassport(passport);
    setStep(6);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Add Material | GreenLoop" description="Add construction material from a project and attach supporting photos." />

      <div className="mx-auto max-w-4xl">
        <header className="mb-6 border-b border-steel-200 pb-5 dark:border-steel-800">
          <h1 className="font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Add Material</h1>
          <p className="mt-2 max-w-2xl text-base text-steel-600 dark:text-gray-400">Add what you have, how much there is, where it is, and a photo. GreenLoop creates a Material Passport—your material’s digital record.</p>
          <p className="mt-2 text-sm font-medium text-steel-700 dark:text-gray-300">Step {step < 6 ? step : 5} of 5 · {step === 1 ? "Choose material" : step === 2 ? "Enter amount" : step === 3 ? "Choose location" : step === 4 ? "Add photos" : step === 5 ? "Review" : "Complete"}</p>
        </header>
        {step < 6 && (
          <div className="mb-section overflow-hidden border border-steel-200 bg-white dark:border-steel-800 dark:bg-black rounded-surface">
            <div className="flex divide-x divide-steel-200 dark:divide-steel-800">
              {['What do you have?', 'How much?', 'Where is it?', 'Photos', 'Review'].map((label, idx) => (
                <div key={label} className={cn("flex-1 p-4 text-center transition-colors", step === idx + 1 ? "bg-loop-50 text-loop-700 dark:bg-loop-500/10 dark:text-loop-400" : step > idx + 1 ? "bg-gray-50 text-ink-900 dark:bg-white/[0.02] dark:text-white" : "text-steel-400")}>
                  <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="choose-material" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black rounded-surface">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">What do you have?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Choose the main material type. You can add its amount, project location, photos, and detailed condition next.</p>
              <div className="mt-section grid grid-cols-2 gap-card sm:grid-cols-3" role="radiogroup" aria-label="Material type">
                {(Object.entries(TYPE_LABEL) as [MaterialTypeKey, string][]).map(([key, label]) => {
                  const media = materialMediaFor(key);
                  const active = type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setType(key)}
                      className={cn(
                        "group relative overflow-hidden border text-start transition-all",
                        active ? "border-ink-900 ring-2 ring-ink-900 dark:border-white dark:ring-white" : "border-steel-200 hover:border-ink-900 dark:border-steel-800 dark:hover:border-white",
                      )}
                    >
                      <span className="relative block h-24 w-full overflow-hidden">
                        <img src={media.src} alt={media.alt} loading="lazy" className={cn("size-full object-cover transition-transform duration-500", active ? "scale-105" : "group-hover:scale-105")} />
                        <span className="absolute inset-0 bg-ink-950/35" aria-hidden="true" />
                        <span className="absolute bottom-2 left-3 font-archivo text-sm font-bold uppercase tracking-wide text-white">{label}</span>
                        {active && <span className="absolute right-2 top-2 size-5 rounded-full border-2 border-white bg-loop-500" aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  role="radio"
                  aria-checked={type === CUSTOM_TYPE}
                  onClick={() => setType(CUSTOM_TYPE)}
                  className={cn(
                    "group relative overflow-hidden border text-start transition-all",
                    type === CUSTOM_TYPE ? "border-ink-900 ring-2 ring-ink-900 dark:border-white dark:ring-white" : "border-steel-200 hover:border-ink-900 dark:border-steel-800 dark:hover:border-white",
                  )}
                >
                  <span className="relative block h-24 w-full overflow-hidden">
                    <img src={materialMediaFor("custom").src} alt="Other material" loading="lazy" className="size-full object-cover" />
                    <span className="absolute inset-0 bg-ink-950/45" aria-hidden="true" />
                    <span className="absolute bottom-2 left-3 font-archivo text-sm font-bold uppercase tracking-wide text-white">Other / Custom</span>
                    {type === CUSTOM_TYPE && <span className="absolute right-2 top-2 size-5 rounded-full border-2 border-white bg-loop-500" aria-hidden="true" />}
                  </span>
                </button>
              </div>
              {type === CUSTOM_TYPE && (
                <div className="mt-5 border border-steel-200 bg-steel-50 p-4 dark:border-steel-800 dark:bg-white/[0.03] rounded-surface">
                  <label htmlFor="custom-material-name" className="block text-sm font-semibold text-ink-800 dark:text-gray-200">Material name</label>
                  <input
                    id="custom-material-name"
                    type="text"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder="Enter material name, e.g. roof tiles, copper wire"
                    required
                    className="mt-2 block w-full rounded-sm border-2 border-steel-300 p-3 text-sm outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
                  />
                  <p className="mt-2 text-xs text-steel-500 dark:text-gray-400">Your custom material becomes a real GreenLoop material — usable in inventory, requests, offers, matching and pricing.</p>
                </div>
              )}
              <div className="mt-section flex justify-end"><button onClick={() => setStep(2)} className="min-h-11 bg-ink-900 px-8 py-3 font-semibold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">Continue</button></div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="choose-location" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black rounded-surface">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Where is the material?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Search the address, pick a suggestion, and choose (or create) the project it belongs to. The written address remains the source of truth; map coordinates are optional.</p>
              <div className="mt-5 max-w-xl">
                <AddressLocation
                  label="Project location"
                  address={projectLocation}
                  onAddressChange={value => { setProjectLocation(value); setProjectGeo(undefined); }}
                  geo={projectGeo}
                  onGeoChange={setProjectGeo}
                  sources={[...dataset.projects.map((project) => project.location), ...dataset.demands.map((demand) => demand.location)]}
                  placeholder="Search project address…"
                />
              </div>

              <div className="mt-section space-y-4">
                {dataset.projects.map(p => (
                  <label key={p.id} className={cn("flex cursor-pointer items-center gap-4 rounded-sm border p-5 transition-all hover:border-loop-400", projectId === p.id ? "border-loop-500 bg-loop-50 ring-1 ring-loop-500 dark:bg-loop-500/10" : "border-steel-200 dark:border-steel-800")}>
                    <input type="radio" name="project" value={p.id} checked={projectId === p.id} onChange={() => { setProjectId(p.id); setProjectGeo(p.geo); setProjectLocation(p.location); }} className="size-5 text-loop-600 focus:ring-loop-600" />
                    <div>
                      <p className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{p.name}</p>
                      <p className="text-sm text-steel-600 dark:text-gray-400">{p.location} · {p.status}</p>
                    </div>
                  </label>
                ))}
                {showProjectForm ? (
                  <div className="grid gap-detail rounded-sm border border-steel-200 p-4 dark:border-steel-800">
                    <label className="text-sm font-medium text-steel-700 dark:text-gray-300">{t("projectLocationForm.name")}<input value={projectName} maxLength={250} disabled={creatingProject} onChange={(event) => setProjectName(event.target.value)} placeholder={t("projectLocationForm.name")} className="mt-1 w-full rounded-control border border-steel-300 p-3 dark:border-steel-700 dark:bg-black dark:text-white" /></label>
                    <label className="text-sm font-medium text-steel-700 dark:text-gray-300">{t("projectLocationForm.location")}<input value={projectLocation} maxLength={250} disabled={creatingProject} onChange={event => { setProjectLocation(event.target.value); setProjectGeo(undefined); setProjectError(""); }} placeholder={t("projectLocationForm.placeholder")} className="mt-1 w-full rounded-control border border-steel-300 p-3 dark:border-steel-700 dark:bg-black dark:text-white" /></label>
                    <p className="text-xs text-steel-500 dark:text-gray-400">{t("projectLocationForm.hint")}</p>
                    {projectError && <p role="alert" className="text-sm text-error-600 dark:text-error-300">{projectError}</p>}
                    <div className="flex gap-3">
                      <button type="button" onClick={handleCreateProject} disabled={creatingProject || !projectName.trim() || !projectLocation.trim()} className="min-h-11 bg-loop-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{t(creatingProject ? "projectLocationForm.creating" : "projectLocationForm.create")}</button>
                      {dataset.projects.length > 0 && <button type="button" disabled={creatingProject} onClick={() => setShowProjectForm(false)} className="min-h-11 px-4 py-2 text-steel-600 dark:text-gray-300">Cancel</button>}
                    </div>
                  </div>
                ) : <button type="button" onClick={() => setShowProjectForm(true)} className="inline-flex min-h-11 items-center text-sm font-semibold text-loop-600 underline dark:text-loop-400">Create a project</button>}
              </div>

              <div className="mt-section flex justify-end">
                <button onClick={() => setStep(4)} disabled={!projectId || creatingProject || showProjectForm} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black rounded-surface">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">How much material is there?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Enter your best estimate in tonnes. You can add an estimate range, condition, and grade if you know them.</p>
              
              <div className="mt-section grid gap-card sm:grid-cols-2">
                <div className="sm:col-span-2 border border-steel-200 bg-steel-50 px-4 py-3 text-sm font-semibold text-ink-800 dark:border-steel-800 dark:bg-white/[0.03] dark:text-gray-200 rounded-surface">{materialTypeLabel(typeValue) || "Custom material"}</div>
                <div className="sm:col-span-2 grid grid-cols-2 gap-card">
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Unit</label>
                    <input type="text" value={unit} onChange={e => {
                        setUnit(e.target.value);
                        if (e.target.value.toLowerCase() === 'tonnes' || e.target.value.toLowerCase() === 't') setConversionFactor("1");
                    }} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" placeholder="tonnes, m3, pallets..." />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Conversion Factor (t/unit)</label>
                    <input type="number" step="0.01" value={conversionFactor} onChange={e => setConversionFactor(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" disabled={isTonnes} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimated Quantity ({unit})</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                  {!isTonnes && <p className="mt-2 text-sm text-steel-500 font-medium">Equivalent to {quantityTValue.toFixed(2)} tonnes</p>}
                </div>
                <details className="sm:col-span-2 rounded-sm border border-steel-200 px-4 py-3 dark:border-steel-800">
                  <summary className="cursor-pointer text-sm font-semibold text-ink-800 dark:text-gray-200">Optional details: estimate range, condition, and grade</summary>
                  <div className="mt-4 grid gap-card sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimate range · minimum ({unit})</label>
                  <input type="number" value={rangeMin} onChange={e => setRangeMin(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimate range · maximum ({unit})</label>
                  <input type="number" value={rangeMax} onChange={e => setRangeMax(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Condition</label>
                  <select value={condition} onChange={e => setCondition(e.target.value as MaterialCondition)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white">
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Grade</label>
                  <select value={grade} onChange={e => setGrade(e.target.value as MaterialGrade)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white">
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Available from</label>
                  <input type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Price per tonne (₹, optional)</label>
                  <input type="number" min="0" step="1" value={pricePerT} onChange={(event) => setPricePerT(event.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="survey-notes" className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Survey notes</label>
                  <textarea id="survey-notes" value={surveyNotes} onChange={(event) => setSurveyNotes(event.target.value)} rows={3} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                  </div>
                </details>
              </div>

              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(1)} className="min-h-11 font-semibold text-steel-600 hover:text-ink-900 dark:text-gray-300 dark:hover:text-white">Back</button>
                <button onClick={() => setStep(3)} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="add-photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black rounded-surface">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Add photos</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Photos help providers and receivers understand what the material looks like. Evidence means the supporting photos or documents attached to its record.</p>
              
              <div className="mt-section border-2 border-dashed border-steel-300 p-8 text-center dark:border-steel-700">
                <label className="text-sm font-semibold uppercase text-steel-500">{t("backend.uploadLimits")}</label>
                <input type="file" disabled={uploading} multiple accept="image/png,image/jpeg,image/webp,.pdf" onChange={(event) => handleFiles(event.target.files)} className="mt-4 block w-full text-sm text-steel-600 file:me-4 file:border file:border-steel-300 file:bg-white file:px-4 file:py-2 file:font-semibold dark:text-gray-300 dark:file:border-steel-700 dark:file:bg-black" />
                {uploading && <p role="status" className="mt-2 text-sm text-steel-600 dark:text-steel-400">{t("backend.uploadingEvidence")}</p>}
                {uploadError && <p role="alert" className="mt-2 text-sm text-error-500">{uploadError}</p>}
                {evidence.length === 0 && <p className="mt-3 text-xs text-steel-500">No evidence attached yet.</p>}
              </div>

              <div className="mt-section grid gap-card sm:grid-cols-2">
                {evidence.map((ev, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-sm border border-steel-200 dark:border-steel-800">
                    {ev.kind === "site-photo" && ev.ref ? (
                      <div className="relative h-32 w-full bg-steel-100 dark:bg-steel-900">
                        <img src={ev.ref} alt={ev.label} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-steel-50 dark:bg-steel-900/50">
                        <svg className="size-8 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className={cn("absolute inset-x-0 bottom-0 p-3", ev.kind === "site-photo" ? "text-white" : "text-ink-900 dark:text-white")}>
                      <p className="truncate text-sm font-bold">{ev.label}</p>
                      <p className="mt-0.5 flex items-center justify-between text-xs opacity-80">
                        <span>{ev.kind}</span>
                        <span className="text-loop-400 font-medium">Attached</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(3)} className="min-h-11 font-semibold text-steel-600 hover:text-ink-900 dark:text-gray-300 dark:hover:text-white">Back</button>
                <button onClick={() => setStep(5)} disabled={evidence.length === 0} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="review-material" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black rounded-surface">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Review & Create Passport</h2>
              
              <dl className="mt-section grid grid-cols-2 gap-x-8 gap-y-6 border border-steel-200 bg-gray-50 sm:grid-cols-3 dark:border-steel-800 dark:bg-white/[0.02] gl-card-pad rounded-surface">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Project</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{dataset.projects.find(p => p.id === projectId)?.name}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Material</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{materialTypeLabel(typeValue) || "Custom material"} (Grade {grade}, {condition})</dd>
                  {surveyNotes.trim() && <><dt className="text-xs font-semibold uppercase text-steel-500">Survey notes</dt><dd className="text-sm text-steel-600 dark:text-gray-400">{surveyNotes.trim()}</dd></>}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Quantity</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{isTonnes ? `${quantity} t` : `${quantity} ${unit} (${quantityTValue.toFixed(1)} t)`}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Availability</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{availableFrom || "Not specified"}</dd>
                </div>
                {pricePerT !== "" && <div className="flex flex-col gap-1"><dt className="text-xs font-semibold uppercase text-steel-500">Price / tonne</dt><dd className="font-bold text-ink-900 dark:text-white">₹{Number(pricePerT).toLocaleString("en-IN")}</dd></div>}
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Range</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{estimateRange[0].toFixed(1)}–{estimateRange[1].toFixed(1)} t</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Evidence</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{evidence.length} attachments</dd>
                </div>
              </dl>

              {validationError && <p role="alert" className="mt-4 text-sm text-error-500">{validationError}</p>}
              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(4)} className="min-h-11 font-semibold text-steel-600 hover:text-ink-900 dark:text-gray-300 dark:hover:text-white">Back</button>
                <button onClick={handleSubmit} disabled={uploading} className="bg-loop-600 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-700">Create Material Passport</button>
              </div>
            </motion.div>
          )}

          {step === 6 && createdPassport && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-steel-200 border-t-4 border-t-loop-500 bg-white p-12 text-center dark:border-steel-800 dark:border-t-loop-400 dark:bg-black rounded-surface">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-loop-100 text-loop-600 dark:bg-loop-500/20 dark:text-loop-400">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-archivo text-4xl font-bold text-ink-900 dark:text-white">Material Passport Created</h2>
              <p className="mt-4 text-lg text-steel-600 dark:text-gray-400">
                Passport <strong className="text-ink-900 dark:text-white">{createdPassport.id}</strong> has been issued for {createdPassport.quantityT}t of {materialTypeLabel(createdPassport.type)}.
              </p>
              
              <div className="mt-10 flex justify-center gap-4">
                <button onClick={() => navigate(`/app/materials/${createdPassport.id}`)} className="border-2 border-steel-300 px-8 py-4 font-bold uppercase tracking-wide hover:border-ink-900 dark:border-steel-700 dark:text-white dark:hover:border-white">View Passport</button>
                <button onClick={() => navigate('/app/market-demand?view=receivers', { state: { materialId: createdPassport.id } })} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Find a Receiver</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
