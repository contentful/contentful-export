We appreciate any community contributions to this project, whether in the form of issues or Pull Requests.

This document outlines the we'd like you to follow in terms of commit messages and code style.

It also explains what to do in case you want to setup the project locally and run tests.

# Setup

This project is written in ES2015 and transpiled to ES5 using Babel, to the `dist` directory. This should generally only happen at publishing time, or for testing purposes only.

Run `npm install` to install all necessary dependencies. When running `npm install` locally, `dist` is not compiled.

# Code style

This project uses [standard](https://github.com/feross/standard). Install a relevant editor plugin if you'd like.

Everywhere where it isn't applicable, follow a style similar to the existing code.

# Commit messages and issues

This project uses the [Angular JS Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit), via semantic-release. See the semantic-release [Default Commit Message Format](https://github.com/semantic-release/semantic-release#default-commit-message-format) section for more details.

# Running tests

This project has unit and integration tests. Both of these run on both Node.js and Browser environments.

Both of these test environments are setup to deal with Babel and code transpiling, so there's no need to worry about that

- `npm test` runs all three kinds of tests and generates a coverage report
- `npm run test:only` runs Node.js unit tests without coverage. `npm run test:cover` to run Node.js unit tests with coverage. `npm run test:debug` runs babel-node in debug mode (same as running `node debug`).
