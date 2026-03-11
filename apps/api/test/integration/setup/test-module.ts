import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { ClsModule } from 'nestjs-cls'

import { CacheModule } from '@workspace/nestjs-cache'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import { testDb } from './test-database'

import type { TestingModule } from '@nestjs/testing'

export const TestModuleBuilder = {
  async createTestingModule(imports: any[] = [], providers: any[] = []): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DATABASE_URL: testDb.connectionString,
              NODE_ENV: 'test',
            }),
          ],
        }),
        ClsModule.forRoot({
          global: true,
          middleware: { mount: false },
        }),
        CacheModule,
        ...imports,
      ],
      providers: [
        {
          provide: DB_TOKEN,
          useValue: testDb.db,
        },
        ...providers,
      ],
    }).compile()
  },
}
