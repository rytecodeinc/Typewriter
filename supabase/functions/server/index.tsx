import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", cors());
app.use("*", logger(console.log));

// Get all notes
app.get("/make-server-798a08af/notes", async (c) => {
  try {
    const notes = await kv.getByPrefix("note:");
    
    // Sort by timestamp descending (newest first)
    const sortedNotes = notes.sort((a: any, b: any) => {
      return b.value.timestamp - a.value.timestamp;
    });
    
    return c.json({ notes: sortedNotes.map((n: any) => n.value) });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return c.json({ error: "Failed to fetch notes" }, 500);
  }
});

// Create a new note
app.post("/make-server-798a08af/notes", async (c) => {
  try {
    const { content } = await c.req.json();
    
    if (!content || content.trim().length === 0) {
      return c.json({ error: "Note content is required" }, 400);
    }
    
    const noteId = Date.now().toString();
    const note = {
      id: noteId,
      content,
      timestamp: Date.now(),
    };
    
    await kv.set(`note:${noteId}`, note);
    
    return c.json({ note });
  } catch (error) {
    console.error("Error creating note:", error);
    return c.json({ error: "Failed to create note" }, 500);
  }
});

// Delete a note (optional - for future enhancement)
app.delete("/make-server-798a08af/notes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`note:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return c.json({ error: "Failed to delete note" }, 500);
  }
});

Deno.serve(app.fetch);
