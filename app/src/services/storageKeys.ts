export const STORAGE_ROUTES = {
  routes: "lastRoutes",
  activeIndex: "activeRouteIndex",
  timestamp: "lastRoutesTimestamp",
  context: "lastRouteContext",
} as const;

export type RouteStorageKey = typeof STORAGE_ROUTES[keyof typeof STORAGE_ROUTES];
