import { useEffect } from "react";
import { useRouter } from "next/router";

export default function TestRedirect() {
  const router = useRouter();

  useEffect(() => {
    console.log("Testseite aktiv → Weiterleitung");
    router.push("/dashboard");
  }, []);

  return <p>Wird weitergeleitet...</p>;
}
