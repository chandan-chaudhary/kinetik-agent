import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "./InitialNode";

export const nodeComponents = {
  INITIAL: InitialNode,
} as const satisfies NodeTypes;

export type NodeComponentType = keyof typeof nodeComponents;
