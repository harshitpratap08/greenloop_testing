import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import {
  BoxIconLine,
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  GridIcon,
  HorizontaLDots,
  LayoutIcon,
  ListIcon,
  TaskIcon,
  TruckDelivery,
  BoxMoving,
  CheckCircleIcon,
  BoxTapped,
  UserCircleIcon,
  SettingsAltIcon,
  HeadphoneAltIcon,
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

/**
 * GreenLoop navigation — friendly IA first (Home, Projects, Find a receiver,
 * Bookings, Deliveries, Verification, Reports); the technical/operational
 * surfaces (Operations console, Allocations scoring) live in the Admin group.
 */
const providerNavItems: NavItem[] = [
  {
    icon: <GridIcon fontSize={24} />,
    name: "Home",
    key: "explore",
    path: "/app/explore",
  },
  {
    icon: <BoxIconLine fontSize={24} />,
    name: "Projects",
    key: "projects",
    path: "/app/projects",
  },
  {
    icon: <BoxMoving fontSize={24} />,
    name: "Materials & Passports",
    key: "materials",
    path: "/app/materials",
  },
  {
    icon: <ListIcon fontSize={24} />,
    name: "Who Needs Material",
    key: "marketDemand",
    path: "/app/market-demand",
  },
  {
    icon: <BoxTapped fontSize={24} />,
    name: "Find a receiver",
    key: "receivers",
    path: "/app/receivers",
  },
  {
    icon: <CalenderIcon fontSize={24} />,
    name: "Bookings",
    key: "bookings",
    path: "/app/bookings",
  },
  {
    icon: <TruckDelivery fontSize={24} />,
    name: "Deliveries",
    key: "deliveries",
    path: "/app/deliveries",
  },
  {
    icon: <CheckCircleIcon fontSize={24} />,
    name: "Proof of Recovery",
    key: "verification",
    path: "/app/verification",
  },
];

const providerOthersItems: NavItem[] = [
  {
    icon: <TaskIcon fontSize={24} />,
    name: "Reports",
    key: "reports",
    path: "/app/reports",
  },
  {
    icon: <DocsIcon fontSize={24} />,
    name: "Operations console",
    key: "dashboard",
    path: "/app/dashboard",
  },
  {
    icon: <LayoutIcon fontSize={24} />,
    name: "Match Details",
    key: "allocations",
    path: "/app/allocations",
  },
  {
    icon: <ListIcon fontSize={24} />,
    name: "Public website",
    key: "publicSite",
    path: "/",
  },
];

const receiverNavItems: NavItem[] = [
  {
    icon: <GridIcon fontSize={24} />,
    name: "Overview",
    path: "/app/receiver/overview",
  },
  {
    icon: <BoxMoving fontSize={24} />,
    name: "Material Requests",
    path: "/app/receiver/demand",
  },
  {
    icon: <BoxIconLine fontSize={24} />,
    name: "Receiving Capacity",
    path: "/app/receiver/capacity",
  },
  {
    icon: <BoxTapped fontSize={24} />,
    name: "Incoming Requests",
    path: "/app/receiver/incoming-requests",
  },
  {
    icon: <TruckDelivery fontSize={24} />,
    name: "Deliveries",
    path: "/app/receiver/deliveries",
  },
  {
    icon: <CheckCircleIcon fontSize={24} />,
    name: "Check & Accept",
    path: "/app/receiver/verification",
  },
];

const receiverOthersItems: NavItem[] = [
  {
    icon: <ListIcon fontSize={24} />,
    name: "Public website",
    path: "/",
  },
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
    <div className="border-t border-steel-200 pt-4 dark:border-steel-800">
      {isExpanded || isHovered || isMobileOpen ? (
        <h2 className="mb-4 flex text-xs leading-5 text-gray-400 uppercase justify-start">
          Account
        </h2>
      ) : (
        <h2 className="mb-4 flex justify-center">
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
  
  const [isSwitcherOpen, setSwitcherOpen] = useState(false);

  const currentNavItems = user?.activeWorkspace === 'receiver' ? receiverNavItems : providerNavItems;
  const currentOthersItems = user?.activeWorkspace === 'receiver' ? receiverOthersItems : providerOthersItems;
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
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
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  useEffect(() => {
    let submenuMatched = false;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? currentNavItems : currentOthersItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

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
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
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
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-steel-200 bg-gray-25 px-5 text-ink-900 transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-steel-800 dark:bg-gray-900",
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
          "flex py-8",
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start",
        )}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
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

      {(isExpanded || isHovered || isMobileOpen) && user && (
        <div className="px-5 mb-6 relative">
          <button 
            className="dropdown-toggle flex w-full items-center justify-between rounded-lg border border-steel-200 bg-white p-3 text-sm font-medium text-ink-900 hover:bg-gray-25 dark:border-steel-800 dark:bg-gray-dark dark:text-white dark:hover:bg-gray-800"
            onClick={() => setSwitcherOpen(!isSwitcherOpen)}
          >
            <span>{user.activeWorkspace === 'receiver' ? 'Material Receiver' : 'Material Provider'}</span>
            <ChevronDownIcon className="size-4 text-gray-500" />
          </button>
          
          <Dropdown isOpen={isSwitcherOpen} onClose={() => setSwitcherOpen(false)} className="w-[calc(100%-2.5rem)] top-full mt-2">
            <div className="flex flex-col py-2">
              {user.workspaces.includes('provider') && (
                <button
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800",
                    user.activeWorkspace === 'provider' ? "text-loop-600 font-semibold dark:text-loop-500" : "text-ink-900 dark:text-white"
                  )}
                  onClick={() => {
                    setActiveWorkspace('provider');
                    setSwitcherOpen(false);
                    navigate('/app/explore');
                  }}
                >
                  Material Provider
                </button>
              )}
              {user.workspaces.includes('receiver') && (
                <button
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800",
                    user.activeWorkspace === 'receiver' ? "text-loop-600 font-semibold dark:text-loop-500" : "text-ink-900 dark:text-white"
                  )}
                  onClick={() => {
                    setActiveWorkspace('receiver');
                    setSwitcherOpen(false);
                    navigate('/app/receiver/overview');
                  }}
                >
                  Material Receiver
                </button>
              )}
            </div>
          </Dropdown>
        </div>
      )}

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${
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
              <h2
                className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t("sidebar.groups.others")
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(currentOthersItems, "others")}
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
