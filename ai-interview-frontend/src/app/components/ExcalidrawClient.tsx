"use client";

import React from 'react';
import dynamic from "next/dynamic";

// Excalidraw must be loaded dynamically on the client side only
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then(m => m.Excalidraw),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm">
        Loading whiteboard...
      </div>
    )
  }
);

export default function ExcalidrawClient() {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Excalidraw />
    </div>
  );
}