/**
 * Reference plugin: a configurable `greet` tool plus a `tools/result` log line.
 * It demonstrates the plugin form, configuration schema, injected tool registry,
 * and effect-owned registration. Install the package as a profile bundle; the
 * model calls the tool like any shipped tool.
 * @module @deepseek-ai/dsh-plugin-demo
 */

import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export const name = 'plugin-demo'
export const inject = ['tools']

/** Deployment choices for the greeting tool. */
export interface Config {
  /** Word placed before the greeted name (default `Hello`). */
  greeting: string
  /** Log one line for each completed `greet` call (default true). */
  observe: boolean
}

export const Config: z<Config> = z.object({
  greeting: z.string().default('Hello'),
  observe: z.boolean().default(true),
})

/**
 * Register the demo tool and its optional result observer.
 * @param ctx - plugin context; `tools` is available because of {@link inject}.
 * @param config - validated deployment configuration.
 */
export function apply(ctx: Context, config: Config) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet a person by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'Person to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `${config.greeting}, ${args.name}!`
    },
  }))

  if (!config.observe) return
  ctx.on('tools/result', (execution, result) => {
    if (execution.name !== 'greet') return
    ctx.logger.info(`[plugin-demo] ${execution.name} -> ${JSON.stringify(result.content)}`)
  })
}
