/** User roles — mirrors backend Holora.models.User.role choices */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
  TRAINER: "trainer",
  SHOP_MANAGER: "shop_manager",
  FINANCE_MANAGER: "finance_manager",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Trainer primary specialties — mirrors backend trainer.models.Trainer */
export const TRAINER_SPECIALTIES = [
  "Strength & Conditioning",
  "Personal Training",
  "Yoga",
  "Pilates",
  "CrossFit",
  "Boxing / Kickboxing",
  "Martial Arts",
  "HIIT / Functional",
  "Dance Fitness",
  "Swimming",
  "Running / Endurance",
  "Cycling",
  "Rehabilitation",
  "Sports Performance",
  "Nutrition Coaching",
  "Weight Loss",
  "Bodybuilding",
  "Calisthenics",
  "Senior Fitness",
  "Pre/Postnatal",
  "Kids / Youth Fitness",
  "Group Fitness",
  "Outdoor / Boot Camp",
  "Flexibility / Mobility",
  "Mind-Body Wellness",
] as const;

/** Event categories — mirrors backend events.models.EventSubmission.category */
export const EVENT_CATEGORIES = [
  { value: "fitness", label: "Fitness" },
  { value: "yoga", label: "Yoga" },
  { value: "martial_arts", label: "Martial Arts" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "dance", label: "Dance" },
  { value: "wellness", label: "Wellness" },
  { value: "sports", label: "Sports" },
  { value: "workshop", label: "Workshop" },
  { value: "other", label: "Other" },
] as const;

/** Booking statuses — mirrors backend trainer.models.TrainerBooking.status */
export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
} as const;

/** Trainer application statuses */
export const APPLICATION_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

/** Event submission statuses */
export const EVENT_STATUSES = {
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;
