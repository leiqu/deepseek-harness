# Agent Note: A reference plugin bundle without a keyless demo agent

Status: implemented

English | [中文](2026-11-19-reference-plugin-demo-bundle.zh.md)

## Problem

The plugin authoring path is explained by tutorials that build a throwaway `scratch-plugin` directory and by a reference cookbook whose snippets are not runnable on their own. A reader who wants one checked-in artifact to install, read, and adapt has to assemble the package manifest, bundle patch, configuration schema, tool registration, and tests from separate documents. The assembled result is also untested, so a later change to a tool or Loader contract would not fail any check.

The obvious keyless teaching agent is not available: the [stdio and Echo agent removal](../simplification/2026-07-20-remove-stdio-and-echo-agents.md) deleted the mock-only product agent and its one teaching tool, and decided that keyless validation stays test-owned rather than shipping a user-facing scripted demo.

## Decision

`packages/examples/plugin-demo` ships `@deepseek-ai/dsh-plugin-demo`, a non-product reference package installed with `dsh plugin --profile <name> add <path>`. It contributes one configurable `greet` tool, a `tools/result` observer controlled by `observe`, a Schemastery `Config`, a bundle patch, and a package-owned invariant companion. Its README walks a reader from `pnpm run build` through installing into the web profile, calling the tool from a model request, overriding the greeting, and removing the bundle.

The package has no keyless driver and registers no product row. Its test mounts the real system-prompt and tool services, calls `greet` through `ctx.tools.execute`, checks the rendered canonical result and observer branch, and disposes the plugin fiber to assert the tool is unregistered. The package is a bundle rather than only a plugin because installation through an absolute `--patch` path is not portable, and a profile bundle is the supported third-party distribution path ([publish tutorial](../../../../docs/user/develop/basic/publish.md)).

## Alternatives considered

- **Extend the existing tutorials with a checked-in scratch plugin** — rejected: a tutorial artifact would still need package manifests, tests, and bundle metadata to be installable, duplicating the tutorial's teaching order.
- **Ship a keyless self-driving example plugin** — rejected for the same reason the Echo agent was removed: a runnable mock path makes a test fixture into user-facing surface and competes with the real model-backed agent as the quick start.
- **Mount `greet` in a shipped profile or bundle** — rejected: the tool is demonstrative, and adding it to `dsh-base` or `dsh-web-app` would expose demo behavior as product API.
- **Add only a README page with copy-paste code** — rejected: unexecuted snippets drift from the contracts they cite, and no gate would catch a broken registration.
- **Place the package under `packages/bundle/`** — rejected: that group holds shipped product bundles; a demo belongs with the other non-product demo/reference packages.

## Consequences

- One more non-product package and one more model-visible tool name (`greet`) exist in the workspace; no shipped composition mounts either.
- Exercising the demo requires a built repository, a profile mutation, and a model, so the package is not a keyless quick start.
- The tool-pipeline test pins the plugin's registration and result behavior, but there is no assembled-agent snapshot: the package contributes no product path, and the demo's own composition is the profile the reader installs.
- A deployment that already registers `greet` fails at load, which the README states as the deployment's tool-name responsibility.
