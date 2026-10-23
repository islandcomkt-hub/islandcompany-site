import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Island Company',description:'Crescimento precisa de direção',icons:{icon:'/favicon.png',apple:'/apple-touch-icon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang='pt-BR'><body>{children}</body></html>}
