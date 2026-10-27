import type { SearchResult } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import type { Router } from "../router";

const LIMIT = 8;

/**
 * 3 if the text starts with the query, 2 if a word in it does, 1 if it
 * appears anywhere, 0 if not. Crude next to a real search index, which is
 * what the backend will use, but it orders results the way people expect.
 */
function score(text: string, query: string): number {
  const haystack = text.toLowerCase();
  if (haystack.startsWith(query)) return 3;
  if (haystack.split(/[\s·,()–-]+/).some((word) => word.startsWith(query))) return 2;
  return haystack.includes(query) ? 1 : 0;
}

export function registerSearchRoutes(router: Router) {
  router.get("/search", ({ db, query }) => {
    const q = (query.get("q") ?? "").trim().toLowerCase();
    if (q.length < 2) return [];

    // What's sent back, and the text it's matched on (which can include more).
    const candidates: { result: SearchResult; text: string }[] = [
      ...db.projects.map((p) => ({
        result: {
          kind: "project" as const,
          id: p.id,
          title: p.name,
          subtitle: `${p.code} · ${p.area}, ${p.city}`,
        },
        text: `${p.name} ${p.code} ${p.area} ${p.city}`,
      })),
      ...db.invoices.map((i) => ({
        result: {
          kind: "invoice" as const,
          id: i.id,
          title: `${i.number} · ${i.client.name}`,
          subtitle: `${i.reference} · ${formatMoney(i.amount)}`,
        },
        text: `${i.number} ${i.client.name} ${i.reference}`,
      })),
      ...db.equipment.map((e) => ({
        result: {
          kind: "equipment" as const,
          id: e.id,
          title: `${e.name} · ${e.code}`,
          subtitle: e.location,
        },
        text: `${e.name} ${e.code}`,
      })),
      ...db.stock.map((s) => ({
        result: {
          kind: "stock_item" as const,
          id: s.id,
          title: s.name,
          subtitle: `${s.sku} · ${s.location.name}`,
        },
        text: `${s.name} ${s.sku}`,
      })),
      ...db.people.map((person) => ({
        result: {
          kind: "person" as const,
          id: person.id,
          title: person.name,
          subtitle: person.role,
        },
        text: `${person.name} ${person.role}`,
      })),
    ];

    return candidates
      .map((candidate) => ({ result: candidate.result, score: score(candidate.text, q) }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, LIMIT)
      .map((match) => match.result);
  });
}
