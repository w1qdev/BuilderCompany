"use client";

interface MapProps {
  address?: string;
}

export default function YandexMap({
  address = "г. Екатеринбург, ул. Маневровая, 9",
}: MapProps) {
  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden">
      <iframe
        src="https://maps.google.com/maps?q=56.872698,60.515485&z=16&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 300 }}
        loading="lazy"
        title="Карта — ЦСМ"
      />

      {/* Overlay with address */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-dark/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-dark dark:text-white text-sm">{address}</p>
            <p className="text-neutral dark:text-white/60 text-xs mt-1">
              Пн-Пт: 9:00 - 18:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
