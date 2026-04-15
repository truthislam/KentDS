/**
 * DDS V2 — Comprehensive Seed Data
 * ----------------------------------
 * This file contains the EXACT package data extracted from the
 * original DDS static HTML (services.html) and seedFirestore.js.
 *
 * Every price, feature, and description is a 1:1 port.
 * This data is consumed by:
 *   1. The Firestore seed script (scripts/seed-firestore.ts)
 *   2. Development fallback when Firestore is unavailable
 */

import type { ServicePackage, PackageCategoryGroup } from "@/types/packages";

// ─────────────────────────────────────────────
// ADULT PACKAGES
// ─────────────────────────────────────────────
export const adultPackages: ServicePackage[] = [
  {
    id: "Evaluation",
    name: "Evaluation Package",
    price: 90,
    hours: 1,
    requiredDrives: 1,
    subtitle: "1 Hour Assessment",
    sortOrder: 0,
    category: "Adult-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "Professional 1-hour skills evaluation", included: true },
      { text: "Comprehensive review of driving abilities", included: true },
      { text: "Identify areas needing improvement", included: true },
    ],
  },
  {
    id: "Adult-Refresher",
    name: "Refresher Course",
    price: 250,
    hours: 3,
    requiredDrives: 3,
    subtitle: "3 Hours Behind-the-Wheel",
    sortOrder: 1,
    category: "Adult-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "3 Hours Behind-the-Wheel", included: true },
      { text: "Skill Assessment", included: true },
      { text: "Targeted Improvement", included: true },
      { text: "Vehicle Familiarization", included: true },
      { text: "Basic Parking Skills", included: true },
      { text: "Driving Test Included", included: true },
      { text: "Knowledge Test Included", included: true },
    ],
  },
  {
    id: "Adult-Basic",
    name: "Basic Package",
    price: 400,
    hours: 5,
    requiredDrives: 5,
    subtitle: "5 Hours Behind-the-Wheel",
    sortOrder: 2,
    category: "Adult-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "5 Hours Behind-the-Wheel", included: true },
      { text: "Residential Driving", included: true },
      { text: "Basic Parking Skills", included: true },
      { text: "Traffic Signs Review", included: true },
      { text: "Right-of-Way Rules", included: true },
      { text: "City and Highway Driving", included: true },
      { text: "Lane Changing", included: true },
      { text: "Knowledge Test Included", included: true },
      { text: "Driving Test Included", included: true },
    ],
  },
  {
    id: "Adult-Intermediate",
    name: "Intermediate Package",
    price: 550,
    hours: 7,
    requiredDrives: 7,
    subtitle: "7 Hours Behind-the-Wheel",
    sortOrder: 3,
    category: "Adult-Packages",
    isPopular: true,
    isActive: true,
    features: [
      { text: "7 Hours Behind-the-Wheel", included: true },
      { text: "City & Highway Driving", included: true },
      { text: "Lane Changing Safety", included: true },
      { text: "Parallel Parking Mastery", included: true },
      { text: "Defensive Driving Techniques", included: true },
      { text: "Intersection Safety", included: true },
      { text: "Knowledge Test Included", included: true },
      { text: "Driving Test Included", included: true },
    ],
  },
  {
    id: "Adult-Advanced",
    name: "Advanced Package",
    price: 750,
    hours: 10,
    requiredDrives: 10,
    subtitle: "10 Hours Behind-the-Wheel",
    sortOrder: 4,
    category: "Adult-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "10 Hours Behind-the-Wheel", included: true },
      { text: "Complex Intersections", included: true },
      { text: "Highway Merging & Exiting", included: true },
      { text: "Night Driving Tips", included: true },
      { text: "Mock Road Test Preparation", included: true },
      { text: "Advanced Maneuvers", included: true },
      { text: "Detailed Feedback Logs", included: true },
      { text: "Knowledge Test Included", included: true },
      { text: "Driving Test Included", included: true },
    ],
  },
  {
    id: "First-Time-Driver",
    name: "First-Time Driver Essential Package",
    price: 1050,
    hours: 14,
    requiredDrives: 14,
    subtitle: "14 Hours — Complete Program",
    sortOrder: 5,
    category: "Adult-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "14 Hours Behind-the-Wheel", included: true },
      { text: "Step-by-Step Instruction", included: true },
      { text: "All Weather Conditions", included: true },
      { text: "Multiple Mock Tests", included: true },
      { text: "Test Anxiety Management", included: true },
      { text: "City and Highway Driving", included: true },
      { text: "Full Curriculum Coverage", included: true },
      { text: "Knowledge Test Included", included: true },
      { text: "Driving Test Included", included: true },
    ],
  },
];

