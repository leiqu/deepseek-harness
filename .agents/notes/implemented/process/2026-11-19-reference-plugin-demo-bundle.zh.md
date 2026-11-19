# Agent Note: A reference plugin bundle without a keyless demo agent

Status: implemented

[English](2026-11-19-reference-plugin-demo-bundle.md) | 中文

## Problem

插件编写路径由教程解释：教程会让人搭建一个临时 `scratch-plugin` 目录；参考手册里的代码片段也无法单独运行。想找一个已经入库、可安装、可阅读、可修改的完整产物的读者，只能从多份文档中自行拼出包清单、bundle patch、配置 schema、工具注册和测试。拼出来的结果同样没有测试：工具或 Loader 约定之后发生变化时，不会有任何检查失败。

显然的无密钥教学 agent 并不可用：[stdio 与 Echo agent 的移除决定](../simplification/2026-07-20-remove-stdio-and-echo-agents.md)删除了 mock-only 的产品 agent 及其唯一的教学工具，并确定无密钥验证由测试拥有，而不是交付一个面向用户的脚本化演示。

## Decision

`packages/examples/plugin-demo` 提供 `@deepseek-ai/dsh-plugin-demo`：一个非产品参考包，通过 `dsh plugin --profile <name> add <path>` 安装。它提供一个可配置的 `greet` 工具、一个由 `observe` 控制的 `tools/result` 观察器、一个 Schemastery `Config`、一个 bundle patch 以及包自有的 invariant companion。其 README 带领读者从 `pnpm run build` 走到把包安装进 web profile、在模型请求中调用工具、覆盖问候语并移除 bundle。

该包没有无密钥驱动，也不注册任何产品行。它的测试挂载真实的 system-prompt 与工具服务，通过 `ctx.tools.execute` 调用 `greet`，检查渲染后的规范结果和观察器分支，并销毁插件 fiber 以断言工具已注销。该包采用 bundle 形式而非单纯插件，是因为通过绝对 `--patch` 路径安装不可移植，而 profile bundle 是受支持的第三方分发路径（[发布教程](../../../../docs/user/develop/basic/publish.md)）。

## Alternatives considered

- **在现有教程中增加一个入库的 scratch 插件** — 否决：教程产物仍然需要包清单、测试和 bundle 元数据才能安装，这会重复教程的教学顺序。
- **提供一个无密钥的自驱动示例插件** — 否决，理由与 Echo agent 被移除相同：可运行的 mock 路径会把测试夹具变成面向用户的表层，并与真实模型驱动的 agent 争夺快速入门的地位。
- **把 `greet` 挂进随产品交付的 profile 或 bundle** — 否决：该工具只用于演示；把它加进 `dsh-base` 或 `dsh-web-app` 会把演示行为暴露成产品 API。
- **只增加一页可复制代码的 README** — 否决：未执行的片段会偏离它们引用的约定，而且没有门禁能发现损坏的注册。
- **把包放在 `packages/bundle/` 下** — 否决：该组存放随产品交付的 bundle；演示包应与其他非产品演示／参考包放在一起。

## Consequences

- 工作区多了一个非产品包和一个模型可见的工具名（`greet`）；没有任何随产品交付的组合挂载它们。
- 实际体验该演示需要已构建的仓库、修改 profile 以及一个模型，因此该包不是无密钥的快速入门。
- 工具管线测试钉住了插件的注册与结果行为，但没有组装后 agent 的快照：该包不贡献产品路径，演示组合就是读者自己安装的那个 profile。
- 已注册 `greet` 的部署会在加载时失败；README 已把工具重名责任写明为部署方的责任。
