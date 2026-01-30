import { ValueOf } from "next/dist/shared/lib/constants";
import { TimerNodeMetadata } from "./triggers/Timer";
import { PriceNodeMetadata } from "./triggers/Price";
import { SUPPORTED_TYPE } from "./ActionSheet";
import { SUPPORTED_ASSET } from "./TriggerSheet";

export type TradingMetadata = {
  type: typeof SUPPORTED_TYPE;
  quantity: number;
  symbol: typeof SUPPORTED_ASSET;
};

export type NodeMetadata =
  | TimerNodeMetadata
  | PriceNodeMetadata
  | TradingMetadata;

export enum NodeKind {
  Price = "price-trigger",
  Time = "timer",
  DeltaExchange = "delta-exchange",
  Binance = "binance",
}
export type NodeKindType = ValueOf<typeof NodeKind>;

