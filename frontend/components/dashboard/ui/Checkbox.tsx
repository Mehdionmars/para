"use client";

import { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/dashboard/cn";

/**
 * Native checkbox with indeterminate support.
 *
 * `indeterminate` is a DOM property, not an attribute — React cannot set it
 * through JSX, so it has to be written imperatively. Getting this wrong is
 * what makes a "select all" header box look unchecked while part of the page
 * is selected.
 */
export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean }
>(function Checkbox({ className, indeterminate = false, ...props }, forwardedRef) {
  const innerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={(node) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={cn(
        "h-4 w-4 cursor-pointer rounded border-gray-300 accent-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-1",
        className,
      )}
      {...props}
    />
  );
});
