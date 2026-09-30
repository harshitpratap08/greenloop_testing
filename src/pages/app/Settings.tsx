import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { AVAILABLE_LANGUAGES, type LanguageCode, useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Settings | GreenLoop" description="Manage your GreenLoop application preferences." />
      <PageBreadCrumb pageTitle="Settings" />
      <section className="mx-auto max-w-3xl rounded-sm border border-steel-200 bg-white p-8 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
        <h1 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Application Settings</h1>
        <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">These preferences are saved in this browser and apply to both workspaces.</p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold text-ink-900 dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">Current theme: {theme}</p>
            <button type="button" onClick={toggleTheme} className="mt-3 rounded-sm border border-steel-300 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5">Switch to {theme === "dark" ? "light" : "dark"} theme</button>
          </div>
          <label className="text-sm font-semibold text-ink-900 dark:text-white">Language
            <select value={language} onChange={(event) => setLanguage(event.target.value as LanguageCode)} className="mt-2 block w-full rounded-sm border-steel-300 text-sm dark:border-steel-700 dark:bg-black dark:text-white">
              {AVAILABLE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
