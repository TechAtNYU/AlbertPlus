import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Update URL with debounced search value
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearchValue) {
      params.set(paramKey, debouncedSearchValue);
    } else {
      params.delete(paramKey);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearchValue, router, searchParams, paramKey]);

  return {
    searchValue,
    setSearchValue,
    debouncedSearchValue,
  };
}
