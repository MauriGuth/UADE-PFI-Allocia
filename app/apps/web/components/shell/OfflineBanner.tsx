"use client";

import { useEffect, useState } from "react";
import { IconWifiOff } from "../icons";

// Aviso global cuando el navegador pierde la conexión; al volver, se oculta solo.
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="no-print fixed inset-x-0 top-0 z-[55] flex items-center justify-center gap-2 bg-primary px-4 py-2 text-[13px] font-medium text-on-primary"
    >
      <IconWifiOff size={16} /> Sin conexión. Los cambios y la actualización de datos se reanudan cuando vuelvas a estar en línea.
    </div>
  );
}
