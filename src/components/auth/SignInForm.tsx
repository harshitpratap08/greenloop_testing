import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [socialMessage, setSocialMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!login(email, password, rememberMe)) {
      setError("Email or password doesn't match a locally saved demo account. Create an account or reset its demo password.");
      return;
    }
    const hasWorkspace = (() => {
      try {
        const roles: unknown = JSON.parse(localStorage.getItem(`gl_workspaces_${email.trim().toLowerCase()}`) || "[]");
        return Array.isArray(roles) && roles.length > 0;
      } catch {
        return false;
      }
    })();
    navigate(hasWorkspace ? "/app" : "/onboarding");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-md pt-10">
        <Link to="/" className="inline-flex items-center text-sm text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white">
          <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          Back to GreenLoop
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 sm:text-title-md dark:text-white">Sign in to GreenLoop</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plan where recoverable materials go — before the truck leaves.</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">This is a local demo. Your password is stored in this browser and is not suitable for real credentials.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input type="email" autoComplete="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-e-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:focus-visible:outline-white">
                    {showPassword ? <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Checkbox id="remember-me" checked={rememberMe} onChange={setRememberMe} label="Keep me logged in on this device" />
                <Link to="/forgot-password" className="text-sm text-ink-900 hover:text-ink-700 underline dark:text-white dark:hover:text-gray-200">Forgot password?</Link>
              </div>
              {error && <p role="alert" className="text-sm text-error-500">{error}</p>}
              <Button className="w-full" size="sm">Sign in</Button>
            </div>
          </form>

          <div className="mt-6 relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-gray-25 p-2 text-gray-500 sm:px-5 sm:py-2 dark:bg-gray-dark dark:text-gray-400">Or</span></div>
          </div>
          <button type="button" onClick={() => setSocialMessage("External Google sign-in is not connected in this local demo. Use your saved demo account instead.")} className="inline-flex w-full items-center justify-center gap-3 rounded-sm border border-steel-200 bg-steel-50 px-5 py-3 text-sm font-medium text-ink-800 transition-colors hover:border-steel-400 hover:bg-gray-25 dark:border-steel-800 dark:bg-white/5 dark:text-gray-200 dark:hover:border-steel-600 dark:hover:bg-white/10">
            <span aria-hidden="true" className="font-semibold text-blue-600">G</span>
            Continue with Google
          </button>
          {socialMessage && <p role="status" className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">{socialMessage}</p>}

          <div className="mt-8 text-center text-sm">
            <p className="text-gray-500 dark:text-gray-400">Don't have an account?{" "}
              <Link to="/sign-up" className="text-ink-900 hover:text-ink-700 underline dark:text-white dark:hover:text-gray-200">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
