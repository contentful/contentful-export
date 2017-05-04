# Contentful export tool

[![npm](https://img.shields.io/npm/v/contentful-export.svg)](https://www.npmjs.com/package/contentful-export) [![Build Status](https://travis-ci.org/contentful/contentful-export.svg?branch=master)](https://travis-ci.org/contentful/contentful-export) [![Coverage Status](https://coveralls.io/repos/github/contentful/contentful-export/badge.svg?branch=master)](https://coveralls.io/github/contentful/contentful-export?branch=master) [![Dependency Status](https://img.shields.io/david/contentful/contentful-export.svg)](https://david-dm.org/contentful/contentful-export) [![devDependency Status](https://img.shields.io/david/dev/contentful/contentful-import.svg)](https://david-dm.org/contentful/contentful-export#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[https://www.contentful.com](Contentful) is a content management platform for web applications, mobile apps and connected devices. It allows you to create, edit & manage content in the cloud and publish it anywhere via powerful API. Contentful offers tools for managing editorial teams and enabling cooperation between organizations.

This is a command line tool (CLI) that help you backup your published Content Model, Content and Assets or move them to a new Contentful space. _It will support Editor Interfaces, Webhooks and Roles & Permissions in a future version._

To import your exported data, please refer to the [contentful-import](https://github.com/contentful/contentful-import) repository.

## Installation

We recommend the installation of this CLI via npm:

```bash
npm install -g contentful-export
```

## Usage and examples

```
Usage: contentful-export [options]

Options:
  --version               Show version number                          [boolean]

  --space-id              ID of Space with source data       [string] [required]

  --management-token      Contentful management API token for the space to be
                          exported                           [string] [required]

  --export-dir            Defines the path for storing the export json file
                          (default path is the current directory)       [string]

  --include-drafts        Include drafts in the exported entries
                                                      [boolean] [default: false]

  --skip-content-model    Skip exporting content models
                                                      [boolean] [default: false]

  --skip-content          Skip exporting assets and entries
                                                      [boolean] [default: false]

  --skip-roles            Skip exporting roles and permissions
                                                      [boolean] [default: false]

  --skip-webhooks         Skip exporting webhooks     [boolean] [default: false]

  --download-assets       With this flags assets will also be downloaded
                                                                       [boolean]

  --max-allowed-limit     How many items per page per request
                                                        [number] [default: 1000]

  --management-host       Management API host
                                        [string] [default: "api.contentful.com"]

  --proxy                 Proxy configuration in HTTP auth format: host:port or
                          user:password@host:port                       [string]

  --error-log-file        Full path to the error log file               [string]

  --use-verbose-renderer  Display progress in new lines instead of displaying a
                          busy spinner and the status in the same line. Useful
                          for CI.                     [boolean] [default: false]

  --save-file           Save the export as a json file [boolean] [default: true]

  --config              An optional configuration JSON file containing all the
                        options for a single run
```

The `--management-token` parameter allows you to specify a token used for both spaces. If you request a token from [here](https://www.contentful.com/developers/docs/references/authentication/) and your user account has access to both spaces, this should be enough.

Check the _example-config.json_ file for an example of what a configuration file looks like. If you use the configuration file, you don't need to specify the other options for tokens and space ids.

### Example

```shell
contentful-export \
  --space-id spaceID \
  --management-token managementToken
```

or

```shell
contentful-export --config example-config.json
```

You can create your own configuration file based on the [_example-config.json_](example-config.json) file.

### Exported data

This is an overview of the exported data:

```json
{
  "contentTypes": [],
  "entries": [],
  "assets": [],
  "locales": [],
  "webhooks": [],
  "roles": [],
  "editorInterfaces": []
}
```

### Usage as a library

While this tool is intended for use as a command line tool, you can also use it as a Node library:

```javascript
var spaceExport = require('contentful-export')
var options = {
  spaceId: '{space_id}',
  managementToken: '{content_management_api_key}',
  maxAllowedItems: 100,
  errorLogFile: 'filename',
  saveFile: false
  ...
}
spaceExport(options)
.then((output) => {
  console.log('Your space data:', output)
})
.catch((err) => {
  console.log('Oh no! Some errors occurred!', err)
})
```

The `options` object can contain any of the CLI options, but written with a camelCase pattern instead and no dashes. For example `--space-id` would become `spaceId`.

## Limitations

- This tool currently does **not** support the export of space memberships.
- Exported webhooks with credentials will be exported as normal webhooks. Credentials should be added manually afterwards.
- If you have custom UI extensions, you need to reinstall them manually in the new space.

## Changelog

Read the [releases](https://github.com/contentful/contentful-export/releases) page for more information.

## License

This project is licensed under MIT license

[1]: https://www.contentful.com
