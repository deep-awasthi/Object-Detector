import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    console.warn('[Prisma] DATABASE_URL not set — database operations will fail')
  }
  return new PrismaClient()
}

export const prisma = globalForPrisma.prisma || createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
