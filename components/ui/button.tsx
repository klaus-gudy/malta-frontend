import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-95 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95",
        outline:
          "border border-input bg-card text-foreground hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-95",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary-dark underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-[38px] px-[15px]",
        sm: "h-[30px] px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
