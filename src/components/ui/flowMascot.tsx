/* FlowMascotCorner.tsx
 * A tidy, fully-typed, accessible cartoon mascot + speech-bubble corner helper
 * Drop inside any Next.js / React project with Tailwind + Framer-Motion installed.
 */
import { FC, memo } from "react";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

export interface FlowMascotCornerProps {
  /** Text inside the speech bubble */
  message?: string;
}

/* ---------- Animation presets ---------- */
const containerVariants: Variants = {
  hidden: { y: 64, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 1.2, type: "spring", stiffness: 120 },
  },
};

const bubbleVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 1.5, type: "spring", duration: 0.6 },
  },
};

const mascotVariants: Variants = {
  animate: {
    rotate: [0, 10, -10, 0],
    transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
  },
};

/* ---------- Component ---------- */
export const FlowMascotCorner: FC<FlowMascotCornerProps> = memo(
  ({
    message = "¿Listo para tu primer workflow? Haz click en 'Launch Builder'!",
  }) => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="fixed bottom-8 right-8 z-50 flex select-none flex-col items-end gap-0"
      style={{ pointerEvents: "none" }}
    >
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col items-center"
        style={{ pointerEvents: "auto" }}
      >
        {/* Speech bubble */}
        <div
          className="relative max-w-xs rounded-3xl border-4 border-neutral-800
                     bg-white px-6 py-4 text-center text-base font-semibold
                     leading-snug text-blue-700 shadow-[2px_8px_0_2px_rgba(38,38,38,0.09)]
                     cartoon-bubble"
          aria-label="Flow mascot message"
        >
          {message}
          {/* Bubble tail */}
          <svg
            aria-hidden
            className="absolute left-1/2 -bottom-4 -translate-x-1/2 transform"
            width="44"
            height="24"
            viewBox="0 0 44 24"
            fill="none"
          >
            <polygon
              points="22,24 0,0 44,0"
              fill="#fff"
              stroke="#222"
              strokeWidth="4"
            />
          </svg>
        </div>

        {/* Mascot */}
        <motion.div
          variants={mascotVariants}
          animate="animate"
          className="-mt-1"
        >
          <Image
            src="/robot.svg" // replace with your mascot SVG/PNG
            alt="FlowAPI mascot waving hello"
            width={62}
            height={62}
            priority
            draggable={false}
            className="rounded-full border-[2.5px] border-neutral-800 bg-white
                       shadow-[2px_4px_0_rgba(38,38,38,0.11)]"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
);

export default FlowMascotCorner;
