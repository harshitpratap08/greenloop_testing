import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
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
  const { login, simulateGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    // Frontend demo rule: any input signs in (unknown emails are
    // auto-provisioned by the auth layer — no validation restrictions).
    if (!login(email, password, rememberMe)) {
      setError("Enter an email to continue.");
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
          <div className="mb-8">
            <h1 className="mb-2 font-archivo text-4xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Sign In</h1>
            <p className="text-steel-600 dark:text-gray-400">Plan where recoverable materials go — before the truck leaves.</p>
            <p className="mt-4 border-l-2 border-loop-500 pl-3 text-xs text-steel-500 dark:text-gray-500">This is a local demo. Your password is stored in this browser and is not suitable for real credentials.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input type="text" autoComplete="email" required placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
              <button type="submit" className="flex w-full items-center justify-center border-2 border-ink-900 bg-ink-900 px-4 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-loop-600 hover:border-loop-600 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500 dark:hover:border-loop-500 dark:hover:text-white">Sign in</button>
            </div>
          </form>

          <div className="mt-6 relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
            <div className="relative flex justify-center text-sm"><span className="bg-gray-25 p-2 text-gray-500 sm:px-5 sm:py-2 dark:bg-gray-dark dark:text-gray-400">Or</span></div>
          </div>
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
