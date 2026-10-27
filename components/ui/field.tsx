"use client";

import { createContext, useContext, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

/**
 * The one labelled form row: a label, the control, and a hint or an error.
 *
 * It wires the accessibility up so a call site gets it by existing:
 *
 * - the label points at the control (an id is minted when you don't pass one);
 * - the error has `role="alert"`, so it's announced when it appears;
 * - the control is marked `aria-invalid` and pointed at the error (or hint)
 *   with `aria-describedby`.
 *
 * The control picks those up through context, via `useFieldControl()`. Input,
 * Textarea, Select, Checkbox and Switch all do, so you never pass ids by hand.
 * After a failed submit, call `focusFirstInvalid()` to take the user to the
 * first problem.
 *
 * A hint and an error are mutually exclusive: while something's wrong, the
 * error is what needs saying.
 */

interface FieldContextValue {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Props for a control to spread onto its element so it joins the surrounding
 * Field. Returns nothing outside a Field, so controls work standalone too.
 * Spread it first, so an explicit prop at the call site still wins.
 */
export function useFieldControl(): {
  id?: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
} {
  const field = useContext(FieldContext);
  if (!field) return {};
  return {
    id: field.controlId,
    ...(field.invalid ? { "aria-invalid": true as const } : {}),
    ...(field.describedBy ? { "aria-describedby": field.describedBy } : {}),
  };
}

export interface FieldProps {
  label: React.ReactNode;
  /** Only needed when something outside the Field must know the control's id. */
  htmlFor?: string;
  required?: boolean;
  /** Guidance under the control. Hidden while there's an error. */
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, required, hint, error, className, children }: FieldProps) {
  const generatedId = useId();
  const controlId = htmlFor ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <FieldContext.Provider value={{ controlId, describedBy, invalid: Boolean(error) }}>
      <div data-slot="field" className={cn("flex min-w-0 flex-col gap-1.5", className)}>
        <Label htmlFor={controlId}>
          {label}
          {required && <RequiredMark />}
        </Label>
        {children}
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-ink-3">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-danger">
        {" "}
        *
      </span>
      {/* "*" alone is punctuation to a screen reader. */}
      <span className="sr-only"> (required)</span>
    </>
  );
}

/**
 * Move focus to the first control marked invalid. Call it right after setting
 * errors on a failed submit.
 *
 * Deferred a frame on purpose: straight after `setErrors(…)` React hasn't
 * re-rendered, so nothing carries `aria-invalid` yet, and a synchronous
 * version would quietly find nothing. Scrolls too, because on a long form the
 * first bad field is often off-screen.
 */
export function focusFirstInvalid(root: ParentNode = document): void {
  requestAnimationFrame(() => {
    const target = root.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}
