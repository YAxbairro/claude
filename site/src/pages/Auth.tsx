import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const { user, isAdmin, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Um administrador autenticado não tem nada a fazer nesta página.
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  if (user && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <h1 className="text-xl font-semibold">Área Administrativa</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Esta conta não tem permissões de administrador. Faça logout e entre com outra conta.
            </p>
            <Button className="mt-6 w-full" variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Terminar sessão
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link to="/">Voltar à página inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
    } catch {
      /* o erro já foi mostrado ao utilizador */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Área Administrativa</CardTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Entre com a sua conta." : "Crie uma conta de acesso."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Palavra-passe</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signin" ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin" ? "Não tem conta? Criar uma" : "Já tem conta? Entrar"}
          </button>

          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/">Voltar à página inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
