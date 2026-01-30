"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

type HeaderButton = {
  text: string;
  onClick?: () => void;
  variant?: VariantProps<typeof Button>["variant"];
};

type HeaderProps = {
  title: string;
  description?: string;
  showSearch?: boolean;
  button?: HeaderButton;
  rightActions?: React.ReactNode;
};

export default function Header({
  title,
  description,
  showSearch,
  button,
  rightActions,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {showSearch ? (
          <input
            placeholder={`Search ${title.toLowerCase()}`}
            className="px-3 py-2 border rounded-md"
          />
        ) : null}

        {rightActions}

        {button ? (
          <Button variant={button.variant} onClick={button.onClick}>
            {button.text}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

