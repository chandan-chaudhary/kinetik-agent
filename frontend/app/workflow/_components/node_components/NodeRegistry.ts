import { NodeType } from "@/lib/types/types";
import { Database, Loader2, Settings, ShipWheel } from "lucide-react";

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
  // {
  //   type: NodeType.JOB_BOT_TRIGGER,
  //   label: "Job Bot Trigger",
  //   description: "Trigger workflow based on job bot events",
  //   icon: BotIcon,
  // },

  // {
  //   type: NodeType.TRADING_PRICE_TRIGGER,
  //   label: "Trading Price Trigger",
  //   description: "Trigger workflow on trading price changes",
  //   icon: DollarSign,
  // },
  // {
  //   type: NodeType.TRADING_TIME_TRIGGER,
  //   label: "Trading Time Trigger",
  //   description: "Trigger workflow at specific trading times",
  //   icon: Clock,
  // },
];

export const actionNode: NodeTypeOptions[] = [
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
];
