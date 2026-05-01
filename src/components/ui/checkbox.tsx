import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  className?: string;
  children?: React.ReactNode;
};
const Indicator = CheckboxPrimitive.Indicator as unknown as React.ComponentType<unknown>;

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, ...props }, ref) =>
    React.createElement(
      CheckboxPrimitive.Root as any,
      {
        ref,
        className: cn(
          "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className,
        ),
        ...props,
      },
      React.createElement(
        Indicator as any,
        { className: cn("grid place-content-center text-current") },
        React.createElement(Check, { className: "h-4 w-4" }),
      ),
    ),
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
