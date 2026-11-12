// Hero illustration: the heat pump is the subject – outdoor unit in front,
// an insulated pipe carrying heat into the house, warm windows, and
// "Ute −15 °C / Inne 21 °C". Same palette and line style as the category
// card illustrations. Key elements sit between x≈160 and x≈640 so the
// narrower crops on tablet/phone (preserveAspectRatio slice) keep them.

export function HeroArt() {
  return (
    <svg
      className="hero-svg"
      viewBox="0 0 800 394"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustration: en värmepump utanför ett hus som håller huset varmt – ute minus femton grader, inne tjugoett grader"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9eedf" />
          <stop offset="1" stopColor="#f3f3e9" />
        </linearGradient>
        <radialGradient id="hero-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f9dcbf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f9dcbf" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky, warm glow behind the house, ground */}
      <rect width="800" height="394" fill="url(#hero-sky)" />
      <circle cx="300" cy="190" r="190" fill="url(#hero-glow)" />
      <path d="M0 300h800v94H0z" fill="#e1e7d3" />
      <path d="M0 300h800" stroke="#a9b8a0" strokeWidth="2" />
      <path
        d="M40 330h120M220 352h150M470 336h170M660 362h110"
        stroke="#cfd8c4"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tree */}
      <path d="M138 300v-56" stroke="#9aa78f" strokeWidth="5" strokeLinecap="round" />
      <circle cx="138" cy="218" r="40" fill="#d9e2c9" stroke="#b3c2a6" strokeWidth="2" />
      <circle cx="118" cy="234" r="20" fill="#cfdabd" />

      {/* House */}
      <path d="M232 98V62h24v54" fill="#f1efe4" stroke="#95a88f" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M196 152v148h208V152" fill="#fafbf6" stroke="#95a88f" strokeWidth="2.5" strokeLinejoin="round" />
      <path
        d="m176 162 124-96 124 96"
        fill="none"
        stroke="#7e9476"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="218" y="182" width="54" height="52" rx="4" fill="#fbe2c6" stroke="#95a88f" strokeWidth="2" />
      <path d="M245 182v52M218 208h54" stroke="#e7c39d" strokeWidth="2" />
      <rect x="328" y="182" width="54" height="52" rx="4" fill="#fbe2c6" stroke="#95a88f" strokeWidth="2" />
      <path d="M355 182v52M328 208h54" stroke="#e7c39d" strokeWidth="2" />
      <rect x="282" y="240" width="36" height="60" rx="3" fill="#dae4d4" stroke="#95a88f" strokeWidth="2" />
      <circle cx="310" cy="272" r="2.5" fill="#7e9476" />
      {/* heat rising inside the gable */}
      <path
        className="hero-heat"
        d="M262 150c-8-11 8-15 0-27m38 27c-8-11 8-15 0-27m38 27c-8-11 8-15 0-27"
        fill="none"
        stroke="#f4aa72"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Insulated pipe from the unit into the house wall, with flowing heat */}
      <path d="M452 262h-36a12 12 0 0 1-12-12v-4" fill="none" stroke="#5f6f63" strokeWidth="11" strokeLinecap="round" />
      <path
        className="hero-flow"
        d="M452 262h-36a12 12 0 0 1-12-12v-4"
        fill="none"
        stroke="#f4aa72"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="6 10"
      />
      <rect x="398" y="236" width="12" height="8" rx="2" fill="#5f6f63" />

      {/* Outdoor unit (the subject) */}
      <ellipse cx="542" cy="308" rx="112" ry="10" fill="#d3dbc8" />
      <path d="M472 296v12m140-12v12" stroke="#889181" strokeWidth="7" strokeLinecap="round" />
      <rect x="452" y="170" width="180" height="128" rx="11" fill="#ffffff" stroke="#a6b2a6" strokeWidth="2.2" />
      <path d="M453 184h178" stroke="#eef1ea" strokeWidth="3" />
      <circle cx="514" cy="236" r="46" fill="#e4e8e1" stroke="#b4bcb0" strokeWidth="2" />
      <circle cx="514" cy="236" r="38" fill="none" stroke="#cdd3c9" strokeWidth="1.5" />
      <g className="hero-fan" fill="#9eaba0">
        {/* invisible disc centres the rotation box on the hub */}
        <circle cx="514" cy="236" r="44" fill="none" />
        <path d="M514 236c-30-15-25-34-10-28 15 5 16 17 10 28Z" />
        <path d="M514 236c28-20 42-6 29 5-10 11-21 8-29-5Z" />
        <path d="M514 236c5 34-14 40-17 24-5-15 3-23 17-24Z" />
      </g>
      <circle cx="514" cy="236" r="6" fill="#6b7d6e" />
      <path
        d="M578 206h38m-38 11h38m-38 11h38m-38 11h38m-38 11h38m-38 11h38"
        stroke="#c9d0c5"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="578" y="187" width="26" height="9" rx="2" fill="#294d40" />
      {/* air leaving the fan */}
      <path
        d="M642 214c16-6 27 6 44 0m-44 22c16-6 27 6 44 0m-44 22c16-6 27 6 44 0"
        fill="none"
        stroke="#b5c5b4"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Temperature chips */}
      <g className="hero-chip">
        <rect x="170" y="12" width="148" height="42" rx="21" fill="#ffffff" stroke="#dce1d5" />
        <circle cx="193" cy="33" r="7" fill="#f4aa72" />
        <text x="208" y="39">
          Inne 21 °C
        </text>
      </g>
      <g className="hero-chip">
        <rect x="468" y="110" width="148" height="42" rx="21" fill="#ffffff" stroke="#dce1d5" />
        <circle cx="491" cy="131" r="7" fill="#95a88f" />
        <text x="506" y="137">
          Ute −15 °C
        </text>
      </g>
    </svg>
  );
}
