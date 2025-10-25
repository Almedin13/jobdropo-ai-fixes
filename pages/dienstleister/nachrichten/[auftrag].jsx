// pages/dienstleister/nachrichten/[auftrag].jsx
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function RedirectNachChat() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    const auftrag = Array.isArray(router.query.auftrag)
      ? router.query.auftrag[0]
      : router.query.auftrag;
    if (auftrag) router.replace(`/dienstleister/chat/${auftrag}`);
    else router.replace(`/dienstleister/nachrichten`);
  }, [router]);

  return null;
}
