"use client";

import { useState } from 'react';
import Image from 'next/image';

const marcasData = [
  {
    id: 'burger-club',
    name: 'La Burger Club',
    shortDesc: 'Hamburguesas premium con blend de carne seleccionado.',
    fullDesc: 'Bienvenidos a La Burger Club. Nuestro secreto está en el blend exacto de carne fresca picada todos los días, panes artesanales horneados en el momento y salsas de autor que no vas a encontrar en ningún otro lado. Somos el delivery de hamburguesas que estabas esperando.',
    bgColor: 'bg-[#fa622e]', 
    textColor: 'text-white',
    logoSrc: '/logo-burger.svg', 
    // ACÁ YA PUSE TU LINK REAL DE CLOUDINARY:
    modalMediaSrc: 'https://res.cloudinary.com/dghno2xgu/video/upload/v1772126464/modal-burger_faewhe.mp4', 
    modalMediaType: 'video', 
    active: true,
    soloLogo: true, 
    modalTheme: 'light',
  },
  {
    id: 'lomito',
    name: 'El Club del Lomito',
    shortDesc: 'El clásico argentino en su máxima expresión.',
    fullDesc: 'Respetamos la tradición. Usamos lomo tierno, pan francés crujiente, y la combinación perfecta de ingredientes frescos para armar el lomito definitivo. Ideal para resolver una cena potente y con sabor a casa.',
    bgColor: 'bg-black', 
    textColor: 'text-white',
    logoSrc: '/logo-lomito.svg',
    // REEMPLAZÁ ESTO CON EL LINK DEL LOMITO:
    modalMediaSrc: 'https://res.cloudinary.com/dghno2xgu/video/upload/v1772127964/modal-lomito_kcrkol.mp4',
    modalMediaType: 'video',
    active: true,
    soloLogo: true, 
    modalTheme: 'dark',
  },
  {
    id: 'milanesa',
    name: 'Milanesa',
    shortDesc: 'Milanesas de autor, tiernas y crujientes.',
    fullDesc: 'La reina de la cocina argentina, llevada al nivel Dark Kitchen. Rebozados crujientes que soportan el viaje del delivery, carne súper tierna y toppings que van desde la clásica napolitana hasta reversiones con cheddar y panceta.',
    bgColor: 'bg-[#ffc000]', 
    textColor: 'text-black',
    logoSrc: '/logo-milanesa.svg',
    // REEMPLAZÁ ESTO CON EL LINK DE LA MILANESA:
    modalMediaSrc: 'https://res.cloudinary.com/dghno2xgu/video/upload/v1772127933/modal-milanesa_o7ljdx.mp4', 
    modalMediaType: 'video', 
    active: true,
    soloLogo: true, 
    modalTheme: 'light',
  },
  {
    id: 'proximamente',
    name: 'Próximamente',
    shortDesc: 'Nuevas propuestas gastronómicas en camino.',
    fullDesc: 'Estamos constantemente probando nuevos conceptos en nuestra cocina para sorprenderte muy pronto.',
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-500',
    logoSrc: '',
    active: false,
    soloLogo: false, 
    modalTheme: 'light',
  }
];

