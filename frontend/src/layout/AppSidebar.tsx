import { useAuth, type Role } from "@/context/AuthContext.helpers";
import { useSidebar } from "@/context/SidebarContext.helpers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
BoxIconLine,
BoxMoving,
BoxTapped,
CheckCircleIcon,
ChevronDownIcon,
DocsIcon,
GridIcon,
HeadphoneAltIcon,
HorizontaLDots,
ListIcon,
SettingsAltIcon,
UserCircleIcon,
} from "../icons";
import { cn } from "../utils";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  key?: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  subItems?: {
    name: string;
    key?: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    target?: string;
  }[];
};

const providerNavItems: NavItem[] = [
  { icon: <GridIcon fontSize={24} />, name: "Home", key: "explore", path: "/app/explore" },
  { icon: <BoxMoving fontSize={24} />, name: "Inventory", key: "materials", path: "/app/materials" },
  { icon: <ListIcon fontSize={24} />, name: "Requests", key: "marketDemand", path: "/app/market-demand" },
  { icon: <BoxMoving fontSize={24} />, name: "My Orders", key: "bookings-deliveries", path: "/app/bookings-deliveries" },
  { icon: <CheckCircleIcon fontSize={24} />, name: "Verification", key: "verification", path: "/app/verification" },
];

const referenceItems: NavItem[] = [
  { icon: <DocsIcon fontSize={24} />, name: "Dashboard", key: "dashboard", path: "/app/dashboard" },
  { icon: <BoxIconLine fontSize={24} />, name: "Projects", key: "projects", path: "/app/projects" },
  { icon: <ListIcon fontSize={24} />, name: "Website", key: "publicSite", path: "/" },
];

const receiverNavItems: NavItem[] = [
  { icon: <GridIcon fontSize={24} />, name: "Home", key: "explore", path: "/app/receiver/overview" },
  { icon: <BoxMoving fontSize={24} />, name: "Inventory", key: "receiverInventory", path: "/app/receiver/inventory" },
  { icon: <BoxTapped fontSize={24} />, name: "Requests", key: "receiverDemand", path: "/app/receiver/demand" },
  { icon: <BoxIconLine fontSize={24} />, name: "Providers", key: "providers", path: "/app/receiver/providers" },
  { icon: <BoxMoving fontSize={24} />, name: "My Orders", key: "bookings-deliveries", path: "/app/bookings-deliveries" },
  { icon: <CheckCircleIcon fontSize={24} />, name: "Verification", key: "verification", path: "/app/receiver/verification" },
];

const accountNavItems: NavItem[] = [
  {
    icon: <UserCircleIcon fontSize={24} />,
    name: "Profile",
    path: "/app/profile",
  },
  {
    icon: <SettingsAltIcon fontSize={24} />,
    name: "Settings",
    path: "/app/settings",
  },
  {
    icon: <HeadphoneAltIcon fontSize={24} />,
    name: "Support",
    path: "/app/support",
  },
];

