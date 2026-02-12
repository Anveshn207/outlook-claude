"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, User, Briefcase, MapPin, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";

interface SearchHit {
  id: string;
  score: number;
  firstName: string;
  lastName: string;
  email: string | null;
  title: string | null;
  currentEmployer: string | null;
  location: string | null;
  status: string;
  source: string;
  skills: string;
  highlight?: Record<string, string[]>;
}

interface SearchResult {
  data: SearchHit[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

function sanitizeHighlight(html: string): string {
  // Only allow <em> and <mark> tags from OpenSearch highlights
  return html
    .replace(/<(?!\/?(?:em|mark)\b)[^>]*>/gi, '')  // Strip all tags except em and mark
    .replace(/on\w+\s*=/gi, '');  // Strip event handlers
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PASSIVE: "bg-amber-100 text-amber-700 border-amber-200",
  PLACED: "bg-blue-100 text-blue-700 border-blue-200",
  DND: "bg-red-100 text-red-700 border-red-200",
};

export default function SearchPage() {
  const { can } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebounce(query, 400);

  const doSearch = useCallback(
    async (searchQuery: string, searchPage: number) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotal(0);
        setSearched(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          page: String(searchPage),
          limit: "25",
        });
        if (statusFilter !== "all") params.set("status", statusFilter);

        const res = await apiFetch<SearchResult>(
          `/search/candidates?${params}`,
        );
        setResults(res.data);
        setTotal(res.meta.total);
        setSearched(true);
      } catch (err) {
        console.error("[SearchPage] Search failed:", err);
        // Fallback: use candidates API with search param
        try {
          const params = new URLSearchParams({
            search: searchQuery,
            page: String(searchPage),
            limit: "25",
          });
          if (statusFilter !== "all") params.set("status", statusFilter);
          const fallback = await apiFetch<{
            data: Array<{
              id: string;
              firstName: string;
              lastName: string;
              email: string | null;
              title: string | null;
              currentEmployer: string | null;
              location: string | null;
              status: string;
              source: string;
              skills: string[];
            }>;
            meta: { total: number };
          }>(`/candidates?${params}`);
          setResults(
            fallback.data.map((c) => ({
              ...c,
              score: 0,
              skills: c.skills.join(", "),
            })),
          );
          setTotal(fallback.meta.total);
          setSearched(true);
        } catch {
          setResults([]);
          setTotal(0);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    setPage(1);
    doSearch(debouncedQuery, 1);
  }, [debouncedQuery, doSearch]);

  useEffect(() => {
    if (debouncedQuery) {
      doSearch(debouncedQuery, page);
    }
  }, [page, debouncedQuery, doSearch]);

  if (!can("search:read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Search Candidates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across candidate profiles, skills, and resume content.
        </p>
      </div>

      {/* Search bar + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, email, skills, resume content..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PASSIVE">Passive</SelectItem>
            <SelectItem value="DND">DND</SelectItem>
            <SelectItem value="PLACED">Placed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : searched ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {total} result{total !== 1 ? "s" : ""} found
            {query ? ` for "${query}"` : ""}
          </p>

          {results.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border">
              <Search className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No candidates matched your search.
              </p>
            </div>
          ) : (
            <>
              {results.map((hit) => (
                <Card
                  key={hit.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/candidates/${hit.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {hit.firstName} {hit.lastName}
                            </span>
                            <Badge
                              className={statusColors[hit.status] ?? ""}
                              variant="outline"
                            >
                              {hit.status}
                            </Badge>
                            {hit.score > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                Score: {hit.score.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {hit.title && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {hit.title}
                              </span>
                            )}
                            {hit.currentEmployer && (
                              <span>@ {hit.currentEmployer}</span>
                            )}
                            {hit.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {hit.location}
                              </span>
                            )}
                            {hit.email && <span>{hit.email}</span>}
                          </div>
                          {hit.skills && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {hit.skills
                                .split(",")
                                .slice(0, 5)
                                .map((skill) => skill.trim())
                                .filter(Boolean)
                                .map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-[10px]"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                            </div>
                          )}
                          {/* Highlighted resume snippets */}
                          {hit.highlight?.resumeText && (
                            <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-muted-foreground">
                              <span className="font-medium text-amber-700">
                                Resume match:
                              </span>{" "}
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHighlight(hit.highlight.resumeText[0]),
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {total > 25 && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil(total / 25)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / 25)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
          <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm">Type to search across all candidates and resumes.</p>
        </div>
      )}
    </div>
  );
}
