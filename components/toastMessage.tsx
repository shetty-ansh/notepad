'use client'
import {
  CheckCircle2,
  CircleX,
  TriangleAlert,
  CircleHelp,
  Trash2,
  Loader2,
} from "lucide-react";

interface CustomToastProps {
  type:
  | "success"
  | "error"
  | "warning"
  | "confirm"
  | "confirmDelete"
  | "processing";
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const colorMap = {
  success: "text-[#1AB394]",
  error: "text-red-500",
  warning: "text-orange-500",
  confirm: "text-[#0D1717]",
  confirmDelete: "text-red-500",
  processing: "text-[#1AB394]",
};

export function CustomToast({
  type,
  title,
  message,
  onConfirm,
  onCancel,
}: CustomToastProps) {
  const showConfirmButtons = type === "confirm" || type === "confirmDelete";
  const iconClassName = `${colorMap[type]} size-6 flex-shrink-0 ${type === "processing" ? "animate-spin" : ""}`;

  const iconMap = {
    success: <CheckCircle2 className={iconClassName} />,
    error: <CircleX className={iconClassName} />,
    warning: <TriangleAlert className={iconClassName} />,
    confirm: <CircleHelp className={iconClassName} />,
    confirmDelete: <Trash2 className={iconClassName} />,
    processing: <Loader2 className={iconClassName} />,
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-white border-0 w-[360px] shadow-[0_4px_12px_rgba(13,23,23,0.15)]">
      {iconMap[type]}

      <div className="flex flex-col flex-1 gap-2">
        <div className="space-y-0.5">
          <h1 className="font-semibold text-[#0D1717] text-sm">{title}</h1>
          <p className="text-[#0D1717]/70 text-xs leading-relaxed">{message}</p>
        </div>

        {showConfirmButtons && (
          <div className="flex gap-2 mt-0.5">
            <button
              type="button"
              onClick={onConfirm}
              className="bg-[#1AB394] text-white rounded-md h-8 px-4 text-xs font-medium hover:bg-[#1AB394]/90 transition-colors"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-white border border-[#0D1717]/10 text-[#0D1717] rounded-md h-8 px-4 text-xs font-medium hover:bg-[#0D1717]/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}