import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-muted-foreground">
        A página que procura não existe ou foi movida.
      </p>
      <Button asChild variant="gold" className="mt-8">
        <Link to="/">Voltar à página inicial</Link>
      </Button>
    </div>
  );
}
