import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name || "My Workspace";
    const slug =
      body.slug ||
      user.email
        ?.split("@")[0]
        ?.replace(/[^a-z0-9]/gi, "-")
        .toLowerCase() ||
      `workspace-${Date.now()}`;

    // Use admin client to bypass RLS for workspace creation
    const admin = createAdminClient();

    // Create workspace
    const { data: workspace, error: wsError } = await admin
      .from("workspaces")
      .insert({ name, slug })
      .select()
      .single();

    if (wsError) {
      // Handle duplicate slug
      if (wsError.code === "23505") {
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`;
        const { data: retryWorkspace, error: retryError } = await admin
          .from("workspaces")
          .insert({ name, slug: uniqueSlug })
          .select()
          .single();

        if (retryError) {
          return NextResponse.json(
            { error: "Failed to create workspace" },
            { status: 500 }
          );
        }

        // Add user as owner
        await admin.from("workspace_members").insert({
          workspace_id: retryWorkspace.id,
          user_id: user.id,
          role: "owner",
        });

        return NextResponse.json(retryWorkspace);
      }

      return NextResponse.json(
        { error: "Failed to create workspace" },
        { status: 500 }
      );
    }

    // Add user as owner
    await admin.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
