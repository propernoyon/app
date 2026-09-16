import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The custom type-scale utilities declared in `styles/tokens.css`.
 *
 * tailwind-merge resolves `text-*` conflicts by guessing the group from the
 * value, and it has no way to know that these names are font sizes. Without
 * this list `text-body` and `text-primary-foreground` are both classified as
 * "text colour", so one silently deletes the other — which is how a primary
 * button ended up inheriting the body colour instead of its own foreground.
 */
const FONT_SIZES = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body",
  "body-lg",
  "small",
  "caption",
  "micro",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
    },
  },
});

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 * Every component composes classes through this so token utilities win
 * deterministically instead of fighting each other.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
