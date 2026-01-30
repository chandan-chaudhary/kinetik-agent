"use client";
import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Controls,
  MiniMap,
  Background,
  Connection,
  Node,
  Edge,
  Panel,
} from "@xyflow/react";
import {
  Node as CustomNode,
  Connection as CustomConnection,
} from "@/lib/types/types";

import "@xyflow/react/dist/style.css";
import { useWorkflowById } from "@/hooks/useWorkflow";
import { nodeComponents } from "./node-components";
import { AddNodeButton } from "./add-node-button";

export default function Editor({ workflowId }: { workflowId: string }) {
  const { data: workflow } = useWorkflowById(workflowId);
  console.log(workflow);

  // derive nodes/edges from fetched workflow with safe defaults
  const workFlowNodes: Node[] = (workflow?.nodes || []).map(
    (nodeData: CustomNode) => ({
      id: String(nodeData.id),
      type: nodeData.type as string,
      position: (nodeData.position as { x: number; y: number }) || {
        x: 0,
        y: 0,
      },
      data: (nodeData.data as Record<string, unknown>) || {},
    }),
  );

  const workFlowEdges: Edge[] = (workflow?.connections || []).map(
    (conn: CustomConnection) => ({
      id: String(conn.id),
      source: String(conn.fromNodeId),
      target: String(conn.toNodeId),
      sourceHandle: conn.fromOutput,
      targetHandle: conn.toInput,
    }),
  );

  // local state initialised empty; sync when `workflow` changes
  const [nodes, setNodes] = useState<Node[]>(workFlowNodes);
  const [edges, setEdges] = useState<Edge[]>(workFlowEdges);

  useEffect(() => {
    // only update when actual data arrives
    if (workflow) {
      setNodes(workFlowNodes);
      setEdges(workFlowEdges);
    }
  }, [workflow]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodeSnapShot) => applyNodeChanges(changes, nodeSnapShot)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgeSnapShot) => applyEdgeChanges(changes, edgeSnapShot)),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgeSnapShot) => addEdge(params, edgeSnapShot)),
    [],
  );

  return (
    <div className="w-full h-full mx-auto">
      {/* Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        fitView
      >
        <Background color="#aaa" gap={20} />
        <Controls />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
