import { Handle, Position } from "@xyflow/react";

export type PriceNodeMetadata = {
  asset: string;
  price: number;
};
export function PriceTriggerComponent({
  data,
}: // isConnectable,
{
  data: { metadata: PriceNodeMetadata };
  isConnectable: boolean;
}) {
  return (
    <div className="border-2 border-green-500 bg-linear-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <strong className="text-sm font-bold text-green-800 dark:text-green-200">
          Price Trigger
        </strong>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Asset
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.metadata.asset}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Price
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            ${data.metadata.price}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right}></Handle>
    </div>
  );
}
