// pages/dienstleister/auftrag/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../../../context/UserContext";
import ChatThread from "../../../components/chat/Thread";

export default function AuftragDetailDienstleister() {
  const router = useRouter();
  const { user } = useUser();
  const { id } = router.query;
  const auftragId = Array.isArray(id) ? id[0] : id;

  const [auftrag, setAuftrag] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI-State
  const [offerOpen, setOfferOpen] = useState(false);
  const [betrag, setBetrag] = useState("");
  const [einheit, setEinheit] = useState("stunde");
  const [steuerart, setSteuerart] = useState("brutto");
  const [angebotNachricht, setAngebotNachricht] = useState("");

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgContext, setMsgContext] = useState(null);

  const [dbg, setDbg] = useState({ tried: [], status: [] });

  // NEW: Loader/Klickschutz
  const [actionLoading, setActionLoading] = useState(null); // "angenommen" | "abgelehnt" | null
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [msgSubmitting, setMsgSubmitting] = useState(false);

  // --- Toaster ---
  const [toasts, setToasts] = useState([]);
  function showToast(message, type = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  // --------- Auth + sichere JSON-Parser ---------
  const readCookie = (name) => {
    if (typeof document === "undefined") return undefined;
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  const getAuthHeaders = (extra = {}) => {
    const headers = { Accept: "application/json", ...extra };
    const bearer =
      user?.token ||
      (typeof window !== "undefined" &&
        (localStorage.getItem("authToken") || sessionStorage.getItem("authToken")));
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
    const csrf = readCookie("csrfToken") || readCookie("XSRF-TOKEN");
    if (csrf) headers["X-CSRF-Token"] = csrf;
    return headers;
  };
  const readJsonSafe = async (res) => {
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const body = await res.text();
    if (res.status === 204 || body.trim() === "") return {};
    if (ct.includes("application/json")) {
      try { return JSON.parse(body); }
      catch { throw new Error(`Antwort enthielt ungültiges JSON (Status ${res.status}).`); }
    }
    const snippet = body.slice(0, 140).replace(/\s+/g, " ").trim();
    const hint =
      snippet.startsWith("<!DOCTYPE") || snippet.startsWith("<html")
        ? "Server hat HTML zurückgegeben (evtl. Login/Redirect oder Fehlerseite)."
        : "Server hat kein JSON zurückgegeben.";
    throw new Error(`Unerwartete Antwort (Status ${res.status}). ${hint}`);
  };

  // --------- Chat Anchor + Smooth Scroll + Auto-Bottom ---------
  const chatSectionRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#chat") {
      chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 180);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#chat") return;
    const section = chatSectionRef.current;
    if (!section) return;
    const toEnd = () => chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    const ro = new ResizeObserver(() => toEnd());
    ro.observe(section);
    const t1 = setTimeout(toEnd, 350);
    const t2 = setTimeout(toEnd, 1000);
    return () => { ro.disconnect(); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Daten laden
  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const ts = Date.now();
      const urls = [
        `/api/auftraege/${id}?t=${ts}`,
        `/api/autraege/${id}?t=${ts}`,
      ];
      let found = null, tried = [], status = [];
      for (const url of urls) {
        tried.push(url);
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: getAuthHeaders({ "Cache-Control": "no-cache" }),
            credentials: "include",
          });
          status.push(res.status);
          if (!res.ok) continue;
          const data = await res.json().catch(() => null);
          const obj = data?.item ?? data?.data ?? (Array.isArray(data) ? data[0] : data) ?? null;
          if (obj) { found = obj; break; }
        } catch { status.push("fetch_error"); }
      }
      setDbg({ tried, status });
      setAuftrag(found);
      setLoading(false);
    };
    load();
  }, [id, user]);

  // Threads optimistisch als gelesen markieren (fire-and-forget)
  useEffect(() => {
    if (!auftragId || !user?.email) return;
    (async () => {
      try {
        const res = await fetch(`/api/nachrichten/mark-read`, {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
          body: JSON.stringify({ auftragId: String(auftragId) }),
        });
        if (!res.ok) throw new Error(`Mark-Read fehlgeschlagen (${res.status}).`);
      } catch (e) {
        console.warn("mark-read failed", e);
      }
    })();
  }, [auftragId, user?.email]);

  const dlName =
    user?.name || user?.displayName || (user?.email ? user.email.split("@")[0] : "Dienstleister");

  async function sendNachricht({ text, type = "normal", angebotId }) {
    try {
      const res = await fetch(`/api/nachrichten`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          auftragId: String(auftrag?._id || auftragId),
          ...(angebotId ? { angebotId: String(angebotId) } : {}),
          text,
          type,
          senderEmail: user?.email || undefined,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        showToast("Anmeldung/Tokens ungültig. Bitte neu einloggen.", "error");
        return false;
      }
      await readJsonSafe(res);
      return true;
    } catch (e) {
      console.error(e);
      showToast(e.message || "Netzwerkfehler beim Senden.", "error");
      return false;
    }
  }

  // --- Status-Update: gezielt die gängigen Varianten + Klickschutz ---
  async function updateStatus(newStatus, openMsg = true) {
    if (!auftragId || actionLoading) return;
    setActionLoading(newStatus); // "angenommen" | "abgelehnt"
    const attempts = [];

    const tryOne = async (method, url, body) => {
      attempts.push(`${method} ${url}`);
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(body),
      });
      return res;
    };

    try {
      // 1) PATCH /api/auftraege/:id/status  { status }
      let res = await tryOne("PATCH", `/api/auftraege/${auftragId}/status`, { status: newStatus });
      if (!res.ok) {
        // 2) POST /api/auftraege/:id/status { status }
        res = await tryOne("POST", `/api/auftraege/${auftragId}/status`, { status: newStatus });
      }
      if (!res.ok) {
        // 3) PATCH /api/auftraege/:id  { status }
        res = await tryOne("PATCH", `/api/auftraege/${auftragId}`, { status: newStatus });
      }
      if (!res.ok) {
        // 4) PUT /api/auftraege/:id  { status }
        res = await tryOne("PUT", `/api/auftraege/${auftragId}`, { status: newStatus });
      }

      if (res.status === 401 || res.status === 403) {
        showToast("Anmeldung/Tokens ungültig. Bitte neu einloggen.", "error");
        setActionLoading(null);
        return;
      }
      if (!res.ok) {
        showToast(`Status-Update fehlgeschlagen (${res.status}).`, "error");
        setActionLoading(null);
        return;
      }

      let data = {};
      try { data = await readJsonSafe(res); } catch { /* 204/kein JSON ok */ }

      const updated = data?.item?.status || data?.status || newStatus;
      setAuftrag((prev) => ({ ...(prev || {}), status: updated }));

      showToast(
        updated === "angenommen" ? "Auftrag angenommen." :
        updated === "abgelehnt" ? "Auftrag abgelehnt." : "Status aktualisiert."
      );

      if (openMsg) {
        if (updated === "angenommen") {
          setMsgContext("accept");
          setMsgText(`Glückwunsch. Der Dienstleister ${dlName} hat den Auftrag angenommen.`);
        } else if (updated === "abgelehnt") {
          setMsgContext("decline");
          setMsgText(`Hinweis: Der Dienstleister ${dlName} hat den Auftrag abgelehnt.`);
        }
        setMsgOpen(true);
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || "Fehler beim Aktualisieren des Status.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  function openOfferModal() { setOfferOpen(true); }
  function handleAcceptClick() { updateStatus("angenommen", true); }
  function handleDeclineClick() { updateStatus("abgelehnt", true); }

  async function submitOffer(e) {
    e.preventDefault();
    if (!betrag || isNaN(Number(betrag))) {
      showToast("Bitte gültigen Betrag eingeben.", "error"); return;
    }
    setOfferSubmitting(true);
    try {
      const res = await fetch(`/api/angebote`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({
          auftragId: String(auftragId),
          dienstleisterId: String(user._id),
          betrag: Number(betrag),
          einheit,
          steuerart,
          nachricht: angebotNachricht?.trim() || undefined,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        showToast("Anmeldung/Tokens ungültig. Bitte neu einloggen.", "error");
        return;
      }
      const data = await readJsonSafe(res);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Angebot konnte nicht erstellt werden");
      const created = data?.item || data?.data || data?.angebot || data;
      const angebotId = created?._id || created?.insertedId || null;
      const einheitLabel = einheit === "stunde" ? "pro Stunde" : "pauschal";
      await sendNachricht({
        text: `Neues Angebot von ${dlName}: ${Number(betrag).toFixed(2)} € (${einheitLabel}, ${steuerart}).`,
        type: "system",
        angebotId
      });
      setOfferOpen(false);
      setBetrag("");
      setAngebotNachricht("");
      showToast("Angebot erfolgreich gesendet.");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Netzwerkfehler beim Abgeben des Angebots.", "error");
    } finally {
      setOfferSubmitting(false);
    }
  }

  async function submitMessage(e) {
    e?.preventDefault?.();
    const text = (msgText || "").trim();
    if (!text) { showToast("Bitte eine Nachricht eingeben.", "error"); return; }
    setMsgSubmitting(true);
    const ok = await sendNachricht({ text, type: "system" });
    setMsgSubmitting(false);
    if (ok) { setMsgOpen(false); setMsgText(""); showToast("Nachricht gesendet."); }
  }

  if (loading) return <p className="p-6">Lade Daten…</p>;
  if (!auftrag) {
    return (
      <div className="p-6">
        <p className="text-red-500">Auftrag nicht gefunden</p>
        <p className="text-xs text-gray-500 mt-1">Debug: tried {dbg.tried.join(" , ")} | status {dbg.status.join(" , ")}</p>
      </div>
    );
  }

  const istEigentuemer = user?.email && user.email === auftrag?.erstelltVon;
  const statusStr = String(auftrag?.status || "offen").toLowerCase();
  const isOffen = statusStr === "offen";
  const canAct = isOffen && !istEigentuemer;

  /* ---------- Helper ---------- */
  const pick = (...vals) => vals.find(v => typeof v === "string" && v.trim().length > 0) || undefined;
  const deepPick = (obj, keys) => {
    try {
      const seen = new Set();
      const stack = [obj];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== "object") continue;
        if (seen.has(cur)) continue;
        seen.add(cur);
        for (const k of keys) {
          const v = cur?.[k];
          if (typeof v === "string" && v.trim()) return v.trim();
        }
        for (const v of Object.values(cur)) {
          if (v && typeof v === "object") stack.push(v);
        }
      }
    } catch {}
    return undefined;
  };
  const deepFullName = (obj) => {
    const first = deepPick(obj, ["vorname", "firstName", "firstname", "givenName"]);
    const last  = deepPick(obj, ["nachname", "lastName", "lastname", "familyName"]);
    const combo = [first, last].filter(Boolean).join(" ").trim();
    if (combo) return combo;
    return deepPick(obj, ["name", "fullName", "displayName"]);
  };
  const inferNameFromEmail = (email) => {
    if (!email || typeof email !== "string") return undefined;
    const local = email.split("@")[0] || "";
    return local
      .split(/[.\-_]+/)
      .filter(Boolean)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  };

  // Telefon: Normalisierung für tel:-Links (konservativ, DE-Default)
  const makeTelHref = (value) => {
    if (!value || typeof value !== "string") return undefined;
    let s = value.trim();
    s = s.replace(/[^\d+]/g, "");
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (!s.startsWith("+")) {
      if (s.startsWith("0")) s = "+49" + s.slice(1);
    }
    const digits = s.replace(/[^\d]/g, "");
    if (digits.length < 7 || digits.length > 16) return undefined;
    return s;
  };

  // Google Maps Link aus Adresse
  const makeMapsHref = (addr) => addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : undefined;

  // Name
  let agName =
    pick(
      auftrag?.auftraggeber?.name,
      [auftrag?.auftraggeber?.vorname, auftrag?.auftraggeber?.nachname].filter(Boolean).join(" ").trim(),
      [auftrag?.auftraggeber?.firstName, auftrag?.auftraggeber?.lastName].filter(Boolean).join(" ").trim(),
      auftrag?.auftraggeberName,
      auftrag?.kontaktName,
      auftrag?.kundeName,
      [auftrag?.auftraggeberVorname, auftrag?.auftraggeberNachname].filter(Boolean).join(" ").trim(),
      [auftrag?.vorname, auftrag?.nachname].filter(Boolean).join(" ").trim(),
      auftrag?.name
    ) || deepFullName(auftrag) || undefined;

  // Telefon & E-Mail
  let agPhone =
    pick(
      auftrag?.auftraggeber?.phone,
      auftrag?.auftraggeber?.telefon,
      auftrag?.kontakt?.telefon,
      auftrag?.kontakt?.phone,
      auftrag?.auftraggeberTelefon,
      auftrag?.kontaktTelefon,
      auftrag?.telefon,
      auftrag?.phone,
      auftrag?.tel
    ) ||
    deepPick(auftrag?.auftraggeber || auftrag?.kontakt || {}, [
      "phone","telefon","mobile","handy","tel","phoneNumber","telefonnummer"
    ]) ||
    "—";

  let agEmail =
    pick(
      auftrag?.auftraggeber?.email,
      auftrag?.auftraggeberEmail,
      auftrag?.kontaktEmail,
      auftrag?.email,
      auftrag?.erstelltVon
    ) ||
    deepPick(auftrag?.auftraggeber || auftrag?.kontakt || {}, ["email","mail"]) ||
    "—";

  if (!agName && agEmail) agName = inferNameFromEmail(agEmail);
  agName  = agName  || "—";
  agEmail = agEmail || "—";

  // Adresse
  const fullAddress = [
    auftrag?.strasse,
    [auftrag?.plz, auftrag?.ort].filter(Boolean).join(" ")
  ].filter(Boolean).join(", ");
  const addressHref = makeMapsHref(fullAddress);

  // Datum/Zeitraum robust (ue/ü)
  const datumZeitraum =
    auftrag?.datumDurchfuhrung ||
    auftrag?.datumDurchfuehrung ||
    auftrag?.zeitraum ||
    "—";

  // Normalisierte Hrefs
  const agPhoneHref = agPhone && agPhone !== "—" ? makeTelHref(agPhone) : undefined;
  const agEmailHref = agEmail && agEmail !== "—" ? `mailto:${agEmail}` : undefined;

  // --- Status-Badge + Hinweis ---
  const statusStyles = {
    offen: "bg-gray-100 text-gray-800 border border-gray-200",
    angenommen: "bg-green-100 text-green-800 border border-green-200",
    abgelehnt: "bg-red-100 text-red-800 border border-red-200",
  };
  const statusHint =
    statusStr === "offen"
      ? "Du kannst diesen Auftrag annehmen, ablehnen oder ein Angebot abgeben."
      : statusStr === "angenommen"
        ? "Dieser Auftrag wurde angenommen. Weitere Änderungen sind nicht möglich."
        : statusStr === "abgelehnt"
          ? "Dieser Auftrag wurde abgelehnt. Weitere Änderungen sind nicht möglich."
          : null;

  return (
    <div className="w-full p-6">
      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Kopfzeile */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => router.back()} className="px-3 py-1 rounded bg-yellow-300 hover:bg-yellow-400 text-black text-sm">← Zurück</button>
        <h1 className="text-2xl font-bold">Auftrag: {auftrag.titel}</h1>
        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusStyles[statusStr] || "bg-gray-100 text-gray-800 border"}`}>
          {auftrag?.status || "offen"}
        </span>
      </div>
      {statusHint && <div className="mb-4 text-sm text-gray-600">{statusHint}</div>}

      {/* Aktionen */}
      {canAct ? (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleAcceptClick}
            disabled={!!actionLoading}
            aria-busy={actionLoading === "angenommen"}
          >
            {actionLoading === "angenommen" && <Spinner />}
            Auftrag annehmen
          </button>
          <button
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleDeclineClick}
            disabled={!!actionLoading}
            aria-busy={actionLoading === "abgelehnt"}
          >
            {actionLoading === "abgelehnt" && <Spinner />}
            Auftrag ablehnen
          </button>
          <button
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={openOfferModal}
            disabled={!!actionLoading}
          >
            Angebot abgeben
          </button>
        </div>
      ) : (
        <div className="mb-6 text-sm text-gray-600">
          {istEigentuemer
            ? "Hinweis: Du bist der Ersteller dieses Auftrags. Aktionen sind deaktiviert."
            : statusStr !== "offen"
              ? `Auftragsstatus: ${auftrag?.status || "—"} – Änderungen nicht mehr möglich.`
              : null}
        </div>
      )}

      {/* ---------- GRID LAYOUT ---------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LINKER BEREICH (2 Spalten): Details + Chat */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <section className="border rounded-lg p-4 bg-white">
            <h2 className="text-lg font-semibold mb-3">Auftragsdetails</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Info label="Titel" value={auftrag?.titel} />
              <Info label="Status" value={auftrag?.status || "offen"} />
              <Info label="Branche" value={auftrag?.branche} />
              <Info
                label="Adresse"
                value={
                  fullAddress ? (
                    <a href={addressHref} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      {fullAddress}
                    </a>
                  ) : "—"
                }
              />
              <Info label="Datum / Zeitraum" value={datumZeitraum} />
              <Info label="Turnus" value={auftrag?.turnus} />
              <Info label="Vergütung / Budget" value={auftrag?.preis || "nach Vereinbarung"} />
              <Info label="Erstellt am" value={auftrag?.erstelltAm ? new Date(auftrag.erstelltAm).toLocaleString("de-DE") : "—"} />
            </div>

            {auftrag?.beschreibung && (
              <div className="mt-4">
                <div className="text-gray-500 mb-1">Beschreibung</div>
                <p className="whitespace-pre-wrap">{auftrag.beschreibung}</p>
              </div>
            )}
          </section>

          {/* Chat */}
          <section id="chat" ref={chatSectionRef} className="border rounded-lg p-4 bg-white">
            <h2 className="text-lg font-semibold mt-2 mb-3">Nachrichten</h2>
            <ChatThread auftragId={auftragId} myRole="dienstleister" />
            <div ref={chatBottomRef} />
          </section>
        </div>

        {/* RECHTE SEITE: Auftraggeber-Kontakt */}
        <aside className="space-y-4 lg:sticky lg:top-6 h-fit">
          <SidebarCard title="Auftraggeber">
            <div className="text-sm space-y-2">
              <Row label="Name" value={agName} />
              <ContactRow label="Telefon" value={agPhone} href={agPhoneHref ? `tel:${agPhoneHref}` : undefined} />
              <ContactRow label="E-Mail" value={agEmail} href={agEmailHref} isEmail />
            </div>
          </SidebarCard>

          {Array.isArray(auftrag?.bilder) && auftrag.bilder.length > 0 && (
            <SidebarCard title="Anhänge">
              <div className="grid grid-cols-2 gap-2">
                {auftrag.bilder.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="block border rounded overflow-hidden">
                    <img src={url} alt={`Bild ${i + 1}`} className="w-full h-24 object-cover" />
                  </a>
                ))}
              </div>
            </SidebarCard>
          )}
        </aside>
      </div>

      {/* Angebot-Modal */}
      {offerOpen && (
        <Modal onClose={() => setOfferOpen(false)}>
          <form onSubmit={submitOffer} className="w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Angebot abgeben</h3>
            <label className="block text-sm mb-1">Betrag (€)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded px-3 py-2 mb-3"
              value={betrag}
              onChange={(e) => setBetrag(e.target.value)}
              placeholder="z. B. 49.90"
              required
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-sm mb-1">Abrechnung</div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="einheit" value="stunde" checked={einheit === "stunde"} onChange={() => setEinheit("stunde")} />
                    Pro Stunde
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="einheit" value="pauschal" checked={einheit === "pauschal"} onChange={() => setEinheit("pauschal")} />
                    Pauschal
                  </label>
                </div>
              </div>
              <div>
                <div className="text-sm mb-1">Steuer</div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="steuerart" value="brutto" checked={steuerart === "brutto"} onChange={() => setSteuerart("brutto")} />
                    Brutto
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="steuerart" value="netto" checked={steuerart === "netto"} onChange={() => setSteuerart("netto")} />
                    Netto
                  </label>
                </div>
              </div>
            </div>
            <label className="block text-sm mb-1">Nachricht (optional)</label>
            <textarea
              className="w-full border rounded px-3 py-2 mb-4"
              rows={3}
              value={angebotNachricht}
              onChange={(e) => setAngebotNachricht(e.target.value)}
              placeholder="Kurze Ergänzung zu deinem Angebot…"
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setOfferOpen(false)} disabled={offerSubmitting}>
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={offerSubmitting}
              >
                {offerSubmitting && <Spinner />}
                Angebot senden
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* System-Nachricht (accept/decline) */}
      {msgOpen && (
        <Modal onClose={() => setMsgOpen(false)}>
          <form onSubmit={submitMessage} className="w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {msgContext === "accept" && "Nachricht beim Annehmen"}
              {msgContext === "decline" && "Nachricht beim Ablehnen"}
            </h3>
            <textarea
              className="w-full border rounded px-3 py-2 mb-4"
              rows={6}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Deine Nachricht…"
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setMsgOpen(false)} disabled={msgSubmitting}>
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={msgSubmitting}
              >
                {msgSubmitting && <Spinner />}
                Senden
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------- kleine Hilfs-Komponenten ---------- */
function Info({ label, value }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

function SidebarCard({ title, children }) {
  return (
    <section className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}

// Spezielle Row für Telefon/E-Mail mit Link & Copy
function ContactRow({ label, value, href, isEmail = false }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const right = (() => {
    if (!value || value === "—") return <span className="font-medium">—</span>;
    return (
      <div className="flex items-center gap-2">
        {href ? (
          <a
            href={href}
            className="font-medium underline underline-offset-2 hover:opacity-80 break-all"
          >
            {value}
          </a>
        ) : (
          <span className="font-medium break-all">{value}</span>
        )}
        <CopyButton onClick={copy} copied={copied} ariaLabel={`${isEmail ? "E-Mail" : "Telefon"} kopieren`} />
      </div>
    );
  })();

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      {right}
    </div>
  );
}

function CopyButton({ onClick, copied, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded border hover:bg-gray-50 whitespace-nowrap ${copied ? "border-green-500 text-green-600" : "border-gray-300 text-gray-600"}`}
      aria-label={ariaLabel}
      title={copied ? "Kopiert!" : "In Zwischenablage kopieren"}
    >
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Overlay" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-lg">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700" aria-label="Modal schließen">×</button>
        {children}
      </div>
    </div>
  );
}

// Mini-Toast-Komponenten
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded shadow text-sm text-white ${t.type === "error" ? "bg-red-600" : "bg-gray-900"}`}
          onClick={() => onDismiss?.(t.id)}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// NEW: kleiner Inline-Spinner (Tailwind animate-spin)
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"></circle>
      <path d="M22 12a10 10 0 0 1-10 10" fill="none" stroke="currentColor" strokeWidth="4"></path>
    </svg>
  );
}
