import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import React from "react";
import { Link } from "react-router";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        {children}
        <div className="relative hidden h-full w-full items-center overflow-hidden lg:grid lg:w-1/2">
          {/* Construction photography — recovered concrete stockpiles */}
          <img
            src="/images/site/auth-concrete.jpg"
            alt="Recovered concrete stockpiles at a materials recovery yard"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Flat charcoal scrim — legibility, no gradients */}
          <div className="absolute inset-0 bg-ink-950/80" aria-hidden="true" />

          <div className="relative z-1 flex items-center justify-center">
            <GridShape />

            <div className="flex max-w-sm flex-col items-center px-6">
              <Link to="/" className="mb-6 block">
                <img
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="GreenLoop"
                />
              </Link>

              <p className="text-center text-lg font-medium leading-7 text-white/90">
                Plan where recoverable materials go — before the truck leaves.
              </p>
              <p className="mt-3 text-center text-sm leading-6 text-white/60">
                Survey materials, match receivers, reserve capacity and verify
                every recovered tonne.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
