import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "./use-debounce";

interface UseSearchParamOptions {
  paramKey: string;
  debounceDelay?: number;
}

export function useSearchParam(options: UseSearchParamOptions) {
  const { paramKey, debounceDelay = 300 } = options;

  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for immediate input updates
  const [searchValue, setSearchValue] = useState(
    searchParams.get(paramKey) ?? "",
  );
  const debouncedSearchValue = useDebounce(searchValue, debounceDelay);

  // Track the last URL-synced value to prevent infinite loops
  const lastSyncedValue = useRef<string | null>(searchParams.get(paramKey));

  // Update URL with debounced search value
  useEffect(() => {
    // Only update if the debounced value differs from what's already in the URL
    if (debouncedSearchValue !== lastSyncedValue.current) {
      const params = new URLSearchParams(window.location.search);
      if (debouncedSearchValue) {
        params.set(paramKey, debouncedSearchValue);
      } else {
        params.delete(paramKey);
      }
      lastSyncedValue.current = debouncedSearchValue || null;
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [debouncedSearchValue, paramKey, router]);

  return {
    searchValue,
    setSearchValue,
    debouncedSearchValue,
  };
}
