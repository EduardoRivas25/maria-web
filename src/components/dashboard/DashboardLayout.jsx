import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MariaBubble from "./MariaBubble";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] overflow-x-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop and Mobile Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobile ? (mobileMenuOpen ? "translate-x-0" : "-translate-x-full") : ""
        }`}
      >
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={() => {
            if (isMobile) {
              setMobileMenuOpen(false);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
        
        {/* Close Button inside Sidebar on Mobile */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 text-white/50 hover:text-white bg-white/5 rounded-full"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Mobile Hamburger Button */}
      {isMobile && !mobileMenuOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setMobileMenuOpen(true)}
          className="fixed bottom-6 left-6 z-30 p-3.5 bg-[#f99e02] text-white rounded-full shadow-[0_4px_20px_rgba(249,158,2,0.4)] hover:scale-105 transition-transform"
        >
          <Menu size={24} />
        </motion.button>
      )}

      {/* Main Content Area MARIA */}
      <motion.div
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 240) }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col min-h-screen relative"
      >
        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </motion.div>

      {/* M.A.R.I.A. Floating Bubble */}
      <MariaBubble />
    </div>
  );
}
