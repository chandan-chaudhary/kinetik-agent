import EntityHeader from "@/components/entity-header";
import Editor from "../_components/Editor";

type Props = {
  params: Promise<{ workflowId: string }>;
};
export default async function WorkflowPage({ params }: Props) {
  const { workflowId } = await params;
  return (
    <div className="w-full h-full">
      <EntityHeader title="Workflow Editor" /> 
      <Editor workflowId={workflowId} />
    </div>
  );
}
