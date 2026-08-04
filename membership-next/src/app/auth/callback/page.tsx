"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, authApi, setStoredUser } from "@/lib/api";
import { toast } from "sonner";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (token) {
      setToken(token);
      
      // Ambil detail data profil terbaru dari backend dengan token baru
      authApi.me().then((res) => {
        if (res.success && res.data) {
          setStoredUser(res.data);
          toast.success("Login via Google berhasil!");
          if (role === "admin" || res.data.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        } else {
          toast.error("Gagal mendapatkan profil pengguna.");
          router.push("/auth");
        }
      }).catch(() => {
        toast.error("Gagal menghubungkan profil.");
        router.push("/auth");
      });
    } else {
      const error = searchParams.get("error");
      if (error) {
        toast.error("Login Google gagal atau dibatalkan.");
      }
      router.push("/auth");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="flex flex-col items-center gap-4">
        {/* Simple elegant spinner */}
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-lg font-bold animate-pulse text-muted-foreground">
          Menyinkronkan akun Google Anda...
        </h2>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
