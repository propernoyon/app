"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";

import { adminLoginAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { INITIAL_ADMIN_LOGIN_STATE } from "@/lib/admin/types";

export interface AdminLoginLabels {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  submit: string;
  submitting: string;
  invalid: string;
  rateLimited: string;
  notConfigured: string;
}

/** Admin sign-in form. Credentials are verified server-side and rate limited. */
export function AdminLoginForm({ labels, next }: { labels: AdminLoginLabels; next: string }) {
  const [state, formAction, isPending] = useActionState(
    adminLoginAction,
    INITIAL_ADMIN_LOGIN_STATE,
  );

  return (
    <Card className="w-full max-w-sm">
      <CardBody className="space-y-5">
        <header>
          <span className="grid size-10 place-items-center rounded-xl bg-primary-muted text-primary">
            <KeyRound aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-3 text-h3 text-foreground">{labels.title}</h1>
          <p className="mt-1 text-small text-muted-foreground">{labels.subtitle}</p>
        </header>

        {state.status === "invalid" ? <Alert variant="danger" title={labels.invalid} /> : null}
        {state.status === "rate_limited" ? (
          <Alert variant="warning" title={labels.rateLimited} />
        ) : null}
        {state.status === "not_configured" ? (
          <Alert variant="warning" title={labels.notConfigured} />
        ) : null}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <TextField
            id="admin-email"
            name="email"
            type="email"
            label={labels.email}
            autoComplete="username"
            required
            autoFocus
          />
          <TextField
            id="admin-password"
            name="password"
            type="password"
            label={labels.password}
            autoComplete="current-password"
            required
          />

          <Button type="submit" size="lg" fullWidth loading={isPending}>
            {isPending ? labels.submitting : labels.submit}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
