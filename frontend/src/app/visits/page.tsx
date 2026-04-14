"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VisitsRedirect() {
  const router = useRouter();
  useEffect(() => { router.push("/studies"); }, [router]);
  return null;
}
