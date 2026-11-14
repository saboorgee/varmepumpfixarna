"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * The "Om oss" location card. Shows the illustrated card (`children`) until the
 * visitor clicks "Visa på Google Maps"; only then is the Google Maps iframe
 * loaded, so no request goes to Google without the visitor's choice.
 */
export function LocalMap({ address, children }: { address: string; children: ReactNode }) {
  const [showMap, setShowMap] = useState(false);
  const query = encodeURIComponent(address);

  if (showMap) {
    return (
      <div className="local-visual local-visual-map">
        <iframe
          className="local-map-frame"
          src={`https://www.google.com/maps?q=${query}&hl=sv&z=13&output=embed`}
          title={`Karta: ${address}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="local-visual">
      {children}
      <button type="button" className="local-map-button" onClick={() => setShowMap(true)}>
        <Icon name="pin" />
        Visa på Google Maps
      </button>
    </div>
  );
}
