/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from "@xyflow/react";
import TriggerSheet from "./TriggerSheet";
import { PriceTriggerComponent } from "./triggers/Price";
import { NodeMetadata, NodeKind, NodeKindType } from "./types";
import { TimerTriggerComponent } from "./triggers/Timer";
import ActionSheet from "./ActionSheet";
import DeltaExchange from "./actions/DeltaExchange";
import BinanceExchange from "./actions/Binance";

// const initialNodes = [
//   { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
//   { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
// ];
// const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

const nodeTypes = {
  [NodeKind.Price]: PriceTriggerComponent,
  [NodeKind.Time]: TimerTriggerComponent,
  [NodeKind.DeltaExchange]: DeltaExchange,
  [NodeKind.Binance]: BinanceExchange, // Using same component for now
};

interface NodeType {
  id: string;
  position: { x: number; y: number };
  type: NodeKindType;
  data: {
    kind: "action" | "trigger";
    label: string;
    metadata: NodeMetadata;
  };
}

interface EdgeType {
  id: string;
  source: string;
  target: string;
}

export default function CreateWorkFlow() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [selectedAction, setSelectedAction] = useState<{
    startingNodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  const POSITION_OFFSET = 40;
  console.log(nodes, edges, selectedAction);

  const onNodesChange = useCallback(
    (changes: NodeChange<NodeType>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange<EdgeType>[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
  const onConnectEnd = useCallback((params: any, connectionInfo: any) => {
    console.log(connectionInfo);
    if (!connectionInfo?.isvalid) {
      setSelectedAction({
        startingNodeId: connectionInfo.fromNode.id,
        position: {
          x: connectionInfo.from.x + POSITION_OFFSET,
          y: connectionInfo.from.y + POSITION_OFFSET * 2,
        },
      });
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!nodes.length && (
        <TriggerSheet
          onSelect={(type, metadata) => {
            const newNode: NodeType = {
              id: `node-${nodes.length + 1}`,
              type,
              position: { x: 0, y: 0 },
              data: {
                kind: "trigger",
                label: type,
                metadata: metadata,
              },
            };
            setNodes((nds) => nds.concat(newNode));
          }}
        />
      )}
      {selectedAction && (
        <ActionSheet
          onSelect={(type, metadata) => {
            const newNode: NodeType = {
              id: `node-${nodes.length + 1}`,
              type,
              position: selectedAction.position,
              data: {
                kind: "action",
                label: type,
                metadata: metadata,
              },
            };
            setNodes((nds) => [...nds, newNode]); //nds.concat(newNode)
            const newEdge = {
              id: `${selectedAction.startingNodeId}-${newNode.id}`,
              source: selectedAction.startingNodeId,
              target: newNode.id,
            };
            setEdges((edge) => [...edge, newEdge]);
            setSelectedAction(null);
          }}
        />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        fitView
      >
        <Background color="#aaa" gap={20} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
