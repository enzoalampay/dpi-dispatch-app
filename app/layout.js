import "./globals.css";
import BottomNav from "./components/BottomNav";
import SWRegister from "./components/SWRegister";

export const metadata = {
  title: "DPI Dispatch",
  description: "Ask for a ride. A driver gets assigned. You see the whole day.",
  appleWebApp: {
    capable: true,
    title: "Dispatch",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f2733",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <BottomNav />
        <SWRegister />
      </body>
    </html>
  );
}
