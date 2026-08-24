import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/language";

const API = `${import.meta.env.BASE_URL}api`;

export interface FavoriteStock {
  ticker: string;
  stock: {
    ticker: string;
    companyName: string;
    price: number;
    changePercent: number;
    targetUpsidePercent: number | null;
    reasons: string[];
  } | null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useFavorites(enabled = true) {
  const { lang } = useLanguage();
  return useQuery<{ favorites: FavoriteStock[] }>({
    queryKey: ["favorites", lang],
    queryFn: () => fetchJson(`${API}/favorites?lang=${lang}`),
    staleTime: 60_000,
    enabled,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticker, saved }: { ticker: string; saved: boolean }) => {
      if (saved) {
        await fetchJson(`${API}/favorites/${encodeURIComponent(ticker)}`, { method: "DELETE" });
      } else {
        await fetchJson(`${API}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
}
