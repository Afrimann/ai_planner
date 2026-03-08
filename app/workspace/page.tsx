import { redirect } from "next/navigation";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";
import { listUserWorkspaceAccess } from "@/lib/workspaces";
import {
  activatePersonalModeAction,
  activateWorkspaceModeAction,
} from "./actions";

function formatWorkspaceDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function WorkspaceSelectorPage() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const [workspaceAccess, activeWorkspaceId] = await Promise.all([
    listUserWorkspaceAccess(user.id),
    resolveActiveWorkspaceIdForUser(user.id),
  ]);

  return (
    <section
      style={{
        minHeight: "100%",
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "hsl(var(--muted-foreground))",
            fontWeight: 600,
          }}
        >
          Workspace Context
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(24px, 3vw, 34px)",
            letterSpacing: "-0.03em",
            color: "hsl(var(--foreground))",
            fontWeight: 700,
          }}
        >
          Choose Where You Want To Work
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 760,
            fontSize: 14,
            color: "hsl(var(--muted-foreground))",
          }}
        >
          Use personal mode for standalone work, or switch into a workspace so
          post activity, logs, and reporting stay scoped to that workspace only.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <article
          style={{
            border: "1px solid hsl(var(--border))",
            borderRadius: 14,
            background: "hsl(var(--card))",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 600,
            }}
          >
            Personal Mode
          </p>
          <h2 style={{ margin: 0, fontSize: 20, color: "hsl(var(--foreground))" }}>
            Personal Workspace
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
            Your actions stay private and are not counted in any workspace log.
          </p>
          <form action={activatePersonalModeAction}>
            <button
              type="submit"
              style={{
                marginTop: 8,
                width: "100%",
                borderRadius: 10,
                border: "1px solid hsl(var(--foreground))",
                background:
                  activeWorkspaceId === null
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--background))",
                color:
                  activeWorkspaceId === null
                    ? "hsl(var(--background))"
                    : "hsl(var(--foreground))",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {activeWorkspaceId === null ? "Currently Active" : "Switch To Personal"}
            </button>
          </form>
        </article>

        {workspaceAccess.map((entry) => {
          const isActive = activeWorkspaceId === entry.workspace.id;

          return (
            <article
              key={entry.workspace.id}
              style={{
                border: "1px solid hsl(var(--border))",
                borderRadius: 14,
                background: "hsl(var(--card))",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  letterSpacing: "0.11em",
                  textTransform: "uppercase",
                  color: "hsl(var(--muted-foreground))",
                  fontWeight: 600,
                }}
              >
                {entry.role} Access
              </p>
              <h2
                style={{ margin: 0, fontSize: 20, color: "hsl(var(--foreground))" }}
              >
                {entry.workspace.name}
              </h2>
              <p
                style={{ margin: 0, fontSize: 13, color: "hsl(var(--muted-foreground))" }}
              >
                Created {formatWorkspaceDate(entry.workspace.created_at)}
              </p>
              <form action={activateWorkspaceModeAction}>
                <input type="hidden" name="workspaceId" value={entry.workspace.id} />
                <button
                  type="submit"
                  style={{
                    marginTop: 8,
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid hsl(var(--foreground))",
                    background: isActive
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--background))",
                    color: isActive
                      ? "hsl(var(--background))"
                      : "hsl(var(--foreground))",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {isActive ? "Currently Active" : "Switch To Workspace"}
                </button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
