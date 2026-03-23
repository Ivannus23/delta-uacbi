import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeaderSemana } from "@/components/semana-cultural/HeaderSemana";

export default function AdminSemanaPage() {
  return (
    <>
      <Navbar />
      <main className="container py-10">
        <HeaderSemana />
        <h1 className="text-3xl font-semibold">Panel de administración</h1>
        <p className="mt-2 text-muted-foreground">
          Aquí irá el control de equipos, actividades y puntos.
        </p>
      </main>
      <Footer />
    </>
  );
}
