import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { ProblemDetailsDto } from '@workspace/nestjs-problem-details'

import type { INestApplication } from '@nestjs/common'
import type { OpenAPIObject, SwaggerCustomOptions } from '@nestjs/swagger'

/**
 * Options for configuring the Swagger/Scalar documentation
 */
export interface SwaggerSetupOptions {
  title: string
  description: string
  version: string
  tags?: { name: string; description: string }[]
  servers?: { url: string; description: string }[]
}

const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
}

/**
 * Add default error responses to all endpoints (RFC 9457 Problem Details)
 */
function addDefaultErrorResponses(document: OpenAPIObject): void {
  if (!document.paths) return

  for (const path in document.paths) {
    const pathItem = document.paths[path]
    if (!pathItem) continue

    for (const method in pathItem) {
      // Skip non-HTTP method properties
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        continue
      }

      const operation = pathItem[method as keyof typeof pathItem]
      if (!operation || typeof operation !== 'object' || !('responses' in operation)) {
        continue
      }

      // Skip if default response already defined
      if (operation.responses && !operation.responses.default) {
        operation.responses.default = {
          description: 'Error response (400/401/403/404/422/429/500 etc.)',
          content: {
            'application/problem+json': {
              schema: {
                $ref: '#/components/schemas/ProblemDetailsDto',
              },
            },
          },
        }
      }
    }
  }
}

/**
 * Setup API documentation
 * - /docs  — Scalar API reference (default)
 * - /swagger — Swagger UI (fallback)
 * - /openapi.yaml — Raw OpenAPI spec
 */
export async function setupSwagger(
  app: INestApplication,
  options: SwaggerSetupOptions,
): Promise<void> {
  await Promise.resolve()

  const builder = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth()

  for (const server of options.servers ?? []) {
    builder.addServer(server.url, server.description)
  }

  for (const tag of options.tags ?? []) {
    builder.addTag(tag.name, tag.description)
  }

  const config = builder.build()

  const document = SwaggerModule.createDocument(app, config, {
    include: [],
    deepScanRoutes: true,
    extraModels: [ProblemDetailsDto],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  })

  addDefaultErrorResponses(document)

  SwaggerModule.setup('swagger', app, document, {
    ...swaggerCustomOptions,
    yamlDocumentUrl: '/openapi.yaml',
  })

  app.use(
    '/docs',
    apiReference({
      content: document,
    }),
  )
}
