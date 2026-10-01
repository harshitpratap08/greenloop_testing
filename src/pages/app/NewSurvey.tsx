import { useState } from "react";
import { useNavigate } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import type { MaterialCondition, MaterialGrade, MaterialTypeKey, Evidence, MaterialPassport } from "@/domain/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils";
import { materialMediaFor } from "@/config/appMedia";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function NewSurvey() {
  const { dataset, addMaterialAction, addProjectAction } = useGreenLoopStore();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [projectId, setProjectId] = useState(dataset.projects[0]?.id || "");
  const [type, setType] = useState<MaterialTypeKey>("concrete");
  const [quantity, setQuantity] = useState("10");
  const [rangeMin, setRangeMin] = useState("8");
  const [rangeMax, setRangeMax] = useState("12");
  const [condition, setCondition] = useState<MaterialCondition>("good");
  const [grade, setGrade] = useState<MaterialGrade>("A");
  const [surveyNotes, setSurveyNotes] = useState("");
  const [confidence] = useState("0.85");
  const [showProjectForm, setShowProjectForm] = useState(dataset.projects.length === 0);
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [validationError, setValidationError] = useState("");

  const [createdPassport, setCreatedPassport] = useState<MaterialPassport | null>(null);
  const rangeIsValid = Number.isFinite(Number(rangeMin)) && Number.isFinite(Number(rangeMax)) && Number(rangeMin) >= 0 && Number(rangeMax) >= Number(rangeMin) && Number(rangeMin) <= Number(quantity) && Number(rangeMax) >= Number(quantity);
  const estimateRange: [number, number] = rangeIsValid ? [Number(rangeMin), Number(rangeMax)] : [Number(quantity) || 0, Number(quantity) || 0];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    const selectedFiles = Array.from(files);
    const storedBytes = evidence.reduce((total, item) => total + Math.round((item.ref?.length ?? 0) * 0.75), 0);
    const addedBytes = selectedFiles.reduce((total, file) => total + file.size, 0);
    if (selectedFiles.some((file) => file.size > 2 * 1024 * 1024) || storedBytes + addedBytes > 4 * 1024 * 1024) {
      setUploadError("Each file must be no larger than 2 MB, with 4 MB total evidence per passport.");
      return;
    }
    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const kind: Evidence["kind"] = file.type.startsWith("image/") ? "site-photo" : "survey-sheet";
        setEvidence((current) => [...current, {
          kind,
          label: file.name,
          ref: typeof reader.result === "string" ? reader.result : undefined,
          recordedAt: new Date().toISOString(),
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCreateProject = () => {
    if (!projectName.trim() || !projectLocation.trim()) return;
    const project = addProjectAction({ name: projectName.trim(), location: projectLocation.trim(), status: "active" });
    setProjectId(project.id);
    setProjectName("");
    setProjectLocation("");
    setShowProjectForm(false);
  };

  const handleSubmit = () => {
    const quantityValue = Number(quantity);
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setValidationError("Enter a quantity greater than zero.");
      setStep(2);
      return;
    }
    if (!projectId) {
      setValidationError("Choose or create the project location for this material.");
      setStep(3);
      return;
    }
    setValidationError("");
    const passport = addMaterialAction({
      projectId,
      type,
      quantityT: quantityValue,
      quantityRangeT: estimateRange,
      condition,
      grade,
      confidence: parseFloat(confidence) || 0,
      surveyNotes: surveyNotes.trim() || undefined,
      evidence
    });
    setCreatedPassport(passport);
    setStep(6);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Add Material | GreenLoop" description="Add construction material from a project and attach supporting photos." />
      <PageBreadCrumb pageTitle="Add Material" />

      <div className="mx-auto max-w-4xl">
        <header className="mb-6 border-b border-steel-200 pb-5 dark:border-steel-800">
          <h1 className="font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white">Add Material</h1>
          <p className="mt-2 max-w-2xl text-base text-steel-600 dark:text-gray-400">Add what you have, how much there is, where it is, and a photo. GreenLoop creates a Material Passport—your material’s digital record.</p>
          <p className="mt-2 text-sm font-medium text-steel-700 dark:text-gray-300">Step {step < 6 ? step : 5} of 5 · {step === 1 ? "Choose material" : step === 2 ? "Enter amount" : step === 3 ? "Choose location" : step === 4 ? "Add photos" : step === 5 ? "Review" : "Complete"}</p>
        </header>
        {step < 6 && (
          <div className="mb-8 overflow-hidden border border-steel-200 bg-white dark:border-steel-800 dark:bg-black">
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
            <motion.div key="choose-material" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">What do you have?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Choose the main material type. You can add its amount, project location, photos, and detailed condition next.</p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Material type">
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
              </div>
              <div className="mt-8 flex justify-end"><button onClick={() => setStep(2)} className="min-h-11 bg-ink-900 px-8 py-3 font-semibold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">Continue</button></div>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="choose-location" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Where is the material?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Choose the project where the material is located. This is saved with its Material Passport.</p>
              
              <div className="mt-8 space-y-4">
                {dataset.projects.map(p => (
                  <label key={p.id} className={cn("flex cursor-pointer items-center gap-4 rounded-sm border p-5 transition-all hover:border-loop-400", projectId === p.id ? "border-loop-500 bg-loop-50 ring-1 ring-loop-500 dark:bg-loop-500/10" : "border-steel-200 dark:border-steel-800")}>
                    <input type="radio" name="project" value={p.id} checked={projectId === p.id} onChange={() => setProjectId(p.id)} className="size-5 text-loop-600 focus:ring-loop-600" />
                    <div>
                      <p className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{p.name}</p>
                      <p className="text-sm text-steel-600 dark:text-gray-400">{p.location} · {p.status}</p>
                    </div>
                  </label>
                ))}
                {showProjectForm ? (
                  <div className="grid gap-3 rounded-sm border border-steel-200 p-4 dark:border-steel-800">
                    <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="Project name" className="w-full rounded-sm border border-steel-300 p-3 dark:border-steel-700 dark:bg-black dark:text-white" />
                    <input value={projectLocation} onChange={(event) => setProjectLocation(event.target.value)} placeholder="Project location" aria-label="Project location" className="w-full rounded-sm border border-steel-300 p-3 dark:border-steel-700 dark:bg-black dark:text-white" />
                    <div className="flex gap-3">
                      <button type="button" onClick={handleCreateProject} disabled={!projectName.trim() || !projectLocation.trim()} className="min-h-11 bg-loop-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Create project</button>
                      {dataset.projects.length > 0 && <button type="button" onClick={() => setShowProjectForm(false)} className="min-h-11 px-4 py-2 text-steel-600 dark:text-gray-300">Cancel</button>}
                    </div>
                  </div>
                ) : <button type="button" onClick={() => setShowProjectForm(true)} className="inline-flex min-h-11 items-center text-sm font-semibold text-loop-600 underline dark:text-loop-400">Create a project</button>}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep(4)} disabled={!projectId} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">How much material is there?</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Enter your best estimate in tonnes. You can add an estimate range, condition, and grade if you know them.</p>
              
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 rounded-sm border border-steel-200 bg-steel-50 px-4 py-3 text-sm font-semibold text-ink-800 dark:border-steel-800 dark:bg-white/[0.03] dark:text-gray-200">{TYPE_LABEL[type]}</div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimated Quantity (t)</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <details className="sm:col-span-2 rounded-sm border border-steel-200 px-4 py-3 dark:border-steel-800">
                  <summary className="cursor-pointer text-sm font-semibold text-ink-800 dark:text-gray-200">Optional details: estimate range, condition, and grade</summary>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimate range · minimum (t)</label>
                  <input type="number" value={rangeMin} onChange={e => setRangeMin(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimate range · maximum (t)</label>
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
            <motion.div key="add-photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Add photos</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Photos help providers and receivers understand what the material looks like. Evidence means the supporting photos or documents attached to its record.</p>
              
              <div className="mt-8 border-2 border-dashed border-steel-300 p-8 text-center dark:border-steel-700">
                <label className="text-sm font-semibold uppercase text-steel-500">Photos and survey evidence (up to 2 MB each; 4 MB total)</label>
                <input type="file" multiple accept="image/*,.pdf" onChange={(event) => handleFiles(event.target.files)} className="mt-4 block w-full text-sm text-steel-600 file:me-4 file:border file:border-steel-300 file:bg-white file:px-4 file:py-2 file:font-semibold dark:text-gray-300 dark:file:border-steel-700 dark:file:bg-black" />
                {uploadError && <p role="alert" className="mt-2 text-sm text-error-500">{uploadError}</p>}
                {evidence.length === 0 && <p className="mt-3 text-xs text-steel-500">No evidence attached yet.</p>}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
            <motion.div key="review-material" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border border-steel-200 border-t-4 border-t-loop-600 bg-white p-8 dark:border-steel-800 dark:border-t-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Review & Create Passport</h2>
              
              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 rounded-sm border border-steel-200 bg-gray-50 p-6 sm:grid-cols-3 dark:border-steel-800 dark:bg-white/[0.02]">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Project</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{dataset.projects.find(p => p.id === projectId)?.name}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Material</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{TYPE_LABEL[type]} (Grade {grade}, {condition})</dd>
                  {surveyNotes.trim() && <><dt className="text-xs font-semibold uppercase text-steel-500">Survey notes</dt><dd className="text-sm text-steel-600 dark:text-gray-400">{surveyNotes.trim()}</dd></>}
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Quantity</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{quantity} t</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Range</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{estimateRange[0]}–{estimateRange[1]} t</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Evidence</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{evidence.length} attachments</dd>
                </div>
              </dl>

              {validationError && <p role="alert" className="mt-4 text-sm text-error-500">{validationError}</p>}
              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(4)} className="min-h-11 font-semibold text-steel-600 hover:text-ink-900 dark:text-gray-300 dark:hover:text-white">Back</button>
                <button onClick={handleSubmit} className="bg-loop-600 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-700">Create Material Passport</button>
              </div>
            </motion.div>
          )}

          {step === 6 && createdPassport && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border border-steel-200 border-t-4 border-t-loop-500 bg-white p-12 text-center dark:border-steel-800 dark:border-t-loop-400 dark:bg-black">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-loop-100 text-loop-600 dark:bg-loop-500/20 dark:text-loop-400">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-archivo text-4xl font-bold text-ink-900 dark:text-white">Material Passport Created</h2>
              <p className="mt-4 text-lg text-steel-600 dark:text-gray-400">
                Passport <strong className="text-ink-900 dark:text-white">{createdPassport.id}</strong> has been issued for {createdPassport.quantityT}t of {TYPE_LABEL[createdPassport.type]}.
              </p>
              
              <div className="mt-10 flex justify-center gap-4">
                <button onClick={() => navigate(`/app/materials/${createdPassport.id}`)} className="border-2 border-steel-300 px-8 py-4 font-bold uppercase tracking-wide hover:border-ink-900 dark:border-steel-700 dark:text-white dark:hover:border-white">View Passport</button>
                <button onClick={() => navigate('/app/receivers', { state: { materialId: createdPassport.id } })} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Find a Receiver</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
