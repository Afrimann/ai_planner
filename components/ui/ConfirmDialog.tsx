"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  confirmLabel?: string;
  formAction: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string>;
}

export function ConfirmDialog({
  open,
  title,
  description,
  onClose,
  confirmLabel = "Confirm",
  formAction,
  hiddenFields = {},
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidthClassName="max-w-md">
      <p className="text-sm text-zinc-700">{description}</p>
      <form action={formAction} className="mt-5 flex justify-end gap-2">
        {Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <ConfirmSubmitButton>{confirmLabel}</ConfirmSubmitButton>
      </form>
    </Modal>
  );
}

function ConfirmSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Working..." : children}
    </Button>
  );
}
