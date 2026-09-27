import GridShape from "@/components/common/GridShape";
import PageMeta from "@/components/common/PageMeta";
import { cn } from "@/utils";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

interface NotFoundProps {
  className?: string;
}

export default function NotFound({ className }: NotFoundProps) {
  const { t } = useTranslation("common", { keyPrefix: "notFound" });

  return (
    <>
      <PageMeta
        title="Page Not Found | GreenLoop"
        description="The page you are looking for does not exist in GreenLoop."
      />
      <div
        className={cn(
          "relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6",
          className,
        )}
      >
        <GridShape />
        <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
          <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl dark:text-white/90">
            Page Not Found
          </h1>

          <img src="/images/error/404.svg" alt="404" className="dark:hidden" />
          <img
            src="/images/error/404-dark.svg"
            alt="404"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg dark:text-gray-400">
            {t("message")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/app"
              className={cn(
                "inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600",
              )}
            >
              {t("goPlatform")}
            </Link>
            <Link
              to="/"
              className={cn(
                "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200",
              )}
            >
              {t("backHome")}
            </Link>
          </div>
        </div>
        {/* <!-- Footer --> */}
        <p
          className={cn(
            "absolute inset-s-1/2 bottom-6 -translate-x-1/2 text-center text-sm text-gray-500 rtl:translate-x-1/2 dark:text-gray-400",
          )}
        >
          &copy; {new Date().getFullYear()} - GreenLoop
        </p>
      </div>
    </>
  );
}
