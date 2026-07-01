import { Elysia, t } from "elysia";
import { createUser, loginUser, getCurrentUser, logoutUser } from "../services/user.service";
import { parseBearerToken } from "../utils/auth";

export const userRoute = new Elysia({ prefix: "/api/users" })
  .post(
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
        nama: t.String({ maxLength: 255 }),
        email: t.String({ maxLength: 255 }),
        password: t.String({ maxLength: 255 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const token = await loginUser(body);
        return { data: token };
      } catch (error: any) {
        if (error.message === "email salah") {
          set.status = 401;
          return { error: "email salah" };
        }

        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get(
    "/current",
    async ({ request, set }) => {
      const authHeader = request.headers.get("Authorization");
      const token = parseBearerToken(authHeader);

      if (!token) {
        set.status = 401;
        return { error: "unauthorized" };
      }

      try {
        const user = await getCurrentUser(token);
        return { data: user };
      } catch (error: any) {
        if (error.message === "unauthorized") {
          set.status = 401;
          return { error: "unauthorized" };
        }

        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    }
  )
  .get(
    "/logout",
    async ({ request, set }) => {
      const authHeader = request.headers.get("Authorization");
      const token = parseBearerToken(authHeader);

      if (!token) {
        set.status = 401;
        return { error: "unauthorized" };
      }

      try {
        await logoutUser(token);
        return { data: "berhasil logout" };
      } catch (error: any) {
        if (error.message === "unauthorized") {
          set.status = 401;
          return { error: "unauthorized" };
        }

        set.status = 500;
        return { error: "Terjadi kesalahan pada server" };
      }
    }
  );
