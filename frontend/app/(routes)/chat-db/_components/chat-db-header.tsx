"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Bot, Database, Eye, EyeOff, Settings } from "lucide-react";

import EntityHeader from "@/components/entity-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCredentials } from "@/hooks/useCredentials";
import { type DBChatConfig } from "@/hooks/useChatDB";
import {
  DB_PLACEHOLDERS,
  DB_TYPES,
  DEFAULT_MODELS,
  DEFAULT_DB_TYPE,
  type LlmProvider,
  LlmProvider as LlmProviderEnum,
  isDbType,
  isLlmProvider,
} from "@/lib/types/chat-config";

type ConfigStatus = {
  config: DBChatConfig;
  readyToSave: boolean;
  isConfigured: boolean;
  settingsOpen: boolean;
};

type ParsedCredentialPreview = {
  provider?: LlmProvider;
  model?: string;
};

function parseCredentialPreview(preview?: string): ParsedCredentialPreview {
  if (!preview) return {};

  const [providerRaw, modelRaw] = preview.split("/").map((part) => part.trim());

  const provider = isLlmProvider(providerRaw) ? providerRaw : undefined;

  const model = modelRaw && modelRaw !== "—" ? modelRaw : undefined;

  return { provider, model };
}

type ChatDbHeaderProps = {
  title: string;
  dbType?: string | null;
  initialConfig?: Partial<DBChatConfig>;
  actions?: ReactNode;
  onConfigChange?: (config: DBChatConfig) => void;
  onConfigSave?: (config: DBChatConfig) => void;
  onStatusChange?: (status: ConfigStatus) => void;
};

export function ChatDbHeader({
  title,
  dbType,
  initialConfig,
  actions,
  onConfigChange,
  onConfigSave,
  onStatusChange,
}: ChatDbHeaderProps) {
  const initialSaved = Boolean(
    (initialConfig?.databaseUrl || "").trim().length > 0 &&
    (initialConfig?.credentialId || initialConfig?.llmProvider),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(initialSaved);
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState<DBChatConfig>({
    dbType:
      initialConfig?.dbType && isDbType(initialConfig.dbType)
        ? initialConfig.dbType
        : DEFAULT_DB_TYPE,
    databaseUrl: initialConfig?.databaseUrl ?? "",
    llmProvider:
      initialConfig?.llmProvider && isLlmProvider(initialConfig.llmProvider)
        ? initialConfig.llmProvider
        : undefined,
    model: initialConfig?.model ?? "",
    apiKey: initialConfig?.apiKey ?? "",
    credentialId: initialConfig?.credentialId,
  });

  const { data: llmCredentials, isLoading: llmCredsLoading } =
    useCredentials("LLM");

  const hasLlm = Boolean(config.credentialId || config.llmProvider);
  const readyToSave = config.databaseUrl.trim().length > 0 && hasLlm;
  const isConfigured = settingsSaved && readyToSave;

  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  useEffect(() => {
    onStatusChange?.({ config, readyToSave, isConfigured, settingsOpen });
  }, [config, readyToSave, isConfigured, settingsOpen, onStatusChange]);

  const handleProviderChange = (provider: LlmProvider) => {
    setSettingsSaved(false);
    setConfig((prev) => ({
      ...prev,
      llmProvider: provider,
      model: DEFAULT_MODELS[provider],
      credentialId: undefined,
      apiKey: "",
    }));
  };

  const handleCredentialSelect = (credentialId?: string) => {
    setSettingsSaved(false);
    setConfig((prev) => {
      if (!credentialId) {
        return {
          ...prev,
          credentialId: undefined,
          llmProvider: undefined,
          model: "",
          apiKey: "",
        };
      }
      const cred = llmCredentials?.find((c) => c.id === credentialId);
      if (!cred) return prev;
      const { provider: previewProvider, model: previewModel } =
        parseCredentialPreview(cred.preview);
      const provider = previewProvider ?? prev.llmProvider;
      return {
        ...prev,
        credentialId,
        llmProvider: provider,
        model:
          previewModel ?? (provider ? DEFAULT_MODELS[provider] : prev.model),
        apiKey: "",
      };
    });
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    setSettingsOpen(false);
    onConfigSave?.(config);
  };

  return (
    <EntityHeader
      title={title}
      description={(dbType || config.dbType)?.toUpperCase()}
      newButtonLabel={undefined}
      icon={undefined}
    >
      {dbType || config.dbType ? (
        <span className="hidden sm:inline-flex items-center rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase text-muted-foreground">
          {dbType || config.dbType}
        </span>
      ) : null}
      {actions}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configure</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Connection Settings</SheetTitle>
            <SheetDescription>
              Configure your database and AI model settings.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6 px-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4 text-blue-500" />
                Database
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Database Type</Label>
                <Select
                  value={config.dbType}
                  onValueChange={(v) => {
                    setSettingsSaved(false);
                    setConfig((prev) => {
                      const nextType = isDbType(v) ? v : prev.dbType;
                      return {
                        ...prev,
                        dbType: nextType,
                        databaseUrl: "",
                      };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DB_TYPES[0]}>PostgreSQL</SelectItem>
                    <SelectItem value={DB_TYPES[1]}>MongoDB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connection String</Label>
                <Textarea
                  value={config.databaseUrl}
                  onChange={(e) => {
                    setSettingsSaved(false);
                    setConfig((prev) => ({
                      ...prev,
                      databaseUrl: e.target.value,
                    }));
                  }}
                  placeholder={DB_PLACEHOLDERS[config.dbType]}
                  className="font-mono text-xs min-h-20 resize-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-4 w-4 text-primary" />
                AI Model
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Credential</Label>
                <Select
                  value={config.credentialId ?? "none"}
                  onValueChange={(v) =>
                    handleCredentialSelect(v === "none" ? undefined : v)
                  }
                  disabled={llmCredsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        llmCredsLoading
                          ? "Loading..."
                          : "Select saved credential"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Use custom key</SelectItem>
                    {llmCredentials?.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.name} - {cred.preview || "saved"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!config.credentialId && (
                <>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={config.llmProvider}
                      onValueChange={(v) =>
                        handleProviderChange(v as LlmProvider)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LlmProviderEnum.GROQ}>
                          Groq
                        </SelectItem>
                        <SelectItem value={LlmProviderEnum.GOOGLE}>
                          Google Gemini
                        </SelectItem>
                        <SelectItem value={LlmProviderEnum.OLLAMA}>
                          Ollama
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {config.llmProvider &&
                    config.llmProvider !== LlmProviderEnum.OLLAMA && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <div className="relative">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={config.apiKey}
                            onChange={(e) => {
                              setSettingsSaved(false);
                              setConfig((prev) => ({
                                ...prev,
                                apiKey: e.target.value,
                              }));
                            }}
                            placeholder={
                              config.llmProvider === LlmProviderEnum.GROQ
                                ? "gsk_..."
                                : "AIza..."
                            }
                            className="pr-10 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>

            <Button
              className="w-full"
              onClick={saveSettings}
              disabled={!readyToSave}
            >
              Save Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </EntityHeader>
  );
}
