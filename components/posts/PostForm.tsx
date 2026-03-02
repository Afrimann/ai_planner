"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, Sparkles, UploadCloud } from "lucide-react";

import {
  createManagedPostAction,
  generateCaptionForPostAction,
} from "@/app/posts/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
// import { warnPostManagementSupabaseSetup } from "@/lib/supabase-setup";
import type { Post } from "@/types";

interface PostFormProps {
  mode?: "create" | "edit";
  initialPost?: Post;
  editAction?: (formData: FormData) => Promise<void>;
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

export function PostForm({
  mode = "create",
  initialPost,
  editAction,
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

  // useEffect(() => {
  //   warnPostManagementSupabaseSetup();
  // }, []);

  useEffect(() => {
    if (!safeCreateState.successMessage || isEdit) {
      return;
    }
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

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  }

  function applyGeneratedCaption() {
    if (!safeCaptionState.generatedCaption) {
      return;
    }
    setCaption(safeCaptionState.generatedCaption);
    setAiModalOpen(false);
  }

  async function copyGeneratedCaption() {
    if (!safeCaptionState.generatedCaption) {
      return;
    }
    await navigator.clipboard.writeText(safeCaptionState.generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const activeAction = isEdit && editAction ? editAction : createAction;

  return (
    <Card
      title={isEdit ? "Edit Post" : "Create Post"}
      description="Structured form for scheduling and publishing workflow."
      className="h-fit"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Tooltip label="Generate caption using AI">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAiModalOpen(true)}
            >
              <div className="flex gap-2 items-center">
                <Sparkles className="h-4 w-4" />
                AI Caption
              </div>
            </Button>
          </Tooltip>
        </div>
      </div>

      <form
        ref={formRef}
        id="post-form"
        action={activeAction}
        className="space-y-4"
      >
        {isEdit && initialPost ? (
          <input type="hidden" name="id" value={initialPost.id} />
        ) : null}

        <input type="hidden" name="image_url" value={imageUrl} />
        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            handleFileChange(event.currentTarget.files?.[0] ?? null);
            setImageModalOpen(false);
          }}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Title"
            name="title"
            defaultValue={initialPost?.title ?? ""}
            placeholder="Q4 campaign launch"
            maxLength={120}
          />

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Platform</span>
            <select
              name="platform"
              defaultValue={initialPost?.platform ?? "instagram"}
              required
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
            </select>
            {safeCreateState.fieldErrors.platform ? (
              <span className="text-xs text-black">
                {safeCreateState.fieldErrors.platform}
              </span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Status</span>
            <select
              name="status"
              defaultValue={initialPost?.status ?? "draft"}
              required
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            >
              <option value="draft">Draft</option>
              <option value="planned">Planned</option>
              <option value="posted">Posted</option>
            </select>
            {safeCreateState.fieldErrors.status ? (
              <span className="text-xs text-black">
                {safeCreateState.fieldErrors.status}
              </span>
            ) : null}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Category</span>
            <select
              name="category"
              defaultValue="general"
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            >
              <option value="general">General</option>
              <option value="launch">Launch</option>
              <option value="engagement">Engagement</option>
              <option value="promotion">Promotion</option>
            </select>
          </label>

          <Input
            label="Tags"
            name="tags"
            placeholder="#saas, #content, #launch"
            helperText="UI metadata input for workflow organization."
          />
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-zinc-700">Body / Caption</span>
          <textarea
            name="caption"
            value={caption}
            onChange={(event) => setCaption(event.currentTarget.value)}
            required
            rows={8}
            maxLength={2000}
            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 text-black outline-none focus:border-black"
          />
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{caption.length}/2000</span>
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              className="underline decoration-zinc-300 underline-offset-2 hover:text-black"
            >
              Open AI assistant
            </button>
          </div>
          {safeCreateState.fieldErrors.caption ? (
            <span className="text-xs text-black">
              {safeCreateState.fieldErrors.caption}
            </span>
          ) : null}
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Scheduled Date</span>
            <input
              type="date"
              name="scheduled_date"
              defaultValue={initialPost?.scheduled_date ?? ""}
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            />
            {safeCreateState.fieldErrors.scheduled_date ? (
              <span className="text-xs text-black">
                {safeCreateState.fieldErrors.scheduled_date}
              </span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Scheduled Time</span>
            <input
              type="time"
              name="scheduled_time"
              defaultValue={initialPost?.scheduled_time?.slice(0, 5) ?? ""}
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            />
            {safeCreateState.fieldErrors.scheduled_time ? (
              <span className="text-xs text-black">
                {safeCreateState.fieldErrors.scheduled_time}
              </span>
            ) : null}
          </label>
        </div>

        <section className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Featured Image</p>
          <div className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3">
            <Tooltip label="Upload or link a featured image">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setImageModalOpen(true)}
              >
                <div className="flex gap-2 items-center">
                  <UploadCloud className="h-4 w-4" />
                  Upload Image
                </div>
              </Button>
            </Tooltip>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Featured preview"
                className="h-52 w-full rounded-xl border border-zinc-300 object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-sm text-zinc-500">
                <ImageIcon className="mr-2 h-4 w-4" />
                No image selected
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
              {selectedFileName ? <span>File: {selectedFileName}</span> : null}
              {imageUrl ? <span>URL linked</span> : null}
            </div>
          </div>
          {safeCreateState.fieldErrors.image ? (
            <span className="text-xs text-black">
              {safeCreateState.fieldErrors.image}
            </span>
          ) : null}
        </section>

        {safeCreateState.formError ? (
          <Alert
            variant="error"
            title="Unable to save post"
            description={safeCreateState.formError}
          />
        ) : null}
        {safeCreateState.successMessage ? (
          <Alert variant="success" title={safeCreateState.successMessage} />
        ) : null}

        <SubmitButton
          pendingText={isEdit ? "Updating post..." : "Saving post..."}
        >
          {isEdit ? "Update Post" : "Save Post"}
        </SubmitButton>
      </form>

      <Modal
        open={aiModalOpen}
        title="AI Caption Assistant"
        onClose={() => setAiModalOpen(false)}
      >
        <form action={captionAction} className="space-y-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Prompt</span>
            <textarea
              name="prompt"
              rows={5}
              maxLength={1000}
              required
              className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
              placeholder="Describe the content intent, audience and tone..."
            />
          </label>
          {safeCaptionState.fieldErrors.prompt ? (
            <span className="text-xs text-black">
              {safeCaptionState.fieldErrors.prompt}
            </span>
          ) : null}
          {safeCaptionState.formError ? (
            <Alert
              variant="error"
              title="AI generation failed"
              description={safeCaptionState.formError}
            />
          ) : null}
          <Button type="submit" fullWidth loading={captionPending}>
            {captionPending ? "Generating..." : "Generate Caption"}
          </Button>
        </form>

        {safeCaptionState.generatedCaption ? (
          <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Generated Caption
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black">
              {safeCaptionState.generatedCaption}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={applyGeneratedCaption}
              >
                Use in editor
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={copyGeneratedCaption}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={imageModalOpen}
        title="Image Manager"
        onClose={() => setImageModalOpen(false)}
      >
        <div className="space-y-3">
          <Alert
            variant="info"
            title="Upload rules"
            description="Accepted: JPEG, PNG, WEBP, GIF. Max file size 5MB."
          />
          <Button
            type="button"
            variant="secondary"
            onClick={openFilePicker}
            fullWidth
          >
            <UploadCloud className="h-4 w-4" />
            Select file
          </Button>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Or paste image URL</span>
            <input
              value={imageUrl}
              onChange={(event) => {
                setImageUrl(event.currentTarget.value);
                setPreviewUrl(event.currentTarget.value);
              }}
              placeholder="https://example.com/image.jpg"
              className="h-12 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-black"
            />
          </label>
        </div>
      </Modal>
    </Card>
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
    <Button type="submit" fullWidth loading={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
