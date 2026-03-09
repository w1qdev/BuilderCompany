import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export interface MatchedExecutor {
  id: number;
  name: string;
  email: string;
}

/**
 * Find best executor for given service(s).
 * Searches Executor.services JSON array for substring matches.
 * Returns first active match, or null if none found.
 */
export async function findExecutorForService(
  serviceNames: string[]
): Promise<MatchedExecutor | null> {
  const executors = await prisma.executor.findMany({
    where: { active: true },
    select: { id: true, name: true, email: true, services: true },
  });

  for (const executor of executors) {
    let executorServices: string[];
    try {
      executorServices = JSON.parse(executor.services);
    } catch {
      continue;
    }

    const matches = serviceNames.some((requestService) =>
      executorServices.some(
        (execService) =>
          execService.toLowerCase().includes(requestService.toLowerCase()) ||
          requestService.toLowerCase().includes(execService.toLowerCase())
      )
    );

    if (matches) {
      return { id: executor.id, name: executor.name, email: executor.email };
    }
  }

  logger.info(`No executor found for services: ${serviceNames.join(", ")}`);
  return null;
}
