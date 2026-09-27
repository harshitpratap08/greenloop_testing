import CapacitySnapshot from "@/layout/CapacitySnapshot";
import { useTranslation } from "react-i18next";

export default function SidebarWidget() {
  const { t } = useTranslation();

  return (
    <div className="pb-20">
      <CapacitySnapshot />
      <div className="mx-auto mt-4 w-full max-w-60 rounded-lg border border-steel-200 bg-white px-4 py-4 text-center dark:border-white/5 dark:bg-white/3">
        <h3 className="eyebrow-label mb-2 text-steel-600 dark:text-steel-400">
          {t("sidebar.widget.title")}
        </h3>
        <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
          {t("sidebar.widget.description")}
        </p>
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-md bg-ink-900 p-2.5 text-theme-sm font-medium text-white hover:bg-ink-800 dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200"
        >
          {t("sidebar.widget.purchasePlan")}
        </button>
      </div>
    </div>
  );
}
