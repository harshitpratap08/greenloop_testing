interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
}) => {
  return (
    <div
      className={`rounded-sm border border-gray-200 bg-gray-25 dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {/* Card Header */}
      <div className="px-6 py-5">
        <h3 className="font-archivo text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800 sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
