import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AdminPageHeader, AddButton, Modal, Field, Input, Select, DataTable, PrimaryButton, useModalForm,
} from "@/components/admin/AdminUI";
import { generateDiplomaPdf } from "@/lib/pdf-diploma";

export const Route = createFileRoute("/_authenticated/admin/diplomas")({
  component: DiplomasPage,
});

type Diploma = {
  id: string;
  numero_diplome: string;
  nom_complet: string;
  date_naissance: string | null;
  nom_diplome: string;
  option: string | null;
  mention: string | null;
  annee_academique: string | null;
  etablissement: string;
  date_obtention: string;
  date_delivrance: string;
  qr_code: string | null;
  pdf_url: string | null;
  student_id: string | null;
  program_id: string | null;
  is_valid: boolean;
};

const empty: Omit<Diploma, "id" | "qr_code" | "pdf_url"> = {
  numero_diplome: "",
  nom_complet: "",
  date_naissance: null,
  nom_diplome: "Licence (Bac+3)",
  option: "",
  mention: "Bien",
  annee_academique: "",
  etablissement: "Institut Supérieur de Formation en Informatique",
  date_obtention: new Date().toISOString().slice(0, 10),
  date_delivrance: new Date().toISOString().slice(0, 10),
  student_id: null,
  program_id: null,
  is_valid: true,
};

