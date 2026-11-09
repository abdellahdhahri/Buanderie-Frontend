export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 border-b border-border">
          <div className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-muted rounded flex-1 animate-pulse"
              />
            ))}
          </div>
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-border last:border-0">
            <div className="flex gap-4 p-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-muted rounded flex-1 animate-pulse"
                  style={{
                    animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
