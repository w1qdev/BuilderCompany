import { prisma } from "./prisma";

export async function canAccessOrgEquipment(userId: number, equipmentId: number): Promise<boolean> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { organizationId: true },
  });
  if (!equipment) return false;
  return isOrgMember(userId, equipment.organizationId);
}

export async function isOrgMember(userId: number, organizationId: number): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return !!membership;
}
