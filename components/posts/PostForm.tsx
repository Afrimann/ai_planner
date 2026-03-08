"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, UploadCloud, Wand } from "lucide-react";

import {
  createManagedPostAction,
  generateCaptionForPostAction,
} from "@/app/posts/actions";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types";

interface PostFormProps {
  mode?: "create" | "edit";
  initialPost?: Post;
  editAction?: (formData: FormData) => Promise<void>;
  workspaceId?: string | null;
}

type CreateFormState = {
  fieldErrors: Partial<
    Record<
      | "platform"
      | "caption"
      | "status"
      | "scheduled_date"
      | "scheduled_time"
      | "image",
      string
    >
  >;
  formError?: string;
  successMessage?: string;
};

type CaptionState = {
  fieldErrors: Partial<Record<"prompt", string>>;
  formError?: string;
  successMessage?: string;
  generatedCaption?: string;
};

const FORM_STYLES = `

  /* Labels — covers our spans AND Input component's internal label (text-black) */
  .nexus-post-form label > span,
  .nexus-post-form .nexus-label,
  .nexus-post-form label,
  .nexus-post-form [data-slot="label"],
  .nexus-post-form [class*="label"],
  .nexus-post-form [class*="Label"],
  .nexus-post-form .text-black,
  .nexus-post-form .text-sm.font-medium {
    color: hsl(var(--muted-foreground)) !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
  }

  /* All text inputs, selects, textareas */
  .nexus-post-form input:not([type="file"]):not([type="hidden"]),
  .nexus-post-form select,
  .nexus-post-form textarea {
    background: hsl(var(--card)) !important;
    color: hsl(var(--foreground)) !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 12px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 13.5px !important;
    outline: none !important;
    transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  }
  .nexus-post-form input:not([type="file"]):not([type="hidden"]):focus,
  .nexus-post-form select:focus,
  .nexus-post-form textarea:focus {
    border-color: hsl(var(--foreground) / 0.5) !important;
    box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.08) !important;
  }
  .nexus-post-form input::placeholder,
  .nexus-post-form textarea::placeholder {
    color: hsl(var(--muted-foreground)) !important;
    -webkit-text-fill-color: hsl(var(--muted-foreground)) !important;
    opacity: 1 !important;
  }
  /* Custom select arrow */
  .nexus-post-form select {
    appearance: none !important;
    -webkit-appearance: none !important;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23717171' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: right 14px center !important;
    background-size: 14px !important;
    padding-right: 40px !important;
    cursor: pointer !important;
  }
  .nexus-post-form select:focus {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: right 14px center !important;
    background-size: 14px !important;
  }

  .nexus-post-form select option {
    background: hsl(var(--card)) !important;
    color: hsl(var(--foreground)) !important;
  }
  .nexus-post-form input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0px 1000px hsl(var(--card)) inset !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
  }

  /* Char counter / helper text */
  .nexus-char-counter {
    color: hsl(var(--muted-foreground)) !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 11px !important;
  }
  .nexus-open-ai-link {
    color: hsl(var(--foreground)) !important;
    font-size: 11px !important;
    font-family: 'Poppins', sans-serif !important;
    text-decoration: underline !important;
    text-decoration-color: hsl(var(--foreground) / 0.3) !important;
    text-underline-offset: 3px !important;
    background: none !important;
    border: none !important;
    cursor: pointer !important;
    padding: 0 !important;
    transition: color 0.15s ease !important;
  }
  .nexus-open-ai-link:hover { color: hsl(var(--foreground)) !important; }

  /* Field error text — also catches Input's internal p.text-black error */
  .nexus-post-form .nexus-field-error,
  .nexus-post-form p.text-black,
  .nexus-post-form p[id$="-error"],
  .nexus-post-form p[class~="text-xs"],
  .nexus-post-form [aria-invalid="true"] ~ p {
    color: hsl(var(--destructive)) !important;
    font-size: 11px !important;
    font-family: 'Poppins', sans-serif !important;
    margin-top: 2px !important;
  }

  /* Section label */
  .nexus-section-label {
    color: hsl(var(--muted-foreground));
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  /* Image preview area */
  .nexus-image-zone {
    border-radius: 14px;
    padding: 16px;
    background: hsl(var(--muted) / 0.5);
    border: 1px solid hsl(var(--border));
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .nexus-image-placeholder {
    height: 180px;
    border-radius: 10px;
    border: 1px dashed hsl(var(--border));
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(var(--muted-foreground));
    font-size: 13px;
    font-family: 'Poppins', sans-serif;
    gap: 8px;
    background: hsl(var(--muted) / 0.35);
  }

  /* AI modal textarea */
  .nexus-modal-form textarea,
  .nexus-modal-form input {
    background: hsl(var(--card)) !important;
    color: hsl(var(--foreground)) !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 12px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 13.5px !important;
    outline: none !important;
    padding: 10px 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
  }
  .nexus-modal-form textarea:focus,
  .nexus-modal-form input:focus {
    border-color: hsl(var(--foreground) / 0.5) !important;
    box-shadow: 0 0 0 3px hsl(var(--foreground) / 0.08) !important;
  }
  .nexus-modal-form textarea::placeholder,
  .nexus-modal-form input::placeholder {
    color: hsl(var(--muted-foreground)) !important;
    -webkit-text-fill-color: hsl(var(--muted-foreground)) !important;
  }
  .nexus-modal-label {
    color: hsl(var(--muted-foreground));
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: block;
  }

  /* Generated caption box */
  .nexus-generated-box {
    margin-top: 16px;
    border-radius: 12px;
    padding: 16px;
    background: hsl(var(--muted) / 0.7);
    border: 1px solid hsl(var(--border));
  }
  .nexus-generated-label {
    margin: 0 0 8px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: hsl(var(--foreground));
    font-family: 'Poppins', sans-serif;
  }
  .nexus-generated-text {
    font-size: 13px;
    color: hsl(var(--foreground));
    white-space: pre-wrap;
    line-height: 1.6;
    font-family: 'Poppins', sans-serif;
  }

  /* Action button inside form */
  .nexus-action-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 10px;
    font-size: 13px; font-weight: 500; font-family: 'Poppins', sans-serif;
    cursor: pointer; border: none; outline: none;
    transition: transform 0.15s ease, background 0.15s ease;
    white-space: nowrap;
  }
  .nexus-action-btn.primary {
    background: hsl(var(--foreground));
    color: hsl(var(--background));
  }
  .nexus-action-btn.primary:hover { transform: translateY(-1px); }
  .nexus-action-btn.secondary {
    background: hsl(var(--muted));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
  }
  .nexus-action-btn.secondary:hover { background: hsl(var(--accent)); transform: translateY(-1px); }
`;

