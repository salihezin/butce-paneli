import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zemin: "#EDF0EE",
        kagit: "#FAFBFA",
        murekkep: "#14213D",
        sessiz: "#5B6678",
        cizgi: "#D5DBD8",
        cini: { DEFAULT: "#0E7C86", koyu: "#0A5961", acik: "#DCEFF0" },
        nar: { DEFAULT: "#B3263E", acik: "#F6E1E5" },
        kehribar: { DEFAULT: "#9A5B0B", acik: "#F6EBD6" },
      },
      borderRadius: { kart: "10px" },
    },
  },
  plugins: [],
};
export default config;
