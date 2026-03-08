"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createWorkspaceAction,
  createWorkspaceReportAction,
  inviteWorkspaceMemberAction,
  type DashboardMutationState,
} from "@/app/dashboard/actions";

const INITIAL_DASHBOARD_MUTATION_STATE: DashboardMutationState = {
  status: "idle",
  timestamp: 0,
};

function useDashboardMutationFeedback(
  state: DashboardMutationState,
  options?: {
    refreshOnSuccess?: boolean;
    refreshDelayMs?: number;
    onSuccess?: (nextState: DashboardMutationState) => void;
  },
): void {
  const router = useRouter();
  const lastTimestampRef = useRef(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (state.status === "idle" || !state.message || state.timestamp <= 0) {
      return;
    }

    if (lastTimestampRef.current === state.timestamp) {
      return;
    }
    lastTimestampRef.current = state.timestamp;

    if (state.status === "success") {
      toast.success(state.message, { duration: 4500 });
      options?.onSuccess?.(state);
    } else {
      toast.error(state.message, { duration: 5500 });
    }

    if (state.status === "success" && options?.refreshOnSuccess) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, options.refreshDelayMs ?? 450);
    }
  }, [options, router, state]);
}

export function DashboardInviteForm({ workspaceId }: { workspaceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    inviteWorkspaceMemberAction,
    INITIAL_DASHBOARD_MUTATION_STATE,
  );
  useDashboardMutationFeedback(state, { refreshOnSuccess: true });

  useEffect(() => {
    if (state.status === "success" && state.timestamp > 0) {
      formRef.current?.reset();
    }
  }, [state.status, state.timestamp]);

  return (
    <form ref={formRef} action={formAction} className="dash-invite-form" noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input
        className="dash-input"
        type="email"
        name="email"
        placeholder="member@company.com"
        required
      />
      <select className="dash-select" name="role" defaultValue="member">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button className="dash-button" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}

export function DashboardCreateWorkspaceForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createWorkspaceAction,
    INITIAL_DASHBOARD_MUTATION_STATE,
  );
  useDashboardMutationFeedback(state, { refreshOnSuccess: true });

  useEffect(() => {
    if (state.status === "success" && state.timestamp > 0) {
      formRef.current?.reset();
    }
  }, [state.status, state.timestamp]);

  return (
    <form ref={formRef} action={formAction} className="dash-invite-form" noValidate>
      <input
        className="dash-input"
        name="workspaceName"
        placeholder="Workspace name"
        required
      />
      <button className="dash-button" type="submit" disabled={pending}>
        {pending ? "Creating..." : "+ Create"}
      </button>
    </form>
  );
}

export function DashboardCreateReportForm({ workspaceId }: { workspaceId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createWorkspaceReportAction,
    INITIAL_DASHBOARD_MUTATION_STATE,
  );
  useDashboardMutationFeedback(state, {
    refreshOnSuccess: true,
    onSuccess: (nextState) => {
      if (!nextState.reportDownloadUrl) {
        return;
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = nextState.reportDownloadUrl;
      downloadLink.target = "_blank";
      downloadLink.rel = "noopener noreferrer";
      downloadLink.click();
    },
  });

  useEffect(() => {
    if (state.status === "success" && state.timestamp > 0) {
      formRef.current?.reset();
    }
  }, [state.status, state.timestamp]);

  return (
    <form ref={formRef} action={formAction} className="dash-invite-form" noValidate>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input
        className="dash-input"
        name="title"
        placeholder="Weekly performance summary"
        required
      />
      <select className="dash-select" name="type" defaultValue="analytics">
        <option value="analytics">Analytics</option>
        <option value="engagement">Engagement</option>
        <option value="content">Content</option>
      </select>
      <button className="dash-button" type="submit" disabled={pending}>
        {pending ? "Generating..." : "Generate Report + PDF"}
      </button>
    </form>
  );
}
