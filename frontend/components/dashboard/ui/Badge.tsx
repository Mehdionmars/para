import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/dashboard/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  defaultVariants: { variant: "default" },
  variants: {
    variant: {
      default: "bg-gray-100 text-gray-700",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-700",
      danger: "bg-red-100 text-red-700",
      info: "bg-sky-100 text-sky-700",
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
