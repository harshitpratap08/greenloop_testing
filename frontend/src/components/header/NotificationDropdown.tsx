import { useAuth } from "@/context/AuthContext.helpers";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatStamp } from "@/utils";
import { useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface ActivityItem {
  id: string;
  actor: string;
  message: string;
  label: string;
  time: string;
  href: string;
  tone: "confirmed" | "hold" | "rejected" | "neutral";
}

const toneDot: Record<ActivityItem["tone"], string> = {
  confirmed: "bg-loop-500",
  hold: "bg-signal-500",
  rejected: "bg-error-500",
  neutral: "bg-steel-400",
};

const toneText: Record<ActivityItem["tone"], string> = {
  confirmed: "text-loop-700 dark:text-loop-300",
  hold: "text-signal-700 dark:text-signal-300",
  rejected: "text-error-700 dark:text-error-300",
  neutral: "text-steel-700 dark:text-steel-300",
};

export default function NotificationDropdown() {
  const { dataset, markNotificationsReadAction } = useGreenLoopStore();
  const { user } = useAuth();
  const items: ActivityItem[] = [...dataset.events].reverse().map((event) => {
    const [firstId = "", secondId = ""] = event.subjectIds;
    const activeReceiver = user?.activeWorkspace === "receiver";
    const href = event.kind.startsWith("demand.")
      ? activeReceiver ? `/app/receiver/demand?demand=${encodeURIComponent(firstId)}` : `/app/market-demand?demand=${encodeURIComponent(firstId)}`
      : event.kind.startsWith("offer.")
        ? activeReceiver ? `/app/receiver/demand?demand=${encodeURIComponent(secondId)}` : `/app/market-demand?demand=${encodeURIComponent(secondId)}`
        : event.kind.startsWith("allocation.")
          ? activeReceiver ? "/app/receiver/incoming-requests" : "/app/bookings"
          : event.kind.includes("capacity")
            ? activeReceiver ? "/app/receiver/demand?capacity=1" : "/app/bookings"
            : event.kind.startsWith("request.")
              ? "/app/bookings"
              : event.kind.startsWith("load.")
                ? activeReceiver ? "/app/receiver/deliveries" : "/app/deliveries"
                : event.kind.startsWith("delivery.")
                  ? activeReceiver ? "/app/receiver/verification" : "/app/deliveries"
                  : event.kind.startsWith("verification.")
                ? activeReceiver ? "/app/receiver/verification" : "/app/verification"
                : event.kind.startsWith("material.")
                  ? `/app/materials/${encodeURIComponent(firstId)}`
                  : event.kind.startsWith("project.")
                    ? `/app/projects/${encodeURIComponent(firstId)}`
                    : "/app/bookings";
    return {
      id: event.id,
      actor: event.actor.name,
      message: event.summary,
      label: event.kind.split(".").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" · "),
      time: formatStamp(event.at),
      href,
      tone: event.kind.includes("hold") ? "hold" : event.kind.includes("reject") || event.kind.includes("cancel") ? "rejected" : event.kind.includes("confirm") || event.kind.includes("verified") ? "confirmed" : "neutral",
    };
  });
  const [isOpen, setIsOpen] = useState(false);
  const readIds = new Set(dataset.readEventIds ?? []);
  const unreadCount = dataset.events.filter(event => !readIds.has(event.id)).length;

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      const unreadIds = items.filter(item => !readIds.has(item.id)).slice(0, 1000).map(item => item.id);
      if (unreadIds.length) void markNotificationsReadAction(unreadIds);
    }
  };

  return (
    <div className="relative">
      <button
        className="dropdown-toggle relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#deded5] bg-white text-[#526157] transition-colors hover:bg-[#e9eee8] sm:h-9 sm:w-9 xl:h-10 xl:w-10"
        onClick={handleClick}
        aria-label={unreadCount ? `Activity, ${unreadCount} unread` : "Activity"}
        aria-expanded={isOpen}
      >
        {unreadCount > 0 && <span className="absolute -end-1 -top-1 z-10 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-signal-500 px-1 text-[9px] font-bold leading-none text-white" aria-hidden="true">{unreadCount}</span>}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -inset-s-13.5 mt-4.25 flex h-120 w-87.5 flex-col rounded-lg border border-steel-200 bg-white p-3 shadow-theme-lg sm:w-90.25 xl:inset-s-auto xl:inset-e-0 dark:border-steel-800 dark:bg-gray-dark"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Activity
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close activity"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex custom-scrollbar h-auto flex-col overflow-y-auto">
          {items.length === 0 && <li className="p-4 text-sm text-gray-500 dark:text-gray-400">No activity has been recorded.</li>}
          {items.map((item) => (
            <li key={item.id}>
              <DropdownItem
                tag="a"
                to={item.href}
                onItemClick={() => { closeDropdown(); void markNotificationsReadAction([item.id]); }}
                className="flex gap-3 border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
              >
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    readIds.has(item.id) ? "bg-steel-300" : toneDot[item.tone],
                  )}
                  aria-hidden="true"
                />

                <span className="block">
                  <span className="mb-1.5 block space-x-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {item.actor}
                    </span>
                    <span>{item.message}</span>
                  </span>

                  <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
                    <span className={cn("font-medium", toneText[item.tone])}>
                      {item.label}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                    <span className="ledger-numeral">{item.time}</span>
                  </span>
                </span>
              </DropdownItem>
            </li>
          ))}
        </ul>
        <Link
          to="/app/audit-trail"
          onClick={closeDropdown}
          className="mt-3 block rounded-lg border border-steel-300 bg-white px-4 py-2 text-center text-sm font-medium text-ink-800 hover:bg-steel-50 dark:border-steel-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View full audit trail
        </Link>
      </Dropdown>
    </div>
  );
}
