# Architecture Guide: Dynamic Workflow System

## Overview

This document explains how the frontend workflow builder connects to the backend LangGraph execution system.

## Current Backend Architecture

### 1. **Hardcoded Graph (llm.service.ts)**

Currently, the backend has a **hardcoded** LangGraph workflow:

```typescript
initGraph() {
  const graph = new StateGraph(stateSchema)
    .addNode('schema', this.nodesService.getSchemaNode())
    .addNode('sqlGenerator', this.nodesService.getSQLGeneratorNode(this.LLM))
    .addNode('sqlExecutor', this.nodesService.getSQLExecutorNode(this.LLM))
    .addNode('approval', this.nodesService.approvalNode())
    .addEdge(START, 'schema')
    .addEdge('schema', 'sqlGenerator')
    .addEdge('sqlGenerator', 'sqlExecutor')
    .addConditionalEdges('sqlExecutor', ...)
    .compile({ checkpointer: this.checkpointer, interruptBefore: ['approval'] });
}
```

**The Workflow Flow:**

```
START → schema → sqlGenerator → sqlExecutor → approval → END
                                       ↓
                                (if error: retry sqlGenerator)
```

### 2. **Nodes Explained** (nodes.service.ts)

Each node is a function that processes state:

#### **Schema Node**

- **Purpose**: Fetch database schema
- **Config Needed**: Database connection string
- **Input**: User query
- **Output**: Database schema string

#### **SQL Generator Node**

- **Purpose**: Generate SQL from user query using LLM
- **Config Needed**:
  - `model`: LLM model name
  - `temperature`: LLM temperature
  - `systemPrompt`: Custom system prompt
  - `maxAttempts`: Max retry attempts
- **Input**: User query + DB schema
- **Output**: Generated SQL query

#### **SQL Executor Node**

- **Purpose**: Execute SQL and format results
- **Config Needed**: Database connection (uses same as schema)
- **Input**: Generated SQL
- **Output**: Query results

#### **Approval Node**

- **Purpose**: Human-in-the-loop validation
- **Config Needed**: None (always needed)
- **Input**: Generated SQL + Results
- **Output**: Approval decision (approved/rejected with feedback)

### 3. **Current API Endpoints** (app.controller.ts)

```typescript
// Execute the hardcoded workflow
POST /query-llm
Body: { prompt: string }
Response: {
  interrupted?: true,
  threadId: string,
  context: {...},
  state: {...}
} OR {
  completed: true,
  threadId: string,
  content: string
}

// Resume after approval
POST /approve
Body: { threadId: string, approved: boolean, feedback?: string }
Response: { completed: true, threadId: string, content: string }
```

---

## Proposed Dynamic Architecture

### Goal: User Creates Workflow in Frontend → Backend Executes It

### Architecture Changes Needed

#### **1. Frontend Node Configuration**

Each frontend node should have:

```typescript
type NodeConfig = {
  id: string; // Unique node ID
  type: string; // "schema" | "sqlGenerator" | "sqlExecutor" | "approval"
  position: { x; y }; // For React Flow
  config: {
    // Node-specific configuration
    // For schema node:
    databaseUrl?: string;

    // For sqlGenerator node:
    model?: string;
    temperature?: number;
    systemPrompt?: string;
    maxAttempts?: number;

    // For sqlExecutor node:
    // (uses same DB as schema)

    // For approval node:
    // (no config needed)
  };
};
```

#### **2. Workflow Definition**

```typescript
type WorkflowDefinition = {
  id: string;
  name: string;
  nodes: NodeConfig[];
  edges: Array<{
    id: string;
    source: string; // source node ID
    target: string; // target node ID
  }>;
};
```

#### **3. Backend Changes**

**A. New Workflow Execution Service**

Create a new service that builds graphs dynamically:

