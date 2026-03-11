# @workspace/nestjs-logger

Pino-based structured logging for NestJS using `nestjs-pino`.

## Usage

```ts
import { Module } from '@nestjs/common'
import { LoggerModule } from '@workspace/nestjs-logger'

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

## Exports

- `LoggerModule`
- `createLoggerConfig(configService)`
- `redactPaths` and `redactCensor`
