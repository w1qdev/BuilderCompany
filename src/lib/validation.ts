import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Некорректный формат email"),
  password: z.string().min(8, "Пароль должен быть не менее 8 символов"),
  name: z.string().min(1, "Имя обязательно").max(100),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный формат email"),
  password: z.string().min(1, "Пароль обязателен"),
  rememberMe: z.boolean().optional(),
});

// Equipment schemas
export const equipmentCreateSchema = z.object({
  name: z.string().min(1, "Наименование обязательно").max(200),
  type: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  registryNumber: z.string().max(100).optional().nullable(),
  verificationDate: z.string().optional().nullable(),
  nextVerification: z.string().optional().nullable(),
  interval: z.number().int().min(1).max(120).default(12),
  category: z.enum(["verification", "calibration", "attestation"]).default("verification"),
  company: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  notes: z.string().max(1000).optional().nullable(),
  arshinUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const equipmentUpdateSchema = equipmentCreateSchema.partial();

// Submit (request) schemas
const submitItemSchema = z.object({
  service: z.string().min(1, "Услуга обязательна"),
  poverk: z.string().optional().nullable(),
  object: z.string().optional().nullable(),
  fabricNumber: z.string().optional().nullable(),
  registry: z.string().optional().nullable(),
});

const submitFileSchema = z.object({
  fileName: z.string(),
  filePath: z.string(),
});

export const submitRequestSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(100),
  phone: z.string().min(1, "Телефон обязателен").max(30),
  email: z.string().email("Некорректный формат email"),
  company: z.string().max(200).optional().nullable(),
  inn: z.string().max(20).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  fileName: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
  needContract: z.boolean().optional().default(false),
  addEquipment: z.boolean().optional().default(false),
  service: z.string().optional(),
  poverk: z.string().optional().nullable(),
  object: z.string().optional().nullable(),
  fabricNumber: z.string().optional().nullable(),
  registry: z.string().optional().nullable(),
  items: z.array(submitItemSchema).optional(),
  files: z.array(submitFileSchema).optional().default([]),
});

// Bulk action schema
export const bulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
  action: z.enum(["delete", "archive", "unarchive"]),
});

// Organization schemas
export const organizationCreateSchema = z.object({
  name: z.string().min(1, "Название обязательно").max(200),
  inn: z.string().max(20).optional().nullable(),
  kpp: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
});

export const addMemberSchema = z.object({
  organizationId: z.number().int().positive(),
  email: z.string().email("Некорректный email"),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

// Helper to validate and return typed result or error response
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0]?.message || "Ошибка валидации";
  return { success: false, error: firstError };
}
