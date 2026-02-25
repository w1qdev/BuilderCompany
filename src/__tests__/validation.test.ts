import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  equipmentCreateSchema,
  submitRequestSchema,
  bulkActionSchema,
  organizationCreateSchema,
  addMemberSchema,
  validate,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = validate(registerSchema, {
      email: "test@example.com",
      password: "123456",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = validate(registerSchema, {
      password: "123456",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validate(registerSchema, {
      email: "notanemail",
      password: "123456",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = validate(registerSchema, {
      email: "test@example.com",
      password: "12345",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = validate(registerSchema, {
      email: "test@example.com",
      password: "123456",
      name: "Test",
      phone: "+79991234567",
      company: "Test Co",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+79991234567");
      expect(result.data.company).toBe("Test Co");
    }
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = validate(loginSchema, {
      email: "test@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = validate(loginSchema, {
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("equipmentCreateSchema", () => {
  it("accepts minimal equipment data", () => {
    const result = validate(equipmentCreateSchema, {
      name: "Прибор-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interval).toBe(12);
      expect(result.data.category).toBe("verification");
    }
  });

  it("rejects empty name", () => {
    const result = validate(equipmentCreateSchema, {
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts full equipment data", () => {
    const result = validate(equipmentCreateSchema, {
      name: "Манометр МП-100",
      type: "Манометр",
      serialNumber: "123456",
      registryNumber: "67890",
      verificationDate: "2024-01-15",
      nextVerification: "2025-01-15",
      interval: 12,
      category: "verification",
      company: "ООО Тест",
      contactEmail: "test@test.com",
      notes: "Заметки",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = validate(equipmentCreateSchema, {
      name: "Прибор",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects interval > 120", () => {
    const result = validate(equipmentCreateSchema, {
      name: "Прибор",
      interval: 200,
    });
    expect(result.success).toBe(false);
  });
});

describe("submitRequestSchema", () => {
  it("accepts valid submit with service", () => {
    const result = validate(submitRequestSchema, {
      name: "Иванов",
      phone: "+79991234567",
      email: "test@test.com",
      service: "Поверка СИ",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid submit with items array", () => {
    const result = validate(submitRequestSchema, {
      name: "Иванов",
      phone: "+79991234567",
      email: "test@test.com",
      items: [
        { service: "Поверка СИ", object: "Манометр" },
        { service: "Калибровка", object: "Термометр" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = validate(submitRequestSchema, {
      phone: "+79991234567",
      email: "test@test.com",
      service: "Поверка",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = validate(submitRequestSchema, {
      name: "Иванов",
      phone: "+79991234567",
      email: "bad-email",
      service: "Поверка",
    });
    expect(result.success).toBe(false);
  });
});

describe("bulkActionSchema", () => {
  it("accepts valid bulk action", () => {
    const result = validate(bulkActionSchema, {
      ids: [1, 2, 3],
      action: "delete",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid action", () => {
    const result = validate(bulkActionSchema, {
      ids: [1],
      action: "destroy",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty ids", () => {
    const result = validate(bulkActionSchema, {
      ids: [],
      action: "delete",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid action types", () => {
    for (const action of ["delete", "archive", "unarchive"]) {
      const result = validate(bulkActionSchema, { ids: [1], action });
      expect(result.success).toBe(true);
    }
  });
});

describe("organizationCreateSchema", () => {
  it("accepts valid org data", () => {
    const result = validate(organizationCreateSchema, {
      name: "ООО Тест",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = validate(organizationCreateSchema, {
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts full org data", () => {
    const result = validate(organizationCreateSchema, {
      name: "ООО Тест",
      inn: "1234567890",
      kpp: "123456789",
      address: "г. Москва",
    });
    expect(result.success).toBe(true);
  });
});

describe("addMemberSchema", () => {
  it("accepts valid member data", () => {
    const result = validate(addMemberSchema, {
      organizationId: 1,
      email: "member@test.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("member");
    }
  });

  it("rejects missing org id", () => {
    const result = validate(addMemberSchema, {
      email: "member@test.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts admin role", () => {
    const result = validate(addMemberSchema, {
      organizationId: 1,
      email: "admin@test.com",
      role: "admin",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("admin");
    }
  });
});
