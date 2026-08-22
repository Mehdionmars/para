"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { updatePassword } from "@/app/dashboard/(app)/settings/actions";
import { Button } from "@/components/dashboard/ui/Button";
import { Input } from "@/components/dashboard/ui/Input";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-gray-600">
          Nouveau mot de passe
        </label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-gray-600">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Mot de passe mis à jour.
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-fit">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Changer le mot de passe
      </Button>
    </form>
  );
}
