# Contentful export tool

[![npm](https://img.shields.io/npm/v/contentful-export.svg)](https://www.npmjs.com/package/contentful-export)
[![Build Status](https://travis-ci.org/contentful/contentful-export.svg?branch=master)](https://travis-ci.org/contentful/contentful-export)
[![codecov](https://codecov.io/gh/contentful/contentful-export/branch/master/graph/badge.svg)](https://codecov.io/gh/contentful/contentful-export)
[![Dependency Status](https://img.shields.io/david/contentful/contentful-export.svg)](https://david-dm.org/contentful/contentful-export)
[![devDependency Status](https://img.shields.io/david/dev/contentful/contentful-import.svg)](https://david-dm.org/contentful/contentful-export#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[Contentful](https://www.contentful.com) provides a content infrastructure for digital teams to power content in websites, apps, and devices. Unlike a CMS, Contentful was built to integrate with the modern software stack. It offers a central hub for structured content, powerful management and delivery APIs, and a customizable web app that enable developers and content creators to ship digital products faster.

This is a command line tool (CLI) that help you backup your published Content Model, Content and Assets or move them to a new Contentful space. _It will support Editor Interfaces, Webhooks and Roles & Permissions in a future version._

To import your exported data, please refer to the [contentful-import](https://github.com/contentful/contentful-import) repository.

## Installation

We recommend the installation of this CLI via npm:

```bash
npm install -g contentful-export
```

## Usage and examples

Check the _example-config.json_ file for an example of what a configuration file looks like. If you use the configuration file, you don't need to specify the other options for tokens and space ids.

### Example

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

You can also use it as a Node library:

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
