# Implementation Plan: Dynamic Workflow System

## Quick Summary

**What you have now:**

- ✅ Backend with hardcoded SQL workflow (schema → generator → executor → approval)
- ✅ Frontend React Flow editor with visual nodes
- ✅ Workflow CRUD in database (save/load workflow structure)
- ❌ **Missing:** Connection between frontend configs and backend execution

**What you need:**

- Backend that reads workflow definition and builds LangGraph dynamically
- Frontend forms to configure each node (model, DB URL, etc.)
- API to execute workflows and handle chat

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Workflow Builder (React Flow)                           │
│     ┌──────────┐    ┌──────────────┐    ┌──────────────┐  │
│     │  Schema  │───▶│ SQL Generator│───▶│ SQL Executor │  │
│     │  Node    │    │   Node       │    │   Node       │  │
│     └──────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│     Config Form         Config Form         No Config       │
│   - DB URL            - model: "gpt-4"                      │
│                       - temp: 0.1                           │
│                       - systemPrompt                        │
│                       - maxAttempts: 3                      │
│                                                              │
│  2. Save Workflow                                           │
│     POST /workflow → { name, nodes[], edges[] }             │
│                                                              │
│  3. Chat Interface                                          │
│     Input: "Show all users"                                 │
│     POST /workflow/{id}/execute → Execute                   │
│                                                              │
│  4. Approval Dialog (on interrupt)                          │
│     Shows: Generated SQL + Results Preview                  │
│     Action: Approve / Reject with feedback                  │
│     POST /workflow/execution/{threadId}/approve             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. WorkflowService (Prisma)                                │
│     - create(workflow)   ✅ Already exists                  │
│     - findOne(id)        ✅ Already exists                  │
│     - update(id, data)   ✅ Already exists                  │
│                                                              │
│  2. WorkflowExecutorService  ⚠️ NEW - To be created         │
│     buildGraph(workflowDef):                                │
│       - Read nodes from workflow                            │
│       - For each node, create LangGraph node with config    │
│       - Connect edges                                       │
│       - Return compiled graph                               │
│                                                              │
│     Example:                                                │
│     ┌────────────────────────────────────────────┐         │
│     │  const graph = new StateGraph(stateSchema) │         │
│     │  for (node of workflow.nodes) {            │         │
│     │    if (node.type === 'sqlGenerator') {     │         │
│     │      const llm = new ChatOllama({          │         │
│     │        model: node.config.model,           │         │
│     │        temperature: node.config.temperature│         │
│     │      });                                    │         │
│     │      graph.addNode(node.id, createNode(llm))│        │
│     │    }                                         │         │
│     │  }                                           │         │
│     │  return graph.compile();                    │         │
│     └────────────────────────────────────────────┘         │
│                                                              │
│  3. API Endpoints                                           │
│     POST /workflow/:id/execute                              │
│       → Load workflow from DB                               │
│       → Build dynamic graph                                 │
│       → Execute with user prompt                            │
│       → Return result or interrupt                          │
│                                                              │
│     POST /workflow/execution/:threadId/approve              │
│       → Load workflow from DB                               │
│       → Rebuild graph (to resume)                           │
│       → Send approval command                               │
│       → Return final result                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: Backend - Dynamic Graph Builder

#### Step 1.1: Create WorkflowExecutorService

```bash
# Create the service
cd backend/src
mkdir workflow-executor
cd workflow-executor
touch workflow-executor.service.ts
```

