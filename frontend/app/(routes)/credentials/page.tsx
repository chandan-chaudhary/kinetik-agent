"use client";

import { useMemo, useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import {
  useCredentials,
  useCreateCredential,
  useUpdateCredential,
  useDeleteCredential,
  type Credential,
  type CredentialType,
  type CreateCredentialPayload,
} from "@/hooks/useCredentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EntityHeader from "@/components/entity-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CredentialCards } from "./_components/credential-cards";
import {
  CredentialForm,
  type CredentialFormState,
} from "./_components/credential-form";
import { CREDENTIAL_DEFINITIONS } from "@/lib/credential-types";
import { decryptCredentialData } from "@/lib/encrypt-decrypt-credentials";
import { toast } from "sonner";

const DEFAULT_FORM: CredentialFormState = {
  name: "",
  type: "LLM",
  data: {},
  isActive: "true",
};

export default function CredentialsPage() {
  const [typeFilter, setTypeFilter] = useState<CredentialType | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editCredential, setEditCredential] = useState<Credential | null>(null);
  const [form, setForm] = useState<CredentialFormState>(DEFAULT_FORM);

  const selectedType = typeFilter === "ALL" ? undefined : typeFilter;
  const credentialsQuery = useCredentials(selectedType);
  const createMutation = useCreateCredential();
  const updateMutation = useUpdateCredential();
  const deleteMutation = useDeleteCredential();

  const credentials = useMemo(
    () => credentialsQuery.data ?? [],
    [credentialsQuery.data],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const totalActive = useMemo(
    () => credentials.filter((item) => item.isActive).length,
    [credentials],
  );

  const totalInactive = useMemo(
    () => credentials.filter((item) => !item.isActive).length,
    [credentials],
  );

  const visibleCredentials = useMemo(() => {
    if (!searchTerm.trim()) return credentials;
    const q = searchTerm.toLowerCase();
    return credentials.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        (item.preview ?? "").toLowerCase().includes(q)
      );
    });
  }, [credentials, searchTerm]);

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  function openCreateDialog() {
    resetForm();
    setOpenCreate(true);
  }

  async function openEditDialog(item: Credential) {
    setForm({
      name: item.name,
      type: item.type,
      data: {},
      isActive: item.isActive ? "true" : "false",
    });
    setEditCredential(item);

    try {
      const decrypted = await decryptCredentialData(item.data);
      if (decrypted) {
        setForm({
          name: item.name,
          type: item.type,
          data: decrypted,
          isActive: item.isActive ? "true" : "false",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to decrypt credential");
    }
  }

  async function submitCreate() {
    await createMutation.mutateAsync({
      name: form.name.trim(),
      type: form.type,
      data: form.data,
      isActive: form.isActive === "true",
    });
    setOpenCreate(false);
    resetForm();
  }

  async function submitUpdate() {
    if (!editCredential) return;
    const updatePayload: Partial<CreateCredentialPayload> = {
      name: form.name.trim(),
      type: form.type,
      isActive: form.isActive === "true",
    };

    if (form.data && Object.keys(form.data).length > 0) {
      updatePayload.data = form.data;
    }

    await updateMutation.mutateAsync({
      id: editCredential.id,
      data: updatePayload,
    });
    setEditCredential(null);
    resetForm();
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this credential?");
    if (!confirmDelete) return;
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div className="flex-1 bg-linear-to-b from-background to-muted/20">
      <EntityHeader
        title="Credentials"
        description="Manage provider keys once, reuse them across every node."
        newButtonLabel="Add Credential"
        onNew={openCreateDialog}
        icon={Plus}
      />

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="pt-5 space-y-1">
              <p className="text-sm text-muted-foreground">Total credentials</p>
              <p className="text-3xl font-semibold tracking-tight">
                {credentials.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {credentials.length === 1 ? "Record" : "Records"} stored in
                vault
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background border-emerald-200/40">
            <CardContent className="pt-5 space-y-1">
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-semibold tracking-tight">
                {totalActive}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalActive} ready for workflows right now
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-background border-red-200/40">
            <CardContent className="pt-5 space-y-1">
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-3xl font-semibold tracking-tight">
                {totalInactive}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalInactive} not ready for workflows
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-2 w-full md:w-auto">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or preview"
              className="w-full md:w-80"
            />

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as CredentialType | "ALL")
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {CREDENTIAL_DEFINITIONS.map((type) => (
                  <SelectItem
                    key={type.type}
                    value={type.type as CredentialType}
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {credentialsQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium">No credentials found</p>
              <p className="text-sm text-muted-foreground">
                Add your first credential to start reusing providers.
              </p>
              <Button onClick={openCreateDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Credential
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CredentialCards
            credentials={visibleCredentials}
            openEditDialog={openEditDialog}
            handleDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
          />
        )}
        <Dialog
          open={openCreate}
          onOpenChange={(value) => {
            setOpenCreate(value);
            if (!value) resetForm();
          }}
        >
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Credential</DialogTitle>
              <DialogDescription>
                Add provider credentials once and reuse them in nodes.
              </DialogDescription>
            </DialogHeader>
            <CredentialForm form={form} setForm={setForm} isEdit={false} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button onClick={submitCreate} disabled={isSaving || !form.name}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editCredential)}
          onOpenChange={(value) => {
            if (!value) {
              setEditCredential(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Credential</DialogTitle>
              <DialogDescription>
                Update your credential details. Leave API key empty to keep
                current key.
              </DialogDescription>
            </DialogHeader>
            <CredentialForm form={form} setForm={setForm} isEdit />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditCredential(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={submitUpdate} disabled={isSaving || !form.name}>
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
