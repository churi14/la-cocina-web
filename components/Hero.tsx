import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full h-[100vh] bg-black flex flex-col md:flex-row overflow-hidden">
      
      {/* 1. SECCIÓN DE TEXTOS */}
      <div className="relative z-10 flex flex-col justify-center px-6 md:px-16 w-full md:w-1/2 h-full order-last md:order-first bg-black/40 md:bg-transparent">
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight leading-[1.1]">
          Delivery y comidas <br/>
          <span className="text-gray-400">para tiempos modernos</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-10 font-medium max-w-lg">
          Más que un delivery tradicional. Tu solución gastronómica de primer nivel para almuerzos y cenas, con los clásicos que a todos les encantan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="#menu" 
            className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-transform hover:scale-105 text-center"
          >
            Nuestros Menús
          </Link>
          <Link 
            href="#contacto" 
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors text-center"
          >
            Contacto
          </Link>
        </div>
      </div>

      {/* 2. SECCIÓN DE VIDEO (Derecha en PC, fondo completo en Celular) */}
      <div className="absolute inset-0 md:relative md:w-1/2 md:h-full z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Asegurate de tener este archivo en tu carpeta public */}
          <source src="https://res.cloudinary.com/dghno2xgu/video/upload/v1772126885/hero-vertical_yiyczb.mp4" type="video/mp4"/>
          Tu navegador no soporta videos.
        </video>
        
        {/* Efecto de degradado negro para fusionar el video con la izquierda (Solo PC) */}
        <div className="hidden md:block absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-black to-transparent z-10"></div>
        
        {/* Capa oscura general para celular (para que el texto se lea bien) */}
        <div className="block md:hidden absolute inset-0 bg-black/50 z-10"></div>
      </div>
      
    </section>
  );
}