function suggestNumero() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ISFI-${year}-${rand}`;
}

function DiplomasPage() {
  const qc = useQueryClient();
  const { open, data, setData, editingId, openNew, openEdit, close } = useModalForm(empty);
  const [saving, setSaving] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["diplomas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("diplomas").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Diploma[];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["students", "select"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, matricule, nom, prenom, date_naissance, program_id");
      return (data ?? []) as { id: string; matricule: string; nom: string; prenom: string; date_naissance: string | null; program_id: string | null }[];
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs", "select"],
    queryFn: async () => {
      const { data } = await supabase.from("programs").select("id, nom_filiere");
      return (data ?? []) as { id: string; nom_filiere: string }[];
    },
  });

  function onSelectStudent(studentId: string) {
    const s = students.find((x) => x.id === studentId);
    if (!s) {
      setData({ ...data, student_id: null });
      return;
    }
    setData({
      ...data,
      student_id: s.id,
      nom_complet: `${s.prenom} ${s.nom}`,
      date_naissance: s.date_naissance,
      program_id: s.program_id ?? data.program_id,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...data,
        numero_diplome: data.numero_diplome || suggestNumero(),
        date_naissance: data.date_naissance || null,
      };
      if (editingId) {
        const { error } = await supabase.from("diplomas").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Diplôme mis à jour");
      } else {
        const { error } = await supabase.from("diplomas").insert(payload);
        if (error) throw error;
        toast.success("Diplôme créé");
      }
      qc.invalidateQueries({ queryKey: ["diplomas"] });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Diploma) {
    if (!confirm(`Supprimer le diplôme ${row.numero_diplome} ?`)) return;
    const { error } = await supabase.from("diplomas").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["diplomas"] }); }
  }

  async function generatePdf(row: Diploma) {
    setGeneratingId(row.id);
    try {
      const verificationUrl = `${window.location.origin}/verification?n=${encodeURIComponent(row.numero_diplome)}`;
      const { pdfBytes, qrDataUrl } = await generateDiplomaPdf(row, verificationUrl);

      const fileName = `${row.numero_diplome}.pdf`;
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

      const { error: upErr } = await supabase.storage
        .from("diplomas")
        .upload(fileName, blob, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;

      // Long-lived signed URL (1 year)
      const { data: signed, error: urlErr } = await supabase.storage
        .from("diplomas")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);
      if (urlErr) throw urlErr;

      const { error: dbErr } = await supabase
        .from("diplomas")
        .update({ pdf_url: signed.signedUrl, qr_code: qrDataUrl })
        .eq("id", row.id);
      if (dbErr) throw dbErr;

      toast.success("PDF généré et stocké");
      qc.invalidateQueries({ queryKey: ["diplomas"] });
      window.open(signed.signedUrl, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Diplômes"
        description="Délivrez les diplômes officiels avec génération PDF et QR Code de vérification."
        action={
          <AddButton
            onClick={() => {
              const init = { ...empty, numero_diplome: suggestNumero() };
              setData(init);
              openNew();
              setData(init);
            }}
            label="Nouveau diplôme"
          />
        }
      />

      <DataTable<Diploma>
        rows={rows}
        loading={isLoading}
        empty="Aucun diplôme délivré pour le moment."
        columns={[
          { key: "num", label: "N°", render: (r) => <span className="font-mono text-xs">{r.numero_diplome}</span> },
          { key: "nom", label: "Diplômé", render: (r) => <span className="font-medium">{r.nom_complet}</span> },
          { key: "dip", label: "Diplôme", render: (r) => r.nom_diplome },
          { key: "men", label: "Mention", render: (r) => r.mention ?? "—" },
          { key: "date", label: "Délivré le", render: (r) => new Date(r.date_delivrance).toLocaleDateString("fr-FR") },
          {
            key: "pdf", label: "PDF", render: (r) =>
              r.pdf_url ? (
                <a href={r.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                  <FileText className="h-3.5 w-3.5" /> Voir
                </a>
              ) : <span className="text-xs text-muted-foreground">—</span>,
          },
        ]}
        onEdit={(r) => openEdit({ ...r })}
        onDelete={remove}
        extraActions={(r) => (
          <button
            onClick={() => generatePdf(r)}
            disabled={generatingId === r.id}
            className="p-1.5 rounded-md hover:bg-accent text-primary disabled:opacity-50"
            title="Générer / régénérer le PDF"
          >
            {generatingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          </button>
        )}
      />

      <Modal open={open} onClose={close} title={editingId ? "Modifier le diplôme" : "Nouveau diplôme"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <Field label="Étudiant (optionnel — pré-remplit les champs)">
            <Select value={data.student_id ?? ""} onChange={(e) => onSelectStudent(e.target.value)}>
              <option value="">— Saisie manuelle —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.matricule})</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="N° de diplôme">
              <Input required value={data.numero_diplome} onChange={(e) => setData({ ...data, numero_diplome: e.target.value })} />
            </Field>
            <Field label="Filière">
              <Select value={data.program_id ?? ""} onChange={(e) => setData({ ...data, program_id: e.target.value || null })}>
                <option value="">— Aucune —</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.nom_filiere}</option>)}
              </Select>
            </Field>
            <Field label="Nom complet" className="col-span-2">
              <Input required value={data.nom_complet} onChange={(e) => setData({ ...data, nom_complet: e.target.value })} />
            </Field>
            <Field label="Date de naissance">
              <Input type="date" value={data.date_naissance ?? ""} onChange={(e) => setData({ ...data, date_naissance: e.target.value })} />
            </Field>
            <Field label="Type de diplôme">
              <Select value={data.nom_diplome} onChange={(e) => setData({ ...data, nom_diplome: e.target.value })}>
                <option>Licence (Bac+3)</option>
                <option>Master (Bac+5)</option>
                <option>Doctorat</option>
                <option>DUT / BTS</option>
              </Select>
            </Field>
            <Field label="Option / spécialité">
              <Input value={data.option ?? ""} onChange={(e) => setData({ ...data, option: e.target.value })} />
            </Field>
            <Field label="Mention">
              <Select value={data.mention ?? ""} onChange={(e) => setData({ ...data, mention: e.target.value })}>
                <option value="">Aucune</option>
                <option>Passable</option>
                <option>Assez Bien</option>
                <option>Bien</option>
                <option>Très Bien</option>
                <option>Excellent</option>
              </Select>
            </Field>
            <Field label="Année académique">
              <Input value={data.annee_academique ?? ""} onChange={(e) => setData({ ...data, annee_academique: e.target.value })} placeholder="2024 — 2025" />
            </Field>
            <Field label="Date d'obtention">
              <Input type="date" required value={data.date_obtention} onChange={(e) => setData({ ...data, date_obtention: e.target.value })} />
            </Field>
            <Field label="Date de délivrance">
              <Input type="date" required value={data.date_delivrance} onChange={(e) => setData({ ...data, date_delivrance: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <PrimaryButton variant="ghost" onClick={close}>Annuler</PrimaryButton>
            <PrimaryButton type="submit" loading={saving} variant="gold">Enregistrer le diplôme</PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
