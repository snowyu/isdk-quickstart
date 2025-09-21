import path from 'path'
import { fileURLToPath } from 'url';

import { AIAgent, AIEventBus, LocalProviderProgressEventName, register } from '@isdk/ai-simple-agent'
import { beforeShutdown } from '@isdk/ai-tool';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const brainDir = '~/.local/share/ai/brain/'
await register({brainDir})

{ // 监听加载模型进度
  let loading: boolean|undefined
  AIEventBus.on(LocalProviderProgressEventName, (progress: number, {filepath, type}: {filepath: string, type: string}) => {
    if (!loading) {
      loading = true
      console.log(`Loading ${type} ${path.basename(filepath)}`)
    }
    if (progress === 1) {
      console.log(`Loaded ${type} ${path.basename(filepath)}`)
    }
  })
}

{ // 配置运行智能体脚本
  AIAgent.logLevel = 'silence'
  // AIAgent.logLevel = 'debug'
  const agentScript = await AIAgent.loadFile(path.join(__dirname, 'char_lisi.ai.yaml'))
  const runtime = await agentScript.getRuntime(false);

  agentScript.llmStream = false // 是否启用流式输出，启用后会触发 'llmStream' 事件
  agentScript.autoRunLLMIfPromptAvailable = false // 禁止在脚本最后自动运行 LLM 模型，因为这里需要我们手动交互执行
  runtime.on('error', async (error: any) => {
    // 忽略 Abort 错误
    if (error.name !== 'AbortError') {
      console.error(error)
      process.exit(error.code || 1)
    }
  })

  // 当 ctrl+c 按下时，触发 interrupted，中断运行
  let quit: boolean|undefined;
  const interrupted = () => {
    quit = true
    if (!runtime.isToolAborted()) {
      runtime.abortTool()
    }
  }
  beforeShutdown(interrupted)

  const agentName = runtime.name || 'ai'

  // 执行智能体脚本
  await runtime.run()

  // 获取结果
  let result = runtime.LatestResult

  // 这里最后一次的结果是脚本最后一个语句的结果
  // console.log(`🚀 ~ ${agentName}:`, result)

  // 进行本次会话的第一轮交互并获得响应结果, shouldRemember: false 表示不保存本轮消息到记忆库, 默认是保存。
  result = await runtime.$interact({message: {role: 'user', content: '我们有聊过关于生命的意义话题吗？，如果有聊过，请告诉我是什么时候？', shouldRemember: false}})
  console.log(`🚀 ~ ${agentName}:`, result)
}
