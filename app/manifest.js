export default function manifest() {
  return {
    name: "DPI Dispatch",
    short_name: "Dispatch",
    description: "Ask for a ride. A driver gets assigned. You see the whole day.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#1f2733",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
