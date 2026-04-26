import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Croissant, LogOut, Image as ImageIcon, Package, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BAKERY } from "@/config/bakery";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    document.title = `Dashboard — ${BAKERY.name} Admin`;
  }, []);

  const phone = (user?.user_metadata as { phone?: string } | undefined)?.phone ?? "Admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-bakery flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-warm text-primary-foreground">
              <Croissant className="h-5 w-5" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-semibold">{BAKERY.name}</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Admin dashboard
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Signed in as <span className="font-medium text-foreground">{phone}</span>
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground/80 transition-all hover:border-destructive/40 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="container-bakery py-12">
        <div className="mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            Welcome back
          </span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your bakery, at a glance
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage products, banners, and customer orders. Full dashboard with analytics & CSV export coming up next.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Package,
              title: "Products",
              body: "Add, edit, and remove items from your menu.",
              to: "/admin/products",
            },
            {
              icon: ImageIcon,
              title: "Banners",
              body: "Manage homepage carousel images.",
              to: "/admin/banners",
            },
            {
              icon: ClipboardList,
              title: "Orders",
              body: "Track WhatsApp orders, payments, and deliveries.",
              to: null,
            },
          ].map((card) => {
            const inner = (
              <>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-primary">
                  <card.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                {!card.to && (
                  <span className="mt-4 inline-block rounded-full bg-highlight/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-highlight-foreground">
                    Coming next
                  </span>
                )}
                {card.to && (
                  <span className="mt-4 inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Manage →
                  </span>
                )}
              </>
            );
            const className =
              "group block rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-warm";
            return card.to ? (
              <Link key={card.title} to={card.to} className={className}>
                {inner}
              </Link>
            ) : (
              <div key={card.title} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
