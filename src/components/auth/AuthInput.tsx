import { type ReactNode } from 'react';

interface AuthInputProps {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
}

export function AuthInput({
  id,
  type,
  label,
  value,
  onChange,
  icon,
  autoComplete,
  required,
  placeholder
}: AuthInputProps) {
  return (
    <div data-ev-id="ev_0eb86f5a73" className="flex flex-col gap-1.5">
			<label data-ev-id="ev_722ffc058d" htmlFor={id} className="text-sm font-medium text-foreground">
				{label}
			</label>
			<div data-ev-id="ev_0571395400" className="relative">
				{icon &&
        <span data-ev-id="ev_7d4151bf7b" className="absolute inset-inline-start-3 top-1/2 -translate-y-1/2 text-foreground-muted">
						{icon}
					</span>
        }
				<input data-ev-id="ev_ccd399e403"
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className={
        `w-full h-11 rounded-lg bg-input border border-input-border text-foreground ` +
        `placeholder:text-foreground-subtle focus-ring transition-colors ` +
        `${icon ? 'ps-10 pe-4' : 'px-4'}`
        } />

			</div>
		</div>);

}