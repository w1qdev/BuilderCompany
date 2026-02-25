"use client";

import EquipmentList from "@/components/EquipmentList";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function IOEquipmentContent() {
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight") || searchParams.get("id");
  const highlightId = highlightParam ? Number(highlightParam) : undefined;

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
      highlightId={highlightId}
    />
  );
}

export default function IOEquipmentPage() {
  return (
    <Suspense>
      <IOEquipmentContent />
    </Suspense>
  );
}
