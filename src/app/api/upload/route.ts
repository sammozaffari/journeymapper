import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TEXT_EXTENSIONS = ["txt", "csv", "md", "json", "tsv"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate a unique file path
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const fileName = `${projectId}/${Date.now()}-${file.name}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("research-files")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "File upload failed", message: uploadError.message },
        { status: 500 }
      );
    }

    // Read text content for text-based files
    let rawContent: string | null = null;
    if (TEXT_EXTENSIONS.includes(fileExt)) {
      rawContent = await file.text();
    }

    // Create research item record
    const { data: researchItem, error: insertError } = await supabase
      .from("research_items")
      .insert({
        project_id: projectId,
        title,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: file.type,
        file_size: file.size,
        raw_content: rawContent,
        ai_status: rawContent ? "pending" : null,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file if record creation fails
      await supabase.storage.from("research-files").remove([fileName]);

      return NextResponse.json(
        { error: "Failed to create research item", message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: researchItem });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
