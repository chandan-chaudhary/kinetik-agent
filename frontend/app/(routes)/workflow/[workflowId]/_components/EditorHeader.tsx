import EntityHeader from "@/components/entity-header";
import { Save } from "lucide-react";

export default function EditorHeader({
  disabled,
  onSave,
  isSaving,
}: {
  disabled?: boolean;
  onSave: () => void;
  isSaving?: boolean;
}) {
  return (
    <>
      <EntityHeader
        title="Workflow Editor"
        description="Edit and connect nodes within your workflow"
        onNew={onSave}
        newButtonLabel="Save"
        isCreating={isSaving}
        isDisabled={disabled}
        icon={Save}
      />
    </>
  );
}
