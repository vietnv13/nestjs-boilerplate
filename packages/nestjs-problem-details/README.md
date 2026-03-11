# @workspace/nestjs-problem-details

RFC 9457 Problem Details helpers for NestJS:

- `ProblemDetailsDto` (response shape)
- `ProblemDetailsFilter` (global exception filter)
- Swagger helpers for documenting problem responses

## Usage

Register the filter as a provider and install it globally:

```ts
// app.module.ts
import { Module } from '@nestjs/common'
import { ProblemDetailsFilter } from '@workspace/nestjs-problem-details'

@Module({
  providers: [ProblemDetailsFilter],
})
export class AppModule {}
```

```ts
// main.ts
import { NestFactory } from '@nestjs/core'
import { ProblemDetailsFilter } from '@workspace/nestjs-problem-details'
import { AppModule } from './app.module'

const app = await NestFactory.create(AppModule)
app.useGlobalFilters(app.get(ProblemDetailsFilter))
```

## Environment variables

- `API_BASE_URL` (optional; used to build `type` URIs)

