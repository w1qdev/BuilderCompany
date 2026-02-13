"use client";

import ScheduleView from "@/components/ScheduleView";

export default function IOSchedulePage() {
  return (
    <ScheduleView
      title="График аттестации ИО"
      categories={["attestation"]}
      equipmentLink="/dashboard/equipment/io"
      equipmentLinkLabel="Оборудование ИО"
    />
  );
}
