import { authenticate } from "../_shared";

export const dynamic = "force-dynamic";

export const POST = (req: Request) =>
  authenticate(req, "/auth/register", ["name", "email", "password"]);
