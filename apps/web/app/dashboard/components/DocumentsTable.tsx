"use client";

import { useMemo, useState } from "react";

import { DocumentRow } from "./DocumentRow";
import type { DemoDocument } from "./seed-data";

type Filter = "all" | "high" | "payment";
type Sort = "recent" | "risk" | "flags";

interface DocumentsTableProps {
  documents: DemoDocument[];
}

const filterLabels: Record<Filter, string> = {
  all: "All",
  high: "High risk",
  payment: "Awaiting payment",
};

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const counts = useMemo(
    () => ({
      all: documents.length,
      high: documents.filter((doc) => doc.riskLevel === "high").length,
      payment: documents.filter((doc) => doc.status === "Awaiting payment").length,
    }),
    [documents],
  );

  const visibleDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents
      .filter((doc) => {
        if (filter === "high" && doc.riskLevel !== "high") return false;
        if (filter === "payment" && doc.status !== "Awaiting payment") return false;
        if (!normalized) return true;
        return [doc.name, doc.type, doc.market, doc.uploader, doc.status].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      })
      .sort((a, b) => {
        if (sort === "risk") return b.riskScore - a.riskScore;
        if (sort === "flags") return b.flags - a.flags;
        return new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime();
      });
  }, [documents, filter, query, sort]);

  return (
    <div className="glass overflow-hidden">
      <div className="panel-header flex-col items-stretch sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(filterLabels) as Filter[]).map((key) => (
            <button
              className={`badge transition ${
                filter === key
                  ? "border-ink bg-ink text-white"
                  : "border-slate-200/80 bg-white/70 text-muted hover:text-ink"
              }`}
              key={key}
              onClick={() => setFilter(key)}
              type="button"
            >
              {filterLabels[key]} ({counts[key]})
            </button>
          ))}
        </div>
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
          <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            <span className="sr-only">Search documents</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              className="input-glass h-11 pl-9 text-xs sm:h-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents"
              value={query}
            />
          </label>
          <label className="sr-only" htmlFor="document-sort">
            Sort documents
          </label>
          <select
            className="input-glass h-11 w-full text-xs sm:h-9 sm:w-36"
            id="document-sort"
            onChange={(event) => setSort(event.target.value as Sort)}
            value={sort}
          >
            <option value="recent">Most recent</option>
            <option value="risk">Highest risk</option>
            <option value="flags">Most flags</option>
          </select>
        </div>
      </div>
      <div className="hidden grid-cols-[auto_minmax(0,1.3fr)_160px_110px_120px_auto] gap-4 border-b border-slate-200/70 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted sm:grid">
        <span />
        <span>Document</span>
        <span>Risk</span>
        <span>Flags</span>
        <span>Status</span>
        <span />
      </div>
      {visibleDocuments.length > 0 ? (
        <ul className="divide-y divide-slate-200/70">
          {visibleDocuments.map((doc) => (
            <li key={doc.id}>
              <DocumentRow doc={doc} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-muted">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
            </svg>
          </div>
          <h2 className="mt-3 text-sm font-semibold text-ink">No matching documents</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted">
            Try a different search term or clear the filter to return to the full review history.
          </p>
        </div>
      )}
    </div>
  );
}
