"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type FilterState = Record<string, string>;

type UseAdminFiltersOptions<T extends FilterState> = {
  initialValues: T;
  defaultValues: T;
  debounceMs?: number;
  resetKeys?: string[];
};

export function useAdminFilters<T extends FilterState>({
  initialValues,
  defaultValues,
  debounceMs = 300,
  resetKeys = ["page"],
}: UseAdminFiltersOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialValuesSignature = JSON.stringify(initialValues);
  const defaultValuesSignature = JSON.stringify(defaultValues);
  const stableInitialValues = useMemo(
    () => JSON.parse(initialValuesSignature) as T,
    [initialValuesSignature],
  );
  const stableDefaultValues = useMemo(
    () => JSON.parse(defaultValuesSignature) as T,
    [defaultValuesSignature],
  );
  const [values, setValues] = useState(stableInitialValues);

  const managedKeys = useMemo(
    () => Object.keys(stableDefaultValues) as Array<keyof T>,
    [stableDefaultValues],
  );

  useEffect(() => {
    setValues(stableInitialValues);
  }, [stableInitialValues]);

  const buildQueryString = useCallback((nextValues: T) => {
    const params = new URLSearchParams(searchParams.toString());

    managedKeys.forEach((key) => {
      const value = nextValues[key]?.trim();

      if (value) {
        params.set(String(key), value);
      } else {
        params.delete(String(key));
      }
    });

    resetKeys.forEach((key) => {
      params.delete(key);
    });

    return params.toString();
  }, [managedKeys, resetKeys, searchParams]);

  const syncUrl = useCallback((nextValues: T) => {
    const nextQuery = buildQueryString(nextValues);
    const currentParams = new URLSearchParams(searchParams.toString());

    resetKeys.forEach((key) => {
      currentParams.delete(key);
    });

    if (currentParams.toString() === nextQuery) {
      return;
    }

    const target = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(target, { scroll: false });
  }, [buildQueryString, pathname, resetKeys, router, searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      syncUrl(values);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, syncUrl, values]);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((currentValues) => {
      if (currentValues[key] === value) {
        return currentValues;
      }

      return {
        ...currentValues,
        [key]: value,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setValues(stableDefaultValues);
    syncUrl(stableDefaultValues);
  }, [stableDefaultValues, syncUrl]);

  const hasActiveFilters = managedKeys.some(
    (key) => values[key] !== stableDefaultValues[key],
  );

  return {
    values,
    setValue,
    reset,
    hasActiveFilters,
  };
}
