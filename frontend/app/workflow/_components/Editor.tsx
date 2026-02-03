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
  ReactFlowProvider,
} from "@xyflow/react";
import {
  Node as CustomNode,
  Connection as CustomConnection,
  Workflow,
  NodeType,
} from "@/lib/types/types";

import "@xyflow/react/dist/style.css";
import { useWorkflowById, useUpdateWorkflow } from "@/hooks/useWorkflow";
import { nodeComponents } from "./node_components/node-type-components";
import { AddNodeButton } from "./add-node-button";
import EntityHeader from "@/components/entity-header";
import { Save, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Editor({ workflowId }: { workflowId: string }) {
  const { data: workflow } = useWorkflowById(workflowId);
  const updateMutation = useUpdateWorkflow();
  const [isSaving, setIsSaving] = useState(false);
  console.log(workflow);

  // local state initialised empty; sync when `workflow` changes
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // only update when actual data arrives
    if (workflow) {
      // derive nodes/edges from fetched workflow with safe defaults
      const workFlowNodes: Node[] = (workflow.nodes || []).map(
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

      const workFlowEdges: Edge[] = (workflow.connections || []).map(
        (conn: CustomConnection) => ({
          id: String(conn.id),
          source: String(conn.fromNodeId),
          target: String(conn.toNodeId),
          sourceHandle: conn.fromOutput,
          targetHandle: conn.toInput,
        }),
      );

      setNodes(workFlowNodes);
      setEdges(workFlowEdges);
    }
  }, [workflow]);

  const saveWorkFLow = async () => {
    console.log("saving triggered");
    setIsSaving(true);
    const data: Partial<Workflow> = {
      nodes: nodes.map((node: Node) => ({
        id: node.id,
        workflowId: workflowId,
        type: node.type as NodeType,
        position: node.position,
        data: node.data || {},
      })) as unknown as Workflow["nodes"],
      connections: edges.map((edge) => ({
        workflowId: workflowId,
        fromNodeId: edge.source,
        toNodeId: edge.target,
        fromOutput: edge.sourceHandle || "main",
        toInput: edge.targetHandle || "main",
      })) as unknown as Workflow["connections"],
    };
    try {
      console.log(data);

      await updateMutation.mutateAsync({ id: workflowId, data });
    } catch (error) {
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="flex flex-col h-screen w-full">
      <EntityHeader
        title="Workflow Editor"
        description="Edit and connect nodes within your workflow"
        onNew={saveWorkFLow}
        newButtonLabel={isSaving ? "Saving..." : "Save"}
        isCreating={isSaving}
        icon={Save}
      >
        <Link href={`/workflow/${workflowId}/chat`}>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </Link>
      </EntityHeader>
      <div className="flex-1 workflow-canvas relative">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeComponents}
            fitView
            className="bg-muted/5"
            // defaultEdgeOptions={{
            //   animated: true,
            //   style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
            // }}
            snapGrid={[10, 10]}
            snapToGrid={true}
            panOnScroll={true}
            panOnDrag={false}
            selectionOnDrag={true}
          >
            <Background gap={16} size={1} />
            <Controls
            // className="!bg-card !border-border !shadow-lg !rounded-lg"
            // showInteractive={false}
            />
            <Panel position="top-right" className="m-4!">
              <AddNodeButton />
            </Panel>
            <MiniMap
              className="bg-card! border-border! shadow-lg! rounded-lg!"
              nodeColor={(node) => {
                if (node.type === "INITIAL")
                  return "hsl(var(--workflow-trigger))";
                if (node.type === "CONDITION")
                  return "hsl(var(--workflow-condition))";
                return "hsl(var(--workflow-action))";
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
