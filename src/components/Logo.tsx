import logoAsset from "@/assets/mastercbc-logo.png.asset.json";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return <img src={logoAsset.url} alt="Master CBC" className={className} />;
}