/** Signed-in essentials pinned under the nav — identity, preferences, help. */
const AccountSidebarWidget: React.FC<{
  render: (items: NavItem[], menuType: "main" | "others") => React.ReactNode;
}> = ({ render }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  return (
    <div className="border-t border-white/10 pt-4">
      {isExpanded || isHovered || isMobileOpen ? (
        <h2 className="mb-3 flex text-[10px] font-semibold leading-5 uppercase tracking-[0.16em] text-white/40 justify-start">
          Account
        </h2>
      ) : (
        <h2 className="mb-3 flex justify-center text-white/40">
          <HorizontaLDots className="size-6" />
        </h2>
      )}
      {render(accountNavItems, "others")}
    </div>
  );
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const { user, setActiveWorkspace } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const currentNavItems = user?.activeWorkspace === 'receiver' ? receiverNavItems : providerNavItems;
  const currentReferenceItems = referenceItems;
  const location = useLocation();
  type Submenu = { type: "main" | "others"; index: number } | null;
  const [submenuOverride, setSubmenuOverride] = useState<{
    locationKey: string;
    workspace: Role | undefined;
    submenu: Submenu;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-close sidebar on mobile after route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => {
      const [pathname, search] = path.split("?");
      return location.pathname === pathname && (!search || location.search === `?${search}`);
    },
    [location.pathname, location.search],
  );

  const routeSubmenu = useMemo(() => {
    let match: Submenu = null;
    for (const menuType of ["main", "others"] as const) {
      const items = menuType === "main" ? currentNavItems : currentReferenceItems;
      const index = items.findIndex((nav) => nav.subItems && (nav.path === location.pathname || nav.subItems.some((item) => item.path === location.pathname)));
      if (index !== -1) match = { type: menuType, index };
    }
    return match;
  }, [currentNavItems, currentReferenceItems, location.pathname]);
  const openSubmenu = submenuOverride?.locationKey === location.key &&
    submenuOverride.workspace === user?.activeWorkspace
    ? submenuOverride.submenu : routeSubmenu;

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu, isExpanded, isHovered, isMobileOpen, t]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setSubmenuOverride({
      locationKey: location.key,
      workspace: user?.activeWorkspace,
      submenu: openSubmenu?.type === menuType && openSubmenu.index === index
        ? null : { type: menuType, index },
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            nav.path ? (
              <div className="flex items-center">
                <Link to={nav.path} className={cn("group menu-item min-w-0 flex-1", isActive(nav.path) || nav.subItems.some(item => isActive(item.path)) ? "menu-item-active" : "menu-item-inactive")}>
                  <span className={cn("menu-item-icon-size", isActive(nav.path) || nav.subItems.some(item => isActive(item.path)) ? "menu-item-icon-active" : "menu-item-icon-inactive")}>{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}</span>}
                </Link>
                {(isExpanded || isHovered || isMobileOpen) && <button type="button" aria-label={nav.key ? t(`sidebar.items.${nav.key}`) : nav.name} aria-expanded={openSubmenu?.type === menuType && openSubmenu.index === index} aria-controls={`${menuType}-${index}-submenu`} onClick={() => handleSubmenuToggle(index, menuType)} className="ms-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white dark:hover:bg-white/10">
                  <ChevronDownIcon className={cn("size-5 transition-transform duration-200", openSubmenu?.type === menuType && openSubmenu.index === index && "rotate-180")} />
                </button>}
              </div>
            ) : (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`group menu-item ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "xl:justify-center"
                  : "xl:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">
                  {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                </span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`absolute inset-e-10 ms-auto ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive"
                  } menu-dropdown-badge`}
                >
                  {t("sidebar.badges.new")}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ms-auto h-5 w-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-ink-700 dark:text-ink-200"
                      : ""
                  }`}
                />
              )}
            </button>
            )
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                target={nav.target}
                className={`group menu-item ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">
                    {nav.key ? t(`sidebar.items.${nav.key}`) : nav.name}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              id={`${menuType}-${index}-submenu`}
              inert={openSubmenu?.type !== menuType || openSubmenu.index !== index}
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ms-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      target={subItem.target}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.key
                        ? t(`sidebar.items.${subItem.key}`)
                        : subItem.name}
                      <span className="ms-auto flex items-center gap-1">
                        {subItem.new && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            {t("sidebar.badges.new")}
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-pro-active"
                                : "menu-dropdown-badge-pro-inactive"
                            } menu-dropdown-badge-pro`}
                          >
                            {t("sidebar.badges.pro")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-[#294437] bg-[#173528] px-4 text-[#f4f2ed] transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0",
        isExpanded || isMobileOpen ? "w-72.5" : isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "flex items-start py-6",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
        )}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="flex flex-col gap-1">
              <img src="/images/logo/logo-dark.svg" alt="GreenLoop" width={150} height={36} />
              <span className="ps-10 text-[10px] leading-3 text-[#b4c5b9]">Materials Recovery Network</span>
            </span>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {user?.workspaces.includes("provider") && user.workspaces.includes("receiver") && (
        <div className="mb-4 px-1">
          <button
            type="button"
            onClick={async () => {
              const nextWorkspace: Role = user.activeWorkspace === "receiver" ? "provider" : "receiver";
              if (await setActiveWorkspace(nextWorkspace)) {
                navigate(nextWorkspace === "receiver" ? "/app/receiver/overview" : "/app/explore");
              }
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
            aria-label={t(user.activeWorkspace === "receiver" ? "sidebar.workspace.switchToProvider" : "sidebar.workspace.switchToReceiver")}
            title={t(user.activeWorkspace === "receiver" ? "sidebar.workspace.switchToProvider" : "sidebar.workspace.switchToReceiver")}
          >
            <span>{isExpanded || isHovered || isMobileOpen ? t(user.activeWorkspace === "receiver" ? "sidebar.workspace.receiver" : "sidebar.workspace.provider") : user.activeWorkspace === "receiver" ? "R" : "P"}</span>
            <span aria-hidden="true">↔</span>
          </button>
        </div>
      )}

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-3 flex text-[10px] font-semibold leading-5 uppercase tracking-[0.16em] text-white/40 ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.groups.menu")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(currentNavItems, "main")}
            </div>

            <div>
              <h2 className={`mb-3 flex text-[10px] font-semibold leading-5 uppercase tracking-[0.16em] text-white/40 ${!isExpanded && !isHovered ? "xl:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? t("sidebar.groups.others") : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(currentReferenceItems, "others")}
            </div>

            <AccountSidebarWidget render={renderMenuItems} />
          </div>
        </nav>

        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
