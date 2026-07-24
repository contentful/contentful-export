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
  skipAssets?: boolean;
  skipContent?: boolean;
  skipContentModel?: boolean;
  skipEditorInterfaces?: boolean;
  skipRoles?: boolean;
  skipWebhooks?: boolean;
  skipTags?: boolean;
  useVerboseRenderer?: boolean;
  includeExperienceOrchestration?: boolean;
}

type ContentfulExportField = 'contentTypes' | 'entries' | 'assets' | 'locales' | 'tags' | 'webhooks' | 'roles' | 'editorInterfaces' | 'designTokens' | 'componentTypes' | 'templates' | 'dataAssemblies' | 'fragments' | 'experiences';

declare const runContentfulExport: (params: Options) => Promise<Record<ContentfulExportField, unknown[]>>
export default runContentfulExport
