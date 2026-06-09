import { ThemeProvider } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/routes/router";

export function Providers() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
