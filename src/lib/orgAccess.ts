import { prisma } from "@/lib/prisma";

export async function canAccessOrgEquipment(userId: number, equipmentId: number): Promise<boolean> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { userId: true, organizationId: true },
  });
  if (!equipment) return false;
  if (!equipment.organizationId) return equipment.userId === userId;
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: equipment.organizationId } },
  });
  return !!membership;
}

export async function isOrgMember(userId: number, organizationId: number): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  return !!membership;
}
