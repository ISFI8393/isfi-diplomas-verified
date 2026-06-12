import { useState, type ReactNode } from "react";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  loading,
  type = "button",
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "gold" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    gold: "bg-[var(--gradient-gold)] text-gold-foreground shadow-[var(--shadow-gold)] hover:opacity-90",
    ghost: "bg-background border border-border hover:bg-accent",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${styles}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <PrimaryButton onClick={onClick}>
      <Plus className="h-4 w-4" /> {label}
    </PrimaryButton>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div
        className={`w-full ${size === "lg" ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-card border border-border shadow-[var(--shadow-elegant)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`}
    />
  );
}

export function DataTable<T extends { id: string }>({
  rows,
  loading,
  empty,
  columns,
  onEdit,
  onDelete,
  extraActions,
}: {
  rows: T[];
  loading?: boolean;
  empty: string;
  columns: { key: string; label: string; render: (row: T) => ReactNode }[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => ReactNode;
}) {
  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left font-semibold">{c.label}</th>
            ))}
            {(onEdit || onDelete || extraActions) && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border hover:bg-secondary/30">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3">{c.render(row)}</td>
              ))}
              {(onEdit || onDelete || extraActions) && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {extraActions?.(row)}
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="p-1.5 rounded-md hover:bg-accent" title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive" title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function useModalForm<T>(initial: T) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<T>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  function openNew() {
    setData(initial);
    setEditingId(null);
    setOpen(true);
  }
  function openEdit(row: T & { id: string }) {
    setData(row);
    setEditingId(row.id);
    setOpen(true);
  }
  function close() {
    setOpen(false);
  }
  return { open, data, setData, editingId, openNew, openEdit, close };
}
