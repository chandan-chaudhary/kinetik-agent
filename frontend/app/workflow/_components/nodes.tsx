"use client";
import { useState, useCallback } from "react";
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
} from "@xyflow/react";
import {
  NodeData,
  NodeTemplate,
  WorkflowDomain,
} from "@/lib/types/workflow.types";
import { NodeCatalog } from "@/components/workflow/NodeCatalog";
import { NodeConfigPanel } from "@/components/workflow/NodeConfigPanel";
import { Button } from "@/components/ui/button";
// import { executeWorkflow, saveWorkflow } from "@/lib/api/workflow.api";
import "@xyflow/react/dist/style.css";
import { GenericNodeComponent } from "./InitialNode";
import { executeWorkflow } from "@/hooks/workflow.api";

export type NodeType = Node<NodeData>;
export type EdgeType = Edge;
// Generic node component that displays config

const nodeTypes = {
  generic: GenericNodeComponent,
};

export default function DynamicWorkflowBuilder() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NodeTemplate | null>(
    null,
  );
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("My Workflow");

  const [executing, setExecuting] = useState(false);
  console.log(nodes, edges, "in main page..");

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<EdgeType>[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  const handleSelectNode = (template: NodeTemplate) => {
    setSelectedTemplate(template);
    setEditingNodeId(null);
    setConfigPanelOpen(true);
  };

  const handleSaveConfig = (config: Record<string, any>) => {
    if (!selectedTemplate) return;

    if (editingNodeId) {
      // Update existing node
      setNodes((nds) =>
        nds.map((node) =>
          node.id === editingNodeId
            ? { ...node, data: { ...node.data, config } }
            : node,
        ),
      );
      setEditingNodeId(null);
    } else {
      console.log(config, "in create new node");

      // Add new node
      const newNode: NodeType = {
        id: `node-${Date.now()}`,
        type: "generic",
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          kind: selectedTemplate.kind,
          label: selectedTemplate.name,
          type: selectedTemplate.fullType,
          icon: selectedTemplate.icon,
          config: config,
          template: selectedTemplate,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    }

    setSelectedTemplate(null);
  };

  const handleNodeDoubleClick = (_event: React.MouseEvent, node: NodeType) => {
    setEditingNodeId(node.id);
    setSelectedTemplate(node.data.template);
    setConfigPanelOpen(true);
  };

  async function handleExecuteWorkflow() {
    setExecuting(true);

    try {
      const workflowDefinition = {
        name: workflowName,
        // domain: ,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          position: node.position,
          config: node.data.config,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          // condition: edge.condition,
        })),
      };

      console.log("Executing workflow:", workflowDefinition);
      const result = await executeWorkflow(workflowDefinition);
      console.log("Workflow execution result:", result);
    } catch (error) {
      console.error("Error executing workflow:", error);
    } finally {
      setExecuting(false);
    }
  }
  console.log(editingNodeId);

  return (
    <div className="w-screen h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold border-none outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCatalogOpen(true)} variant="outline">
            + Add Node
          </Button>
          <Button variant="outline">Save Workflow</Button>
          <Button onClick={handleExecuteWorkflow} disabled={executing}>
            {executing ? "Executing..." : "Execute Workflow"}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#aaa" gap={20} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Node Catalog */}
      <NodeCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onSelectNode={handleSelectNode}
      />

      {/* Node Config Panel */}
      <NodeConfigPanel
        key={editingNodeId ?? selectedTemplate?.id ?? "new"}
        open={configPanelOpen}
        template={selectedTemplate}
        initialConfig={
          editingNodeId
            ? nodes.find((n) => n.id === editingNodeId)?.data.config
            : undefined
        }
        onClose={() => {
          setConfigPanelOpen(false);
          setSelectedTemplate(null);
          setEditingNodeId(null);
        }}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
