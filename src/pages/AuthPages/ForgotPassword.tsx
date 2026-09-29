import React, { useState } from "react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <PageMeta
        title="Forgot Password | GreenLoop"
        description="Reset your GreenLoop account password"
      />
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link
              to="/sign-in"
              className="inline-flex items-center text-sm font-medium text-steel-600 transition-colors hover:text-ink-900 dark:text-steel-400 dark:hover:text-white"
            >
              <ChevronLeftIcon className="size-5 rtl:rotate-180" />
              Back to Sign In
            </Link>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
            <h1 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
              Forgot Password
            </h1>
            
            {submitted ? (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If an account exists for <span className="font-medium text-ink-900 dark:text-white">{email}</span>, you will receive a password reset link shortly.
                </p>
                <div className="mt-6">
                  <Link to="/sign-in">
                    <Button className="w-full" size="md">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <div className="space-y-5">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" size="md">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
