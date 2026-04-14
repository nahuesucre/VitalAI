"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScreeningRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/studies"); }, [router]);
  return null;
}
