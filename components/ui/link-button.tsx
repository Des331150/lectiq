import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonStyleProps = VariantProps<typeof buttonVariants>;

export interface LinkButtonProps
  extends React.ComponentProps<typeof Link>,
    Pick<ButtonStyleProps, "variant" | "size"> {
  className?: string;
}

/**
 * A link that looks like a button.
 *
 * `<Link><Button /></Link>` is the pattern this codebase used in six places,
 * including the dashboard. It nests a <button> inside an <a>, which is invalid
 * HTML and gives every action two tab stops: one for the anchor and one for the
 * button inside it. Screen readers announce it as a link containing a button,
 * and activating it is ambiguous.
 *
 * This renders a single <a> carrying the button styles instead, so the action
 * is one focusable element announced as a link.
 */
export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}