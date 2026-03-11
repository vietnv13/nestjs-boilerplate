#!/usr/bin/env node

/**
 * Database seed script
 *
 * Creates a test user account for Swagger auto-login.
 * Requires SWAGGER_TEST_EMAIL and SWAGGER_TEST_PASSWORD in .env.
 *
 * Usage: pnpm db:seed
 */

import { randomUUID } from 'node:crypto'

import bcrypt from 'bcrypt'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { accountsTable, usersTable } from '../dist/index.js'

config()

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not configured')
    process.exit(1)
  }

  const email = process.env.SWAGGER_TEST_EMAIL
  const password = process.env.SWAGGER_TEST_PASSWORD

  if (!email || !password) {
    console.error('❌ SWAGGER_TEST_EMAIL or SWAGGER_TEST_PASSWORD is not configured')
    console.error('Add them to your .env file:')
    console.error('  SWAGGER_TEST_EMAIL=test@example.com')
    console.error('  SWAGGER_TEST_PASSWORD=TestPassword123')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: databaseUrl })
  const db = drizzle(pool)

  try {
    console.log(`🔍 Checking for existing test account: ${email}`)

    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)

    if (existing) {
      console.log('✅ Test account already exists, skipping')
      return
    }

    console.log('📝 Creating test account...')

    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)

    await db.insert(usersTable).values({
      id: userId,
      name: 'Test User',
      email,
      emailVerified: true,
      role: 'user',
    })

    await db.insert(accountsTable).values({
      id: randomUUID(),
      userId,
      accountId: email,
      providerId: 'email',
      password: passwordHash,
    })

    console.log('✅ Test account created successfully')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

await seed()
