import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'
import { ClsModule } from 'nestjs-cls'

import { DB_TOKEN } from '@/shared-kernel/infrastructure/db/db.port'

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
        EventEmitterModule.forRoot(),
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
