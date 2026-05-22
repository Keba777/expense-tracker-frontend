import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ExpenseTracker",
    short_name: "Expenses",
    description: "Track your income and expenses with beautiful insights",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Add Expense",
        short_name: "Expense",
        url: "/expenses",
        icons: [{ src: "/icon-192", sizes: "192x192" }],
      },
      {
        name: "Add Income",
        short_name: "Income",
        url: "/income",
        icons: [{ src: "/icon-192", sizes: "192x192" }],
      },
      {
        name: "Reports",
        short_name: "Reports",
        url: "/reports",
        icons: [{ src: "/icon-192", sizes: "192x192" }],
      },
    ],
  };
}
