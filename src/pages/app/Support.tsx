import { useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

export default function Support() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setSubject("");
      setMessage("");
      setTimeout(() => setSuccess(false), 5000);
    }, 800);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Support | GreenLoop"
        description="Get help and contact support."
      />
      <PageBreadCrumb pageTitle="Support" />

      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Help Information */}
        <section className="rounded-sm border border-steel-200 bg-white p-8 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
          <h2 className="mb-4 font-archivo text-xl font-bold text-ink-900 dark:text-white">GreenLoop Workflow Help</h2>
          <div className="prose prose-sm max-w-none text-ink-800 dark:text-gray-300">
            <p className="mb-4">
              GreenLoop connects construction material providers with receivers to keep materials in the circular economy.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Providers:</strong> Survey materials, create Material Passports, and find Receivers with capacity to take them.</li>
              <li><strong>Receivers:</strong> Publish Material Requests to indicate demand, or accept Incoming Capacity Requests from Providers.</li>
            </ul>
            <p className="mt-4">
              Ensure you switch between Provider and Receiver workspaces using the user menu in the top right to access role-specific features.
            </p>
          </div>
        </section>

        {/* Contact Form */}
        <section className="rounded-sm border border-steel-200 bg-white p-8 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
          <h2 className="mb-6 font-archivo text-xl font-bold text-ink-900 dark:text-white">Contact Support</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Subject</Label>
              <Input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Briefly describe your issue"
              />
            </div>
            
            <div>
              <Label>Message</Label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="mt-1 block w-full rounded-sm border-steel-300 p-3 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                placeholder="How can we help?"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button size="md" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              {success && (
                <span className="text-sm font-medium text-loop-600 dark:text-loop-400">
                  Support request submitted.
                </span>
              )}
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
