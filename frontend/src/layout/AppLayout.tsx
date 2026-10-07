import { SidebarProvider } from "@/context/SidebarContext";
import { useSidebar } from "@/context/SidebarContext.helpers";
import { cn } from "@/utils";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="relative min-h-screen bg-[#f6f5f0] text-[#26342b] transition-colors duration-300 dark:bg-[#101913] dark:text-[#f2f3ef] xl:flex">
      <div className="relative z-10 flex min-h-screen w-full xl:flex">
        <AppSidebar />
      <Backdrop />

      <div
        className={cn(
          "min-w-0 flex-1 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ms-72.5" : "xl:ms-22.5",
          isMobileOpen ? "ms-0" : "",
        )}
      >
        <AppHeader />
        <main className="greenloop-workspace mx-auto w-full max-w-app p-4 sm:p-card xl:p-section">
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
