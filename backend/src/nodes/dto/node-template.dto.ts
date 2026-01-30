export interface NodeTemplateDto {
  id: string;
  domain: string;
  type: string;
  fullType: string; // e.g., 'sql.generator'
  name: string;
  description: string;
  kind: 'trigger' | 'action';
  icon?: string;
  configSchema: any; // JSON Schema
  inputSchema: any; // JSON Schema
  outputSchema: any; // JSON Schema
  defaultConfig?: any;
}

export class GetNodeTemplatesQueryDto {
  domain?: string;
  kind?: string;
}
