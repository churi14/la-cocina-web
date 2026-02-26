"use client"; // Esto es obligatorio para poder detectar el scroll del usuario

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  // Creamos el estado para saber si el usuario hizo scroll o no
  const [isScrolled, setIsScrolled] = useState(false);

  // Este "Efecto" escucha el movimiento de la página
  useEffect(() => {
    const handleScroll = () => {
      // Si el usuario bajó más de 50 píxeles, cambiamos el estado a true
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Activamos el "escuchador" de eventos
    window.addEventListener('scroll', handleScroll);
    
    // Limpieza de seguridad cuando cerramos la página
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    // Cambiamos "sticky" por "fixed" para que la barra flote por encima del video.
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        {/* Logo: Ahora con el tamaño ajustado */}
        <div className="flex-shrink-0">
          <Link href="/" className="relative block w-[180px] h-[50px] transition-transform hover:scale-105">
            <Image 
              src={isScrolled ? "/logo-negro.svg" : "/logo-blanco.svg"} 
              alt="La Cocina Logo" 
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>

        {/* MENÚ ACTUALIZADO */}
        <nav className={`hidden md:flex gap-8 font-medium transition-colors duration-500 ${
          isScrolled ? 'text-gray-800' : 'text-white'
        }`}>
          <Link href="#nosotros" className="hover:text-red-600 transition-colors">Nosotros</Link>
          <Link href="#menu" className="hover:text-red-600 transition-colors">Nuestros Menús</Link>
          <Link href="#contacto" className="hover:text-red-600 transition-colors">Contacto</Link>
        </nav>

        {/* Horarios */}
        <div className={`hidden lg:flex flex-col text-sm font-medium text-right leading-relaxed transition-colors duration-500 ${
          isScrolled ? 'text-gray-600' : 'text-gray-200'
        }`}>
          <p>Mediodía: Mar a Dom 12:00 a 15:00</p>
          <p>Noche: Lun a Dom 20:00 a 00:00</p>
        </div>

      </div>
    </header>
  );
}