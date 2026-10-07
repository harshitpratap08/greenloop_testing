import { cn } from "@/utils";

/**
 * Editorial figure — photography as a structural element, always captioned
 * with subject and demo-dataset context. Flat border, no masks or shine.
 */
export default function Figure({
  src,
  alt,
  caption,
  credit,
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="overflow-hidden border border-steel-200 dark:border-steel-800">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn("block h-auto w-full object-cover", imgClassName)}
        />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          {caption && (
            <span className="text-theme-xs text-ink-700 dark:text-gray-300">{caption}</span>
          )}
          {credit && (
            <span className="ledger-numeral text-theme-xs text-steel-500">{credit}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
