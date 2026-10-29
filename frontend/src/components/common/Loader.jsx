import { Loader2 } from 'lucide-react';

export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
      <span className="text-gray-400">{text}</span>
    </div>
  );
}