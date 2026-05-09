import React from 'react';
import { User, GraduationCap, Zap } from 'lucide-react';
import {
	PricingTable,
	PricingTableBody,
	PricingTableHeader,
	PricingTableHead,
	PricingTableRow,
	PricingTableCell,
	PricingTablePlan,
} from '@/components/ui/pricing-table';
import { Button } from '@/components/ui/button';

export const FEATURES = [
	{
		label: 'Modelo de Inteligencia',
		values: ['Básico (Rápido)', 'Inteligente (Pro)', 'Avanzado (Razonamiento)'],
	},
	{
		label: 'Consultas mensuales',
		values: ['50 peticiones', '500 peticiones', 'Ilimitadas'],
	},
	{
		label: 'Herramientas conectadas a la vez',
		values: ['Hasta 2', 'Hasta 5', 'Ilimitadas'],
	},
	{
		label: 'Acceso a ecosistema (+250 Apps)',
		values: [false, true, true],
	},
	{
		label: 'Interacción por Voz',
		values: [false, '60 mins / mes', 'Ilimitada'],
	},
	{
		label: 'Tareas automatizadas',
		values: ['Básicas (Leer correos)', 'Avanzadas (Agendar/Notificar)', 'Complejas (Flujos multi-app)'],
	},
	{
		label: 'Gestión desde WhatsApp/Telegram',
		values: [false, true, true],
	},
	{
		label: 'Personalización del Agente',
		values: ['No', 'Básica', 'Avanzada (Instrucciones propias)'],
	},
	{
		label: 'Soporte',
		values: ['Comunidad', 'Estándar (Email)', 'Prioritario 24/7'],
	},
];

export default function PricingSection() {
	return (
		<section className="relative z-10 py-16 px-8 lg:px-16 max-w-7xl mx-auto w-full" id="pricing">
			<div className="relative mx-auto flex max-w-4xl flex-col items-center text-center mb-16">
				<span className="inline-block px-4 py-1.5 mb-6 text-sm rounded-full border border-[#f99e02]/30 bg-[#f99e02]/10 text-[#f99e02] font-semibold tracking-wide shadow-[0_0_15px_rgba(249,158,2,0.2)]">
					💰 Precios
				</span>
				<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
					Elige el plan ideal para tu <span className="text-[#f99e02]">productividad</span>
				</h2>
				<p className="text-xl text-white/60 max-w-2xl mx-auto">
					Desde un uso casual hasta la dominación total de tu flujo de trabajo. M.A.R.I.A. escala contigo.
				</p>
			</div>
			
			<div className="mx-auto my-5 w-full overflow-x-auto pb-8">
                <PricingTable className="min-w-[900px] w-full">
                    <PricingTableHeader>
                        <PricingTableRow>
                            <th className="w-[28%]" />
                            <th className="p-2 w-[24%]">
                                <PricingTablePlan
                                    name="Free"
                                    badge="Para probar"
                                    price="$0"
                                    icon={User}
                                >
                                    <Button variant="outline" className="w-full rounded-xl py-6 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" size="lg">
                                        Empezar Gratis
                                    </Button>
                                </PricingTablePlan>
                            </th>
                            <th className="p-2 w-[24%]">
                                <PricingTablePlan
                                    name="Student"
                                    badge="Más popular"
                                    price="$4.99"
                                    compareAt="$9.99"
                                    icon={GraduationCap}
                                    className="border-[#f99e02]/50 shadow-[0_0_30px_rgba(249,158,2,0.15)] relative overflow-hidden"
                                >
                                    {/* Highlight overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#f99e02]/10 to-transparent pointer-events-none" />
                                    
                                    <Button
                                        className="w-full rounded-xl py-6 bg-[#f99e02] text-white font-bold hover:bg-[#e08e02] shadow-[0_0_20px_rgba(249,158,2,0.3)] border-none"
                                        size="lg"
                                    >
                                        Plan Estudiante
                                    </Button>
                                </PricingTablePlan>
                            </th>
                            <th className="p-2 w-[24%]">
                                <PricingTablePlan
                                    name="Pro"
                                    badge="Sin límites"
                                    price="$14.99"
                                    compareAt="$29.99"
                                    icon={Zap}
                                >
                                    <Button variant="outline" className="w-full rounded-xl py-6 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" size="lg">
                                        Subir a Pro
                                    </Button>
                                </PricingTablePlan>
                            </th>
                        </PricingTableRow>
                    </PricingTableHeader>
                    <PricingTableBody>
                        {FEATURES.map((feature, index) => (
                            <PricingTableRow key={index}>
                                <PricingTableHead>{feature.label}</PricingTableHead>
                                {feature.values.map((value, i) => (
                                    <PricingTableCell key={i}>{value}</PricingTableCell>
                                ))}
                            </PricingTableRow>
                        ))}
                    </PricingTableBody>
                </PricingTable>
            </div>
		</section>
	);
}
