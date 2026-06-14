import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Image as ImageIcon, Loader2, Upload, Trash2 } from "lucide-react";
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
  diploma_pdf_url: string | null;
  photo_url: string | null;
  student_id: string | null;
  program_id: string | null;
  is_valid: boolean;
};

const empty: Omit<Diploma, "id" | "qr_code" | "pdf_url" | "diploma_pdf_url" | "photo_url"> = {
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

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB
const PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function suggestNumero() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ISFI-${year}-${rand}`;
}

async function signedUrlFor(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error) throw error;
  return data.signedUrl;
}

/** Downscale + crop to a square ~512px JPEG/WEBP for candidate photos. */
async function resizePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  const target = 512;
  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, target, target);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Conversion image échouée"))),
      "image/jpeg",
      0.9,
    );
  });
}

function DiplomasPage() {
  const qc = useQueryClient();
  const { open, data, setData, editingId, openNew, openEdit, close } = useModalForm(empty);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; file: File; row: Diploma } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [targetRow, setTargetRow] = useState<Diploma | null>(null);

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
      const { data } = await supabase.from("students").select("id, matricule, nom, prenom, date_naissance, program_id, photo_url");
      return (data ?? []) as { id: string; matricule: string; nom: string; prenom: string; date_naissance: string | null; program_id: string | null; photo_url: string | null }[];
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
    setBusyId(row.id);
    try {
      const verificationUrl = `${window.location.origin}/verification?n=${encodeURIComponent(row.numero_diplome)}`;
      const { pdfBytes, qrDataUrl } = await generateDiplomaPdf(row, verificationUrl);

      const fileName = `generated/${row.numero_diplome}.pdf`;
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });

      const { error: upErr } = await supabase.storage
        .from("diplomas")
        .upload(fileName, blob, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;

      const signedUrl = await signedUrlFor("diplomas", fileName);

      const { error: dbErr } = await supabase
        .from("diplomas")
        .update({ pdf_url: signedUrl, qr_code: qrDataUrl })
        .eq("id", row.id);
      if (dbErr) throw dbErr;

      toast.success("PDF généré et stocké");
      qc.invalidateQueries({ queryKey: ["diplomas"] });
      window.open(signedUrl, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de génération");
    } finally {
      setBusyId(null);
    }
  }

  function triggerPdfUpload(row: Diploma) {
    setTargetRow(row);
    pdfInputRef.current?.click();
  }

  function triggerPhotoUpload(row: Diploma) {
    setTargetRow(row);
    photoInputRef.current?.click();
  }

  async function onPickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !targetRow) return;
    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("Le fichier dépasse 20 Mo");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewPdf({ url, file, row: targetRow });
  }

  async function confirmUploadPdf() {
    if (!previewPdf) return;
    const { file, row } = previewPdf;
    setBusyId(row.id);
    try {
      const fileName = `uploads/${row.numero_diplome}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("diplomas")
        .upload(fileName, file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const signedUrl = await signedUrlFor("diplomas", fileName);
      const { error: dbErr } = await supabase
        .from("diplomas")
        .update({ diploma_pdf_url: signedUrl })
        .eq("id", row.id);
      if (dbErr) throw dbErr;
      toast.success("Diplôme PDF téléversé");
      qc.invalidateQueries({ queryKey: ["diplomas"] });
      URL.revokeObjectURL(previewPdf.url);
      setPreviewPdf(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      setBusyId(null);
    }
  }

  async function deletePdf(row: Diploma) {
    if (!row.diploma_pdf_url) return;
    if (!confirm("Supprimer le PDF importé ?")) return;
    setBusyId(row.id);
    try {
      await supabase.storage.from("diplomas").remove([`uploads/${row.numero_diplome}.pdf`]);
      const { error } = await supabase.from("diplomas").update({ diploma_pdf_url: null }).eq("id", row.id);
      if (error) throw error;
      toast.success("PDF supprimé");
      qc.invalidateQueries({ queryKey: ["diplomas"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !targetRow) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error("Formats acceptés : JPG, PNG, WEBP");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Image trop volumineuse (max 8 Mo)");
      return;
    }
    setBusyId(targetRow.id);
    try {
      const blob = await resizePhoto(file);
      const fileName = `photos/${targetRow.numero_diplome}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("diplomas")
        .upload(fileName, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const signedUrl = await signedUrlFor("diplomas", fileName);
      const { error: dbErr } = await supabase
        .from("diplomas")
        .update({ photo_url: signedUrl })
        .eq("id", targetRow.id);
      if (dbErr) throw dbErr;
      toast.success("Photo enregistrée");
      qc.invalidateQueries({ queryKey: ["diplomas"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Diplômes"
        description="Délivrez les diplômes officiels avec génération PDF, photo et QR Code de vérification."
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

      {/* Hidden file inputs reused for any row */}
      <input ref={pdfInputRef} type="file" accept="application/pdf" hidden onChange={onPickPdf} />
      <input ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" hidden onChange={onPickPhoto} />

      <DataTable<Diploma>
        rows={rows}
        loading={isLoading}
        empty="Aucun diplôme délivré pour le moment."
        columns={[
          { key: "num", label: "N°", render: (r) => <span className="font-mono text-xs">{r.numero_diplome}</span> },
          { key: "nom", label: "Diplômé", render: (r) => <span className="font-medium">{r.nom_complet}</span> },
          { key: "dip", label: "Diplôme", render: (r) => r.nom_diplome },
          {
            key: "pdf_up", label: "PDF importé", render: (r) =>
              r.diploma_pdf_url ? (
                <a href={r.diploma_pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                  <FileText className="h-3.5 w-3.5" /> Voir
                </a>
              ) : <span className="text-xs text-muted-foreground">—</span>,
          },
          {
            key: "photo", label: "Photo", render: (r) =>
              r.photo_url ? (
                <a href={r.photo_url} target="_blank" rel="noreferrer">
                  <img src={r.photo_url} alt="" className="h-9 w-9 rounded-md object-cover border border-border" />
                </a>
              ) : <span className="text-xs text-muted-foreground">—</span>,
          },
          {
            key: "verif", label: "Vérification", render: (r) => (
              <a
                href={`/verification?n=${encodeURIComponent(r.numero_diplome)}`}
                target="_blank" rel="noreferrer"
                className="text-primary hover:underline text-xs"
              >Vérifier</a>
            ),
          },
        ]}
        onEdit={(r) => openEdit({ ...r })}
        onDelete={remove}
        extraActions={(r) => (
          <>
            <button
              onClick={() => triggerPdfUpload(r)}
              disabled={busyId === r.id}
              className="p-1.5 rounded-md hover:bg-accent text-primary disabled:opacity-50"
              title={r.diploma_pdf_url ? "Remplacer le PDF importé" : "Importer un diplôme PDF"}
            >
              {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>
            {r.diploma_pdf_url && (
              <button
                onClick={() => deletePdf(r)}
                disabled={busyId === r.id}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive disabled:opacity-50"
                title="Supprimer le PDF importé"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => triggerPhotoUpload(r)}
              disabled={busyId === r.id}
              className="p-1.5 rounded-md hover:bg-accent text-primary disabled:opacity-50"
              title="Importer la photo du candidat"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => generatePdf(r)}
              disabled={busyId === r.id}
              className="p-1.5 rounded-md hover:bg-accent text-primary disabled:opacity-50"
              title="Générer / régénérer le PDF officiel"
            >
              <Download className="h-4 w-4" />
            </button>
          </>
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

      <Modal
        open={!!previewPdf}
        onClose={() => {
          if (previewPdf) URL.revokeObjectURL(previewPdf.url);
          setPreviewPdf(null);
        }}
        title="Aperçu du PDF avant envoi"
        size="lg"
      >
        {previewPdf && (
          <div className="space-y-4">
            <iframe src={previewPdf.url} className="h-[60vh] w-full rounded-md border border-border" title="Aperçu PDF" />
            <div className="flex justify-end gap-2">
              <PrimaryButton variant="ghost" onClick={() => { URL.revokeObjectURL(previewPdf.url); setPreviewPdf(null); }}>Annuler</PrimaryButton>
              <PrimaryButton variant="gold" loading={busyId === previewPdf.row.id} onClick={confirmUploadPdf}>
                Valider et téléverser
              </PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