// ─────────────────────────────────────────────
// TEEN PACKAGES
// ─────────────────────────────────────────────
export const teenPackages: ServicePackage[] = [
  {
    id: "Teen-Basic",
    name: "Teen Basic Package",
    price: 550,
    hours: 6,
    requiredDrives: 6,
    subtitle: "30h Classroom + 6h Driving",
    sortOrder: 0,
    category: "Teen-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "30 Hours Classroom Instruction", included: true },
      { text: "6 Hours Behind-the-Wheel Training", included: true },
      { text: "1 Hour Observation", included: true },
      { text: "Flexible Schedule", included: true },
      { text: "Certificate of Completion", included: true },
      { text: "Knowledge Test: Not Included", included: false },
      { text: "Driving Test: Not Included", included: false },
    ],
  },
  {
    id: "Teen-Standard",
    name: "Teen Standard Package",
    price: 650,
    hours: 6,
    requiredDrives: 6,
    subtitle: "30h Classroom + 6h Driving + Tests",
    sortOrder: 1,
    category: "Teen-Packages",
    isPopular: true,
    isActive: true,
    features: [
      { text: "30 Hours Classroom Instruction", included: true },
      { text: "Weekend Classes Available", included: true },
      { text: "6 Hours Behind-the-Wheel Training", included: true },
      { text: "1 Hour Observation", included: true },
      { text: "Certificate of Completion", included: true },
      { text: "Knowledge Test: Included", included: true },
      { text: "Driving Test: Included", included: true },
    ],
  },
  {
    id: "Teen-Premium",
    name: "Teen Premium Package",
    price: 750,
    hours: 7,
    requiredDrives: 7,
    subtitle: "30h Classroom + 7h Driving + Tests",
    sortOrder: 2,
    category: "Teen-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "30 Hours Classroom Instruction", included: true },
      { text: "7 Hours Behind-the-Wheel Training", included: true },
      { text: "1 Hour Observation", included: true },
      { text: "Flexible Schedule", included: true },
      { text: "Highway Driving Focus", included: true },
      { text: "Certificate of Completion", included: true },
      { text: "Knowledge Test: Included", included: true },
      { text: "Driving Test: Included", included: true },
    ],
  },
  {
    id: "Teen-Advanced",
    name: "Teen Advanced Package",
    price: 850,
    hours: 9,
    requiredDrives: 9,
    subtitle: "30h Classroom + 9h Driving + Tests",
    sortOrder: 3,
    category: "Teen-Packages",
    isPopular: false,
    isActive: true,
    features: [
      { text: "30 Hours Classroom Instruction", included: true },
      { text: "9 Hours Behind-the-Wheel Training", included: true },
      { text: "1 Hour Observation", included: true },
      { text: "Flexible Schedule", included: true },
      { text: "Defensive Driving Focus", included: true },
      { text: "Adverse Weather Tips", included: true },
      { text: "Certificate of Completion", included: true },
      { text: "Knowledge Test: Included", included: true },
      { text: "Driving Test: Included", included: true },
    ],
  },
];

