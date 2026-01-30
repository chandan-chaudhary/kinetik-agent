import { Handle, Position } from "@xyflow/react";
import { TradingMetadata } from "../types";


export interface ExchangeProps {
  data: {
    metadata: TradingMetadata;
  };
}

export default function DeltaExchange(props: ExchangeProps) {
  return (
    <div className="border-2 border-blue-500 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg shadow-md min-w-[200px]">
      <div className="flex items-center justify-between mb-3 gap-2">
        <strong className="text-sm font-bold text-blue-800 dark:text-blue-200">
          Delta Action
        </strong>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
          {props.data.metadata.type}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Symbol
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {props.data.metadata.symbol}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Quantity
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {props.data.metadata.quantity}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right}></Handle>
      <Handle type="target" position={Position.Left}></Handle>
    </div>
  );
}
