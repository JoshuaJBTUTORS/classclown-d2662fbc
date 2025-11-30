import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinAnimationProps {
  show: boolean;
}

export const CoinAnimation: React.FC<CoinAnimationProps> = ({ show }) => {
  const coins = [0, 1, 2, 3, 4]; // 5 coins for cascade effect

  return (
    <AnimatePresence>
      {show && (
        <div className="relative pointer-events-none">
          {/* Cascading coins */}
          {coins.map((i) => (
            <motion.div
              key={i}
              initial={{ 
                y: 0, 
                x: 0, 
                opacity: 0, 
                scale: 0, 
                rotate: 0 
              }}
              animate={{ 
                y: -120 + Math.random() * 30,
                x: (Math.random() - 0.5) * 60,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0.8],
                rotate: (Math.random() - 0.5) * 30
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute text-4xl drop-shadow-lg"
              style={{ left: '50%', top: '50%' }}
            >
              🪙
            </motion.div>
          ))}
          
          {/* "+2" text */}
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.3, 1.2, 1],
              y: [-10, -40, -60, -80]
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute text-3xl font-bold drop-shadow-lg"
            style={{ 
              left: '50%', 
              top: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'hsl(var(--cleo-green))'
            }}
          >
            +2
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
