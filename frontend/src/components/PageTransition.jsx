/**
 * PageTransition — Wraps route content with a smooth fade+slide entrance animation.
 * Uses Framer Motion's AnimatePresence for exit animations on route change.
 *
 * Usage:
 *   <PageTransition><YourPage /></PageTransition>
 */
import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)',
  },
  enter: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
  },
};

const pageTransition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1], // ease-out-expo
};

const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default React.memo(PageTransition);
