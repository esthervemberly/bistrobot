import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "BistroBot — AI Restaurant Assistant",
  description: "AI-powered restaurant self-service chatbot. Browse menus, get personalized recommendations, and track orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content" style={{ marginLeft: 'var(--sidebar-width)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
