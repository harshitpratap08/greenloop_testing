import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [socialMessage, setSocialMessage] = useState("");
  const { createAccount } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !organization.trim() || !email.trim() || !password || !confirmation) {
      setError("Complete your name, organization, email, password, and confirmation.");
      return;
    }
    if (password.length < 8) {
      setError("Use a demo password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }
    if (!termsAccepted) {
      setError("Accept the terms to create your local demo account.");
      return;
    }
    if (!createAccount({ email, name, organization }, password)) {
      setError("An account with this email already exists in this browser. Sign in or reset its demo password.");
      return;
    }
    navigate("/onboarding");
  };

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to GreenLoop
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">Create your GreenLoop account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Survey materials, match receivers, reserve capacity, verify loads.</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Local demo only: account details and password are stored in this browser, not sent to a server. Do not use a real password.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button type="button" onClick={() => setSocialMessage("External Google sign-up is not connected in this local demo. Create an account using the form below.")} className="inline-flex w-full items-center justify-center gap-3 rounded-sm border border-steel-200 bg-steel-50 px-5 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:bg-white/5 dark:text-gray-200 dark:hover:border-steel-600 dark:hover:bg-white/10">
              <span aria-hidden="true" className="font-semibold text-blue-600">G</span>
              Continue with Google
            </button>
          </div>
          {socialMessage && <p role="status" className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{socialMessage}</p>}
          <div className="relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-gray-25 p-2 text-gray-500 sm:px-5 sm:py-2 dark:bg-gray-dark dark:text-gray-400">Or register with email</span></div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label>Full Name<span className="text-error-500">*</span></Label>
                <Input type="text" id="name" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
              </div>
              <div>
                <Label>Work/Company Name<span className="text-error-500">*</span></Label>
                <Input type="text" id="company" name="company" required value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Enter your company name" />
              </div>
              <div>
                <Label>Work Email<span className="text-error-500">*</span></Label>
                <Input type="email" id="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your work email" />
              </div>
              <div>
                <Label>Password<span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input id="password" name="password" autoComplete="new-password" required minLength={8} placeholder="Create a password (8+ characters)" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:focus-visible:outline-white">
                    {showPassword ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm Password<span className="text-error-500">*</span></Label>
                <Input id="confirm-password" name="confirm-password" autoComplete="new-password" required minLength={8} placeholder="Confirm your password" type={showPassword ? "text" : "password"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </div>
              <Checkbox id="terms-accepted" className="h-5 w-5" checked={termsAccepted} onChange={setTermsAccepted} label="I agree to the Terms and Conditions and Privacy Policy" />
              {error && <p role="alert" className="text-sm text-error-500">{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center rounded-sm bg-ink-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200">Create account</button>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">Already have an account?{" "}
              <Link to="/sign-in" className="text-ink-900 hover:text-ink-700 underline dark:text-white dark:hover:text-gray-200">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
