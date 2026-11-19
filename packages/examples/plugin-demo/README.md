# @deepseek-ai/dsh-plugin-demo

English | [中文](README.zh.md)

A minimal reference plugin, packaged as an installable profile bundle. It contributes one configurable model tool, `greet`, so a plugin author can follow the complete third-party path — package, bundle patch, configuration schema, tool registration, and event observation — without building a scratch directory from the tutorial.

The package is demo surface, not product API: no shipped profile mounts it.

## What it does

`greet` takes a required `name` and returns `<greeting>, <name>!`. When `observe` is true, the plugin also logs one line for each completed `greet` call. Registration is a `ctx.effect`, so unloading the plugin removes both the tool and the listener.

| Config key | Default | Effect |
|---|---|---|
| `greeting` | `Hello` | Word placed before the greeted name |
| `observe` | `true` | Log completed `greet` calls through `ctx.logger` |

## Install

From a repository checkout that has completed the [run-from-source setup](../../../README.md#run-from-source):

```sh
pnpm run build
pnpm dsh plugin --profile web add ./packages/examples/plugin-demo
pnpm dsh web
```

Ask the model to `Use the greet tool to greet Ada.` The result is `Hello, Ada!`. To change the greeting, add this row to the web profile's `cordis.patch.yml`:

```yaml
- id: plugin-demo
  config:
    greeting: Hi
```

Remove the bundle with:

```sh
pnpm dsh plugin --profile web remove @deepseek-ai/dsh-plugin-demo
```

## What the demo shows

- Function-plugin exports: `name`, `inject`, `Config`, and `apply`, with no default export.
- A Schemastery `Config` schema: the plugin owns defaults and validation, not the composition.
- `defineTool`: the parameter and output schemas reach the system prompt automatically, and `execute` receives typed arguments.
- Effect registration: disposing the plugin fiber unregisters the tool.
- A typed `tools/result` listener that observes only this plugin's tool.

The model calls the tool exactly as it calls a shipped tool; no mock adapter or keyless driver is involved. That keeps this package on the right side of the [keyless-demo removal decision](../../../.agents/notes/implemented/simplification/2026-07-20-remove-stdio-and-echo-agents.md).

## Model Experience

### Tool registration

#### What the model sees

`greet` with a required `name` string and the description `Greet a person by name.` A deployment's `greeting` value changes only the rendered result, never the schema.

#### Token effect

Fixed schema cost on every request where the tool is visible.

#### KV Cache effect

Prefix-stable while the package is loaded and the tool's visibility is unchanged.

### Tool-call history and result

#### What the model sees

The assistant tool call retains `name`; the result is one text block, `<greeting>, <name>!`. The `tools/result` log line is host output, not a model message.

#### Token effect

The call arguments and the short result remain in history until compaction.

#### KV Cache effect

Append-only; new content follows the reusable request prefix.

## Known Limitations and Deferred Work

- **Demo surface only** — `greet` demonstrates the plugin contract and is not a product capability; no shipped profile mounts this package.
- **Requires a model to exercise** — the package provides no keyless driver or mock agent; its tool-pipeline test is test-owned, per the removal decision above.
- **Tool-name collision belongs to the deployment** — a composition that already registers `greet` fails at load; remove one of the two rows.
