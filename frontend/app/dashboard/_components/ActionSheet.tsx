"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
import { NodeKind, NodeKindType, NodeMetadata, TradingMetadata } from "./types";
import { SUPPORTED_ASSET } from "./TriggerSheet";

export const SUPPORTED_ACTION = [
  {
    id: NodeKind.DeltaExchange,
    demat: NodeKind.DeltaExchange,
    description: "Place trade on Delta Exchange",
  },
  {
    id: NodeKind.Binance,
    demat: NodeKind.Binance,
    description: "Place trade on Binance",
  },
];
export const SUPPORTED_TYPE = ["LONG" , "SHORT"];

interface TriggerSheetProps {
  onSelect: (type: NodeKindType, metadata: NodeMetadata) => void;
}
export default function ActionSheet(props: TriggerSheetProps) {
  const [metadata, setMetadata] = useState<Partial<TradingMetadata>>({});
  const [selectedAction, setSelectedAction] = useState<NodeKind | null>(
    SUPPORTED_ACTION[0].demat as NodeKind
  );
  return (
    <Sheet open={true}>
      {/* <SheetTrigger asChild>
        <Button variant="outline">Open</Button>
      </SheetTrigger> */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Select a action</SheetTitle>
          <SheetDescription>
            Select a action to start creating your workflow.
            <Select
              value={selectedAction as string}
              onValueChange={(value) => setSelectedAction(value as NodeKind)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a action" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Actions</SelectLabel>
                  {SUPPORTED_ACTION.map((trigger) => (
                    <SelectItem key={trigger.id} value={trigger.demat}>
                      {trigger.demat}
                      <p>{trigger.description}</p>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SheetDescription>
          {(selectedAction === NodeKind.DeltaExchange ||
            selectedAction === NodeKind.Binance) && (
              <div>
                <div>
                  <Select
                    value={metadata?.symbol?.[0]}
                    onValueChange={(value) =>
                      setMetadata((prev) => ({
                        ...(prev as Partial<TradingMetadata>),
                        symbol: [value],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a asset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Assets</SelectLabel>
                        {SUPPORTED_ASSET.map((asset) => (
                          <SelectItem key={asset} value={asset}>
                            {asset}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    value={
                      (metadata as Partial<TradingMetadata>).quantity ?? ""
                    }
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        ...(prev as Partial<TradingMetadata>),
                        quantity: parseInt(e.target.value),
                      }))
                    }
                  />
                  <div>
                    <Select
                      value={metadata?.type?.[0]}
                      onValueChange={(value) =>
                        setMetadata((prev) => ({
                          ...(prev as Partial<TradingMetadata>),
                          type: [value],
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Types</SelectLabel>
                          {SUPPORTED_TYPE.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
        </SheetHeader>
        <SheetFooter>
          <Button
            onClick={() => props.onSelect(selectedAction as NodeKindType, metadata as NodeMetadata)}
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
