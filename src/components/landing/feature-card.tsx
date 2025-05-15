import { Workflow, Settings, GitBranch, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---------- constants ---------- */
export const FEATURES = [
  { icon: Workflow,  title: 'Visual Builder', desc: 'Drag, drop, connect.',        color: 'cyan'   },
  { icon: Settings,  title: 'Easy Tweaks',    desc: 'Headers, JSON & more.',       color: 'lime'   },
  { icon: GitBranch, title: 'Open & Growing', desc: 'Custom nodes incoming!',      color: 'purple' },
] as const;

/* ---------- types ---------- */
// Define props explicitly based on the FEATURES structure
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: (typeof FEATURES)[number]['color']; // Use the actual color union type
}

/* ---------- component ---------- */

/**
 * Renders a feature card with an icon, title, description, and background color.
 * @param {object} props - Component props.
 * @param {LucideIcon} props.icon - Icon component from lucide-react.
 * @param {string} props.title - Feature title.
 * @param {string} props.desc - Feature description.
 * @param {'cyan' | 'lime' | 'purple'} props.color - Color theme for the card.
 */
export function FeatureCard({ icon: Icon, title, desc, color }: FeatureCardProps) {
  // Base reveal class applied in the parent mapping
  return (
    <div className="p-6 rounded-2xl border-2 border-black bg-white shadow-lg flex flex-col items-center text-center transition-transform duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1">
      <div className={cn('p-3 rounded-lg mb-4',
        color === 'cyan'   ? 'bg-cyan-100'   :
        color === 'lime'   ? 'bg-lime-100'   :
                            'bg-purple-100' // Default or final case
      )}>
        <Icon className={cn('h-7 w-7',
          color === 'cyan'   ? 'text-cyan-700'   :
          color === 'lime'   ? 'text-lime-700'   :
                              'text-purple-700' // Default or final case
        )}/>
      </div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm text-neutral-700">{desc}</p>
    </div>
  );
} 