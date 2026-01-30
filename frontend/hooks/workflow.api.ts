import axios from "axios";
import {
  NodeTemplate,
  NodeTemplatesGrouped,
  WorkflowDefinition,
} from "../lib/types/workflow.types";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/utils";


/**
 * Fetch all node templates grouped by domain
 */
export async function fetchNodeTemplates(): Promise<NodeTemplatesGrouped> {
  try {
    const response = await axios.get(`${API_BASE_URL}nodes`);
    if (!response) throw new Error("No response from server");
    if (response.status === 200 && response.data) {
      toast.success("Node templates fetched successfully");
      return response.data;
    }
  } catch (error) {
    console.log(error);
    toast.error("Failed to fetch node templates");
  }
}

/**
 * Fetch node templates by domain
 */
export async function fetchNodeTemplatesByDomain(
  domain: string,
): Promise<NodeTemplate[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}nodes`, {
      params: { domain },
    });
    if (!response) throw new Error("No response from server");
    if (response.status === 200 && response.data) {
      toast.success("Node fetched successfully");
      return response.data;
    }
  } catch (error) {
    console.log(error);
    toast.error(`Failed to fetch node templates for domain: ${domain}`);
  }
}

/**
 * Fetch all node templates as flat array
 */
export async function fetchAllNodeTemplates(): Promise<NodeTemplate[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}nodes/all`);
    if (!response) throw new Error("No response from server");
    if (response.status === 200 && response.data) {
      toast.success("All node templates fetched successfully");
      return response.data;
    }
  } catch (error) {
    toast.error("Failed to fetch all node templates");
    console.log(error);
  }
}

// In hooks/workflow.api.ts

export const executeWorkflow = async (data: WorkflowDefinition) => {
  try {
    const response = await axios.post(`${API_BASE_URL}workflow/execute`, data);
    if (!response) throw new Error("No response from server");
    if (response.status === 200 && response.data) {
      toast.success("Workflow executed successfully!");
      return response.data;
    }
  } catch (error) {
    toast.error("Failed to execute workflow.");
    console.log(error);
  }
};

export const saveWorkflow = async (data: WorkflowDefinition) => {
  try {
    const response = await axios.post(`${API_BASE_URL}workflow/save`, data);
    if (!response) throw new Error("No response from server");
    if (response.status === 200 && response.data) {
      toast.success("Workflow saved!");
      return response.data;
    }
  } catch (error) {
    toast.error("Failed to save workflow.");
    console.log(error);
  }
};