```typescript
// backend/src/workflow/workflow-executor.service.ts
@Injectable()
export class WorkflowExecutorService {
  async buildGraph(workflowDef: WorkflowDefinition): StateGraph {
    const graph = new StateGraph(stateSchema);

    // Add nodes based on workflow definition
    for (const node of workflowDef.nodes) {
      switch (node.type) {
        case "schema":
          graph.addNode(node.id, this.createSchemaNode(node.config));
          break;
        case "sqlGenerator":
          graph.addNode(node.id, this.createSqlGeneratorNode(node.config));
          break;
        case "sqlExecutor":
          graph.addNode(node.id, this.createSqlExecutorNode(node.config));
          break;
        case "approval":
          graph.addNode(node.id, this.nodesService.approvalNode());
          break;
      }
    }

    // Add edges
    for (const edge of workflowDef.edges) {
      graph.addEdge(edge.source, edge.target);
    }

    return graph.compile({
      checkpointer: new MemorySaver(),
      interruptBefore: ["approval"],
    });
  }

  private createSchemaNode(config: any) {
    // Create schema node with custom DB URL from config
    return async (state) => {
      const dbSchema = await getDbSchema(config.databaseUrl);
      return { dbSchema };
    };
  }

  private createSqlGeneratorNode(config: any) {
    // Create LLM instance with config
    const llm = new ChatOllama({
      model: config.model || "llama3",
      temperature: config.temperature || 0.7,
    });

    return this.nodesService.getSQLGeneratorNode(llm);
  }
}
```

**B. New API Endpoints**

```typescript
// backend/src/workflow/workflow.controller.ts

@Controller("workflow")
export class WorkflowController {
  // Save workflow (already exists)
  @Post()
  async create(@Body() workflow: WorkflowDefinition) {
    return this.workflowService.create(workflow);
  }

  // Execute a saved workflow
  @Post(":workflowId/execute")
  async execute(
    @Param("workflowId") workflowId: string,
    @Body() body: { prompt: string },
  ) {
    // 1. Load workflow from DB
    const workflow = await this.workflowService.findOne(workflowId);

    // 2. Build dynamic graph
    const graph = await this.executorService.buildGraph(workflow);

    // 3. Execute
    const threadId = `exec_${Date.now()}`;
    const result = await graph.invoke(
      { messages: [new HumanMessage(body.prompt)], userQuery: body.prompt },
      { configurable: { thread_id: threadId } },
    );

    return result;
  }

  // Resume execution (approval)
  @Post("execution/:threadId/approve")
  async approve(
    @Param("threadId") threadId: string,
    @Body() body: { approved: boolean; feedback?: string; workflowId: string },
  ) {
    // Rebuild graph and resume
    const workflow = await this.workflowService.findOne(body.workflowId);
    const graph = await this.executorService.buildGraph(workflow);

    const result = await graph.invoke(
      new Command({
        resume: { approved: body.approved, feedback: body.feedback },
      }),
      { configurable: { thread_id: threadId } },
    );

    return result;
  }
}
```

---

## Frontend Implementation

### 1. **Node Configuration Forms**

Each node type has its own configuration form:

**SQL Generator Node** (already created):

```tsx
<Form>
  <FormField name="model">
    <Select>
      <SelectItem value="gpt-4">GPT-4</SelectItem>
      <SelectItem value="llama3">Llama 3</SelectItem>
    </Select>
  </FormField>
  <FormField name="temperature">
    <Input type="number" min="0" max="2" />
  </FormField>
  <FormField name="systemPrompt">
    <Textarea />
  </FormField>
  <FormField name="maxAttempts">
    <Input type="number" min="1" max="10" />
  </FormField>
</Form>
```

**Schema Node** (needs to be created):

```tsx
<Form>
  <FormField name="databaseUrl">
    <Input type="text" placeholder="postgresql://..." />
  </FormField>
</Form>
```

