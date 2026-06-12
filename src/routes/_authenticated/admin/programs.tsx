import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader,
  AddButton,
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  DataTable,
  PrimaryButton,
  useModalForm,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/programs")({
  component: ProgramsPage,
});

type Program = {
  id: string;
  code: string;
  nom_filiere: string;
  description: string | null;
  niveau: string | null;
  duree_annees: number | null;
};

const empty: Omit<Program, "id"> = {
  code: "",
  nom_filiere: "",
  description: "",
  niveau: "Licence",
  duree_annees: 3,
};

function ProgramsPage() {
  const qc = useQueryClient();
  const { open, data, setData, editingId, openNew, openEdit, close } =
    useModalForm<Omit<Program, "id">>(empty);
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("programs").update(data).eq("id", editingId);
        if (error) throw error;
        toast.success("Formation mise à jour");
      } else {
        const { error } = await supabase.from("programs").insert(data);
        if (error) throw error;
        toast.success("Formation créée");
      }
      qc.invalidateQueries({ queryKey: ["programs"] });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Program) {
    if (!confirm(`Supprimer la formation "${row.nom_filiere}" ?`)) return;
    const { error } = await supabase.from("programs").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Supprimée");
      qc.invalidateQueries({ queryKey: ["programs"] });
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Formations"
        description="Gérez les filières et programmes proposés par l'ISFI."
        action={<AddButton onClick={openNew} label="Nouvelle formation" />}
      />

      <DataTable<Program>
        rows={rows}
        loading={isLoading}
        empty="Aucune formation. Créez votre première filière."
        columns={[
          { key: "code", label: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: "nom", label: "Nom", render: (r) => <span className="font-medium">{r.nom_filiere}</span> },
          { key: "niveau", label: "Niveau", render: (r) => r.niveau ?? "—" },
          { key: "duree", label: "Durée", render: (r) => (r.duree_annees ? `${r.duree_annees} an(s)` : "—") },
        ]}
        onEdit={(r) => openEdit({ ...r })}
        onDelete={remove}
      />

      <Modal open={open} onClose={close} title={editingId ? "Modifier la formation" : "Nouvelle formation"}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code (unique)">
              <Input required value={data.code} onChange={(e) => setData({ ...data, code: e.target.value })} placeholder="GL-L3" />
            </Field>
            <Field label="Niveau">
              <Select value={data.niveau ?? ""} onChange={(e) => setData({ ...data, niveau: e.target.value })}>
                <option value="Licence">Licence</option>
                <option value="Master">Master</option>
                <option value="Doctorat">Doctorat</option>
                <option value="DUT">DUT / BTS</option>
              </Select>
            </Field>
          </div>
          <Field label="Nom de la filière">
            <Input required value={data.nom_filiere} onChange={(e) => setData({ ...data, nom_filiere: e.target.value })} placeholder="Génie Logiciel" />
          </Field>
          <Field label="Durée (années)">
            <Input type="number" min={1} max={8} value={data.duree_annees ?? ""} onChange={(e) => setData({ ...data, duree_annees: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={data.description ?? ""} onChange={(e) => setData({ ...data, description: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <PrimaryButton variant="ghost" onClick={close}>Annuler</PrimaryButton>
            <PrimaryButton type="submit" loading={saving}>Enregistrer</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
