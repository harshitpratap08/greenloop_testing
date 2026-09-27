import { cn } from "@/utils";
import type { EventDisplayInfo } from "@fullcalendar/react";
import React from "react";

export interface CalendarEventItemProps {
  eventInfo: EventDisplayInfo;
}

const CalendarEventItem: React.FC<CalendarEventItemProps> = ({ eventInfo }) => {
  const calendarLevel = (
    eventInfo.event.extendedProps?.calendar || "primary"
  ).toLowerCase();

  // Color mappings
  const colorMap: Record<
    string,
    { bg: string; dot: string; title: string; time: string }
  > = {
    success: {
      bg: "border border-loop-100 bg-loop-50 dark:border-loop-500/20 dark:bg-loop-500/15",
      dot: "bg-loop-500",
      title: "text-loop-700 dark:text-loop-400",
      time: "text-loop-600/80 dark:text-loop-400/80",
    },
    danger: {
      bg: "border border-error-100 bg-error-50 dark:border-error-500/20 dark:bg-error-500/15",
      dot: "bg-error-500",
      title: "text-error-700 dark:text-error-400",
      time: "text-error-600/80 dark:text-error-400/80",
    },
    primary: {
      bg: "border border-steel-200 bg-steel-50 dark:border-steel-500/20 dark:bg-steel-500/15",
      dot: "bg-steel-600",
      title: "text-steel-700 dark:text-steel-300",
      time: "text-steel-600/80 dark:text-steel-400/80",
    },
    warning: {
      bg: "border border-signal-100 bg-signal-50 dark:border-signal-500/20 dark:bg-signal-500/15",
      dot: "bg-signal-500",
      title: "text-signal-700 dark:text-signal-400",
      time: "text-signal-600/80 dark:text-signal-400/80",
    },
  };

  const colors = colorMap[calendarLevel] ?? colorMap.primary;
  const isTimeGridView =
    !eventInfo.event?.allDay &&
    eventInfo.view?.type &&
    eventInfo.view.type.startsWith("timeGrid");

  if (isTimeGridView) {
    return (
      <div
        dir="ltr"
        className={cn(
          "event-fc-color flex h-full w-full flex-col justify-start overflow-hidden rounded-md p-1 transition-colors sm:rounded-lg sm:p-1.5",
          colors.bg,
        )}
      >
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div
            className={cn("size-1.5 shrink-0 rounded-full sm:size-2", colors.dot)}
          />
          <div
            className={cn(
              "truncate text-[11px] font-semibold leading-tight sm:text-xs",
              colors.title,
            )}
          >
            {eventInfo.event.title || ""}
          </div>
        </div>
        {eventInfo.timeText && (
          <div
            className={cn(
              "mt-0.5 truncate ps-2.5 text-[10px] font-medium leading-tight sm:ps-3.5 sm:text-[11px]",
              colors.time,
            )}
          >
            {eventInfo.timeText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "event-fc-color flex items-center rounded-md py-1 ps-1.5 pe-2 transition-colors sm:rounded-lg sm:py-1.5 sm:ps-2.5 sm:pe-3",
        colors.bg,
      )}
    >
      <div
        className={cn(
          "fc-daygrid-event-dot ms-0 me-1 h-2.5 w-1 shrink-0 rounded-full border-none sm:me-2 sm:h-3.5",
          colors.dot,
        )}
      />
      {eventInfo.timeText && (
        <div className="fc-event-time me-1 p-0 text-[10px] font-normal text-gray-500 sm:me-1.5 sm:text-xs dark:text-gray-400">
          {eventInfo.timeText}
        </div>
      )}
      <div className="fc-event-title truncate p-0 text-[11px] font-medium text-gray-700 sm:text-xs dark:text-white">
        {eventInfo.event.title || ""}
      </div>
    </div>
  );
};

export default CalendarEventItem;
