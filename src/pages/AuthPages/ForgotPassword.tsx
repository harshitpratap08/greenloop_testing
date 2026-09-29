import React, { useState } from "react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Use a demo password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }
    if (!resetPassword(email, password)) {
      setError("No locally saved demo account was found for this email. This form does not send email or issue a reset link.");
      return;
    }
    setReset(true);
  };

  return (
    <>
      <PageMeta title="Forgot Password | GreenLoop" description="Reset your locally stored GreenLoop demo password" />
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link to="/sign-in" className="inline-flex items-center text-sm font-medium text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
              <ChevronLeftIcon className="size-5 rtl:rotate-180" />
              Back to Sign In
            </Link>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
            <h1 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Reset demo password</h1>
            {reset ? (
              <div className="mt-4">
                <p role="status" className="text-sm text-gray-600 dark:text-gray-400">The password for {" "}<span className="font-medium text-ink-900 dark:text-white">{email.trim().toLowerCase()}</span> has been changed in this browser. No reset email was sent. This local demo stores passwords in browser storage and is not secure for real credentials.</p>
                <div className="mt-6"><Link to="/sign-in"><Button className="w-full" size="md">Return to Sign In</Button></Link></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Set a new password for an account stored in this browser. This local demo does not send email or use a backend; do not use a real password.</p>
                <div className="space-y-5">
                  <div><Label>Email</Label><Input type="email" autoComplete="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  <div><Label>New demo password</Label><Input type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                  <div><Label>Confirm new password</Label><Input type="password" autoComplete="new-password" placeholder="Confirm your new password" minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required /></div>
                  {error && <p role="alert" className="text-sm text-error-500">{error}</p>}
                  <Button className="w-full" size="md" type="submit">Save New Demo Password</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
