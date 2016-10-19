# Contentful Export
[![npm](https://img.shields.io/npm/v/contentful-export.svg)](https://www.npmjs.com/package/contentful-export)
[![Build Status](https://travis-ci.org/contentful/contentful-export.svg?branch=master)](https://travis-ci.org/contentful/contentful-export)
[![Coverage Status](https://coveralls.io/repos/github/contentful/contentful-export/badge.svg?branch=master)](https://coveralls.io/github/contentful/contentful-export?branch=master)
[![Dependency Status](https://david-dm.org/contentful/contentful-export.svg)](https://david-dm.org/contentful/contentful-export)
[![devDependency Status](https://david-dm.org/contentful/contentful-export/dev-status.svg)](https://david-dm.org/contentful/contentful-export#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

[Contentful][1] is a content management platform for web applications, mobile apps and connected devices. It allows you to create, edit & manage content in the cloud and publish it anywhere via powerful API. Contentful offers tools for managing editorial teams and enabling cooperation between organizations.

This is a Command Line Tool (CLI) that allows you to backup your published Content Model, Content and Assets or move them to a new Contentful space. Editor Interfaces, Webhooks and Roles & Permissions will be supported in a next version of this tool.

To import your data, please refer to the [contentful-import](https://github.com/contentful/contentful-import) repository.

# Installation

We recommend the installation of this CLI via npm:

`npm install -g contentful-export`

# Usage and Examples

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

The `--management-token` parameter allows you to specify a token which will be used for both spaces. If you get a token from https://www.contentful.com/developers/docs/references/authentication/ and your user account has access to both spaces, this should be enough.

Check the `example-config.json` file for an example of what a configuration file would look like. If you use the config file, you don't need to specify the other options for tokens and space ids.

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

You can create your own config file based on the [`example-config.json`](example-config.json) file.

### Exported Data

This is an overview of what gets exported.

```json
{
  "contentTypes": [],
  "entries": [],
  "locales":[],
  "assets":[]
}

```

### Usage as a library

While this tool is mostly intended to be used as a command line tool, it can also be used as a Node library:

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

The options object can contain any of the CLI options but written with a camelCase pattern instead, and no dashes. So `--space-id` would become `spaceId`.
Apart from those options, there are an additional ones that can be passed to it:

* `errorLogFile` - File to where any errors will be written.

# Limitations

- This tool exports only your published Content Model, Content and Assets or move them to a new Contentful space. Editor Interfaces, Webhooks and Roles & Permissions will be supported in a next version of this tool. Drafts are not exported;
- The content exported by this tool can only be imported to a new blank space. We curently do not support merging content into pre-existent spaces.
- If you have custom widgets, you need to reinstall them manually on the new space.

# Changelog

Check out the [releases](https://github.com/contentful/contentful-export/releases) page.

# License

This project is licensed under MIT license.

[1]: https://www.contentful.com
