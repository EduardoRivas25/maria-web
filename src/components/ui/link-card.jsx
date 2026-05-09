import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const LinkCard = React.forwardRef(
  ({ className, title, description, imageUrl, ...props }, ref) => {
    const cardVariants = {
      initial: { scale: 1, y: 0 },
      hover: {
        scale: 1.03,
        y: -5,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 15,
        },
      },
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'group relative flex h-80 w-full max-w-sm flex-col justify-between overflow-hidden',
          'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-card-foreground shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        variants={cardVariants}
        initial="initial"
        whileHover="hover"
        {...props}
      >
        {/* Text content */}
        <div className="z-10">
          <h3 className="mb-2 text-2xl font-bold tracking-tight text-white">
            {title}
          </h3>
          <p className="max-w-[90%] text-sm text-white/70 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Image container */}
        <div className="absolute bottom-0 right-0 h-48 w-48 translate-x-2 translate-y-2 transform">
          <motion.img
            src={imageUrl}
            alt={`${title} illustration`}
            className="h-full w-full object-contain transition-all duration-500 ease-out group-hover:scale-125 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:-rotate-6 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"
          />
        </div>
      </motion.div>
    );
  }
);

LinkCard.displayName = 'LinkCard';

export { LinkCard };
