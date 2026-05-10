import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { createPortal } from 'react-dom';

export function Header({ onSignInClick, onRegisterClick, onLogoClick }) {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	const links = [
		{
			label: 'Características',
			href: '#features',
		},
		{
			label: 'Precios',
			href: '#pricing',
		},
		{
			label: 'Integraciones',
			href: '#integrations',
		},
	];

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'fixed top-0 left-0 right-0 z-50 w-full border-b border-border',
				'bg-background/80 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg'
			)}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<button onClick={onLogoClick} className="hover:bg-white/5 rounded-md p-2 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent">
					<img src="logomaria-texto.png" alt="Maria Logo" className="h-12 w-auto object-contain" />
				</button>
				<div className="hidden items-center gap-2 md:flex">
					{links.map((link) => (
						<a key={link.label} className={buttonVariants({ variant: 'ghost' })} href={link.href}>
							{link.label}
						</a>
					))}
					<Button variant="outline" onClick={onSignInClick}>Iniciar Sesión</Button>
					<Button className="bg-[#f99e02] hover:bg-[#e08e02] text-white font-semibold" onClick={onRegisterClick}>Comenzar</Button>
				</div>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="md:hidden"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>
			<MobileMenu open={open} className="flex flex-col justify-between gap-2">
				<div className="grid gap-y-2">
					{links.map((link) => (
						<a
							key={link.label}
							className={buttonVariants({
								variant: 'ghost',
								className: 'justify-start',
							})}
							href={link.href}
						>
							{link.label}
						</a>
					))}
				</div>
				<div className="flex flex-col gap-2">
					<Button variant="outline" className="w-full bg-transparent" onClick={(e) => { setOpen(false); onSignInClick?.(e); }}>
						Iniciar Sesión
					</Button>
					<Button className="w-full bg-[#f99e02] hover:bg-[#e08e02] text-white font-semibold" onClick={(e) => { setOpen(false); onRegisterClick?.(e); }}>Comenzar</Button>
				</div>
			</MobileMenu>
		</header>
	);
}

function MobileMenu({ open, children, className, ...props }) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
				'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-4',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}
