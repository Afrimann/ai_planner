import { NextResponse } from "next/server";

import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { buildWorkspaceReportPdfForUser } from "@/lib/reports";

interface RouteParams {
  workspaceId: string;
  reportId: string;
}

export async function GET(
  _request: Request,
  context: { params: RouteParams } | { params: Promise<RouteParams> },
) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { workspaceId, reportId } = await Promise.resolve(context.params);

  try {
    const { fileName, bytes } = await buildWorkspaceReportPdfForUser(
      user.id,
      workspaceId,
      reportId,
    );

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build report PDF.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
