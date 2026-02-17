"use client";
import Editor from "../_components/Editor";
import { useParams } from "next/navigation";
export default function WorkflowPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  return <Editor workflowId={workflowId} />;
}
