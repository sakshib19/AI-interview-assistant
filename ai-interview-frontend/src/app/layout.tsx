// src/app/layout.tsx
import "./globals.css";
import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import ProtectedRoute from "./components/ProtectedRoute";
export const metadata = {
  title: "AI Interview",
  description: "Upload resume and practice interviews",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 👇 Add suppressHydrationWarning here
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ensure responsive viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            {/* <ProtectedRoute> */}
            {children}
            {/* </ProtectedRoute> */}
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}