import { Controller, Get, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiExcludeController } from '@nestjs/swagger'

/**
 * Swagger dev helper controller - provides test credentials (dev only)
 * Reads SWAGGER_TEST_EMAIL and SWAGGER_TEST_PASSWORD from ConfigService
 */
@Controller('.well-known')
@ApiExcludeController()
export class SwaggerDevController {
  constructor(private readonly config: ConfigService) {}

  /**
   * Get Swagger test credentials (dev only)
   */
  @Get('swagger-credentials')
  getCredentials() {
    if (process.env['NODE_ENV'] === 'production') {
      throw new NotFoundException()
    }

    const email = this.config.get<string>('SWAGGER_TEST_EMAIL')
    const password = this.config.get<string>('SWAGGER_TEST_PASSWORD')

    if (!email || !password) {
      return {}
    }

    return { email, password }
  }
}
