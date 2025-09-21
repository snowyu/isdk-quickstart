import path from 'path'
import { fileURLToPath } from 'url';
import logUpdate from 'log-update'
import colors from 'ansicolor'
import { beforeShutdown, formatTextWithSpace, shutdown } from '@isdk/ai-tool';

import { AIAgent, AIEventBus, LocalProviderProgressEventName, register } from '@isdk/ai-simple-agent'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const brainDir = '~/.local/share/ai/brain/'
// const defaultModel = 'qwen2.5-3b-instruct.Q4_0.gguf'

await register({brainDir})

AIEventBus.on(LocalProviderProgressEventName, (progress: number, {filepath, type}: {filepath: string, type: string}) => {
  logUpdate(`Loading ${type} ${path.basename(filepath)} ${(progress*100).toFixed(2)}%`)
  if (progress === 1) {
    logUpdate.persist(`Loaded ${type} ${path.basename(filepath)}`)
  }
})


AIAgent.logLevel = 'silence'
// AIAgent.logLevel = 'debug'

const agentScript = await AIAgent.loadFile(path.join(__dirname, 'cha_lisi.ai.yaml'))

const runtime = await agentScript.getRuntime(false);

runtime.llmStream = true
runtime.on('error', async (error: any) => {
  if (error.name !== 'AbortError') {
    console.error(error)
    process.exit(error.code || 1)
  }
})

let quit: boolean|undefined;
const consoleClear = false;

const interrupted = () => {
  quit = true
  if (!runtime.isToolAborted()) {
    runtime.abortTool()
  }
}
// ctrl+c
beforeShutdown(interrupted)


// when llmStream is true
let retryCount = 0
let llmLastContent = ''
runtime.on('llmStream', async function(llmResult: {content: string, stop?: boolean}, content: string, count: number, id?: string) {
  const runtime = this.target as AIAgent
  if (quit) {
    runtime.abortTool('quit')
    await shutdown()
  }

  let s = llmResult.content
  if (count !== retryCount) {
    retryCount = count
    s += colors.blue(`<续:${count}>`)
  }

  if (!id && runtime.id) {id = runtime.id}

  if (!llmLastContent && !consoleClear && id) {process.stdout.write('['+formatTextWithSpace(id)+']: ')}

  llmLastContent += s

  if (consoleClear) {
    if (llmLastContent) logUpdate((id ? '['+formatTextWithSpace(id)+']: ' : '') + llmLastContent.trim())
  } else {
    if (s) process.stdout.write(s.trimStart())
  }

  if (llmResult.stop) {
    llmLastContent = ''
    if (consoleClear) {
      logUpdate.clear()
    } else {
      process.stdout.write('\n')
    }
  }
})

const agentName = runtime.name || 'ai'

// 执行脚本
await runtime.run()

let result = runtime.LatestResult

console.log(`🚀 ~ ${agentName}:`, result)

// result = await runtime.$interact({message: '用一句话告诉我，为啥人总是贪生怕死?'})

// console.log(`🚀 ~ ${agentName}:`, result)

// result = await runtime.$interact({message: '为啥天空是蔚蓝的?'})

// console.log(`🚀 ~ ${agentName}:`, result)
