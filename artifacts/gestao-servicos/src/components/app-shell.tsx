import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  ClipboardList,
  Hammer,
  Building2,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@workspace/replit-auth-web';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/servicos', label: 'Serviços', icon: Wrench },
  { href: '/materiais', label: 'Materiais', icon: Package },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/checklist', label: 'Checklist', icon: ClipboardCheck },
  { href: '/empresa', label: 'Empresa', icon: Building2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location === href || location.startsWith(href + '/');
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-background bg-noise">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Hammer className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-semibold text-sidebar-foreground text-[15px] tracking-tight">
              Gestão de
            </span>
            <span className="font-display font-semibold text-sidebar-foreground text-[15px] tracking-tight -mt-0.5">
              Serviços
            </span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/70 truncate mb-2">{user?.firstName || user?.email || 'Usuário'}</p>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2" data-testid="button-logout">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-4 h-14">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Hammer className="h-3.5 w-3.5" />
          </div>
          <span className="font-display font-semibold text-sidebar-foreground text-sm tracking-tight">
            Gestão de Serviços
          </span>
        </div>
        <nav className="flex overflow-x-auto px-2 pb-2 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`link-nav-mobile-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 md:ml-64 pt-24 md:pt-0 min-w-0 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
