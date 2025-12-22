"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  action: (formData: FormData) => void;
  title: string;
  description?: string;
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  // Если нужно передать скрытые поля
  hidden?: Record<string, string>;
};

export function ConfirmDeleteForm({
  action,
  title,
  description,
  buttonText = "Удалить",
  confirmText = "Да, удалить",
  cancelText = "Отмена",
  hidden,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <form ref={formRef} action={action}>
        {hidden
          ? Object.entries(hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))
          : null}

        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          {buttonText}
        </Button>
      </form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setOpen(false);
                formRef.current?.requestSubmit();
              }}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
