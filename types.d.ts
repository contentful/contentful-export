export interface Options {
  managementToken: string;
  spaceId: string;

  contentFile?: string;
  contentOnly?: boolean;
  deliveryToken?: string;
  environmentId?: string;
  errorLogFile?: string;
  exportDir?: string;
  host?: string;
  includeArchived?: boolean;
  includeDrafts?: boolean;
  limit?: number;
  managementApplication?: string;
  managementFeature?: string;
  maxAllowedLimit?: boolean;
  proxy?: string;
  queryEntries?: string | string[];
  rawProxy?: boolean;
  saveFile?: boolean;
  skipContent?: boolean;
  skipContentModel?: boolean;
  skipEditorInferfaces?: boolean;
  skipRoles?: boolean;
  skipWebhooks?: boolean;
  useVerboseRenderer?: boolean;
};


type ContentfulExportField = 'contentTypes' | 'entries' | 'assets' | 'locales' | 'tags' | 'webhooks' | 'roles' | 'editorInterfaces';

declare const runContentfulExport: (params: Options) => Promise<Record<ContentfulExportField, unknown[]>>;
export default runContentfulExport;