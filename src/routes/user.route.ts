import { Elysia, t } from "elysia";
import { createUser } from "../services/user.service";

export const userRoute = new Elysia({ prefix: "/api/users" }).post(
  "/",
  async ({ body, set }) => {
    try {
      await createUser(body);
      return { data: "ok" };
    } catch (error: any) {
      if (error.message === "email telah digunakan") {
        set.status = 409;
        return { error: "email telah digunakan" };
      }

      set.status = 500;
      return { error: "Terjadi kesalahan pada server" };
    }
  },
  {
    body: t.Object({
      nama: t.String(),
      email: t.String(),
      password: t.String(),
    }),
  }
);
