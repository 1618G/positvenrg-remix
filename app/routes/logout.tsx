import { redirect } from "@remix-run/node";

export async function loader() {
  return redirect("/", {
    headers: {
      "Set-Cookie": "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}
