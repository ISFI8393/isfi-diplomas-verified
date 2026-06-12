import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader, AddButton, Modal, Field, Input, Select, DataTable, PrimaryButton, useModalForm,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/students")({
  component: StudentsPage,
});

type Student = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  genre: string | null;
  program_id: string | null;
  annee_inscription: number | null;
  statut: string | null;
};

const empty: Omit<Student, "id"> = {
  matricule: "", nom: "", prenom: "", email: "", telephone: "",
  date_naissance: null, lieu_naissance: "", genre: "M", program_id: null,
  annee_inscription: new Date().getFullYear(), statut: "actif",
};

function StudentsPage() {
  const qc = useQueryClient();
  const { open, data, setData, editingId, openNew, openEdit, close } = useModalForm<Omit<Student, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, program:programs(nom_filiere)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Student & { program?: { nom_filiere: string } | null })[];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs", "select"],
    queryFn: async () => {
      const { data } = await supabase.from("programs").select("id, nom_filiere").order("nom_filiere");
      return (data ?? []) as { id: string; nom_filiere: string }[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...data, date_naissance: data.date_naissance || null };
      if (editingId) {
        const { error } = await supabase.from("students").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Étudiant mis à jour");
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) throw error;
        toast.success("Étudiant ajouté");
      }
      qc.invalidateQueries({ queryKey: ["students"] });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Student) {
    if (!confirm(`Supprimer l'étudiant ${row.prenom} ${row.nom} ?`)) return;
    const { error } = await supabase.from("students").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["students"] }); }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Étudiants"
        description="Gestion du fichier étudiant."
        action={<AddButton onClick={openNew} label="Nouvel étudiant" />}
      />
      <DataTable<Student & { program?: { nom_filiere: string } | null }>
        rows={rows}
        loading={isLoading}
        empty="Aucun étudiant pour le moment."
        columns={[
          { key: "mat", label: "Matricule", render: (r) => <span className="font-mono text-xs">{r.matricule}</span> },
          { key: "name", label: "Nom complet", render: (r) => <span className="font-medium">{r.prenom} {r.nom}</span> },
          { key: "email", label: "Email", render: (r) => r.email ?? "—" },
          { key: "prog", label: "Filière", render: (r) => r.program?.nom_filiere ?? "—" },
          { key: "year", label: "Année", render: (r) => r.annee_inscription ?? "—" },
          { key: "stat", label: "Statut", render: (r) => (
            <span className={`rounded-full px-2 py-0.5 text-xs ${r.statut === "diplomé" ? "bg-gold/15 text-gold-foreground" : "bg-success/15 text-success"}`}>
              {r.statut ?? "—"}
            </span>
          ) },
        ]}
        onEdit={(r) => openEdit({ ...r })}
        onDelete={remove}
      />

      <Modal open={open} onClose={close} title={editingId ? "Modifier l'étudiant" : "Nouvel étudiant"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matricule">
              <Input required value={data.matricule} onChange={(e) => setData({ ...data, matricule: e.target.value })} />
            </Field>
            <Field label="Statut">
              <Select value={data.statut ?? "actif"} onChange={(e) => setData({ ...data, statut: e.target.value })}>
                <option value="actif">Actif</option>
                <option value="diplomé">Diplômé</option>
                <option value="suspendu">Suspendu</option>
              </Select>
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
            <Field label="Date de naissance">
              <Input type="date" value={data.date_naissance ?? ""} onChange={(e) => setData({ ...data, date_naissance: e.target.value })} />
            </Field>
            <Field label="Lieu de naissance">
              <Input value={data.lieu_naissance ?? ""} onChange={(e) => setData({ ...data, lieu_naissance: e.target.value })} />
            </Field>
            <Field label="Genre">
              <Select value={data.genre ?? "M"} onChange={(e) => setData({ ...data, genre: e.target.value })}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
            <Field label="Année d'inscription">
              <Input type="number" min={2000} max={2100} value={data.annee_inscription ?? ""} onChange={(e) => setData({ ...data, annee_inscription: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Filière" className="col-span-2">
              <Select value={data.program_id ?? ""} onChange={(e) => setData({ ...data, program_id: e.target.value || null })}>
                <option value="">— Aucune —</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.nom_filiere}</option>)}
              </Select>
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
