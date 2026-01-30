import Link from "next/link";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";

export type EntityHeaderProps = {
  title: string;
  description?: string;
  newButtonLabel?: string;
  isCreating?: boolean;
  isDisabled?: boolean;
} & (
  | { onNew: () => void; newButtonHref?: never }
  | { newButtonHref: string; onNew?: never }
  | { onNew?: never; newButtonHref?: never }
);
export default function EntityHeader({
  title,
  description,
  newButtonLabel,
  isCreating,
  isDisabled,
  onNew,
  newButtonHref,
}: EntityHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b pb-2">
      <div className="px-4">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {onNew && !newButtonHref ? (
        <Button onClick={onNew} disabled={isDisabled || isCreating}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {newButtonLabel || "New"}
        </Button>
      ) : null}
      {newButtonHref && !onNew ? (
        <Button disabled={isDisabled || isCreating}>
          <Link href={newButtonHref}>
            <PlusIcon className="mr-2 h-4 w-4" />
            {newButtonLabel || "New"}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
