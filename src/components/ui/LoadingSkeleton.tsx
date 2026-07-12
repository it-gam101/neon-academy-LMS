interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'list' | 'text';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 3 }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div data-ev-id="ev_d0d8fecf44" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{Array.from({ length: count }).map((_, i) =>
        <div data-ev-id="ev_ebd43f0188" key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
						<div data-ev-id="ev_723640774f" className="h-40 bg-muted rounded-lg mb-4" />
						<div data-ev-id="ev_984a492adb" className="h-4 bg-muted rounded w-3/4 mb-2" />
						<div data-ev-id="ev_e43737213d" className="h-3 bg-muted rounded w-1/2 mb-4" />
						<div data-ev-id="ev_1020f150cd" className="h-8 bg-muted rounded w-1/3" />
					</div>
        )}
			</div>);

  }

  if (variant === 'table') {
    return (
      <div data-ev-id="ev_636dbc21f5" className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
				<div data-ev-id="ev_b502e02537" className="h-12 bg-muted border-b border-border" />
				{Array.from({ length: count }).map((_, i) =>
        <div data-ev-id="ev_7d64a9a4aa" key={i} className="h-14 border-b border-border flex items-center gap-4 px-4">
						<div data-ev-id="ev_728e296890" className="h-4 bg-muted rounded w-1/4" />
						<div data-ev-id="ev_b0683ff1bc" className="h-4 bg-muted rounded w-1/4" />
						<div data-ev-id="ev_5c9e03bddc" className="h-4 bg-muted rounded w-1/4" />
						<div data-ev-id="ev_187540e7d4" className="h-4 bg-muted rounded w-1/4" />
					</div>
        )}
			</div>);

  }

  if (variant === 'list') {
    return (
      <div data-ev-id="ev_5ff2d17633" className="space-y-4 animate-pulse">
				{Array.from({ length: count }).map((_, i) =>
        <div data-ev-id="ev_b1676def94" key={i} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
						<div data-ev-id="ev_7877018016" className="w-12 h-12 bg-muted rounded-lg" />
						<div data-ev-id="ev_de83c6862e" className="flex-1">
							<div data-ev-id="ev_63fcb8a68b" className="h-4 bg-muted rounded w-1/3 mb-2" />
							<div data-ev-id="ev_b0b197358c" className="h-3 bg-muted rounded w-1/2" />
						</div>
						<div data-ev-id="ev_aa7bc01425" className="h-8 bg-muted rounded w-20" />
					</div>
        )}
			</div>);

  }

  return (
    <div data-ev-id="ev_5edc09139b" className="space-y-2 animate-pulse">
			{Array.from({ length: count }).map((_, i) =>
      <div data-ev-id="ev_1c249921a1" key={i} className="h-4 bg-muted rounded" style={{ width: `${80 - i * 10}%` }} />
      )}
		</div>);

}