import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export interface MatchedExecutor {
  id: number;
  name: string;
  email: string;
}

interface RequestItemInput {
  service: string;
  equipmentTypeId?: number | null;
}

/**
 * Find best executor for given request items using structured specializations.
 *
 * Algorithm:
 * 1. Collect required (service, equipmentTypeId) pairs from items that have equipmentTypeId
 * 2. For each active executor, check if they cover ALL required pairs
 * 3. If no items have equipmentTypeId, fall back to old substring matching
 */
export async function findExecutorForService(
  serviceNames: string[],
  items?: RequestItemInput[]
): Promise<MatchedExecutor | null> {
  // Collect required pairs from items
  const requiredPairs = (items || [])
    .filter((item) => item.equipmentTypeId)
    .map((item) => ({
      service: item.service,
      equipmentTypeId: item.equipmentTypeId!,
    }));

  // If we have structured pairs, use specialization-based matching
  if (requiredPairs.length > 0) {
    const executors = await prisma.executor.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        specializations: {
          select: { serviceType: true, equipmentTypeId: true },
        },
      },
    });

    for (const executor of executors) {
      const specs = executor.specializations;
      const coversAll = requiredPairs.every((pair) =>
        specs.some(
          (spec) =>
            spec.equipmentTypeId === pair.equipmentTypeId &&
            (spec.serviceType.toLowerCase().includes(pair.service.toLowerCase()) ||
              pair.service.toLowerCase().includes(spec.serviceType.toLowerCase()))
        )
      );

      if (coversAll) {
        logger.info(
          `Executor "${executor.name}" matched via specializations for ${requiredPairs.length} pair(s)`
        );
        return { id: executor.id, name: executor.name, email: executor.email };
      }
    }

    logger.info(
      `No executor covers all ${requiredPairs.length} required specialization pair(s)`
    );
    return null;
  }

  // Fallback: old substring-based matching on Executor.services field
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
