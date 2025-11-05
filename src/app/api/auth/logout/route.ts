// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });

  response.cookies.set({
    name: "authToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
  });

  response.cookies.set({
    name: "refreshToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
  });

  return response;
}