**File:** `backend/src/workflow-executor/workflow-executor.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { StateGraph, START, MemorySaver } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { stateSchema } from "src/config/schemas";
import { NodesService } from "src/nodes/nodes.service";

interface WorkflowNode {
  id: string;
  type: string;
  config: any;
}

interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: Array<{ source: string; target: string }>;
}

@Injectable()
export class WorkflowExecutorService {
  constructor(private nodesService: NodesService) {}

  async buildGraph(workflow: WorkflowDefinition) {
    const graph = new StateGraph(stateSchema);

    // Add nodes
    for (const node of workflow.nodes) {
      const graphNode = await this.createNode(node);
      graph.addNode(node.id, graphNode);
    }

    // Add edges
    for (const edge of workflow.edges) {
      if (edge.source === "START") {
        graph.addEdge(START, edge.target);
      } else {
        graph.addEdge(edge.source, edge.target);
      }
    }

    return graph.compile({
      checkpointer: new MemorySaver(),
      interruptBefore: workflow.nodes
        .filter((n) => n.type === "approval")
        .map((n) => n.id),
    });
  }

  private async createNode(node: WorkflowNode) {
    switch (node.type) {
      case "schema":
        return this.nodesService.getSchemaNode();

      case "sqlGenerator":
        const llm = new ChatOllama({
          model: node.config.model || "llama3",
          temperature: node.config.temperature || 0.7,
        });
        return this.nodesService.getSQLGeneratorNode(llm);

      case "sqlExecutor":
        const executorLlm = new ChatOllama({
          model: node.config.model || "llama3",
          temperature: 0.3,
        });
        return this.nodesService.getSQLExecutorNode(executorLlm);

      case "approval":
        return this.nodesService.approvalNode();

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }
}
```

#### Step 1.2: Update WorkflowController

Add execution endpoints to `backend/src/workflow/workflow.controller.ts`:

```typescript
import { WorkflowExecutorService } from "../workflow-executor/workflow-executor.service";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";

@Controller("workflow")
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly executorService: WorkflowExecutorService, // Add this
  ) {}

  // ... existing CRUD methods ...

  @Post(":id/execute")
  async execute(@Param("id") id: string, @Body() body: { prompt: string }) {
    const workflow = await this.workflowService.findOne(id);
    const graph = await this.executorService.buildGraph(workflow);

    const threadId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const result = await graph.invoke(
      {
        messages: [new HumanMessage(body.prompt)],
        userQuery: body.prompt,
        sqlAttempts: 0,
        approved: false,
      },
      { configurable: { thread_id: threadId } },
    );

    // Check if interrupted
    if (result.__interrupt__?.length > 0) {
      return {
        interrupted: true,
        threadId,
        context: result.__interrupt__[0].value,
      };
    }

    return {
      completed: true,
      threadId,
      content: result.messages[result.messages.length - 1].content,
    };
  }

  @Post("execution/:threadId/approve")
  async approve(
    @Param("threadId") threadId: string,
    @Body()
    body: {
      workflowId: string;
      approved: boolean;
      feedback?: string;
    },
  ) {
    const workflow = await this.workflowService.findOne(body.workflowId);
    const graph = await this.executorService.buildGraph(workflow);

    const result = await graph.invoke(
      new Command({
        resume: {
          approved: body.approved,
          feedback: body.feedback,
        },
      }),
      { configurable: { thread_id: threadId } },
    );

    return {
      completed: true,
      content: result.messages[result.messages.length - 1].content,
    };
  }
}
```

#### Step 1.3: Update Module

```typescript
// backend/src/workflow/workflow.module.ts
import { WorkflowExecutorService } from "../workflow-executor/workflow-executor.service";
import { NodesModule } from "../nodes/nodes.module";

@Module({
  imports: [NodesModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowExecutorService],
})
export class WorkflowModule {}
```

---

### Phase 2: Frontend - Node Configuration Forms

#### Step 2.1: Schema Node Config Form

Create `frontend/components/sql-components/sql-trigger/schemaNode.tsx`:

