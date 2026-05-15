import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Generate a share token
    const shareToken = crypto.randomUUID();

    // Create export record
    const { data: exportRecord, error: exportError } = await supabase
      .from("exports")
      .insert({
        project_id: projectId,
        export_type: "interactive_link",
        status: "completed",
        share_token: shareToken,
        settings: {},
      })
      .select()
      .single();

    if (exportError || !exportRecord) {
      console.error("Failed to create export record:", exportError);
      return NextResponse.json(
        {
          error: "Failed to create share link",
          message: exportError?.message,
        },
        { status: 500 }
      );
    }

    // Build the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    const url = `${baseUrl}/share/${shareToken}`;

    return NextResponse.json({
      token: shareToken,
      url,
    });
  } catch (error) {
    console.error("Share link error:", error);
    return NextResponse.json(
      {
        error: "Failed to create share link",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
