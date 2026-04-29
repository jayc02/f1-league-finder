import { PrismaClient } from '@prisma/client';
import { shouldLogPerf } from '@/lib/utils/perf';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: shouldLogPerf() ? [{ level: 'query', emit: 'event' }, 'warn', 'error'] : ['error'],
  });

if (shouldLogPerf()) {
  client.$on('query', (event) => {
    if (event.duration >= 40) {
      console.info(`[perf][prisma] ${event.duration}ms ${event.query.split('\n')[0]?.slice(0, 120)}`);
    }
  });
}

export const prisma = client;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client;
}