**SQL Executor Node** - No config needed (uses schema node's DB)

**Approval Node** - No config needed (always interrupts)

### 2. **Save Workflow**

```typescript
const saveWorkflow = async (nodes: Node[], edges: Edge[]) => {
  const workflow = {
    name: workflowName,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      config: n.data.config, // From the form
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };

  await axios.post("/workflow", workflow);
};
```

### 3. **Execute Workflow (Chat Interface)**

```typescript
const executeWorkflow = async (workflowId: string, prompt: string) => {
  const response = await axios.post(`/workflow/${workflowId}/execute`, {
    prompt,
  });

  if (response.data.interrupted) {
    // Show approval UI
    setApprovalContext({
      threadId: response.data.threadId,
      sql: response.data.context.generatedSql,
      results: response.data.context.queryResult,
    });
  } else {
    // Show final result
    setFinalResult(response.data.content);
  }
};

const approveQuery = async (approved: boolean, feedback?: string) => {
  const response = await axios.post(
    `/workflow/execution/${approvalContext.threadId}/approve`,
    {
      approved,
      feedback,
      workflowId: currentWorkflowId,
    },
  );

  setFinalResult(response.data.content);
};
```

---

## Data Flow Example

### User Creates Workflow:

1. **Frontend**: User drags nodes onto canvas
   - Schema Node → SQL Generator → SQL Executor → Approval
2. **Frontend**: User configures each node:
   - Schema: `databaseUrl: "postgresql://..."`
   - SQL Generator: `model: "gpt-4", temperature: 0.1, ...`
3. **Frontend**: Saves workflow via `POST /workflow`
4. **Backend**: Stores in Prisma DB

### User Executes Workflow (Chat):

1. **Frontend**: User types "Show me all users"
2. **Frontend**: `POST /workflow/{id}/execute` with prompt
3. **Backend**:
   - Loads workflow from DB
   - Builds dynamic LangGraph from node configs
   - Executes: schema → sqlGenerator → sqlExecutor
   - Interrupts at approval node
4. **Backend**: Returns `{ interrupted: true, threadId, context: { sql, results } }`
5. **Frontend**: Shows approval dialog with SQL and preview
6. **User**: Clicks "Approve" or "Reject with feedback"
7. **Frontend**: `POST /workflow/execution/{threadId}/approve`
8. **Backend**: Resumes graph execution
9. **Backend**: Returns final formatted answer
10. **Frontend**: Displays result to user

---

## Implementation Checklist

### Backend Tasks:

- [ ] Create `WorkflowExecutorService` with dynamic graph building
- [ ] Add `POST /workflow/:id/execute` endpoint
- [ ] Add `POST /workflow/execution/:threadId/approve` endpoint
- [ ] Modify schema functions to accept custom DB URL
- [ ] Store workflow configs in Prisma DB (already exists)

### Frontend Tasks:

- [x] SQL Generator config form (✓ Done)
- [ ] Schema Node config form (DB URL)
- [ ] SQL Executor Node (no config)
- [ ] Approval Node (no config)
- [ ] Workflow save functionality
- [ ] Chat interface component
- [ ] Approval dialog UI
- [ ] API integration for execute & approve

---

## Current vs Proposed

| Aspect           | Current                       | Proposed                     |
| ---------------- | ----------------------------- | ---------------------------- |
| Graph Definition | Hardcoded in `llm.service.ts` | User-defined in frontend     |
| Node Config      | Environment variables         | Per-node config in UI        |
| Flexibility      | Fixed workflow                | Any workflow combination     |
| Execution        | `POST /query-llm`             | `POST /workflow/:id/execute` |
| Storage          | No storage                    | Workflows saved in DB        |

---

## Next Steps

1. **Start with Backend**: Create `WorkflowExecutorService` to build dynamic graphs
2. **Update API**: Add execution endpoints that accept workflow ID
3. **Frontend**: Create config forms for remaining nodes
4. **Chat UI**: Build chat interface that executes workflows
5. **Test**: End-to-end test with custom workflow

Would you like me to implement any of these components?
