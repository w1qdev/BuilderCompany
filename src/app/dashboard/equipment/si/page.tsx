"use client";

import EquipmentList from "@/components/EquipmentList";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SIEquipmentContent() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight") || searchParams.get("id");
  const highlightId = highlightParam ? Number(highlightParam) : undefined;

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
      highlightId={highlightId}
    />
  );
}

export default function SIEquipmentPage() {
  return (
    <Suspense>
      <SIEquipmentContent />
    </Suspense>
  );
}
