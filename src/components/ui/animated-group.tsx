'use client';

import React, { Children, useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  once?: boolean; // Trigger animation only once
  amount?: number; // Percentage of element in view to trigger animation
}

const defaultContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
};

export const AnimatedGroup: React.FC<AnimatedGroupProps> = ({
  children,
  className,
  variants = {},
  once = true,
  amount = 0.2, // Trigger when 20% is visible
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const containerVariants = variants.container ?? defaultContainerVariants;
  const itemVariants = variants.item ?? defaultItemVariants;

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}; 