// ─────────────────────────────────────────────
// KNOWLEDGE TEST OPTIONS
// ─────────────────────────────────────────────
export const knowledgeTestOptions: ServicePackage[] = [
  {
    id: "KnowledgeTest-1Attempt",
    name: "Knowledge Test — 1 Attempt",
    price: 25,
    hours: 0,
    requiredDrives: 0,
    subtitle: "Single attempt",
    sortOrder: 0,
    category: "Knowledge-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "Official DOL written permit exam", included: true },
      { text: "First step to your driver's license!", included: true },
    ],
  },
  {
    id: "KnowledgeTest-2Attempts",
    name: "Knowledge Test — 2 Attempts",
    price: 40,
    hours: 0,
    requiredDrives: 0,
    subtitle: "Two attempts for peace of mind",
    sortOrder: 1,
    category: "Knowledge-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "Take the pressure off with two tries", included: true },
      { text: "Great value and peace of mind", included: true },
    ],
  },
  {
    id: "KnowledgeDriving-Bundle",
    name: "Knowledge + Driving Test Bundle",
    price: 150,
    hours: 0,
    requiredDrives: 0,
    subtitle: "All-in-one license package",
    sortOrder: 2,
    category: "Knowledge-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "All-in-one license package", included: true },
      { text: "Includes both tests & a warm-up drive", included: true },
    ],
  },
];

// ─────────────────────────────────────────────
// DRIVING TEST OPTIONS
// ─────────────────────────────────────────────
export const drivingTestOptions: ServicePackage[] = [
  {
    id: "DrivingTest-PersonalCar",
    name: "Driving Test (Personal Car)",
    price: 70,
    hours: 0,
    requiredDrives: 0,
    subtitle: "Bring your own vehicle",
    sortOrder: 0,
    category: "Driving-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "Official DOL-certified road test", included: true },
      { text: "Use your own insured vehicle", included: true },
    ],
  },
  {
    id: "DrivingTest-SchoolCar",
    name: "Driving Test (School Car)",
    price: 85,
    hours: 0,
    requiredDrives: 0,
    subtitle: "Use our vehicle",
    sortOrder: 1,
    category: "Driving-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "Official DOL-certified road test", included: true },
      { text: "School vehicle provided for the test", included: true },
    ],
  },
  {
    id: "DrivingTest-Plus30m",
    name: "Driving Test + 30min Practice",
    price: 140,
    hours: 0.5,
    requiredDrives: 0,
    subtitle: "Test with a warm-up",
    sortOrder: 2,
    category: "Driving-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "30-minute warm-up practice session", included: true },
      { text: "Official DOL-certified road test", included: true },
      { text: "School vehicle provided", included: true },
    ],
  },
  {
    id: "DrivingTest-Plus1h",
    name: "Driving Test + 1hr Practice",
    price: 180,
    hours: 1,
    requiredDrives: 0,
    subtitle: "Full practice + test",
    sortOrder: 3,
    category: "Driving-Test-Options",
    isPopular: false,
    isActive: true,
    features: [
      { text: "1-hour practice session before the test", included: true },
      { text: "Official DOL-certified road test", included: true },
      { text: "School vehicle provided", included: true },
    ],
  },
];

// ─────────────────────────────────────────────
// ALL PACKAGES — flat array for seed scripts
// ─────────────────────────────────────────────
export const allPackages: ServicePackage[] = [
  ...adultPackages,
  ...teenPackages,
  ...knowledgeTestOptions,
  ...drivingTestOptions,
];

// ─────────────────────────────────────────────
// GROUPED CATEGORIES — for UI tab rendering
// ─────────────────────────────────────────────
export const packageCategories: PackageCategoryGroup[] = [
  {
    id: "Adult-Packages",
    label: "Adult Lessons",
    icon: "UserCheck",
    packages: adultPackages,
  },
  {
    id: "Teen-Packages",
    label: "Teen Drivers Ed",
    icon: "Car",
    packages: teenPackages,
  },
  {
    id: "Knowledge-Test-Options",
    label: "Knowledge Tests",
    icon: "FileText",
    packages: knowledgeTestOptions,
  },
  {
    id: "Driving-Test-Options",
    label: "Road Tests",
    icon: "Route",
    packages: drivingTestOptions,
  },
];
