import sophieLogo from "@/assets/sophie logo.png";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={sophieLogo} alt="Sophie" className={className} />;
}
