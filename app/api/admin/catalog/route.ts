import { isAdminRequest } from "@/lib/auth";
import { updateCatalog } from "@/lib/store";

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const liquors = await updateCatalog(Array.isArray(body.updates) ? body.updates : []);
    return Response.json({ liquors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update stock.";
    return Response.json({ error: message }, { status: 400 });
  }
}
