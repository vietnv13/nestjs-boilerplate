# @workspace/nestjs-request-context

Request context helpers built on `nestjs-cls`:

- `createClsConfig()` to configure `ClsModule`
- W3C Trace Context parsing (`traceparent` / `tracestate`)

## Usage

```ts
import { Module } from '@nestjs/common'
import { ClsModule } from 'nestjs-cls'
import { createClsConfig } from '@workspace/nestjs-request-context'

@Module({
  imports: [ClsModule.forRoot(createClsConfig())],
})
export class AppModule {}
```

Headers supported:

- `x-request-id`
- `x-correlation-id`
- `traceparent`, `tracestate`
- `api-version`, `x-api-version`
