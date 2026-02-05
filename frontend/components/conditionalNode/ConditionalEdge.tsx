import {
  EdgeProps,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
} from "@xyflow/react";
import { EdgeCondition } from "@/lib/types/types";

interface ConditionalEdgeData {
  condition?: EdgeCondition | null;
  priority?: number;
}

export function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
//   sourcePosition,
//   targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as ConditionalEdgeData;
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const getConditionLabel = (): string => {
    if (!edgeData?.condition) return "";

    const { field, operator, value } = edgeData.condition;

    // Create human-readable labels
    switch (operator) {
      case "exists":
        return `✓ ${field}`;
      case "not_exists":
        return `✗ ${field}`;
      case "eq":
        return `${field} = ${value}`;
      case "ne":
        return `${field} ≠ ${value}`;
      case "gt":
        return `${field} > ${value}`;
      case "lt":
        return `${field} < ${value}`;
      case "gte":
        return `${field} ≥ ${value}`;
      case "lte":
        return `${field} ≤ ${value}`;
      case "contains":
        return `${field} contains "${value}"`;
      case "starts_with":
        return `${field} starts with "${value}"`;
      case "ends_with":
        return `${field} ends with "${value}"`;
      default:
        return "";
    }
  };

  const label = getConditionLabel();
  const priority =
    edgeData?.priority !== undefined ? `[${edgeData.priority}]` : "";

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-md border border-primary/20"
          >
            {priority && <span className="mr-1 opacity-70">{priority}</span>}
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
