export interface Equipment {
  id: number;
  name: string;
  type: string | null;
  serialNumber: string | null;
  registryNumber: string | null;
  verificationDate: string | null;
  nextVerification: string | null;
  interval: number;
  category: string;
  status: string;
  company: string | null;
  contactEmail: string | null;
  notes: string | null;
  arshinMismatch: boolean;
  arshinValidDate: string | null;
  arshinUrl: string | null;
  mitApproved: boolean | null;
  mitUrl: string | null;
  ignored: boolean;
  pinned: boolean;
  requestItems?: { id: number; request: { id: number; status: string; createdAt: string } }[];
}

export interface VerificationRecord {
  id: number;
  date: string;
  nextDate: string | null;
  result: string | null;
  performer: string | null;
  certificate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ArshinItem {
  miFullNumber: string;
  miName: string;
  miType: string;
  miManufacturer: string;
  miSerialNumber: string;
  miRegestryNumber: string;
  validDate: string;
  vriDate: string;
  arshinUrl: string;
  orgTitle?: string;
}

export interface EquipmentFormData {
  name: string;
  type: string;
  serialNumber: string;
  registryNumber: string;
  verificationDate: string;
  nextVerification: string;
  interval: number;
  category: string;
  company: string;
  contactEmail: string;
  notes: string;
  arshinUrl: string;
}

export const categoryLabels: Record<string, string> = {
  verification: "Поверка",
  calibration: "Калибровка",
  attestation: "Аттестация",
};
