import { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { PageMotion, RevealItem, MediaPanel } from "@/components/greenloop/kit";
import { ambientMedia } from "@/config/appMedia";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState(() => ({
    fullName: user?.name || "Site Manager",
    companyName: user?.organization || "Harrow Road Demolition",
    email: user?.email || "manager@harrowdemo.co.uk",
    phone: user?.phone || "",
    location: user?.location || "",
    vat: user?.vat || ""
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    const saved = await updateUser({
      name: formData.fullName.trim(),
      organization: formData.companyName.trim(),
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      vat: formData.vat.trim(),
    });
    setIsSaving(false);
    setSuccess(saved);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Account Profile | GreenLoop"
        description="Manage your GreenLoop account details."
      />
      <PageBreadCrumb pageTitle="Account Profile" />

      <PageMotion className="mx-auto max-w-3xl">
        <RevealItem>
          <div className="relative group">
            <MediaPanel
              media={ambientMedia.siteCabins}
              aspect="aspect-[21/9]"
              caption={user?.activeWorkspace === "receiver" ? "Receiver workspace" : "Provider workspace"}
            />
            <div className="pointer-events-none absolute bottom-4 start-5 end-5">
              <p className="font-archivo text-2xl font-bold text-white drop-shadow-md">{user?.name ?? "Your profile"}</p>
              <p className="mt-1 text-sm font-medium text-white/85 drop-shadow-md">{user?.organization || "GreenLoop account"}</p>
            </div>
          </div>
        </RevealItem>
        <RevealItem className="mt-6">
        <div className="border border-steel-200 bg-white p-8 dark:border-steel-800 dark:bg-white/[0.02]">
        <h2 className="mb-6 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Profile Settings</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Company / Workspace Name</label>
              <input 
                type="text" 
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Location / Region</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">VAT / Company Number</label>
              <input type="text" name="vat" value={formData.vat} onChange={handleChange} className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                readOnly
                aria-describedby="account-email-note"
                required
                className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
              />
              <p id="account-email-note" className="mt-1 text-xs text-steel-500">Email is the sign-in identifier for your account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-steel-100 dark:border-steel-800/50">
            <Button size="md" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            {success && (
              <span className="text-sm font-medium text-loop-600 dark:text-loop-400">
                Profile saved successfully.
              </span>
            )}
          </div>
        </form>
      </div>
        </RevealItem>
      </PageMotion>
    </div>
  );
}
