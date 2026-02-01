import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/auth-utils";
import { getUserData, saveUserData } from "@/lib/db";

// Default empty data structure (matches store exactly)
const EMPTY_DATA = {
  stories: [],
  characters: [],
  locations: [],
  events: [],
  relationships: [],
  loreEntries: [],
  ideaGroups: [],
  ideaCards: [],
  chapters: [],
  tags: [],
};

// GET - Load user data from database
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await getUserData(payload.userId);
    
    // Return empty arrays if no data exists yet
    if (!data) {
      return NextResponse.json(EMPTY_DATA);
    }

    // Ensure all fields exist with defaults
    return NextResponse.json({
      ...EMPTY_DATA,
      ...data,
    });
  } catch (error) {
    console.error("Sync GET error:", error);
    return NextResponse.json(
      { error: "Failed to load data" },
      { status: 500 }
    );
  }
}

// POST - Save user data to database
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await request.json();
    
    // Ensure all arrays exist with defaults (matches store field names)
    const sanitizedData = {
      stories: data.stories || [],
      characters: data.characters || [],
      locations: data.locations || [],
      events: data.events || [],
      relationships: data.relationships || [],
      loreEntries: data.loreEntries || [],
      ideaGroups: data.ideaGroups || [],
      ideaCards: data.ideaCards || [],
      chapters: data.chapters || [],
      tags: data.tags || [],
    };

    await saveUserData(payload.userId, sanitizedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      { error: "Failed to save data" },
      { status: 500 }
    );
  }
}
