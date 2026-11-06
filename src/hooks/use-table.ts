"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface UseTableOptions<T> {
  data: T[];
  initialPageSize?: number;
  initialSortKey?: string | null;
  initialSortDirection?: SortDirection;
  searchQuery?: string;
  searchFields?: ((item: T) => string | number | boolean | null | undefined)[];
  getSortValue?: (item: T, key: string) => any;
  customFilter?: (item: T) => boolean;
}

export interface UseTableReturn<T> {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Sort state
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  setSort: (key: string | null, direction: SortDirection) => void;

  // Pagination state
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;

  // Data
  filteredItems: T[];
  paginatedItems: T[];
}

/**
 * Robust helper to safely extract a sort value by key path (e.g. "createdBy.name" or direct property)
 */
export function resolveSortValue<T>(item: T, key: string, customGetter?: (item: T, key: string) => any): any {
  if (customGetter) {
    const custom = customGetter(item, key);
    if (custom !== undefined) return custom;
  }

  if (!item || typeof item !== "object") return "";

  if (key in item) {
    return (item as any)[key];
  }

  // Handle dot notation (e.g. "annexType.number" or "createdBy.name")
  if (key.includes(".")) {
    const parts = key.split(".");
    let curr: any = item;
    for (const part of parts) {
      if (curr === null || curr === undefined) return "";
      curr = curr[part];
    }
    return curr;
  }

  return "";
}

/**
 * Compares two values with real-data awareness (numeric, chronological dates, string locale)
 */
export function compareValues(a: any, b: any, direction: "asc" | "desc"): number {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;

  let result = 0;

  // 1. Numbers
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  }
  // 2. Booleans
  else if (typeof a === "boolean" && typeof b === "boolean") {
    result = a === b ? 0 : a ? -1 : 1;
  }
  // 3. Dates or ISO strings
  else if (
    (a instanceof Date || (typeof a === "string" && /^\d{4}-\d{2}-\d{2}/.test(a))) &&
    (b instanceof Date || (typeof b === "string" && /^\d{4}-\d{2}-\d{2}/.test(b)))
  ) {
    const timeA = new Date(a).getTime();
    const timeB = new Date(b).getTime();
    if (!isNaN(timeA) && !isNaN(timeB)) {
      result = timeA - timeB;
    } else {
      result = String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    }
  }
  // 4. Strings & Fallback
  else {
    const strA = String(a).trim();
    const strB = String(b).trim();
    result = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" });
  }

  return direction === "asc" ? result : -result;
}

export function useTable<T>({
  data,
  initialPageSize = 10,
  initialSortKey = null,
  initialSortDirection = null,
  searchQuery: externalSearchQuery,
  searchFields,
  getSortValue,
  customFilter,
}: UseTableOptions<T>): UseTableReturn<T> {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [page, setPageInternal] = useState(1);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);

  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const setSearchQuery = useCallback((query: string) => {
    setInternalSearchQuery(query);
    setPageInternal(1);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeInternal(size);
    setPageInternal(1);
  }, []);

  const setPage = useCallback((newPage: number | ((prev: number) => number)) => {
    setPageInternal(newPage);
  }, []);

  const onSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDirection("asc");
        return key;
      }
      setSortDirection((prevDir) => {
        if (prevDir === "asc") return "desc";
        if (prevDir === "desc") return null;
        return "asc";
      });
      return prevKey;
    });
    setPageInternal(1);
  }, []);

  const setSort = useCallback((key: string | null, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
    setPageInternal(1);
  }, []);

  // 1. Filtered Data
  const filteredItems = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let items = data;

    // Apply custom filter if provided
    if (customFilter) {
      items = items.filter(customFilter);
    }

    // Apply search query across searchFields if provided
    const q = activeSearchQuery.trim().toLowerCase();
    if (q && searchFields && searchFields.length > 0) {
      items = items.filter((item) => {
        return searchFields.some((fieldFn) => {
          try {
            const val = fieldFn(item);
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          } catch {
            return false;
          }
        });
      });
    }

    return items;
  }, [data, activeSearchQuery, searchFields, customFilter]);

  // 2. Sorted Data
  const sortedItems = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const valA = resolveSortValue(a, sortKey, getSortValue);
      const valB = resolveSortValue(b, sortKey, getSortValue);
      return compareValues(valA, valB, sortDirection);
    });
  }, [filteredItems, sortKey, sortDirection, getSortValue]);

  // 3. Paginated Data
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-clamp page if it exceeds totalPages
  const validPage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, validPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(validPage * pageSize, totalItems);

  const nextPage = useCallback(() => {
    setPageInternal((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPageInternal((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    searchQuery: activeSearchQuery,
    setSearchQuery,
    sortKey,
    sortDirection,
    onSort,
    setSort,
    page: validPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    nextPage,
    prevPage,
    canNextPage: validPage < totalPages,
    canPrevPage: validPage > 1,
    filteredItems,
    paginatedItems,
  };
}
