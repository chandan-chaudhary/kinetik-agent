import { Handle, Position } from "@xyflow/react";

export type TimerNodeMetadata = {
  time: number;
};
export function TimerTriggerComponent({
  data,
}: // isConnectable,
{
  data: { metadata: TimerNodeMetadata };
  isConnectable: boolean;
}) {
  return (
    <div className="border-2 border-purple-500 bg-linear-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <strong className="text-sm font-bold text-purple-800 dark:text-purple-200">
          Timer Trigger
        </strong>
      </div>

      <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Interval
        </div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {data.metadata.time}s
        </div>
      </div>
      <Handle type="source" position={Position.Right}></Handle>
    </div>
  );
}
