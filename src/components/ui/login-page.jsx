import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import DotField from '@/components/ui/DotField';

export default function LoginPage({ onBack, onSignInClick, onLogin }) {
    const handleSubmit = (e) => { e.preventDefault(); onLogin?.(); };
    return (
        <section className="flex min-h-screen items-center justify-center bg-background px-4 py-16 relative overflow-hidden">
            {/* DotField Background */}
            <div className="absolute inset-0 z-0">
                <DotField
                    dotRadius={2}
                    dotSpacing={14}
                    bulgeStrength={67}
                    glowRadius={160}
                    sparkle={false}
                    waveAmplitude={0}
                    gradientFrom="#fdb501"
                    gradientTo="#f59702"
                    glowColor="#120F17"
                />
            </div>

            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 m-auto h-fit w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_80px_rgba(249,158,2,0.15)]">
                <div className="p-8 pb-6 md:p-10">
                    <div className="text-center">
                        <button onClick={onBack} aria-label="go home" className="mx-auto block w-fit border-none bg-transparent cursor-pointer">
                            <img 
                                src="/logomariaM.png" 
                                alt="M.A.R.I.A Logo" 
                                className="h-20 w-auto mb-4 drop-shadow-[0_0_15px_rgba(249,158,2,0.3)] mx-auto" 
                            />
                        </button>
                        <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
                        <p className="text-white/60 text-sm">Bienvenido a M.A.R.I.A. Regístrate para comenzar</p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstname">Nombre</Label>
                                <Input type="text" required name="firstname" id="firstname" placeholder="Juan" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname">Apellido</Label>
                                <Input type="text" required name="lastname" id="lastname" placeholder="Pérez" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input type="email" required name="email" id="email" placeholder="juan@ejemplo.com" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pwd">Contraseña</Label>
                                <a href="#" className="text-xs text-[#f99e02] hover:text-[#e08e02] transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <Input type="password" required name="pwd" id="pwd" placeholder="••••••••" />
                        </div>

                        <Button type="submit" className="w-full bg-[#f99e02] hover:bg-[#e08e02] text-white font-semibold rounded-xl py-6 mt-2">
                            Registrarse
                        </Button>
                    </div>

                    <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <hr className="border-white/10" />
                        <span className="text-white/40 text-xs uppercase tracking-wider">O continuar con</span>
                        <hr className="border-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex items-center justify-center gap-2 border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl py-6"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 256 262">
                                <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
                                <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
                                <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
                                <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
                            </svg>
                            <span>Google</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex items-center justify-center gap-2 border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl py-6"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"></path>
                            </svg>
                            <span>GitHub</span>
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 mt-2">
                    <p className="text-white/60 text-center text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <button type="button" onClick={onSignInClick} className="text-[#f99e02] hover:text-[#e08e02] font-semibold transition-colors bg-transparent border-none cursor-pointer p-0">
                            Inicia Sesión
                        </button>
                    </p>
                </div>
            </motion.form>
        </section>
    );
}
