import { useEffect, useState } from "react";

// The whole site is one page: the address holds `#/<view>/<arg>/<arg>`.
//
//   #/learn                          the course
//   #/learn/<track>/<chapter>/<slug>/<step>
//   #/exam                           the exam list
//   #/exam/<paper>                   one paper
//   #/playground/<exercise?>         the playground
//   #/library?q=...&chapter=...      the library
//
// parseRoute turns the hash into parts; buildHash turns parts into a hash.
export const parseRoute = (hash = window.location.hash) => {
  const raw = hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { view: parts[0] || "learn", parts: parts.slice(1), params, raw };
};

export const buildHash = (view, parts = [], params = {}) => {
  const path = [view, ...parts].filter(Boolean).map(encodeURIComponent).join("/");
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")).toString();
  return `#/${path}${query ? `?${query}` : ""}`;
};

export const navigate = (view, parts = [], params = {}, replace = false) => {
  const next = buildHash(view, parts, params);
  if (window.location.hash === next) return;
  if (replace) window.history.replaceState(null, "", next);
  else window.location.hash = next;
};

export const useHashRoute = () => {
  const [route, setRoute] = useState(() => parseRoute());
  useEffect(() => {
    const onChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
};
