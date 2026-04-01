"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
  iconClassName?: string;
}

const containerSizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const iconSizeClasses: Record<AvatarSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function buildUserAvatarUrl({
  avatarUrl,
  name,
  email,
  userId,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
}) {
  const trimmedAvatarUrl = avatarUrl?.trim();
  if (trimmedAvatarUrl) return trimmedAvatarUrl;

  const seed = (
    name?.trim() ||
    email?.trim() ||
    userId?.trim() ||
    "user"
  ).trim();
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function UserAvatar({
  name,
  email,
  userId,
  avatarUrl,
  size = "md",
  className,
  iconClassName,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const src = useMemo(
    () =>
      buildUserAvatarUrl({
        avatarUrl,
        name,
        email,
        userId,
      }),
    [avatarUrl, name, email, userId],
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-linear-to-r from-purple-600 to-indigo-600 flex items-center justify-center",
        containerSizeClasses[size],
        className,
      )}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={name ? `${name} avatar` : "User avatar"}
          fill
          unoptimized
          className="object-cover"
          onError={() => setImageError(true)}
          sizes="64px"
        />
      ) : (
        <UserIcon
          className={cn(iconSizeClasses[size], "text-white", iconClassName)}
        />
      )}
    </div>
  );
}
