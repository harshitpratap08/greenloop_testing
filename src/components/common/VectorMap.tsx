import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import jsVectorMap from "jsvectormap";

if (typeof window !== "undefined") {
  (window as unknown as { jsVectorMap: typeof jsVectorMap }).jsVectorMap =
    jsVectorMap;
}

import "jsvectormap/dist/maps/world.js";

type SetScale = (scale: number, anchorX?: number, anchorY?: number, isCentered?: boolean, animate?: boolean) => void;
type VectorMapInstance = jsVectorMap & {
  setScale?: SetScale;
  _setScale?: SetScale;
  _width?: number;
  _height?: number;
};

export type VectorMapMarker = {
  name?: string;
  coords?: [number, number];
  latLng?: [number, number];
  style?: Record<string, unknown>;
  [key: string]: unknown;
};

export type VectorMapProps = {
  map?: string | Record<string, unknown>;
  containerStyle?: CSSProperties;
  containerClassName?: string;
  backgroundColor?: string;
  zoomOnScroll?: boolean;
  zoomOnScrollSpeed?: number;
  zoomMax?: number;
  zoomMin?: number;
  zoomAnimate?: boolean;
  zoomStep?: number;
  zoomButtons?: boolean;
  markers?: VectorMapMarker[];
  markerStyle?: Record<string, unknown>;
  markersSelectable?: boolean;
  markersSelectableOne?: boolean;
  selectedMarkers?: Array<string | number>;
  regionStyle?: Record<string, unknown>;
  regionLabelStyle?: Record<string, unknown>;
  regionsSelectable?: boolean;
  regionsSelectableOne?: boolean;
  selectedRegions?: string[];
  labels?: Record<string, unknown>;
  lines?: unknown[];
  lineStyle?: Record<string, unknown>;
  series?: Record<string, unknown>;
  visualizeData?: jsVectorMap.MapOptions["visualizeData"];
  focusOn?: Record<string, unknown>;
  onLoaded?: (map: unknown) => void;
  onRegionClick?: (event: MouseEvent, code: string) => void;
  onMarkerClick?: (event: MouseEvent, index: string) => void;
  onRegionSelected?: (
    code: string,
    isSelected: boolean,
    selectedRegions: string[],
  ) => void;
  onMarkerSelected?: (
    index: string,
    isSelected: boolean,
    selectedMarkers: string[],
  ) => void;
  onRegionTipShow?: (e: unknown, el: unknown, code: string) => void;
  onMarkerTipShow?: (e: unknown, el: unknown, index: number) => void;
  onRegionTooltipShow?: (
    event: MouseEvent,
    tooltip: unknown,
    code: string,
  ) => void;
  onMarkerTooltipShow?: (
    event: MouseEvent,
    tooltip: unknown,
    index: string,
  ) => void;
  onViewportChange?: (scale: number, transX: number, transY: number) => void;
  onDestroyed?: () => void;
  mapRef?: RefObject<VectorMapInstance | null>;
  style?: CSSProperties;
  className?: string;
};

