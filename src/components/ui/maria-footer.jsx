import React from 'react';
import { Facebook } from "@/svgs/facebok";
import { Instagram } from "@/svgs/insta";
import { XformerlyTwitter } from "@/svgs/x";
import { Telegram } from "@/svgs/telegram";
import { WhatsApp } from "@/svgs/whats";

const footerSections = [
  {
    title: 'Producto',
    links: [
      { label: 'Problema', href: '#features' },
      { label: 'Solucion', href: '#about' },
      { label: 'Precios', href: '#pricing' },
      { label: 'Integraciones', href: '#integrations' },
    ]
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nosotros', href: '#about' },
      { label: 'Preguntas Frecuentes', href: '#faqs' },
      { label: 'Términos de Servicio', href: '#terms' },
      { label: 'Privacidad', href: '#privacy' },
    ]
  },
  {
    title: 'Redes Sociales',
    links: [
      { label: 'X (Twitter)', href: 'https://x.com/juan_rivas07', icon: XformerlyTwitter },
      { label: 'Instagram', href: 'https://www.instagram.com/edu_rivass07/', icon: Instagram },
      { label: 'Facebook', href: 'https://www.facebook.com/tecnmcampusuruapan', icon: Facebook },
      { label: 'Telegram', href: '#', icon: Telegram },
      { label: 'WhatsApp', href: 'https://wa.me/1234567890', icon: WhatsApp },
    ]
  }
];

export function MariaFooter() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-black/40 backdrop-blur-md pt-16 pb-8 px-6 lg:px-16 overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[120px] bg-[#f99e02]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-12 lg:gap-24 relative z-10">

        {/* Brand Section */}
        <div className="flex flex-col items-start max-w-sm">
          <img
            src="/logomariaM.png"
            alt="M.A.R.I.A Logo"
            className="h-16 w-auto mb-6 drop-shadow-[0_0_15px_rgba(249,158,2,0.3)]"
          />
          <p className="text-white/60 text-base leading-relaxed">
            Centraliza tus herramientas, automatiza tus procesos y reduce tu carga cognitiva con un solo agente inteligente.
          </p>
        </div>

        {/* Links Sections */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col">
              <h4 className="text-white font-bold text-lg mb-6 tracking-wide">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/60 hover:text-[#f99e02] transition-all duration-300 inline-flex items-center text-sm font-medium hover:translate-x-1"
                    >
                      {link.icon && (
                        <span className="w-5 h-5 mr-3 flex items-center justify-center opacity-80 group-hover:opacity-100">
                          <link.icon className="w-full h-full object-contain" />
                        </span>
                      )}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-white/40 text-sm gap-4 relative z-10">
        <p>© {new Date().getFullYear()} M.A.R.I.A.</p>
        <p>Diseñado para potenciar tu productividad ⚡</p>
      </div>
    </footer>
  );
}
