# @deepseek-ai/dsh-plugin-demo

[English](README.md) | 中文

一个可安装为 profile bundle 的最小参考插件。它提供一个可配置的模型工具 `greet`，让插件作者可以跟着走完第三方插件的完整路径——包、bundle patch、配置 schema、工具注册和事件观察——而不必先按教程搭一个 scratch 目录。

该包是演示用的表层，不属于产品 API：任何随产品交付的 profile 都不会挂载它。

## 功能

`greet` 接收必填的 `name`，返回 `<greeting>, <name>!`。当 `observe` 为 true 时，插件还会为每次完成的 `greet` 调用记录一行日志。注册通过 `ctx.effect` 完成，因此卸载插件会同时移除工具和监听器。

| 配置键 | 默认值 | 作用 |
|---|---|---|
| `greeting` | `Hello` | 放在被问候名字前的词 |
| `observe` | `true` | 通过 `ctx.logger` 记录完成的 `greet` 调用 |

## 安装

在已完成[从源码运行准备](../../../README.md#run-from-source)的仓库检出中：

```sh
pnpm run build
pnpm dsh plugin --profile web add ./packages/examples/plugin-demo
pnpm dsh web
```

让模型执行 `Use the greet tool to greet Ada.`，结果是 `Hello, Ada!`。要修改问候语，把下面这一行加入 web profile 的 `cordis.patch.yml`：

```yaml
- id: plugin-demo
  config:
    greeting: Hi
```

移除该 bundle：

```sh
pnpm dsh plugin --profile web remove @deepseek-ai/dsh-plugin-demo
```

## 演示内容

- 函数式插件的导出：`name`、`inject`、`Config` 和 `apply`，且没有 default 导出。
- Schemastery `Config` schema：默认值和校验由插件负责，而不是由组合负责。
- `defineTool`：参数与输出 schema 会自动进入 system prompt，`execute` 收到带类型的参数。
- 注册即 effect：销毁插件 fiber 会注销该工具。
- 带类型的 `tools/result` 监听器，只观察本插件的工具。

模型调用该工具的方式与调用随产品交付的工具完全相同；不涉及 mock adapter 或无密钥驱动。这一点让该包符合[移除无密钥演示的决定](../../../.agents/notes/implemented/simplification/2026-07-20-remove-stdio-and-echo-agents.md)。

## 模型体验

### 工具注册

#### 模型看到什么

`greet` 带一个必填的 `name` 字符串，描述为 `Greet a person by name.`。部署的 `greeting` 值只改变渲染结果，从不改变 schema。

#### Token 影响

在工具可见的每个请求中产生固定的 schema 开销。

#### KV Cache 影响

在包保持加载且工具可见性不变时，前缀稳定。

### 工具调用历史与结果

#### 模型看到什么

助手的工具调用保留 `name`；结果是单个文本块 `<greeting>, <name>!`。`tools/result` 日志行属于宿主输出，不是模型消息。

#### Token 影响

调用参数和简短结果会留在历史中，直到压缩。

#### KV Cache 影响

只追加；新内容接在可复用的请求前缀之后。

## 已知限制与后续工作

- **仅作演示** — `greet` 用于演示插件约定，不是产品能力；没有任何随产品交付的 profile 挂载该包。
- **需要模型来实际调用** — 该包不提供无密钥驱动或 mock agent；其工具管线测试由测试拥有，符合上文提到的移除决定。
- **工具重名由部署负责** — 已注册 `greet` 的组合会在加载时失败；删除两行中的一行。
