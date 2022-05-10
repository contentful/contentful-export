export interface Options {
  managementToken: string;
  spaceId: string;
  contentFile?: string;
  contentOnly?: boolean;
  deliveryToken?: string;
  downloadAssets?: boolean;
  environmentId?: string;
  errorLogFile?: string;
  exportDir?: string;
  headers?: string[];
  host?: string;
  includeArchived?: boolean;
  includeDrafts?: boolean;
  limit?: number;
  managementApplication?: string;
  managementFeature?: string;
  maxAllowedLimit?: number;
  proxy?: string;
  queryEntries?: string[];
  queryAssets?: string[];
  rawProxy?: boolean;
  saveFile?: boolean;
  skipContent?: boolean;
  skipContentModel?: boolean;
  skipEditorInterfaces?: boolean;
  skipRoles?: boolean;
  skipWebhooks?: boolean;
  useVerboseRenderer?: boolean;
}

type ContentfulExportField = 'contentTypes' | 'entries' | 'assets' | 'locales' | 'tags' | 'webhooks' | 'roles' | 'editorInterfaces';

declare const runContentfulExport: (params: Options) => Promise<Record<ContentfulExportField, unknown[]>>
export default runContentfulExport
