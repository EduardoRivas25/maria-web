import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, BrainCircuit, Workflow, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { 
    id: 1, 
    title: "Instrucción", 
    desc: "El usuario da una orden por texto o voz.", 
    icon: MessageSquare 
  },
  { 
    id: 2, 
    title: "Interpretación", 
    desc: "Gemini 3 analiza la intención exacta.", 
    icon: BrainCircuit 
  },
  { 
    id: 3, 
    title: "Automatización", 
    desc: "n8n orquesta los flujos de trabajo.", 
    icon: Workflow 
  },
  { 
    id: 4, 
    title: "Ejecución", 
    desc: "La acción se completa en la app destino.", 
    icon: CheckCircle 
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { 
    scaleX: 1, 
    opacity: 1,
    transition: { duration: 1.2, ease: "easeInOut", delay: 0.5 }
  }
};

const floatingIconVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      ease: "easeInOut",
      repeat: Infinity,
    }
  }
};

export function FlowDiagram({ className }) {
  return (
    <div className={cn("w-full py-12", className)}>
      <motion.div 
        className="flex flex-col md:flex-row items-center justify-between relative max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        
        {/* Background connecting line for desktop */}
        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-white/5 z-0 rounded-full">
          {/* Static gradient line that draws in */}
          <motion.div 
            className="h-full bg-gradient-to-r from-transparent via-[#f99e02]/50 to-transparent origin-left"
            variants={lineVariants}
          />
          {/* Animated moving dot representing data flow */}
          <motion.div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#f99e02] rounded-full shadow-[0_0_20px_4px_#f99e02]"
            initial={{ left: "0%", opacity: 0, x: "-50%" }}
            animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.5, ease: "linear", repeat: Infinity, repeatDelay: 1 }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <motion.div 
              className="flex flex-col items-center relative z-10 w-64 my-6 md:my-0 group"
              variants={itemVariants}
            >
              {/* Icon Container with Floating Animation */}
              <motion.div 
                className="w-24 h-24 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center mb-6 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-[#f99e02]/50 group-hover:shadow-[0_0_40px_rgba(249,158,2,0.4)] relative overflow-hidden"
                variants={floatingIconVariants}
                animate="animate"
                // Adding a slight delay based on index so they don't float in perfect sync
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                {/* Inner glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f99e02]/0 via-[#f99e02]/0 to-[#f99e02]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Subtle pulse effect */}
                <div className="absolute inset-0 rounded-2xl border border-[#f99e02]/40 animate-ping opacity-0 group-hover:opacity-100" />
                
                <step.icon className="w-10 h-10 text-white group-hover:text-[#f99e02] transition-colors duration-300 relative z-10" />
              </motion.div>
              
              {/* Text */}
              <div className="text-center transition-transform duration-300 group-hover:-translate-y-1">
                <h4 className="text-xl font-bold text-white mb-2 group-hover:text-[#f99e02] transition-colors">{step.id}. {step.title}</h4>
                <p className="text-sm text-white/60 leading-relaxed px-4">
                  {step.desc}
                </p>
              </div>
            </motion.div>

            {/* Mobile connecting line with moving data packet */}
            {index < steps.length - 1 && (
              <div className="block md:hidden h-16 w-[2px] bg-white/5 relative my-2">
                <motion.div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#f99e02] rounded-full shadow-[0_0_10px_#f99e02]"
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2, ease: "linear", repeat: Infinity, delay: index * 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        ))}

      </motion.div>
    </div>
  );
}
