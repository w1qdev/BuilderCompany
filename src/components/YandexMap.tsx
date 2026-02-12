"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ymaps: any;
  }
}

interface YandexMapProps {
  center?: [number, number];
  zoom?: number;
  address?: string;
}

export default function YandexMap({
  center = [56.838011, 60.597474], // Екатеринбург
  zoom = 16,
  address = "г. Екатеринбург, ул. Маневровая, 9",
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // Load Yandex Maps API
    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?apikey=ваш_ключ&lang=ru_RU";
    script.async = true;

    script.onload = () => {
      window.ymaps.ready(() => {
        if (mapRef.current && !mapInstance.current) {
          // Create map
          mapInstance.current = new window.ymaps.Map(mapRef.current, {
            center,
            zoom,
            controls: ["zoomControl", "fullscreenControl"],
          });

          // Add placemark
          const placemark = new window.ymaps.Placemark(
            center,
            {
              balloonContentHeader: "ЦСМ",
              balloonContentBody: `
                <div style="padding: 10px;">
                  <p style="margin: 0 0 8px; font-weight: 600;">Центр Стандартизации и Метрологии</p>
                  <p style="margin: 0 0 4px; color: #666; font-size: 14px;">${address}</p>
                  <p style="margin: 0; color: #666; font-size: 14px;">Пн-Пт: 9:00 - 18:00</p>
                </div>
              `,
              hintContent: "ЦСМ — Центр Стандартизации и Метрологии",
            },
            {
              preset: "islands#orangeDotIcon",
              iconColor: "#E87A2E",
            }
          );

          mapInstance.current.geoObjects.add(placemark);

          // Disable scroll zoom by default (can be enabled by clicking)
          mapInstance.current.behaviors.disable("scrollZoom");
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      // Remove script on cleanup
      const existingScript = document.querySelector(
        'script[src*="api-maps.yandex.ru"]'
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [center, zoom, address]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay with address for better UX */}
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
              Нажмите на карту для взаимодействия
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
