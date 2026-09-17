import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/dashboard/cn";

// Pale fill with a matching hairline, so a status reads on a white card
// without turning into a solid block of colour.
const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: "border-gray-200 bg-gray-50 text-gray-700",
      success: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
      warning: "border-amber-200/80 bg-amber-50 text-amber-700",
      danger: "border-red-200/80 bg-red-50 text-red-700",
      info: "border-sky-200/80 bg-sky-50 text-sky-700",
    },
  },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
