"use client";

import { useState } from "react";

const NOVA_LOCAL_URL = "https://local.novaagency.info?embed=true";

export default function LocalEmbedClient() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 64px)" }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#e1691e", borderTopColor: "transparent" }}
            />
            <p className="text-sm text-[#94A3B8]">Cargando Nova Local...</p>
          </div>
        </div>
      )}
      <iframe
        src={NOVA_LOCAL_URL}
        className="w-full h-full border-0"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
        onLoad={() => setLoaded(true)}
        allow="camera; clipboard-write"
        title="Nova Local"
      />
    </div>
  );
}
