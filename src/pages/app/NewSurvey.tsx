import { useState } from "react";
import { useNavigate } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import type { MaterialCondition, MaterialGrade, MaterialTypeKey, Evidence, MaterialPassport } from "@/domain/types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/utils";

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
  const [confidence] = useState("0.85");
  const [showProjectForm, setShowProjectForm] = useState(dataset.projects.length === 0);
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [validationError, setValidationError] = useState("");

  const [createdPassport, setCreatedPassport] = useState<MaterialPassport | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setUploadError("");
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name} exceeds the 5 MB per-file limit.`);
        return;
      }
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
    const minValue = Number(rangeMin);
    const maxValue = Number(rangeMax);
    if (!projectId || !Number.isFinite(quantityValue) || quantityValue <= 0 || !Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue < 0 || maxValue < minValue || minValue > quantityValue || maxValue < quantityValue) {
      setValidationError("Choose a project and enter a positive quantity within a valid range.");
      setStep(2);
      return;
    }
    setValidationError("");
    const passport = addMaterialAction({
      projectId,
      type,
      quantityT: quantityValue,
      quantityRangeT: [minValue, maxValue],
      condition,
      grade,
      confidence: parseFloat(confidence) || 0,
      evidence
    });
    setCreatedPassport(passport);
    setStep(5);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="New Survey | GreenLoop" description="Create a new material survey." />
      <PageBreadCrumb pageTitle="New Survey" />

      <div className="mx-auto max-w-4xl">
        {step < 5 && (
          <div className="mb-8 overflow-hidden rounded-sm border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-black">
            <div className="flex divide-x divide-steel-200 dark:divide-steel-800">
              {['Project', 'Material', 'Evidence', 'Review'].map((label, idx) => (
                <div key={label} className={cn("flex-1 p-4 text-center transition-colors", step === idx + 1 ? "bg-loop-50 text-loop-700 dark:bg-loop-500/10 dark:text-loop-400" : step > idx + 1 ? "bg-gray-50 text-ink-900 dark:bg-white/[0.02] dark:text-white" : "text-steel-400")}>
                  <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-t-4 border-loop-600 bg-white p-8 shadow-sm dark:border-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Select Project Origin</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Which demolition or recovery project is being surveyed?</p>
              
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
                      <button type="button" onClick={handleCreateProject} disabled={!projectName.trim() || !projectLocation.trim()} className="bg-loop-600 px-4 py-2 font-semibold text-white disabled:opacity-50">Create project</button>
                      {dataset.projects.length > 0 && <button type="button" onClick={() => setShowProjectForm(false)} className="px-4 py-2 text-steel-600 dark:text-gray-300">Cancel</button>}
                    </div>
                  </div>
                ) : <button type="button" onClick={() => setShowProjectForm(true)} className="text-sm font-semibold text-loop-600 underline dark:text-loop-400">Create a project</button>}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep(2)} disabled={!projectId} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 disabled:opacity-50 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-t-4 border-loop-600 bg-white p-8 shadow-sm dark:border-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Material Details</h2>
              
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Material Type</label>
                  <select value={type} onChange={e => setType(e.target.value as MaterialTypeKey)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white">
                    {Object.entries(TYPE_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Estimated Quantity (t)</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Range Min (t)</label>
                  <input type="number" value={rangeMin} onChange={e => setRangeMin(e.target.value)} className="w-full rounded-sm border-2 border-steel-300 p-3 outline-none focus:border-loop-500 dark:border-steel-700 dark:bg-black dark:text-white" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold uppercase text-steel-600 dark:text-gray-400">Range Max (t)</label>
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
              </div>

              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(1)} className="font-bold text-steel-500 hover:text-ink-900 dark:hover:text-white">Back</button>
                <button onClick={() => setStep(3)} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-t-4 border-loop-600 bg-white p-8 shadow-sm dark:border-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Attach Evidence</h2>
              <p className="mt-2 text-steel-600 dark:text-gray-400">Add photos, notes, and lab reports to back up the survey estimate.</p>
              
              <div className="mt-8 border-2 border-dashed border-steel-300 p-8 text-center dark:border-steel-700">
                <label className="text-sm font-semibold uppercase text-steel-500">Photos and survey evidence (up to 5 MB each)</label>
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
                <button onClick={() => setStep(2)} className="font-bold text-steel-500 hover:text-ink-900 dark:hover:text-white">Back</button>
                <button onClick={() => setStep(4)} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="border-t-4 border-loop-600 bg-white p-8 shadow-sm dark:border-loop-500 dark:bg-black">
              <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Review & Create Passport</h2>
              
              <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 rounded-sm border border-steel-200 bg-gray-50 p-6 sm:grid-cols-3 dark:border-steel-800 dark:bg-white/[0.02]">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Project</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{dataset.projects.find(p => p.id === projectId)?.name}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Material</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{TYPE_LABEL[type]} (Grade {grade}, {condition})</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Quantity</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{quantity} t</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Range</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{rangeMin} - {rangeMax} t</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase text-steel-500">Evidence</dt>
                  <dd className="font-bold text-ink-900 dark:text-white">{evidence.length} attachments</dd>
                </div>
              </dl>

              {validationError && <p role="alert" className="mt-4 text-sm text-error-500">{validationError}</p>}
              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(3)} className="font-bold text-steel-500 hover:text-ink-900 dark:hover:text-white">Back</button>
                <button onClick={handleSubmit} className="bg-loop-600 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-700">Create Material Passport</button>
              </div>
            </motion.div>
          )}

          {step === 5 && createdPassport && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="border-t-4 border-loop-500 bg-white p-12 text-center shadow-lg dark:border-loop-400 dark:bg-black">
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
                <button onClick={() => navigate('/app/materials')} className="border-2 border-steel-300 px-8 py-4 font-bold uppercase tracking-wide hover:border-ink-900 dark:border-steel-700 dark:text-white dark:hover:border-white">View Passports</button>
                <button onClick={() => navigate('/app/receivers', { state: { materialId: createdPassport.id } })} className="bg-ink-900 px-8 py-4 font-bold text-white uppercase tracking-wide hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500">Find a Receiver</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
