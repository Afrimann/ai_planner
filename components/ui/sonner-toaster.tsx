"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "bw-sonner-toast",
          title: "bw-sonner-title",
          description: "bw-sonner-description",
          actionButton: "bw-sonner-action",
          cancelButton: "bw-sonner-cancel",
        },
      }}
    />
  );
}
