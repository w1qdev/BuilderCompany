"use client";

import EquipmentList from "@/components/EquipmentList";

export default function IOEquipmentPage() {
  return (
    <EquipmentList
      title="Испытательное оборудование"
      categories={["attestation"]}
      categoryOptions={[
        { value: "attestation", label: "Аттестация" },
      ]}
      defaultCategory="attestation"
      dateLabel="Дата последней аттестации"
      nextDateLabel="Дата следующей аттестации"
    />
  );
}
