/**
 * DDS V2 — Package Type Definitions
 * -----------------------------------
 * These types model the Firestore document schema for all
 * driving school service packages. They are the single source
 * of truth consumed by seed scripts, React hooks, and components.
 */

export type PackageCategory =
  | "Adult-Packages"
  | "Teen-Packages"
  | "Knowledge-Test-Options"
  | "Driving-Test-Options";

export interface PackageFeature {
  /** Human-readable feature label */
  text: string;
  /** Whether this feature is included (true) or explicitly excluded (false) */
  included: boolean;
}

export interface ServicePackage {
  /** Firestore document ID — matches the original DDS IDs */
  id: string;
  /** Display name shown on the card */
  name: string;
  /** Price in USD (integer cents would be used server-side, but we store dollars for display) */
  price: number;
  /** Number of behind-the-wheel hours included */
  hours: number;
  /** Number of required driving sessions for admin tracking */
  requiredDrives: number;
  /** Short tagline for the card subtitle */
  subtitle: string;
  /** Detailed feature list rendered as checkmarks / x-marks */
  features: PackageFeature[];
  /** Whether this package should be highlighted as "Popular" */
  isPopular?: boolean;
  /** Sort order within its category (lower = first) */
  sortOrder: number;
  /** The category group this package belongs to */
  category: PackageCategory;
  /** Active / draft toggle for CMS */
  isActive: boolean;
  /** Custom Clover/Stripe payment link */
  paymentLink?: string;
  /** ISO timestamp of last update */
  updatedAt?: string;
}

export interface PackageCategoryGroup {
  id: PackageCategory;
  label: string;
  icon: string; // Lucide icon name
  packages: ServicePackage[];
}
