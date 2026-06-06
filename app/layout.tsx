import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseAuthProvider } from "@/providers/FirebaseAuthProvider";
import { AtmosphereProvider } from "@/providers/AtmosphereProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeetSync",
  description: "Sensory Workspace",
  icons: {
    icon: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-dark-2`}>
        <FirebaseAuthProvider>
          <AtmosphereProvider>
            <Toaster />
            {children}
          </AtmosphereProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