export default function CategoryGrid() {
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<typeof marcasData[0] | null>(null);

  // Variable de ayuda para saber si el modal abierto es oscuro o claro
  const isDarkModal = marcaSeleccionada?.modalTheme === 'dark';

  return (
    <section className="py-24 bg-white relative" id="marcas">
      <div className="container mx-auto px-4">
        
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter mb-4">
            Nuestras Marcas
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg md:text-xl">
            Explorá nuestras cocinas exclusivas, preparadas con materias primas de primera calidad y listas para llegar a tu mesa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {marcasData.map((marca) => (
            <div 
              key={marca.id} 
              className={`group block w-full h-[400px] rounded-3xl overflow-hidden relative shadow-sm transition-all duration-300 hover:shadow-xl ${marca.active ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              
              <div className={`absolute inset-0 ${marca.bgColor} ${marca.active ? 'transition-transform duration-700 ease-out group-hover:scale-105' : ''}`}></div>
              
              <div className="absolute inset-0 p-10 z-10">
                
                {marca.soloLogo ? (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    {marca.logoSrc && (
                      <div className="relative w-full h-40 md:h-48 transform transition-transform duration-500 group-hover:-translate-y-4">
                        <Image 
                          src={marca.logoSrc} 
                          alt={`Logo ${marca.name}`}
                          fill
                          className="object-contain object-center scale-[1.30]"
                          priority
                        />
                      </div>
                    )}
                    
                    {marca.active && (
                      <div className="absolute bottom-0 opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                        <button 
                          onClick={() => setMarcaSeleccionada(marca)}
                          className="px-8 py-3 bg-white text-black font-bold rounded-full text-sm transition-all duration-300 hover:scale-110 hover:bg-gray-100 shadow-lg hover:shadow-xl"
                        >
                          Descubrir marca
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-between">
                    <div className="relative w-full h-16 flex items-start justify-start">
                      {marca.logoSrc ? (
                        <Image 
                          src={marca.logoSrc} 
                          alt={`Logo ${marca.name}`}
                          fill
                          className="object-contain object-left"
                          priority
                        />
                      ) : (
                        <span className="text-2xl font-bold text-neutral-400">?</span>
                      )}
                    </div>

                    <div className={marca.textColor}>
                      <h3 className="text-2xl font-extrabold mb-3 tracking-tight opacity-90">
                        {marca.name}
                      </h3>
                      <p className="opacity-80 text-sm md:text-base leading-relaxed">
                        {marca.shortDesc}
                      </p>

                      {marca.active && (
                        <div className="mt-8 opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                          <button 
                            onClick={() => setMarcaSeleccionada(marca)}
                            className={`px-8 py-3 font-bold rounded-full text-sm transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl ${marca.textColor === 'text-white' ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-neutral-800'}`}
                          >
                            Descubrir marca
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* POP-UP MODAL INMERSIVO DINÁMICO */}
      {marcaSeleccionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
          
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setMarcaSeleccionada(null)}
          ></div>

          <div className={`relative w-full h-full md:h-auto md:max-w-7xl md:rounded-3xl overflow-y-auto md:overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row border ${isDarkModal ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}>
            
            <button 
              onClick={() => setMarcaSeleccionada(null)}
              className="absolute top-6 right-6 bg-black/50 hover:bg-black/80 text-white rounded-full p-3 transition-colors z-50 shadow-xl border border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            {/* COLUMNA A: Video/Imagen */}
            <div className="absolute inset-0 md:relative md:w-1/2 h-full z-0 order-first md:order-last bg-black">
              {marcaSeleccionada.modalMediaSrc ? (
                marcaSeleccionada.modalMediaType === 'video' ? (
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src={marcaSeleccionada.modalMediaSrc} type="video/mp4" />
                  </video>
                ) : (
                  <Image 
                    src={marcaSeleccionada.modalMediaSrc} 
                    alt={`Imagen modal ${marcaSeleccionada.name}`}
                    fill
                    className="object-cover"
                  />
                )
              ) : (
                <div className={`w-full h-full ${marcaSeleccionada.bgColor}`}></div>
              )}
              
              <div className={`hidden md:block absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r ${isDarkModal ? 'from-black' : 'from-white'} to-transparent z-10`}></div>
              <div className={`block md:hidden absolute inset-0 bg-gradient-to-t ${isDarkModal ? 'from-black via-black/80' : 'from-white via-white/90'} to-transparent z-10`}></div>
            </div>

            {/* COLUMNA B: TEXTOS DINÁMICOS */}
            <div className="relative w-full h-full md:w-1/2 p-8 md:p-16 flex flex-col justify-end md:justify-center items-center text-center z-10 bg-transparent order-last md:order-first">
                
              {marcaSeleccionada.logoSrc && (
                  <div className="relative w-full max-w-[375px] h-36 md:h-48 mb-10 mx-auto transform flex items-center justify-center">
                    <Image 
                        src={marcaSeleccionada.logoSrc} 
                        alt={`Logo Modal ${marcaSeleccionada.name}`}
                        fill
                        className="object-contain object-center"
                    />
                  </div>
              )}

              <div className={`w-full ${isDarkModal ? 'text-white' : 'text-black'}`}>
                <p className={`${isDarkModal ? 'text-gray-300' : 'text-gray-500'} font-medium mb-6 text-xl leading-relaxed`}>
                    {marcaSeleccionada.shortDesc}
                </p>
                <div className={`prose prose-lg ${isDarkModal ? 'prose-invert text-gray-200' : 'prose-neutral text-gray-700'} mb-10 mx-auto max-w-none leading-relaxed`}>
                    <p>{marcaSeleccionada.fullDesc}</p>
                </div>
              </div>

              <button 
                className={`w-full md:w-auto px-12 py-5 font-extrabold rounded-full text-xl transition-all duration-300 hover:scale-105 shadow-lg 
                  ${isDarkModal 
                    ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                    : 'bg-black text-white hover:bg-neutral-800 shadow-[0_0_20px_rgba(0,0,0,0.1)]'
                  }`}
              >
                Ver menú completo
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}