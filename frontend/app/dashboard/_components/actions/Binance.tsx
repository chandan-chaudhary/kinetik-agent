import { Handle, Position } from "@xyflow/react";
import { ExchangeProps } from "./DeltaExchange";


export default function BinanceExchange(props: ExchangeProps) {
  return (
    <div className="border-2 border-yellow-500 bg-linear-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-lg shadow-md min-w-[200px]">
      <div className="flex items-center justify-between mb-3 gap-2">
        <strong className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
          Binance Action
        </strong>
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
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
