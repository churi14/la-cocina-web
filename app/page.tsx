import Header from '@/components/Header';
import Hero from '@/components/Hero';
import CategoryGrid from '@/components/CategoryGrid'; // <-- Importamos el archivo nuevo

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <CategoryGrid /> {/* <-- Lo agregamos a la página */}
    </main>
  );
}