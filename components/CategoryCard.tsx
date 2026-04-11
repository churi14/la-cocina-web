import Link from 'next/link';

// Definimos qué datos necesita recibir nuestra tarjeta
interface CategoryCardProps {
  title: string;
  description: string;
  link: string;
  bgColor: string;
}

export default function CategoryCard({ title, description, link, bgColor }: CategoryCardProps) {
  return (
    <Link href={link} className="group block w-full h-80 rounded-2xl overflow-hidden relative cursor-pointer">
      {/* Fondo de color estático (luego lo podés cambiar por imágenes) */}
      <div className={`absolute inset-0 ${bgColor} transition-transform duration-500 group-hover:scale-105`}></div>
      
      {/* Capa oscura para que el texto resalte */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300"></div>

      {/* Contenido (Textos) */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-white/90 text-sm md:text-base">
          {description}
        </p>
      </div>
    </Link>
  );
}