import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/dashboard/cn";

/* Exported so a real link can wear the button's clothes without a <button>
   nested inside an <a>: that nesting is invalid HTML and leaves two focus
   stops on one control. Callers that navigate use <Link className={
   buttonVariants(...)}> instead. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
  {
    defaultVariants: { size: "default", variant: "default" },
    variants: {
      size: {
        default: "h-10 px-4",
        icon: "h-9 w-9",
        sm: "h-8 px-3 text-xs",
      },
      variant: {
        default: "bg-violet-700 text-white hover:bg-violet-800",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        outline: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return <button ref={ref} className={cn(buttonVariants({ size, variant }), className)} {...props} />;
});
