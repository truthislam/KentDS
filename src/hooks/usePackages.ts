"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  ServicePackage,
  PackageCategory,
  PackageCategoryGroup,
} from "@/types/packages";

// Fallback data for dev/offline mode
import {
  packageCategories as fallbackCategories,
  allPackages as fallbackAll,
} from "@/data/seed-packages";

const APP_ID = "kent";
const BASE_PATH = `artifacts/${APP_ID}/public/data`;

/**
 * Fetch all packages for a single category from Firestore.
 * Falls back to local seed data if Firestore is unreachable.
 */
async function fetchCategoryPackages(
  categoryId: PackageCategory
): Promise<ServicePackage[]> {
  try {
    const listRef = collection(
      db,
      `${BASE_PATH}/packages/${categoryId}/list`
    );
    const q = query(listRef, orderBy("sortOrder", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error("empty");

    return snapshot.docs.map((d) => ({
      ...(d.data() as ServicePackage),
      id: d.id,
    }));
  } catch (err) {
    // Fallback to local seed data
    const group = fallbackCategories.find((g) => g.id === categoryId);
    return group?.packages ?? [];
  }
}

/**
 * Hook: usePackagesByCategory
 * Returns all packages for a given category, sorted by sortOrder.
 */
export function usePackagesByCategory(categoryId: PackageCategory) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCategoryPackages(categoryId);
        if (!cancelled) setPackages(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return { packages, loading, error };
}

/**
 * Hook: useAllPackageCategories
 * Returns ALL categories with their packages — the full catalog.
 */
export function useAllPackageCategories() {
  const [categories, setCategories] = useState<PackageCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryIds: PackageCategory[] = [
          "Adult-Packages",
          "Teen-Packages",
          "Knowledge-Test-Options",
          "Driving-Test-Options",
        ];

        const results = await Promise.all(
          categoryIds.map((id) => fetchCategoryPackages(id))
        );

        const iconMap: Record<PackageCategory, string> = {
          "Adult-Packages": "UserCheck",
          "Teen-Packages": "Car",
          "Knowledge-Test-Options": "FileText",
          "Driving-Test-Options": "Route",
        };

        const labelMap: Record<PackageCategory, string> = {
          "Adult-Packages": "Adult Lessons",
          "Teen-Packages": "Teen Drivers Ed",
          "Knowledge-Test-Options": "Knowledge Tests",
          "Driving-Test-Options": "Road Tests",
        };

        const groups: PackageCategoryGroup[] = categoryIds.map((id, idx) => ({
          id,
          label: labelMap[id],
          icon: iconMap[id],
          packages: results[idx],
        }));

        if (!cancelled) setCategories(groups);
      } catch (e) {
        // Full fallback
        if (!cancelled) {
          setCategories(fallbackCategories);
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

/**
 * Hook: usePackageById
 * Fetches a single package by its document ID, scanning all categories.
 */
export function usePackageById(packageId: string | null) {
  const [pkg, setPkg] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packageId) {
      setPkg(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      const categoryIds: PackageCategory[] = [
        "Adult-Packages",
        "Teen-Packages",
        "Knowledge-Test-Options",
        "Driving-Test-Options",
      ];

      for (const catId of categoryIds) {
        try {
          const docRef = doc(
            db,
            `${BASE_PATH}/packages/${catId}/list`,
            packageId
          );
          const snap = await getDoc(docRef);
          if (snap.exists() && !cancelled) {
            setPkg({ ...(snap.data() as ServicePackage), id: snap.id });
            setLoading(false);
            return;
          }
        } catch (err) {
          // Try next category
        }
      }

      // Fallback to local data
      if (!cancelled) {
        const found = fallbackAll.find((p) => p.id === packageId) ?? null;
        setPkg(found);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  return { pkg, loading };
}
