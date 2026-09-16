"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { TextField, TextareaField, SelectField } from "@/components/ui/field";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { PageSection } from "./section";

/**
 * Interactive states can't be shown by a static gallery, so they live in this
 * client island. Everything interactable on the storefront is validated here
 * with the same components the pages use.
 */
export function InteractiveDemos() {
  return (
    <ToastProvider closeLabel="Dismiss">
      <DemosInner />
    </ToastProvider>
  );
}

function DemosInner() {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(2);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [email, setEmail] = useState("not-an-email");
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.includes("@") ? "Enter a valid email address" : null;

  return (
    <>
      <PageSection
        title="Quantity stepper"
        hint="44px targets, clamped to stock, keyboard and touch friendly."
      >
        <div className="flex flex-wrap items-center gap-6">
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            max={12}
            labels={{
              decrease: "Decrease quantity",
              increase: "Increase quantity",
              quantity: "Quantity",
            }}
          />
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            size="sm"
            labels={{ decrease: "Decrease", increase: "Increase", quantity: "Qty" }}
          />
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            disabled
            labels={{ decrease: "Decrease", increase: "Increase", quantity: "Qty" }}
          />
        </div>
      </PageSection>

      <PageSection
        title="Dialog & confirm"
        hint="Native <dialog>: focus trap, Esc, inert background."
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalOpen(true)}>Open dialog</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Destructive confirm
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Product information"
          description="Everything after the title scrolls independently."
          closeLabel="Close"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Save</Button>
            </>
          }
        >
          <p className="text-small text-muted-foreground">
            Long content scrolls inside the panel while the header and footer stay pinned.
          </p>
          <div className="mt-4 h-64 rounded-lg bg-muted" />
        </Modal>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Remove this item?"
          description="The item will be taken out of your basket."
          confirmLabel="Remove"
          cancelLabel="Keep"
          destructive
          onConfirm={() => toast({ title: "Item removed", variant: "info" })}
        />
      </PageSection>

      <PageSection title="Toasts" hint="Polite live region; errors escalate to role=alert.">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => toast({ title: "Added to basket", description: "Fresh oranges × 2" })}
          >
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: "Something went wrong",
                description: "We could not reach the store. Try again.",
                variant: "error",
              })
            }
          >
            Error toast
          </Button>
          <Button
            variant="ghost"
            onClick={() => toast({ title: "Only 2 left", variant: "warning" })}
          >
            Warning toast
          </Button>
        </div>
      </PageSection>

      <PageSection
        title="Form fields"
        hint="Visible labels, aria-describedby wiring, error only after submit/blur."
      >
        <div className="grid max-w-xl gap-5">
          <TextField
            id="demo-email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            hint="We only use this to confirm your order."
            placeholder="you@example.com"
          />
          <TextField id="demo-disabled" label="Disabled" disabled placeholder="Unavailable" />
          <SelectField id="demo-select" label="Fulfilment" defaultValue="delivery">
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup in store</option>
          </SelectField>
          <TextareaField id="demo-note" label="Order note" placeholder="Leave at the door" />
          <div>
            <Button onClick={() => setSubmitted(true)}>Validate</Button>
          </div>
        </div>
      </PageSection>

      <PageSection title="Alerts" hint="Inline status messages for empty, error and notice states.">
        <div className="grid gap-3">
          <Alert variant="info" title="Store hours">
            Deliveries run between 09:00 and 21:00.
          </Alert>
          <Alert variant="success" title="Order confirmed">
            Your reference is MATC-4821ABC990.
          </Alert>
          <Alert variant="warning" title="Stock is limited">
            Only 2 units left of this item.
          </Alert>
          <Alert variant="danger" title="Could not place the order">
            The store is temporarily unavailable. Please try again.
          </Alert>
        </div>
      </PageSection>
    </>
  );
}
