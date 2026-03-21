
import { toast } from "sonner";
import { CustomToast } from "@/components/toastMessage";

export const showToast = (
  type: "success" | "error" | "processing" | "warning" | "confirm" | "confirmDelete",
  title: string,
  message: string,
  onConfirm?: () => void,
  onCancel?: () => void
) => {
  return toast.custom(
    (toastId) => (
      <CustomToast
        type={type}
        title={title}
        message={message}
        onConfirm={() => {
          toast.dismiss(toastId);
          onConfirm?.();
        }}
        onCancel={() => {
          toast.dismiss(toastId);
          onCancel?.();
        }}
      />
    ),
    {
      duration: type === "confirm" || type === "confirmDelete" || type === "processing" ? Infinity : 3000,
      // `CustomToast` already renders its own card UI (bg/border/padding/shadow).
      // Ensure the Sonner toast wrapper is transparent + unpadded to avoid
      // a "double card" appearance (seen on the Welcome Back toast).
      className: "!bg-transparent !border-none !shadow-none !p-0",
    }
  );
};
