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