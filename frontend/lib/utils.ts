import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// "prisma": "^5.22.0",
// "@prisma/client": "^5.22.0",
// "mongodb": "^7.0.0",
//         /fix The datasource property url is no longer supported in schema files. Move connection URLs for Migrate to prisma.config.ts and pass either adapter for a direct database connection or accelerateUrl for Accelerate to the PrismaClient constructor. See https://pris.ly/d/config-datasource and https://pris.ly/d/prisma7-client-config

// Remove the unsupported url property from the datasource in schema.prisma and move connection configuration to prisma.config.ts as instructed.
