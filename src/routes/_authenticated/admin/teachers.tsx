import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader, AddButton, Modal, Field, Input, Textarea, DataTable, PrimaryButton, useModalForm,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  component: TeachersPage,
});

type Teacher = {
  id: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  matiere: string | null;
  grade: string | null;
  bio: string | null;
};

const empty: Omit<Teacher, "id"> = {
  matricule: "", nom: "", prenom: "", email: "", telephone: "", matiere: "", grade: "", bio: "",
};

function TeachersPage() {
  const qc = useQueryClient();
  const { open, data, setData, editingId, openNew, openEdit, close } = useModalForm<Omit<Teacher, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Teacher[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("teachers").update(data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teachers").insert(data);
        if (error) throw error;
      }
      toast.success("Enregistré");
      qc.invalidateQueries({ queryKey: ["teachers"] });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Teacher) {
    if (!confirm(`Supprimer ${row.prenom} ${row.nom} ?`)) return;
    const { error } = await supabase.from("teachers").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["teachers"] }); }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Enseignants"
        description="Gérez le corps enseignant de l'ISFI."
        action={<AddButton onClick={openNew} label="Nouvel enseignant" />}
      />
      <DataTable<Teacher>
        rows={rows}
        loading={isLoading}
        empty="Aucun enseignant pour le moment."
        columns={[
          { key: "mat", label: "Matricule", render: (r) => <span className="font-mono text-xs">{r.matricule ?? "—"}</span> },
          { key: "name", label: "Nom complet", render: (r) => <span className="font-medium">{r.prenom} {r.nom}</span> },
          { key: "matiere", label: "Matière", render: (r) => r.matiere ?? "—" },
          { key: "grade", label: "Grade", render: (r) => r.grade ?? "—" },
          { key: "email", label: "Email", render: (r) => r.email ?? "—" },
        ]}
        onEdit={(r) => openEdit({ ...r })}
        onDelete={remove}
      />

      <Modal open={open} onClose={close} title={editingId ? "Modifier l'enseignant" : "Nouvel enseignant"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matricule">
              <Input value={data.matricule ?? ""} onChange={(e) => setData({ ...data, matricule: e.target.value })} />
            </Field>
            <Field label="Grade">
              <Input value={data.grade ?? ""} onChange={(e) => setData({ ...data, grade: e.target.value })} placeholder="Professeur, Docteur, ..." />
            </Field>
            <Field label="Prénom">
              <Input required value={data.prenom} onChange={(e) => setData({ ...data, prenom: e.target.value })} />
            </Field>
            <Field label="Nom">
              <Input required value={data.nom} onChange={(e) => setData({ ...data, nom: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={data.email ?? ""} onChange={(e) => setData({ ...data, email: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <Input value={data.telephone ?? ""} onChange={(e) => setData({ ...data, telephone: e.target.value })} />
            </Field>
            <Field label="Matière(s)" className="col-span-2">
              <Input value={data.matiere ?? ""} onChange={(e) => setData({ ...data, matiere: e.target.value })} placeholder="Algorithmique, IA, ..." />
            </Field>
            <Field label="Bio" className="col-span-2">
              <Textarea rows={3} value={data.bio ?? ""} onChange={(e) => setData({ ...data, bio: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PrimaryButton variant="ghost" onClick={close}>Annuler</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Enregistrer</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
