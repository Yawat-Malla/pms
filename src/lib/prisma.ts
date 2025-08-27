import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Function to ensure database exists
export async function ensureDbExists() {
  try {
    // Test connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('database "pms_db" does not exist')) {
      console.error('Database does not exist. Please create it manually.');
    } else {
      console.error('Database connection error:', error);
    }
    return false;
  }
}