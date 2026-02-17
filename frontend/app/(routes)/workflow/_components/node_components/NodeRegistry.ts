import { NodeType } from "@/lib/types/types";
import {
  Database,
  GitBranch,
  Loader2,
  SearchCodeIcon,
  Settings,
  ShipWheel,
  User,
  Waypoints,
} from "lucide-react";

export type NodeTypeOptions = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

export const triggerNode: NodeTypeOptions[] = [
  // {
  //   type:NodeType.INITIAL,
  //   label: "Initial Node",
  //   description: "Start creating your workflow",
  //   icon: MouseIcon,
  // },

  {
    type: NodeType.SQL_QUERY_TRIGGER,
    label: "SQL Query Trigger",
    description: "Trigger workflow based on SQL query events",
    icon: Database,
  },

  {
    type: NodeType.MARKET_RESEARCH_TRIGGER,
    label: "Market Research Trigger",
    description: "Trigger workflow on market research events",
    icon: SearchCodeIcon,
  },
  // {
  //   type: NodeType.TRADING_TIME_TRIGGER,
  //   label: "Trading Time Trigger",
  //   description: "Trigger workflow at specific trading times",
  //   icon: Clock,
  // },
];

export const actionNode: NodeTypeOptions[] = [
  {
    type: NodeType.CONDITION,
    label: "Condition",
    description: "Branch workflow based on a condition (if/else)",
    icon: GitBranch,
  },
  // {
  //   type: NodeType.SHOULD_CONTINUE,
  //   label: "Conditional Node",
  //   description: "Route workflow based on conditions",
  //   icon: Waypoints,
  // },
 {
    type: NodeType.APPROVAL,
    label: "Approval",
    description: "Require human approval before continuing",
    icon: User, // You can change this icon
  },
  {
    type: NodeType.LLM_NODE,
    label: "LLM Node",
    description: "Integrate Large Language Models into your workflow",
    icon: ShipWheel,
  },
  {
    type: NodeType.SQL_GENERATOR_ACTION,
    label: "SQL Generator Action",
    description: "Generate SQL statements dynamically",
    icon: Settings,
  },
  {
    type: NodeType.SQL_EXECUTOR_ACTION,
    label: "SQL Executor Action",
    description: "Run SQL commands against a database",
    icon: Loader2,
  },


// MARKET RESEARCH ACTION NODES
  {
    type: NodeType.ASSET_DATA_ACTION,
    label: "Asset Data Action",
    description: "Fetch and process asset data for market research",
    icon: Database, // You can change this icon
  },
  {
    type: NodeType.NEWS_DATA_ACTION,
    label: "News Data Action",
    description: "Fetch and analyze news data for market research",
    icon: SearchCodeIcon, // You can change this icon
  },
];
