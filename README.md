# Contentful export tool

[![npm](https://img.shields.io/npm/v/contentful-export.svg)](https://www.npmjs.com/package/contentful-export) [![Build Status](https://travis-ci.org/contentful/contentful-export.svg?branch=master)](https://travis-ci.org/contentful/contentful-export) [![Coverage Status](https://coveralls.io/repos/github/contentful/contentful-export/badge.svg?branch=master)](https://coveralls.io/github/contentful/contentful-export?branch=master) [![Dependency Status](https://david-dm.org/contentful/contentful-export.svg)](https://david-dm.org/contentful/contentful-export) [![devDependency Status](https://david-dm.org/contentful/contentful-export/dev-status.svg)](https://david-dm.org/contentful/contentful-export#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[Contentful][1] is a content management platform for web applications, mobile apps and connected devices. It allows you to create, edit & manage content in the cloud and publish it anywhere via powerful API. Contentful offers tools for managing editorial teams and enabling cooperation between organizations.

This is a command line tool (CLI) that allows you to backup your published Content Model, Content and Assets or move them to a new Contentful space. It will support Editor Interfaces, Webhooks and Roles & Permissions in a future version.

To import your data, please refer to the [contentful-import](https://github.com/contentful/contentful-import) repository.

## Installation

We recommend the installation of this CLI via npm:

```bash
npm install -g contentful-export
```

## Usage and Examples

```shell
Usage: contentful-export [options]

Options:
  --version           Show version number                              
  --space-id          ID of Space with source data           
                      [string] [required]
  --management-token  Management API token for the space to be exported.
                      [string] [required]
  --export-dir        Defines the path for storing the export json file
                      (defaultpath is the current directory) [string]
  --config            Configuration file with required values
```

The `--management-token` parameter allows you to specify a token used for both spaces. If you request a token from [here](https://www.contentful.com/developers/docs/references/authentication/) and your user account has access to both spaces, this should be enough.

Check the _example-config.json_ file for an example of what a configuration file would look like. If you use the configuration file, you don't need to specify the other options for tokens and space ids.

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

### Exported Data

This is an overview of the data exported.

```json
{
  "contentTypes": [],
  "entries": [],
  "locales": [],
  "assets": [],
  "webhooks": [],
  "editorInterfaces": []
}

### Usage as a library

While this tool is intended to be used as a command line tool, you can also use it as a Node library:

```javascript
var spaceExport = require('contentful-export')

spaceExport(options)
.then((output) => {
  console.log('space data', output)
})
.catch((err) => {
  console.log('oh no! errors occurred!', err)
})
```

The `options` object can contain any of the CLI options, but written with a camelCase pattern instead, and no dashes. For example `--space-id` would become `spaceId`.

Another option is `errorLogFile`, the location of a file to log errors to.

## Limitations

- This tool exports only your published Content Model, Content and Assets. It will support Editor Interfaces, Webhooks and Roles & Permissions in a future version. Draft entries are not supported.
- You can only export the content exported by this tool into an empty space. We currently do not support merging content into pre-existing spaces.
- If you have custom widgets, you need to reinstall them manually in the new space.

## Changelog

Read the [releases](https://github.com/contentful/contentful-export/releases) page for more information.

## License

This project is licensed under MIT license

[1]: https://www.contentful.com