```tsx
import { memo, useState } from "react";
import { BaseTriggerNode } from "../../base-trigger-node";
import { Node, NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import SqlDialog from "./sqlDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schemaConfigSchema = z.object({
  databaseUrl: z.string().url("Must be a valid database URL").optional(),
});

type SchemaNodeData = z.infer<typeof schemaConfigSchema> & {
  [key: string]: unknown;
};

export const SchemaNode = memo((props: NodeProps<Node<SchemaNodeData>>) => {
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<z.infer<typeof schemaConfigSchema>>({
    resolver: zodResolver(schemaConfigSchema),
    defaultValues: {
      databaseUrl: props.data.databaseUrl || "",
    },
  });

  function onSubmit(values: z.infer<typeof schemaConfigSchema>) {
    // TODO: Update node data
    console.log(values);
    setOpenDialog(false);
  }

  return (
    <>
      <SqlDialog open={openDialog} onOpenChange={setOpenDialog}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="databaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="postgresql://user:pass@host:port/db"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </SqlDialog>
      <BaseTriggerNode
        {...props}
        name="Schema Node"
        description="Fetch database schema"
        icon={Database}
        onSettings={() => setOpenDialog(true)}
        onDoubleClick={() => setOpenDialog(true)}
      />
    </>
  );
});
```

#### Step 2.2: Update SQL Executor Node

No config form needed, just update the component:

```tsx
// frontend/components/sql-components/sql-action/sqlExecutorNode.tsx
export const SqlExecutorNode = memo((props: NodeProps<SqlExecutorNodeType>) => {
  return (
    <BaseActionNode
      {...props}
      name="SQL Executor"
      description="Execute SQL queries"
      icon={Database}
      status="idle"
      // No settings needed
    />
  );
});
```

---

### Phase 3: Frontend - Chat Interface

#### Step 3.1: Create Chat Component

Create `frontend/app/workflow/[workflowId]/chat/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { API_BASE_URL } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: { workflowId: string };
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [approvalContext, setApprovalContext] = useState<any>(null);

  const executeWorkflow = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/workflow/${params.workflowId}/execute`,
        { prompt },
      );

      if (res.data.interrupted) {
        setApprovalContext(res.data);
      } else {
        setMessages([
          ...messages,
          { role: "assistant", content: res.data.content },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleApprove = async (approved: boolean, feedback?: string) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/workflow/execution/${approvalContext.threadId}/approve`,
        { workflowId: params.workflowId, approved, feedback },
      );

      setMessages([
        ...messages,
        { role: "assistant", content: res.data.content },
      ]);
      setApprovalContext(null);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <Card key={i} className="mb-4 p-4">
            <strong>{msg.role}:</strong> {msg.content}
          </Card>
        ))}

        {approvalContext && (
          <Card className="p-4 border-yellow-500">
            <h3 className="font-bold mb-2">Approval Required</h3>
            <p className="mb-2">
              <strong>SQL:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded mb-4">
              {approvalContext.context.generatedSql}
            </pre>
            <p className="mb-2">
              <strong>Results:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded mb-4">
              {JSON.stringify(approvalContext.context.queryResult, null, 2)}
            </pre>
            <div className="flex gap-2">
              <Button onClick={() => handleApprove(true)}>Approve</Button>
              <Button
                variant="destructive"
                onClick={() => handleApprove(false, "Regenerate")}
              >
                Reject
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e) => e.key === "Enter" && executeWorkflow()}
        />
        <Button onClick={executeWorkflow}>Send</Button>
      </div>
    </div>
  );
}
```

---

## Testing Flow

1. **Create Workflow**:
   - Go to `/workflow`
   - Create new workflow
   - Add nodes: Schema → SQL Generator → SQL Executor → Approval
   - Configure SQL Generator (model, temperature, etc.)
   - Save

2. **Execute**:
   - Go to `/workflow/{id}/chat`
   - Type: "Show me all users"
   - System executes workflow
   - Approval dialog appears

3. **Approve**:
   - Review SQL and results
   - Click "Approve"
   - Get final formatted answer

---

## Summary

**Current State:**

- Backend: Hardcoded graph ✅
- Frontend: Visual editor ✅
- Missing: Dynamic execution ❌

**After Implementation:**

- Backend: Builds graphs from user-defined workflows ✅
- Frontend: Configures nodes + executes via chat ✅
- Fully dynamic system ✅