// ─── Styled select wrapper ─────────────────────────────────────────────────────
function NexusSelect({
  label,
  name,
  defaultValue,
  required,
  children,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="nexus-label">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        style={{ height: 48, padding: "0 12px" }}
      >
        {children}
      </select>
      {error && <span className="nexus-field-error">{error}</span>}
    </label>
  );
}

// ─── Styled date/time input ────────────────────────────────────────────────────
function NexusDateInput({
  label,
  name,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="nexus-label">{label}</span>
      <input
        type={name.includes("time") ? "time" : "date"}
        name={name}
        defaultValue={defaultValue}
        style={{ height: 48, padding: "0 12px" }}
      />
      {error && <span className="nexus-field-error">{error}</span>}
    </label>
  );
}

export function PostForm({
  mode = "create",
  initialPost,
  editAction,
  workspaceId,
}: PostFormProps) {
  const isEdit = mode === "edit";
  const [caption, setCaption] = useState(initialPost?.caption ?? "");
  const [imageUrl, setImageUrl] = useState(initialPost?.image_url ?? "");
  const [previewUrl, setPreviewUrl] = useState(initialPost?.image_url ?? "");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const createInitialState = useMemo<CreateFormState>(
    () => ({ fieldErrors: {} }),
    [],
  );
  const captionInitialState = useMemo<CaptionState>(
    () => ({ fieldErrors: {} }),
    [],
  );

  const [createState, createAction] = useActionState(
    createManagedPostAction,
    createInitialState,
  );
  const [captionState, captionAction, captionPending] = useActionState(
    generateCaptionForPostAction,
    captionInitialState,
  );

  const safeCreateState = createState ?? createInitialState;
  const safeCaptionState = captionState ?? captionInitialState;

  // ── ALL LOGIC UNTOUCHED ──
  useEffect(() => {
    if (!safeCreateState.successMessage || isEdit) return;
    formRef.current?.reset();
    setCaption("");
    setImageUrl("");
    setPreviewUrl("");
    setSelectedFileName("");
  }, [isEdit, safeCreateState.successMessage]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      setSelectedFileName("");
      return;
    }
    setSelectedFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function applyGeneratedCaption() {
    if (!safeCaptionState.generatedCaption) return;
    setCaption(safeCaptionState.generatedCaption);
    setAiModalOpen(false);
  }

  async function copyGeneratedCaption() {
    if (!safeCaptionState.generatedCaption) return;
    await navigator.clipboard.writeText(safeCaptionState.generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const activeAction = isEdit && editAction ? editAction : createAction;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FORM_STYLES }} />

      {/* Card wrapper */}
      <div
        className="card"
        style={{
          height: "fit-content",
        }}
        >

          {/* Card header */}
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                color: "hsl(var(--foreground))",
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {isEdit ? "Editing" : "New"}
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.02em",
              }}
            >
              {isEdit ? "Edit Post" : "Create Post"}
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "hsl(var(--muted-foreground))",
                fontWeight: 300,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Structured form for scheduling and publishing workflow.
            </p>
          </div>

          {/* AI Caption button */}
          <div style={{ marginBottom: 20 }}>
            <Tooltip label="Generate caption using AI">
              <button
                type="button"
                className="nexus-action-btn secondary w-full justify-center sm:w-auto"
                onClick={() => setAiModalOpen(true)}
              >
                <Wand style={{ width: 14, height: 14 }} />
                AI Caption
              </button>
            </Tooltip>
          </div>

          {/* ── FORM — ALL LOGIC UNTOUCHED ── */}
          <form
            ref={formRef}
            id="post-form"
            action={activeAction}
            className="nexus-post-form"
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            {isEdit && initialPost && (
              <input type="hidden" name="id" value={initialPost.id} />
            )}
            <input
              type="hidden"
              name="workspaceId"
              value={workspaceId ?? initialPost?.workspace_id ?? ""}
            />
            <input type="hidden" name="image_url" value={imageUrl} />
            <input
              ref={fileInputRef}
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                handleFileChange(e.currentTarget.files?.[0] ?? null);
                setImageModalOpen(false);
              }}
            />

            {/* Title + Platform */}
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            >
              <Input
                label="Title"
                name="title"
                defaultValue={initialPost?.title ?? ""}
                placeholder="Q4 campaign launch"
                maxLength={120}
              />
              <NexusSelect
                label="Platform"
                name="platform"
                defaultValue={initialPost?.platform ?? "instagram"}
                required
                error={safeCreateState.fieldErrors.platform}
              >
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter</option>
              </NexusSelect>
            </div>

            {/* Status + Category + Tags */}
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
            >
              <NexusSelect
                label="Status"
                name="status"
                defaultValue={initialPost?.status ?? "draft"}
                required
                error={safeCreateState.fieldErrors.status}
              >
                <option value="draft">Draft</option>
                <option value="planned">Planned</option>
                <option value="posted">Posted</option>
              </NexusSelect>
              <NexusSelect
                label="Category"
                name="category"
                defaultValue="general"
              >
                <option value="general">General</option>
                <option value="launch">Launch</option>
                <option value="engagement">Engagement</option>
                <option value="promotion">Promotion</option>
              </NexusSelect>
              <Input
                label="Tags"
                name="tags"
                placeholder="#saas, #content"
                helperText="UI metadata for workflow."
              />
            </div>

            {/* Caption */}
            <label style={{ display: "grid", gap: 6 }}>
              <span className="nexus-label">Body / Caption</span>
              <textarea
                name="caption"
                value={caption}
                onChange={(e) => setCaption(e.currentTarget.value)}
                required
                rows={8}
                maxLength={2000}
                style={{
                  padding: "10px 14px",
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
              />
              <div
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="nexus-char-counter">
                  {caption.length}/2000
                </span>
                <button
                  type="button"
                  className="nexus-open-ai-link"
                  onClick={() => setAiModalOpen(true)}
                >
                  Open AI assistant
                </button>
              </div>
              {safeCreateState.fieldErrors.caption && (
                <span className="nexus-field-error">
                  {safeCreateState.fieldErrors.caption}
                </span>
              )}
            </label>

            {/* Date + Time */}
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            >
              <NexusDateInput
                label="Scheduled Date"
                name="scheduled_date"
                defaultValue={initialPost?.scheduled_date ?? ""}
                error={safeCreateState.fieldErrors.scheduled_date}
              />
              <NexusDateInput
                label="Scheduled Time"
                name="scheduled_time"
                defaultValue={initialPost?.scheduled_time?.slice(0, 5) ?? ""}
                error={safeCreateState.fieldErrors.scheduled_time}
              />
            </div>

            {/* Featured Image */}
            <div>
              <p className="nexus-section-label">Featured Image</p>
              <div className="nexus-image-zone">
                <div>
                  <Tooltip label="Upload or link a featured image">
                    <button
                      type="button"
                      className="nexus-action-btn secondary w-full justify-center sm:w-auto"
                      onClick={() => setImageModalOpen(true)}
                    >
                      <UploadCloud style={{ width: 14, height: 14 }} />
                      Upload Image
                    </button>
                  </Tooltip>
                </div>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Featured preview"
                    style={{
                      height: 180,
                      width: "100%",
                      borderRadius: 10,
                      objectFit: "cover",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                ) : (
                  <div className="nexus-image-placeholder">
                    <ImageIcon style={{ width: 16, height: 16 }} />
                    No image selected
                  </div>
                )}
                {(selectedFileName || imageUrl) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedFileName && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "hsl(var(--muted-foreground))",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        File: {selectedFileName}
                      </span>
                    )}
                    {imageUrl && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "hsl(var(--muted-foreground))",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      >
                        URL linked
                      </span>
                    )}
                  </div>
                )}
              </div>
              {safeCreateState.fieldErrors.image && (
                <span
                  className="nexus-field-error"
                  style={{ display: "block", marginTop: 4 }}
                >
                  {safeCreateState.fieldErrors.image}
                </span>
              )}
            </div>

            {/* Alerts — LOGIC UNTOUCHED */}
            {safeCreateState.formError && (
              <Alert
                variant="error"
                title="Unable to save post"
                description={safeCreateState.formError}
              />
            )}
            {safeCreateState.successMessage && (
              <Alert variant="success" title={safeCreateState.successMessage} />
            )}

            <SubmitButton
              pendingText={isEdit ? "Updating post..." : "Saving post..."}
            >
              {isEdit ? "Update Post" : "Save Post"}
            </SubmitButton>
          </form>
        </div>

      {/* ── AI Caption Modal — ALL LOGIC UNTOUCHED ── */}
      <Modal
        open={aiModalOpen}
        title="AI Caption Assistant"
        onClose={() => setAiModalOpen(false)}
      >
        <form
          action={captionAction}
          className="nexus-modal-form"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="nexus-modal-label">Prompt</span>
            <textarea
              name="prompt"
              rows={5}
              maxLength={1000}
              required
              placeholder="Describe the content intent, audience and tone..."
            />
          </label>
          {safeCaptionState.fieldErrors.prompt && (
            <span className="nexus-field-error">
              {safeCaptionState.fieldErrors.prompt}
            </span>
          )}
          {safeCaptionState.formError && (
            <Alert
              variant="error"
              title="AI generation failed"
              description={safeCaptionState.formError}
            />
          )}
          <Button
            type="submit"
            fullWidth
            loading={captionPending}
            className="nexus-btn"
          >
            {captionPending ? "Generating..." : "Generate Caption"}
          </Button>
        </form>

        {safeCaptionState.generatedCaption && (
          <div className="nexus-generated-box">
            <p className="nexus-generated-label">Generated Caption</p>
            <p className="nexus-generated-text">
              {safeCaptionState.generatedCaption}
            </p>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <button
                type="button"
                className="nexus-action-btn secondary"
                onClick={applyGeneratedCaption}
              >
                Use in editor
              </button>
              <button
                type="button"
                className="nexus-action-btn secondary"
                onClick={copyGeneratedCaption}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Image Modal — ALL LOGIC UNTOUCHED ── */}
      <Modal
        open={imageModalOpen}
        title="Image Manager"
        onClose={() => setImageModalOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Alert
            variant="info"
            title="Upload rules"
            description="Accepted: JPEG, PNG, WEBP, GIF. Max file size 5MB."
          />
          <button
            type="button"
            className="nexus-action-btn secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={openFilePicker}
          >
            <UploadCloud style={{ width: 14, height: 14 }} />
            Select file
          </button>
          <label
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
            className="nexus-modal-form"
          >
            <span className="nexus-modal-label">Or paste image URL</span>
            <input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.currentTarget.value);
                setPreviewUrl(e.currentTarget.value);
              }}
              placeholder="https://example.com/image.jpg"
            />
          </label>
        </div>
      </Modal>
    </>
  );
}

function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending} className="nexus-btn">
      {pending ? pendingText : children}
    </Button>
  );
}



