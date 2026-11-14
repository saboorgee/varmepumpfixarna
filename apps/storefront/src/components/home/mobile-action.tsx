"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

/** Sticky "Få en gratis offert" bar on phones; hidden while the form is visible. */
export function MobileAction() {
  const [formVisible, setFormVisible] = useState(false);
  useEffect(() => {
    const form = document.getElementById("offert");
    if (!form || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => setFormVisible(entries[0].isIntersecting), {
      threshold: 0.12,
    });
    observer.observe(form);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`mobile-action${formVisible ? " is-hidden" : ""}`}>
      <a href="#offert">
        Få en gratis offert <Icon name="diagonal" />
      </a>
      <a href={SITE.phoneHref} className="mobile-call" aria-label={`Ring oss på ${SITE.phone}`}>
        <Icon name="phone" />
        Ring
      </a>
    </div>
  );
}
