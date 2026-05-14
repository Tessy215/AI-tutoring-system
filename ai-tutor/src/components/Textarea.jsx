import { cn } from "../lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none placeholder:text-gray-400 flex min-h-16 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };