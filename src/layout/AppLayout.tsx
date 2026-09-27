import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { cn } from "@/utils";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="relative min-h-screen xl:flex bg-[#F6F6F3] text-ink-900 transition-colors duration-300 dark:bg-[#0B0F15] dark:text-gray-100">
      <div className="relative z-10 flex min-h-screen w-full xl:flex">
        <AppSidebar />
      <Backdrop />

      <div
        className={cn(
          "flex-1 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ms-72.5" : "xl:ms-22.5",
          isMobileOpen ? "ms-0" : "",
        )}
      >
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
