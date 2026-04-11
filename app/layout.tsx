import './globals.css'

export const metadata = {
  title: 'La Cocina | Delivery y Catering',
  description: 'Delivery y Catering para tiempos modernos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}