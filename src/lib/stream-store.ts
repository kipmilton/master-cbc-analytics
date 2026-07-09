import { useEffect, useState } from "react";
import { streams as seedStreams, type Stream } from "./mock-data";

const KEY = "mastercbc.streams";
const EVT = "mastercbc:streams";

export function loadStreams(): Stream[] {
  if (typeof window === "undefined") return seedStreams;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : seedStreams;
  } catch { return seedStreams; }
}

export function saveStreams(list: Stream[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

export function useStreams() {
  const [list, setList] = useState<Stream[]>(() => loadStreams());
  useEffect(() => {
    const sync = () => setList(loadStreams());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [list, (next: Stream[]) => { saveStreams(next); setList(next); }] as const;
}
