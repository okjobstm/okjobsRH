import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export function BrandMark({ className = "size-7", priority = false }: BrandMarkProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
      draggable={false}
      height={310}
      priority={priority}
      src="/brand/okjobs-logo.png"
      width={305}
    />
  );
}
