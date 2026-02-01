import { z } from "zod";

// Basic helpers
export const JsonSchema = z.any();
export const DateTimeSchema = z.string();

// NodeType as defined in frontend types
export const NodeTypeSchema = z.enum(["INITIAL"]);

export const UserSchema = z.object({
  id: z.string().optional(),
  profilePicture: z.string().url().optional(),
  email: z.email().optional(),
  name: z.string().optional(),
  password: z.string().optional(),
});

// Forward-declared lazy schemas for recursive relations
export const WorkflowSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    userId: z.string(),
    user: UserSchema.optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    nodes: z.array(NodeSchema),
    connections: z.array(ConnectionSchema).optional(),
    createdAt: DateTimeSchema.optional(),
    updatedAt: DateTimeSchema.optional(),
  }),
);

export const NodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    workflowId: z.string(),
    workflow: WorkflowSchema.optional(),
    type: NodeTypeSchema,
    position: JsonSchema,
    data: JsonSchema.optional(),
    outputConnections: z.array(ConnectionSchema).optional(),
    inputConnections: z.array(ConnectionSchema).optional(),
    createdAt: DateTimeSchema.optional(),
    updatedAt: DateTimeSchema.optional(),
  }),
);

export const ConnectionSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    workflowId: z.string(),
    workflow: WorkflowSchema.optional(),
    fromNodeId: z.string(),
    fromNode: NodeSchema.optional(),
    toNodeId: z.string(),
    toNode: NodeSchema.optional(),
    fromOutput: z.string().optional(),
    toInput: z.string().optional(),
    createdAt: DateTimeSchema.optional(),
    updatedAt: DateTimeSchema.optional(),
  }),
);


// Convenience: validation entrypoints
export const validateWorkflow = (data: unknown) => WorkflowSchema.parse(data);
export const validateNode = (data: unknown) => NodeSchema.parse(data);
export const validateConnection = (data: unknown) =>
  ConnectionSchema.parse(data);
