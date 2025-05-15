import { PlugZap, SlidersHorizontal, PlayCircle, Share2, LucideIcon } from 'lucide-react';

/* ---------- constants ---------- */
export const STEPS = [
  { icon: PlugZap,           title: 'Connect',   desc: 'Link data sources.' },
  { icon: SlidersHorizontal, title: 'Configure', desc: 'Set logic visually.' },
  { icon: PlayCircle,        title: 'Run',       desc: 'Execute instantly.' },
  { icon: Share2,            title: 'Ship',      desc: 'Deliver everywhere.' },
] as const;

/* ---------- types ---------- */
interface StepCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

/* ---------- component ---------- */

/**
 * Renders a step card for the "How it works" section.
 * @param {object} props - Component props.
 * @param {LucideIcon} props.icon - Icon component from lucide-react.
 * @param {string} props.title - Step title.
 * @param {string} props.desc - Step description.
 */
export function StepCard({ icon: Icon, title, desc }: StepCardProps) {
  // Base reveal class applied in the parent mapping
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="p-4 rounded-xl bg-blue-100 border-2 border-black shadow-sm">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h4 className="font-bold">{title}</h4>
      <p className="text-sm text-neutral-600">{desc}</p>
    </div>
  );
} 