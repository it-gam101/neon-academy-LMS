interface AuthDividerProps {
  text: string;
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div data-ev-id="ev_24be49db87" className="relative my-6">
			<div data-ev-id="ev_f938dffec2" className="absolute inset-0 flex items-center">
				<div data-ev-id="ev_a8017ecaf2" className="w-full border-t border-border" />
			</div>
			<div data-ev-id="ev_c85d3a61e3" className="relative flex justify-center">
				<span data-ev-id="ev_eeedb4e2ff" className="bg-card px-3 text-sm text-foreground-muted">
					{text}
				</span>
			</div>
		</div>);

}