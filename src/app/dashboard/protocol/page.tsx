"use client";

import { useState } from "react";

interface ProtocolForm {
  protocolNumber: string;
  date: string;
  equipmentName: string;
  equipmentType: string;
  serialNumber: string;
  registryNumber: string;
  owner: string;
  verificationType: string;
  method: string;
  conditions: string;
  result: string;
  conclusion: string;
  inspector: string;
  inspectorPosition: string;
}

const initialForm: ProtocolForm = {
  protocolNumber: "",
  date: new Date().toISOString().split("T")[0],
  equipmentName: "",
  equipmentType: "",
  serialNumber: "",
  registryNumber: "",
  owner: "",
  verificationType: "периодическая",
  method: "",
  conditions: "Температура: 20±5 °C, влажность: 30-80%, давление: 84-106.7 кПа",
  result: "",
  conclusion: "годен",
  inspector: "",
  inspectorPosition: "Инженер-метролог",
};

export default function ProtocolPage() {
  const [form, setForm] = useState<ProtocolForm>(initialForm);
  const [generating, setGenerating] = useState(false);

  const updateField = (field: keyof ProtocolForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generateProtocol = () => {
    setGenerating(true);

    const content = `
ПРОТОКОЛ ПОВЕРКИ № ${form.protocolNumber || "___"}

Дата: ${form.date ? new Date(form.date).toLocaleDateString("ru-RU") : "___________"}

1. СРЕДСТВО ИЗМЕРЕНИЙ
   Наименование: ${form.equipmentName || "___________"}
   Тип (модель): ${form.equipmentType || "___________"}
   Заводской номер: ${form.serialNumber || "___________"}
   Регистрационный номер: ${form.registryNumber || "___________"}
   Принадлежит: ${form.owner || "___________"}

2. ВИД ПОВЕРКИ
   ${form.verificationType || "___________"}

3. МЕТОДИКА ПОВЕРКИ
   ${form.method || "___________"}

4. УСЛОВИЯ ПОВЕРКИ
   ${form.conditions || "___________"}

5. РЕЗУЛЬТАТЫ ПОВЕРКИ
   ${form.result || "___________"}

6. ЗАКЛЮЧЕНИЕ
   По результатам поверки средство измерений признано: ${form.conclusion === "годен" ? "ГОДНЫМ" : "НЕГОДНЫМ"}

Поверитель: ${form.inspectorPosition || "___________"} _____________ ${form.inspector || "___________"}
                                                         (подпись)         (Ф.И.О.)

Дата: ${form.date ? new Date(form.date).toLocaleDateString("ru-RU") : "___________"}
    `.trim();

    // Create a printable HTML page
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Протокол поверки № ${form.protocolNumber || "___"}</title>
  <style>
    @page { margin: 2cm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 14px; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; font-size: 18px; margin: 20px 0; text-transform: uppercase; }
    .date { text-align: right; margin-bottom: 20px; }
    .section { margin: 16px 0; }
    .section-title { font-weight: bold; margin-bottom: 8px; }
    .field { margin: 4px 0 4px 20px; }
    .field-label { display: inline-block; min-width: 200px; }
    .conclusion { font-size: 16px; font-weight: bold; text-align: center; margin: 24px 0; padding: 12px; border: 2px solid ${form.conclusion === "годен" ? "#16a34a" : "#dc2626"}; background: ${form.conclusion === "годен" ? "#f0fdf4" : "#fef2f2"}; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
    .signature-line { border-bottom: 1px solid #000; min-width: 150px; text-align: center; }
    .no-print { margin: 20px 0; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="padding: 10px 24px; background: #e8733a; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Печать / Сохранить PDF</button>
  </div>

  <h1>Протокол поверки № ${form.protocolNumber || "___"}</h1>
  <div class="date">Дата: ${form.date ? new Date(form.date).toLocaleDateString("ru-RU") : "___________"}</div>

  <div class="section">
    <div class="section-title">1. СРЕДСТВО ИЗМЕРЕНИЙ</div>
    <div class="field"><span class="field-label">Наименование:</span> ${form.equipmentName || "___________"}</div>
    <div class="field"><span class="field-label">Тип (модель):</span> ${form.equipmentType || "___________"}</div>
    <div class="field"><span class="field-label">Заводской номер:</span> ${form.serialNumber || "___________"}</div>
    <div class="field"><span class="field-label">Регистрационный номер:</span> ${form.registryNumber || "___________"}</div>
    <div class="field"><span class="field-label">Принадлежит:</span> ${form.owner || "___________"}</div>
  </div>

  <div class="section">
    <div class="section-title">2. ВИД ПОВЕРКИ</div>
    <div class="field">${form.verificationType || "___________"}</div>
  </div>

  <div class="section">
    <div class="section-title">3. МЕТОДИКА ПОВЕРКИ</div>
    <div class="field">${form.method || "___________"}</div>
  </div>

  <div class="section">
    <div class="section-title">4. УСЛОВИЯ ПОВЕРКИ</div>
    <div class="field">${form.conditions || "___________"}</div>
  </div>

  <div class="section">
    <div class="section-title">5. РЕЗУЛЬТАТЫ ПОВЕРКИ</div>
    <div class="field">${form.result || "___________"}</div>
  </div>

  <div class="conclusion">
    По результатам поверки средство измерений признано: <strong>${form.conclusion === "годен" ? "ГОДНЫМ" : "НЕГОДНЫМ"}</strong>
  </div>

  <div class="signature">
    <div>
      <div>Поверитель:</div>
      <div style="margin-top: 8px;">${form.inspectorPosition || "___________"}</div>
    </div>
    <div class="signature-line" style="margin: 0 20px;">
      <br>(подпись)
    </div>
    <div class="signature-line">
      ${form.inspector || "___________"}<br>(Ф.И.О.)
    </div>
  </div>
</body>
</html>`);
      printWindow.document.close();
    }

    // Also copy to clipboard
    navigator.clipboard.writeText(content).catch(() => {});
    setGenerating(false);
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-dark dark:text-white mb-2">
        Генератор протоколов поверки
      </h1>
      <p className="text-sm text-neutral dark:text-white/60 mb-6">
        Заполните форму для генерации печатного протокола поверки
      </p>

      <div className="bg-white dark:bg-dark-light rounded-2xl shadow-sm p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Номер протокола</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.protocolNumber} onChange={(e) => updateField("protocolNumber", e.target.value)} placeholder="001/2026" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Дата</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-white/10" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Наименование СИ</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.equipmentName} onChange={(e) => updateField("equipmentName", e.target.value)} placeholder="Манометр" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Тип/Модель</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.equipmentType} onChange={(e) => updateField("equipmentType", e.target.value)} placeholder="МП-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Заводской номер</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.serialNumber} onChange={(e) => updateField("serialNumber", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Номер реестра</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.registryNumber} onChange={(e) => updateField("registryNumber", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral mb-1">Принадлежит (организация)</label>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.owner} onChange={(e) => updateField("owner", e.target.value)} placeholder='ООО "Компания"' />
        </div>

        <hr className="border-gray-200 dark:border-white/10" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Вид поверки</label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.verificationType} onChange={(e) => updateField("verificationType", e.target.value)}>
              <option value="первичная">Первичная</option>
              <option value="периодическая">Периодическая</option>
              <option value="внеочередная">Внеочередная</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Заключение</label>
            <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.conclusion} onChange={(e) => updateField("conclusion", e.target.value)}>
              <option value="годен">Годен</option>
              <option value="не годен">Не годен</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral mb-1">Методика поверки</label>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.method} onChange={(e) => updateField("method", e.target.value)} placeholder="МИ 2124-90, ГОСТ 8.529-85" />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral mb-1">Условия поверки</label>
          <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.conditions} onChange={(e) => updateField("conditions", e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral mb-1">Результаты поверки</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm resize-none" rows={3} value={form.result} onChange={(e) => updateField("result", e.target.value)} placeholder="Все метрологические характеристики соответствуют требованиям..." />
        </div>

        <hr className="border-gray-200 dark:border-white/10" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Поверитель (Ф.И.О.)</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.inspector} onChange={(e) => updateField("inspector", e.target.value)} placeholder="Иванов И.И." />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral mb-1">Должность</label>
            <input className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-dark text-sm" value={form.inspectorPosition} onChange={(e) => updateField("inspectorPosition", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={generateProtocol}
            disabled={generating}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            Сгенерировать протокол
          </button>
          <button
            onClick={() => setForm(initialForm)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-white/5 text-neutral hover:bg-gray-200 transition-colors"
          >
            Очистить
          </button>
        </div>
      </div>

      {/* FGIS Arshin link */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5">
        <h3 className="font-semibold text-dark dark:text-white mb-2">Полезные ресурсы</h3>
        <div className="space-y-2 text-sm">
          <a
            href="https://fgis.gost.ru/fundmetrology/registry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            ФГИС «Аршин» — реестр утверждённых типов СИ
          </a>
          <a
            href="https://fgis.gost.ru/fundmetrology/registry/4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Реестр аккредитованных лиц (поверители)
          </a>
        </div>
      </div>
    </div>
  );
}
