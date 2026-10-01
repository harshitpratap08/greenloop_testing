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
  const { createAccount, simulateGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !organization.trim() || !email.trim() || !password) {
      setError("Complete your name, organization, email, and password.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }
    // Frontend demo rule: any input signs up — no format, strength or
    // account-existence enforcement. An existing email simply signs in.
    if (!createAccount({ email, name, organization }, password)) {
      setError("This account could not be created in this browser.");
      return;
    }
    navigate("/onboarding");
  };

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-md px-6 pt-10 sm:px-8 lg:px-0">
        <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to GreenLoop
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 sm:px-8 lg:px-0">
        <div>
          <div className="mb-8">
            <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Create Account</h1>
            <p className="text-steel-600 dark:text-gray-400">Survey materials, match receivers, reserve capacity and verify loads.</p>
            <p className="mt-4 border-s-2 border-loop-500 ps-3 text-xs text-steel-500 dark:text-gray-500">Local demo only: account details and password are stored in this browser, not sent to a server. Do not use a real password.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <button type="button" onClick={() => {
              if (!simulateGoogleLogin()) {
                setSocialMessage("Google demo sign-in could not start in this browser.");
                return;
              }
              const savedRoles = localStorage.getItem("gl_workspaces_google-user@example.com");
              navigate(savedRoles && savedRoles !== "[]" ? "/app" : "/onboarding");
            }} className="inline-flex w-full items-center justify-center gap-3 border-2 border-steel-300 bg-white px-5 py-4 text-sm font-bold uppercase tracking-wider text-ink-900 transition-colors hover:border-ink-900 dark:border-steel-700 dark:bg-black dark:text-white dark:hover:border-white">
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
            <div className="space-y-6">
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
                <Input type="text" id="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your work email" />
              </div>
              <div>
                <Label>Password<span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input id="password" name="password" autoComplete="new-password" required placeholder="Create a password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:focus-visible:outline-white">
                    {showPassword ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm Password<span className="text-error-500">*</span></Label>
                <Input id="confirm-password" name="confirm-password" autoComplete="new-password" placeholder="Confirm your password" type={showPassword ? "text" : "password"} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
              </div>
              <Checkbox id="terms-accepted" className="h-5 w-5" checked={termsAccepted} onChange={setTermsAccepted} label="I agree to the Terms and Conditions and Privacy Policy" />
              {error && <p role="alert" className="text-sm text-error-500">{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">Create account</button>
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
