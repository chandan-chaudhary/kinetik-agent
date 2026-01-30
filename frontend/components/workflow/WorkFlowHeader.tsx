import EntityHeader from "../entity-header";

export default function WorkFlowHeader({ disabled, openCreate }: { disabled?: boolean; openCreate: () => void }) {
  return (
    <>
      <EntityHeader
        title="Workflow Editor"
        description="Create and manage your workflows"
        isDisabled={disabled}
        onNew={openCreate}
        // newButtonHref="/workflows/new"
        newButtonLabel="Create Workflow"
        isCreating={false}
      />
    </>
  );
}
