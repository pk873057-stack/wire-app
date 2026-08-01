import "./globals.css";

export const metadata = {
  title: "WIRE — Live Dispatch Network",
  description: "A public feed of dispatches, filed in real time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
