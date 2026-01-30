"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NodeMetadata, NodeKind, NodeKindType } from "./types";
import { TimerNodeMetadata } from "./triggers/Timer";
import { PriceNodeMetadata } from "./triggers/Price";

export const SUPPORTED_TRIGGER = [
  {id: NodeKind.Price, title: NodeKind.Price, description: "Trigger based on price movements" },
  {id: NodeKind.Time, title: NodeKind.Time, description: "Trigger based on time intervals" },
];

export const SUPPORTED_ASSET = ["BTC", "ETH", "SOL"];

interface TriggerSheetProps {
  onSelect: (type: NodeKindType, metadata: NodeMetadata) => void;
}
export default function TriggerSheet(props: TriggerSheetProps) {
  const [metadata, setMetadata] = useState<
    TimerNodeMetadata | PriceNodeMetadata
  >({ time: 3600 } as TimerNodeMetadata);
  const [selectedTrigger, setSelectedTrigger] = useState<NodeKind | null>(
    SUPPORTED_TRIGGER[0].title as NodeKind
  );
  return (
    <Sheet open={true}>
      {/* <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger> */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Select a trigger</SheetTitle>
          <SheetDescription>
            Select a trigger to start creating your workflow.
            <Select
              value={selectedTrigger as string}
              onValueChange={(value) => setSelectedTrigger(value as NodeKind)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Triggers</SelectLabel>
                  {SUPPORTED_TRIGGER.map((trigger) => (
                    <SelectItem key={trigger.id} value={trigger.title}>
                      {trigger.title}
                      <p>{trigger.description}</p>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SheetDescription>
          {selectedTrigger === NodeKind.Time && (
            <Input
              type="number"
              value={(metadata as TimerNodeMetadata).time}
              onChange={(e) =>
                setMetadata({
                  time: parseInt(e.target.value),
                } as TimerNodeMetadata)
              }
            />
          )}
          {selectedTrigger === NodeKind.Price && (
            <>
              <Select
                value={(metadata as PriceNodeMetadata).asset ?? ""}
                onValueChange={(value) =>
                  setMetadata(
                    (m) => ({ ...m, asset: value } as PriceNodeMetadata)
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Triggers</SelectLabel>
                    {SUPPORTED_ASSET.map((asset) => (
                      <SelectItem key={asset} value={asset}>
                        {asset}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={(metadata as PriceNodeMetadata).price ?? ""}
                onChange={(e) =>
                  setMetadata(
                    (m) =>
                      ({
                        ...m,
                        price:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      } as PriceNodeMetadata)
                  )
                }
              />
            </>
          )}
        </SheetHeader>
        <SheetFooter>
          <Button
            onClick={() =>
              props.onSelect(selectedTrigger as NodeKindType, metadata)
            }
            type="submit"
          >
            Select Trigger
          </Button>
          {/* <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose> */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
