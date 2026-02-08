import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedHeroProps {
  name: string;
  role: string;
  tagline: string;
}

export default function AnimatedHero({ name, role, tagline }: AnimatedHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  if (!mounted) return null;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-5xl md:text-7xl font-bold tracking-tight"
        variants={itemVariants}
      >
        {name}
      </motion.h1>

      <motion.p
        className="text-xl md:text-2xl text-accent font-medium"
        variants={itemVariants}
      >
        {role}
      </motion.p>

      <motion.p
        className="text-lg md:text-xl text-neutral-600 max-w-2xl leading-relaxed"
        variants={itemVariants}
      >
        {tagline}
      </motion.p>

      <motion.div
        className="flex gap-4 pt-4"
        variants={itemVariants}
      >
        <a
          href="/about"
          className="px-8 py-3 bg-accent text-white font-medium rounded-full hover:bg-accent/90 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Learn More
        </a>
        <a
          href="/contact"
          className="px-8 py-3 border-2 border-neutral-300 text-neutral-900 font-medium rounded-full hover:border-accent hover:text-accent hover:bg-neutral-50 transition-all duration-200"
        >
          Get in Touch
        </a>
      </motion.div>
    </motion.div>
  );
}
