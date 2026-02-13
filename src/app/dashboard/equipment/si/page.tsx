"use client";

import EquipmentList from "@/components/EquipmentList";

export default function SIEquipmentPage() {
  return (
    <EquipmentList
      title="Средства измерений"
      categories={["verification", "calibration"]}
      categoryOptions={[
        { value: "verification", label: "Поверка" },
        { value: "calibration", label: "Калибровка" },
      ]}
      defaultCategory="verification"
      dateLabel="Дата последней поверки"
      nextDateLabel="Дата следующей поверки"
    />
  );
}
