"use client";

import ScheduleView from "@/components/ScheduleView";

export default function SISchedulePage() {
  return (
    <ScheduleView
      title="График поверки СИ"
      categories={["verification", "calibration"]}
      equipmentLink="/dashboard/equipment/si"
      equipmentLinkLabel="Оборудование СИ"
      exportType="si"
    />
  );
}
