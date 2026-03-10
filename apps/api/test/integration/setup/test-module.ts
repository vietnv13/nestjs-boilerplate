import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ClsModule } from "nestjs-cls";
import { testDb } from "./test-database";
import { DB_TOKEN } from "@/shared-kernel/infrastructure/db/db.port";

export class TestModuleBuilder {
  static async createTestingModule(
    imports: any[] = [],
    providers: any[] = [],
  ): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DATABASE_URL: testDb.connectionString,
              NODE_ENV: "test",
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
    }).compile();
  }
}
