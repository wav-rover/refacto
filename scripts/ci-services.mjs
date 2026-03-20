import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const serviceNames = [
  'auth-service',
  'project-service',
  'task-service',
  'notification-service',
  'api-gateway',
]

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const runNpmCi = (serviceDir) => {
  const result = spawnSync('npm', ['ci'], {
    cwd: serviceDir,
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) throw result.error
  if (typeof result.status === 'number' && result.status !== 0) process.exit(result.status)
}

for (const serviceName of serviceNames) {
  const serviceDir = path.join(rootDir, 'services', serviceName)
  // Run sequentially to keep logs readable and avoid hammering the machine.
  runNpmCi(serviceDir)
}

