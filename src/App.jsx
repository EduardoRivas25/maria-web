import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/ui/header-1'
import ShapeGrid from '@/components/ui/ShapeGrid'

import { SparklesText } from '@/components/ui/sparkles-text'
import RotatingText from '@/components/ui/RotatingText'
import { LinkCard } from '@/components/ui/link-card'
import { FlowDiagram } from '@/components/ui/flow-diagram'
import IntegrationHero from '@/components/ui/integration-hero'
import PricingSection from '@/components/ui/pricing-section'
import { MariaFooter } from '@/components/ui/maria-footer'
import LoginPage from '@/components/ui/login-page'
import SignInPage from '@/components/ui/sign-in-page'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const navigate = useNavigate()

  const handleLogoClick = () => {
    if (currentPage === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setCurrentPage('landing')
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0)
    }
  }

  const handleLogin = () => {
    // For now, any data → redirect to dashboard
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-clip">
      {currentPage === 'landing' ? (
        <>
          <Header 
            onLogoClick={handleLogoClick} 
            onSignInClick={() => setCurrentPage('signin')}
            onRegisterClick={() => setCurrentPage('login')} 
          />

          {/* Dark space for navbar area */}
          <div className="h-14 w-full bg-background relative z-20" />
          {/* Hero Section with Background ShapeGrid */}
      <div className="relative w-full h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ShapeGrid
            speed={0.3}
            squareSize={40}
            direction='diagonal' // up, down, left, right, diagonal
            borderColor="#f79902"
            hoverFillColor='#f79902'
            hoverTrailAmount={5} // number of trailing hovered shapes (0 = no trail)
            hoverColor="#f79902"
            shape="hexagon"
          />
        </div>

        <main className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-20 pointer-events-none max-w-7xl mx-auto w-full gap-16">
          <div className="pointer-events-auto flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <SparklesText
              text="MARIA"
              className="text-8xl md:text-9xl font-extrabold text-white mb-6"
            />
            <div className="flex flex-col items-center md:items-start gap-4 text-xl md:text-2xl text-white/80 font-medium mb-10 md:mb-0">
              <RotatingText
                texts={[
                  'Reduce tu carga cognitiva',
                  'Automatiza tus procesos',
                  'Mejora tu productividad',
                  'Optimiza tus estudios',
                  'Centraliza tus herramientas'
                ]}
                mainClassName="bg-[#f99e02] text-white font-bold overflow-hidden px-5 py-2 rounded-xl"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={3000}
              />
            </div>
          </div>

          <div className="pointer-events-auto flex-1 flex items-center justify-center md:justify-end w-full">
            <img
              src="/personaje-maria.png"
              alt="Maria personaje"
              className="w-full max-w-[320px] md:max-w-lg object-contain animate-float"
            />
          </div>
        </main>
      </div>

      {/* El Problema Section */}
      <section id="features" className="relative z-10 py-16 px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white">El </h2>
          <span className="text-[#f99e02] font-bold text-4xl md:text-5xl mb-4">Problema</span>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mt-4">
            La fragmentación digital está frenando tu potencial. Descubre por qué el caos actual no te deja avanzar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
          <LinkCard
            title="Fragmentación Digital"
            description="Vives saltando entre múltiples herramientas aisladas (calendario, notas, correos) perdiendo el hilo de tus tareas."
            imageUrl="/fragdigital.png"
            href="#"
          />
          <LinkCard
            title="Alta Carga Cognitiva"
            description="El esfuerzo mental constante de gestionar información duplicada genera fatiga y reduce tu capacidad de enfoque."
            imageUrl="/cargacognitiva.png"
            href="#"
          />
          <LinkCard
            title="Pérdida de Tiempo"
            description="Horas valiosas se desperdician cada día en tareas repetitivas y en la búsqueda de información fragmentada."
            imageUrl="/perdidatiempo.png"
            href="#"
          />
        </div>
      </section>

      {/* La Solución Unificada Section */}
      <section id="about" className="relative z-10 py-16 px-8 max-w-7xl mx-auto w-full my-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 md:p-16 flex flex-col md:flex-row items-center gap-16 overflow-hidden relative">

          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#f99e02]/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              La Solución <span className="text-[#f99e02]">Unificada</span>
            </h2>
            <h3 className="text-2xl font-semibold text-white/90 mb-4">Todo en un solo lugar</h3>
            <p className="text-xl text-white/70 mb-6 leading-relaxed">
              El antídoto al caos. Ya no necesitas saltar entre 10 pestañas distintas para gestionar tu día. M.A.R.I.A. centraliza todo a través de un solo agente inteligente.
            </p>
            <div className="bg-black/20 border border-white/10 rounded-2xl p-6 mb-0">
              <p className="text-lg text-white/80 leading-relaxed">
                Interactúa de forma natural mediante <strong>texto o voz</strong>. Dile lo que necesitas y ella se encargará de controlar y organizar toda tu vida académica y profesional al instante.
              </p>
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center relative z-10">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              {/* Animated decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[110%] h-[110%] rounded-full border border-[#f99e02]/20 animate-[spin_15s_linear_infinite] border-dashed" />
                <div className="absolute w-[80%] h-[80%] rounded-full border border-[#f99e02]/40 animate-[spin_10s_linear_infinite_reverse]" />
              </div>

              {/* Central Character/Avatar */}
              <div className="relative w-3/4 h-3/4 bg-black/40 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(249,158,2,0.2)]">
                <img
                  src="/solucion.png"
                  alt="M.A.R.I.A. Asistente"
                  className="w-full object-contain animate-float"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona Section */}
      <section className="relative z-10 py-16 px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cómo <span className="text-[#f99e02]">Funciona</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            El flujo técnico detrás de la magia. Así es como M.A.R.I.A. convierte tus palabras en acciones reales.
          </p>
        </div>

        <FlowDiagram />
      </section>

      {/* Integrations Section */}
      <IntegrationHero />

      {/* Pricing Section */}
      <PricingSection />

      <MariaFooter />
        </>
      ) : currentPage === 'login' ? (
        <LoginPage 
            onBack={() => setCurrentPage('landing')} 
            onSignInClick={() => setCurrentPage('signin')}
            onLogin={handleLogin}
        />
      ) : (
        <SignInPage 
            onBack={() => setCurrentPage('landing')} 
            onRegisterClick={() => setCurrentPage('login')}
            onLogin={handleLogin}
        />
      )}
    </div>
  )
}

export default App
