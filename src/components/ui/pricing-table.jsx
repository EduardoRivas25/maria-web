import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { Badge } from './badge';

function PricingTable({ className, ...props }) {
	return (
		<div
			data-slot="table-container"
			className="relative w-full overflow-x-auto"
		>
			<table className={cn('w-full text-sm', className)} {...props} />
		</div>
	);
}

function PricingTableHeader({ ...props }) {
	return <thead data-slot="table-header" {...props} />;
}

function PricingTableBody({
	className,
	...props
}) {
	return (
		<tbody
			data-slot="table-body"
			className={cn('[&_tr]:divide-x [&_tr]:border-b [&_tr]:border-white/10 [&_td]:border-white/10 [&_th]:border-white/10 [&_tr]:divide-white/10', className)}
			{...props}
		/>
	);
}

function PricingTableRow({ className, ...props }) {
	return <tr data-slot="table-row" className={cn("hover:bg-white/[0.02] transition-colors", className)} {...props} />;
}

function PricingTableCell({
	className,
	children,
	...props
}) {
	return (
		<td
			data-slot="table-cell"
			className={cn('p-3 align-middle whitespace-nowrap text-white/80 text-center', className)}
			{...props}
		>
			{children === true ? (
				<CheckIcon aria-hidden="true" className="size-5 text-[#f99e02] mx-auto" />
			) : children === false ? (
				<MinusIcon
					aria-hidden="true"
					className="text-white/20 size-5 mx-auto"
				/>
			) : (
				children
			)}
		</td>
	);
}

function PricingTableHead({ className, ...props }) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				'p-3 text-left align-middle font-medium whitespace-nowrap text-white',
				className,
			)}
			{...props}
		/>
	);
}

function PricingTablePlan({
	name,
	badge,
	price,
	compareAt,
	icon: Icon,
	children,
	className,
	...props
}) {
	return (
		<div
			className={cn(
				'bg-white/5 relative h-full overflow-hidden rounded-2xl border border-white/10 p-5 font-normal backdrop-blur-md text-left',
				className,
			)}
			{...props}
		>
			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-[#f99e02]">
					{Icon && <Icon className="h-5 w-5" />}
				</div>
				<h3 className="text-white font-semibold text-lg capitalize">{name}</h3>
				{badge && (
					<Badge
						variant="secondary"
						className="ml-auto rounded-full border border-[#f99e02]/30 bg-[#f99e02]/10 text-[#f99e02] px-3 py-1 text-xs font-medium whitespace-nowrap"
					>
						{badge}
					</Badge>
				)}
			</div>

			<div className="mt-6 flex items-baseline gap-2">
				<span className="text-4xl font-bold text-white">{price}</span>
				{compareAt && (
					<span className="text-white/40 text-sm line-through">
						{compareAt}
					</span>
				)}
				{price !== "Gratis" && price !== "$0" && <span className="text-white/60 text-sm">/mes</span>}
			</div>
			<div className="relative z-10 mt-6">{children}</div>
		</div>
	);
}

export {
	PricingTable,
	PricingTableHeader,
	PricingTableBody,
	PricingTableRow,
	PricingTableHead,
	PricingTableCell,
	PricingTablePlan,
};
