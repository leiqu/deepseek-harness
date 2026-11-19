import { Context } from '@deepseek-ai/cordis'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import { CallId } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { describe, expect, it, vi } from 'vitest'
import * as PluginDemo from '../src/index.ts'

/** Mount the real system-prompt and tool services the plugin injects. */
async function mount(config: Partial<PluginDemo.Config> = {}) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  // The exported schema fills omitted fields; the test may pass a partial config.
  const fiber = await ctx.plugin(PluginDemo, config as PluginDemo.Config)
  return { ctx, fiber }
}

/** Execute one tool through the registry pipeline, standing in for the model. */
function execute(ctx: Context, name: string, args: unknown) {
  return ctx.tools.execute({
    callId: CallId(`demo-${name}`),
    name,
    arguments: args,
    signal: new AbortController().signal,
  })
}

describe('demo greet tool', () => {
  it('renders the configured greeting through the real tool pipeline', async () => {
    const { ctx, fiber } = await mount({ greeting: 'Hi', observe: false })

    expect(ctx.tools.schemas().find(candidate => candidate.name === 'greet')).toMatchObject({
      description: 'Greet a person by name.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Person to greet' } },
        required: ['name'],
      },
    })
    const result = await execute(ctx, 'greet', { name: 'Ada' })

    expect(result.isError).toBe(false)
    expect(result.content).toEqual([{ type: 'text', text: 'Hi, Ada!' }])

    await fiber.dispose()
    expect(ctx.tools.get('greet')).toBeUndefined()
  })

  it('uses the schema defaults when configuration omits both fields', async () => {
    const { ctx } = await mount()
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => {})

    const result = await execute(ctx, 'greet', { name: 'Ada' })

    expect(result.content).toEqual([{ type: 'text', text: 'Hello, Ada!' }])
    expect(info).toHaveBeenCalledWith('[plugin-demo] greet -> [{"type":"text","text":"Hello, Ada!"}]')
  })

  it('logs completed greet calls when observation is enabled', async () => {
    const { ctx } = await mount({ observe: true })
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => {})

    await execute(ctx, 'greet', { name: 'Ada' })

    expect(info).toHaveBeenCalledWith('[plugin-demo] greet -> [{"type":"text","text":"Hello, Ada!"}]')
  })

  it('ignores results of other tools', async () => {
    const { ctx } = await mount({ observe: true })
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => {})
    ctx.tools.register(defineTool({
      name: 'ping',
      description: 'Return pong.',
      parameters: {},
      output: {
        schema: { type: 'string' },
        render: () => [{ type: 'text', text: 'pong' }],
      },
      async execute() {
        return 'pong'
      },
    }))

    await execute(ctx, 'ping', {})

    expect(info).not.toHaveBeenCalled()
  })

  it('does not observe results when observation is disabled', async () => {
    const { ctx } = await mount({ observe: false })
    const info = vi.spyOn(ctx.logger, 'info').mockImplementation(() => {})

    await execute(ctx, 'greet', { name: 'Ada' })

    expect(info).not.toHaveBeenCalled()
  })
})