export function VectorMap({
  map = "world",
  containerStyle,
  containerClassName,
  backgroundColor = "transparent",
  zoomOnScroll = false,
  zoomOnScrollSpeed,
  zoomMax = 12,
  zoomMin = 1,
  zoomAnimate = true,
  zoomStep = 1.5,
  zoomButtons = false,
  markers,
  markerStyle,
  markersSelectable,
  markersSelectableOne,
  selectedMarkers,
  regionStyle,
  regionLabelStyle,
  regionsSelectable,
  regionsSelectableOne,
  selectedRegions,
  labels,
  lines,
  lineStyle,
  series,
  visualizeData,
  focusOn,
  onLoaded,
  onRegionClick,
  onMarkerClick,
  onRegionSelected,
  onMarkerSelected,
  onRegionTipShow,
  onMarkerTipShow,
  onRegionTooltipShow,
  onMarkerTooltipShow,
  onViewportChange,
  onDestroyed,
  mapRef,
  style,
  className,
}: VectorMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    node.innerHTML = "";

    let mapName = "world";
    if (typeof map === "string") {
      if (map === "world" || map === "worldMill" || map === "worldMerc") {
        mapName = "world";
      } else if (map === "usAea" || map === "us_aea" || map === "us_aea_en") {
        mapName = "us_aea_en";
      } else {
        mapName = map;
      }
    } else if (map && typeof map === "object") {
      const mapObj = map as { name?: string };
      if (mapObj.name) {
        mapName = mapObj.name;
        if (
          !(jsVectorMap as unknown as { maps?: Record<string, unknown> })
            .maps?.[mapName]
        ) {
          jsVectorMap.addMap(
            mapName,
            map as unknown as Parameters<typeof jsVectorMap.addMap>[1],
          );
        }
      }
    }

    const normalizedMarkers = markers?.map((marker) => {
      const coords = marker.coords || marker.latLng || [0, 0];
      let itemStyle = marker.style;
      if (itemStyle && typeof itemStyle === "object" && !("initial" in itemStyle)) {
        const { borderWidth, borderColor, ...rest } = itemStyle as Record<
          string,
          unknown
        >;
        itemStyle = {
          initial: {
            ...rest,
            ...(borderWidth !== undefined ? { strokeWidth: borderWidth } : {}),
            ...(borderColor !== undefined ? { stroke: borderColor } : {}),
          },
        };
      }
      return {
        ...marker,
        coords,
        style: itemStyle,
      };
    });

    let mapInstance: VectorMapInstance | null = null;

    try {
      mapInstance = new jsVectorMap({
        selector: node,
        map: mapName,
        backgroundColor,
        draggable: true,
        zoomButtons,
        zoomOnScroll,
        ...(zoomOnScrollSpeed !== undefined ? { zoomOnScrollSpeed } : {}),
        zoomMax,
        zoomMin,
        zoomAnimate,
        zoomStep,
        ...(markers ? { markers: normalizedMarkers as jsVectorMap.MapOptions["markers"] } : {}),
        ...(markerStyle ? { markerStyle: markerStyle as jsVectorMap.MapOptions["markerStyle"] } : {}),
        markersSelectable:
          markersSelectable ?? Boolean(selectedMarkers && selectedMarkers.length > 0),
        ...(markersSelectableOne !== undefined ? { markersSelectableOne } : {}),
        ...(selectedMarkers ? { selectedMarkers } : {}),
        ...(regionStyle ? { regionStyle: regionStyle as jsVectorMap.MapOptions["regionStyle"] } : {}),
        ...(regionLabelStyle ? { regionLabelStyle: regionLabelStyle as jsVectorMap.MapOptions["regionLabelStyle"] } : {}),
        regionsSelectable:
          regionsSelectable ?? Boolean(selectedRegions && selectedRegions.length > 0),
        ...(regionsSelectableOne !== undefined ? { regionsSelectableOne } : {}),
        ...(selectedRegions ? { selectedRegions } : {}),
        ...(labels ? { labels: labels as jsVectorMap.MapOptions["labels"] } : {}),
        ...(lines ? { lines: lines as jsVectorMap.MapOptions["lines"] } : {}),
        ...(lineStyle ? { lineStyle: lineStyle as jsVectorMap.MapOptions["lineStyle"] } : {}),
        ...(series ? { series: series as jsVectorMap.MapOptions["series"] } : {}),
        ...(visualizeData ? { visualizeData } : {}),
        ...(focusOn ? { focusOn: focusOn as jsVectorMap.MapOptions["focusOn"] } : {}),
        ...(onLoaded ? { onLoaded } : {}),
        ...(onRegionClick ? { onRegionClick } : {}),
        ...(onMarkerClick ? { onMarkerClick } : {}),
        ...(onRegionSelected ? { onRegionSelected } : {}),
        ...(onMarkerSelected ? { onMarkerSelected } : {}),
        ...(onRegionTooltipShow
          ? { onRegionTooltipShow }
          : onRegionTipShow
            ? {
                onRegionTooltipShow: (event: MouseEvent, tooltip: jsVectorMap.Tooltip, code: string) =>
                  onRegionTipShow(event, tooltip, code),
              }
            : {}),
        ...(onMarkerTooltipShow
          ? { onMarkerTooltipShow }
          : onMarkerTipShow
            ? {
                onMarkerTooltipShow: (event: MouseEvent, tooltip: jsVectorMap.Tooltip, index: string) =>
                  onMarkerTipShow(event, tooltip, Number(index)),
              }
            : {}),
        ...(onViewportChange ? { onViewportChange } : {}),
        ...(onDestroyed ? { onDestroyed } : {}),
      });

      // Compatibility helpers for custom zoom buttons
      if (typeof mapInstance.setScale !== "function") {
        mapInstance.setScale = function (
          this: VectorMapInstance,
          scale: number,
          anchorX?: number,
          anchorY?: number,
          isCentered?: boolean,
          animate?: boolean,
        ) {
          if (typeof this._setScale === "function") {
            this._setScale(scale, anchorX, anchorY, isCentered, animate);
          }
        };
      }

      if (!Object.prototype.hasOwnProperty.call(mapInstance, "width")) {
        Object.defineProperty(mapInstance, "width", {
          get(this: VectorMapInstance) {
            return this._width ?? node?.clientWidth ?? 0;
          },
          configurable: true,
        });
      }

      if (!Object.prototype.hasOwnProperty.call(mapInstance, "height")) {
        Object.defineProperty(mapInstance, "height", {
          get(this: VectorMapInstance) {
            return this._height ?? node?.clientHeight ?? 0;
          },
          configurable: true,
        });
      }

      if (mapRef) {
        mapRef.current = mapInstance;
      }
    } catch (err) {
      console.error("Failed to initialize jsVectorMap:", err);
    }

    return () => {
      if (mapRef) {
        mapRef.current = null;
      }
      if (mapInstance) {
        try {
          mapInstance.destroy();
        } catch {
          // ignore
        }
      }
      if (node) {
        node.innerHTML = "";
      }
    };
  }, [
    map,
    backgroundColor,
    zoomOnScroll,
    zoomOnScrollSpeed,
    zoomMax,
    zoomMin,
    zoomAnimate,
    zoomStep,
    zoomButtons,
    markers,
    markerStyle,
    markersSelectable,
    markersSelectableOne,
    selectedMarkers,
    regionStyle,
    regionLabelStyle,
    regionsSelectable,
    regionsSelectableOne,
    selectedRegions,
    labels,
    lines,
    lineStyle,
    series,
    visualizeData,
    focusOn,
    onLoaded,
    onRegionClick,
    onMarkerClick,
    onRegionSelected,
    onMarkerSelected,
    onRegionTipShow,
    onMarkerTipShow,
    onRegionTooltipShow,
    onMarkerTooltipShow,
    onViewportChange,
    onDestroyed,
    mapRef,
  ]);

  const combinedClassName = [containerClassName, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={combinedClassName || undefined}
      style={{ width: "100%", height: "100%", ...containerStyle, ...style }}
    />
  );
}

export default VectorMap;
