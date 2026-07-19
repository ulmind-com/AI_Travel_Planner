import React from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

export const ParallaxCard = ({ children, className = '', hoverScale = 1.02, ...props }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D rotation
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 250, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 250, damping: 25 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      whileHover={{ scale: hoverScale }}
      className={`relative ${className}`}
      {...props}
    >
      <div style={{ transform: "translateZ(15px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

export default ParallaxCard;
