import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { Tooltip } from '@/components/ui/Tooltip';

export function ProfileMenu() {
  const { profile, signOut } = useAuth();
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const displayName = profile?.full_name || profile?.email || 'User';
  const initials = displayName.
  split(' ').
  map((n) => n[0]).
  join('').
  toUpperCase().
  slice(0, 2);

  const roleLabel = profile?.role ? t.roles[profile.role] : '';

  return (
    <div data-ev-id="ev_35bce7e1bb" className="relative" ref={menuRef}>
			<Tooltip content={t.tooltips.profileMenu}>
				<button data-ev-id="ev_cca90d16b7"
        onClick={() => setIsOpen(!isOpen)}
        className={
        `flex items-center gap-2 p-1.5 rounded-lg ` +
        `hover:bg-muted transition-colors focus-ring`
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t.tooltips.profileMenu}>

					{/* Avatar */}
					{profile?.avatar_url ?
          <img data-ev-id="ev_4f93832786"
          src={profile.avatar_url}
          alt=""
          className="w-8 h-8 rounded-full object-cover" /> :


          <div data-ev-id="ev_600dd87799" className="w-8 h-8 rounded-full bg-primary-muted flex items-center justify-center">
							<span data-ev-id="ev_2a7e5bb40d" className="text-xs font-medium text-primary">{initials}</span>
						</div>
          }
					<ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
				</button>
			</Tooltip>
			
			{/* Dropdown menu */}
			{isOpen &&
      <div data-ev-id="ev_67bdd5badb"
      className={
      `absolute inset-inline-end-0 top-full mt-2 w-64 ` +
      `bg-card border border-card-border rounded-xl shadow-lg ` +
      `overflow-hidden z-50`
      }
      role="menu">

					{/* User info header */}
					<div data-ev-id="ev_5c447561bb" className="p-4 border-b border-border">
						<p data-ev-id="ev_11b43bf939" className="font-medium text-foreground truncate">{displayName}</p>
						{roleLabel &&
          <p data-ev-id="ev_b35dfb5252" className="text-sm text-foreground-muted">{roleLabel}</p>
          }
					</div>
					
					{/* Menu items */}
					<div data-ev-id="ev_56babf96ed" className="p-2">
						<Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={
            `flex items-center gap-3 px-3 py-2.5 rounded-lg ` +
            `text-foreground-muted hover:text-foreground hover:bg-muted ` +
            `transition-colors focus-ring text-sm`
            }
            role="menuitem">

							<User className="w-4 h-4" />
							{t.profile.profile}
						</Link>
						
						<Link
            to="/settings"
            onClick={() => setIsOpen(false)}
            className={
            `flex items-center gap-3 px-3 py-2.5 rounded-lg ` +
            `text-foreground-muted hover:text-foreground hover:bg-muted ` +
            `transition-colors focus-ring text-sm`
            }
            role="menuitem">

							<Settings className="w-4 h-4" />
							{t.profile.settings}
						</Link>
						
						<div data-ev-id="ev_b632fb4a3a" className="my-2 border-t border-border" />
						
						<button data-ev-id="ev_2980adeff0"
          onClick={handleSignOut}
          className={
          `flex items-center gap-3 px-3 py-2.5 rounded-lg w-full ` +
          `text-destructive hover:bg-destructive-muted ` +
          `transition-colors focus-ring text-sm text-start`
          }
          role="menuitem">

							<LogOut className="w-4 h-4" />
							{t.auth.logout}
						</button>
					</div>
				</div>
      }
		</div>);

}