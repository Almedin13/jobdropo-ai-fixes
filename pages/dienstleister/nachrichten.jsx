// pages/dienstleister/nachrichten.jsx
import DienstleisterLayout from "../../components/layouts/DienstleisterLayout";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";

/* ---------- Utilities ---------- */
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");
const shortId = (id) => {
  const s = String(id || "");
  return s.length > 7 ? s.slice(0, 6) + "…" : s;
};
const deriveNameFromEmail = (email) => {
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) return null;
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._\-+]+/).filter(Boolean);
  if (!parts.length) return null;
  return parts.map(cap).join(" ");
};
const tryJson = async (url, init) => {
  try {
    const r = await fetch(url, init);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
};

/* Tiefensuche */
const deepGetFirst = (obj, predicate, maxDepth = 6) => {
  if (!obj || typeof obj !== "object" || maxDepth < 0) return null;
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const got = deepGetFirst(v, predicate, maxDepth - 1);
      if (got != null) return got;
    }
    return null;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (predicate(k, v)) return v;
    if (v && typeof v === "object") {
      const got = deepGetFirst(v, predicate, maxDepth - 1);
      if (got != null) return got;
    }
  }
  return null;
};
const deepGetFirstString = (obj, keyTester, maxDepth = 6) =>
  deepGetFirst(obj, (k, v) => keyTester(k) && typeof v === "string" && v.trim(), maxDepth);

/* Name aus beliebigen Strukturen */
const bestNameFromObject = (obj) => {
  if (!obj || typeof obj !== "object") return null;

  const full =
    deepGetFirstString(
      obj,
      (k) =>
        [
          "auftraggebername",
          "kundenname",
          "kontaktname",
          "name",
          "full_name",
          "fullname",
          "displayname",
          "display_name",
        ].includes(k.toLowerCase())
    ) || null;
  if (full) return full;

  const first =
    deepGetFirst(
      obj,
      (k, v) => /^(vorname|firstname|first_name|givenname)$/i.test(k) && typeof v === "string"
    ) || null;
  const last =
    deepGetFirst(
      obj,
      (k, v) => /^(nachname|lastname|last_name|familyname)$/i.test(k) && typeof v === "string"
    ) || null;
  const composed = [first, last].filter(Boolean).join(" ").trim();
  if (composed) return composed;

  const containers = ["auftraggeber", "kunde", "kontakt", "profile", "contact", "person", "client", "customer"];
  for (const key of containers) {
    const found = deepGetFirst(obj, (k, v) => k.toLowerCase() === key && v && typeof v === "object");
    if (found) {
      const nm = bestNameFromObject(found);
      if (nm) return nm;
    }
  }
  return null;
};

const fullNameFromObj = (o) => {
  if (!o) return "";
  const first = o.vorname || o.firstName || o.givenName || "";
  const last  = o.nachname || o.lastName || o.familyName || "";
  const combined = `${first} ${last}`.trim();
  return combined || o.name || "";
};

/* IDs & Keys */
const getThreadId = (t) => {
   const s =
     t?.threadId ??
     t?.conversationId ??
     t?._id ??
     null;
   return s != null ? String(s) : "";
 };

 const getAuftragId = (t) => (t?.auftragId ? String(t.auftragId) : "");

 // Kombinierter, stabiler Schlüssel aus allen gängigen IDs
 const getLocalKey = (t) => {
   const aid = getAuftragId(t);
   const tid = getThreadId(t);
   return `${aid || "-" }|${tid || "-" }`;
 };

 const uniqByKey = (arr) => {
   const map = new Map();
   for (const x of arr || []) {
     const k = getLocalKey(x);
     if (k === "-|-") continue; // Einträge ohne IDs überspringen
     if (!map.has(k)) map.set(k, x);
   }
   return Array.from(map.values());
 };

/* ---------- NEU: robuste Preview & Timestamps ---------- */
const getPreview = (t) => {
  const cands = [
    t?.lastMessage,
    t?.preview,
    t?.snippet,
    t?.text,
    t?.body,
    t?.lastText,
    t?.lastBody,
    t?.lastContent,
    t?.message,
    t?.content,
    t?.last?.text,
    t?.last?.body,
    t?.last?.content,
    t?.last?.message,
    deepGetFirstString(t, (k) => /^(lastmessage|preview|snippet|text|body|message|content)$/.test(k.toLowerCase())),
  ].filter((v) => typeof v === "string" && v.trim());
  return (cands[0] || "").trim();
};

const getLastAt = (t) => {
  const cands = [
    t?.lastAt,
    t?.updatedAt,
    t?.lastDate,
    t?.last?.createdAt,
    t?.last?.date,
  ].filter(Boolean);
  return cands[0] || null;
};

const getUnread = (t) => {
  return (
    t?.unreadCount ??
    t?.unreadMessages ??
    (t?.unread ? Number(t.unread) : 0) ??
    0
  );
};

/* -------- Papierkorb-Feststellung robust -------- */
const isDeleted = (t) => {
  const status = String(t?.status || "").toLowerCase();
  return t?.deleted === true || !!t?.deletedAt || status === "trash" || status === "deleted";
};

/* ---------- Seite ---------- */
export default function NachrichtenSeite() {
  const { user } = useUser();
  const router = useRouter();

  // "inbox" | "archiv" | "trash"
  const [view, setView] = useState("inbox");

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [query, setQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [showCount, setShowCount] = useState(20);

  const reloadRef = useRef(null);
  const forceReload = useCallback(async () => {
    if (reloadRef.current) await reloadRef.current();
  }, []);

  useEffect(() => {
    if (user === null) router.push("/login");
    else if (user !== undefined && user.rolle !== "dienstleister") router.push("/dashboard");
  }, [user, router]);

  const firstName = useMemo(() => {
    if (!user) return "";
    if (user.vorname) return user.vorname;
    if (user.name) return String(user.name).split(" ")[0];
    if (user.email) return String(user.email).split("@")[0];
    return "";
  }, [user]);

  const formatDateTime = (iso) => {
    try {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return "";
    }
  };

  const computeDisplayName = (t) => {
    if (t.auftraggeberName && String(t.auftraggeberName).trim()) return t.auftraggeberName.trim();
    if (t.auftraggeber) {
      const n = fullNameFromObj(t.auftraggeber);
      if (n) return n;
    }
    const direct = t.kundeName || t.auftraggeberName || t.kontaktName || null;
    const fromSelf = direct || bestNameFromObject(t);
    if (fromSelf && String(fromSelf).trim()) return String(fromSelf).trim();
    return t.auftragId ? `Auftrag #${shortId(t.auftragId)}` : "Auftrag";
  };

  // Namen ggf. aus Auftrag holen
  const fetchAuftragName = async (auftragId) => {
    const deriveFromObj = (o) => {
      if (!o || typeof o !== "object") return null;
      const denorm =
        o.auftraggeberName ||
        fullNameFromObj(o.auftraggeber) ||
        bestNameFromObject(o) ||
        null;
      if (denorm) return denorm;

      const mail =
        o?.email ||
        o?.auftraggeberEmail ||
        o?.kontaktEmail ||
        o?.kundeEmail ||
        deepGetFirstString(o, (k) => k.toLowerCase().includes("mail"));
      const inferred = deriveNameFromEmail(mail);
      if (inferred) return inferred;

      const firma =
        o?.firma ||
        o?.company ||
        deepGetFirstString(o, (k) => ["firma", "company"].includes(k.toLowerCase()));
      if (firma) return firma;

      return null;
    };

    const id = encodeURIComponent(auftragId);
    {
      const d1 = await tryJson(`/api/auftraege/${id}`);
      if (d1) {
        const obj = d1.item || d1;
        const nm = deriveFromObj(obj);
        if (nm) return nm;
      }
    }
    {
      const d2 = await tryJson(`/api/auftraege/einzeln?id=${id}`);
      if (d2) {
        const nm = deriveFromObj(d2);
        if (nm) return nm;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!user) return;
    let active = true;

    const makeThreadUrls = () => {
      const arch = view === "archiv" ? "1" : "0";
      const base = "/api/nachrichten/threads";
      const qp = (p) => base + "?" + new URLSearchParams({ ...p, archiviert: arch }).toString();
      const u = [];
      if (user?.email) u.push(qp({ email: user.email }));
      if (user?._id) u.push(qp({ dienstleisterId: String(user._id) }));
      if (user?.id) u.push(qp({ userId: String(user.id) }));
      u.push(qp({}));
      return u;
    };

    const makeFallbackUrls = () => {
      const arch = view === "archiv" ? "1" : "0";
      const base = "/api/nachrichten/threads-from-messages";
      const p = (obj) => base + "?" + new URLSearchParams(obj).toString();
      const u = [];
      if (user?.email) u.push(p({ email: user.email, archiviert: arch }));
      if (user?._id) u.push(p({ dienstleisterId: String(user._id), archiviert: arch }));
      if (user?.id) u.push(p({ userId: String(user.id), archiviert: arch }));
      u.push(p({ archiviert: arch }));
      return u;
    };

    const enrichNames = async (items) => {
      const out = [...items];

      for (let i = 0; i < out.length; i++) {
        const t = out[i];
        if (t.kundeName && String(t.kundeName).trim()) continue;
        const immediate =
          t.kundeName ||
          t.auftraggeberName ||
          t.kontaktName ||
          bestNameFromObject(t) ||
          null;
        if (immediate) out[i] = { ...t, kundeName: immediate };
      }

      const needsFetch = out.filter(
        (t) => !(t.kundeName && String(t.kundeName).trim()) && t.auftragId
      );
      if (needsFetch.length) {
        await Promise.all(
          needsFetch.map(async (t) => {
            const nm = await fetchAuftragName(t.auftragId);
            if (nm) {
              const idx = out.findIndex((x) => getLocalKey(x) === getLocalKey(t));
              if (idx >= 0) out[idx] = { ...out[idx], kundeName: nm, auftraggeberName: nm };
            }
          })
        );
      }

      for (let i = 0; i < out.length; i++) {
        const t = out[i];
        if (t.kundeName && String(t.kundeName).trim()) continue;
        const email =
          t?.email || deepGetFirstString(t, (k) => ["email", "mail"].includes(k.toLowerCase()));
        const nm = deriveNameFromEmail(email);
        if (nm) out[i] = { ...t, kundeName: nm, auftraggeberName: nm };
      }

      return out;
    };

    const load = async () => {
      setLoading(true);
      setOpenMenuId(null);

      let found = [];

      for (const u of makeThreadUrls()) {
        const data = await tryJson(u);
        const arr = Array.isArray(data) ? data : data?.items || [];
        if (arr.length) {
          found = arr;
          break;
        }
      }

      if (!found.length) {
        for (const u of makeFallbackUrls()) {
          const data = await tryJson(u);
          const arr = Array.isArray(data) ? data : data?.items || [];
          if (arr.length) {
            found = arr;
            break;
          }
        }
      }

      try {
        found = await enrichNames(found);
      } catch {}

      found = uniqByKey(found);

      if (!active) return;
      setThreads(found);
      setLoading(false);
      setShowCount(pageSize);
    };

    reloadRef.current = load;
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user, view, pageSize]);

  /* Filter (mit robustem Trash) */
  const filtered = useMemo(() => {
    const base = threads.filter((t) => {
      if (view === "trash") return isDeleted(t);
      if (view === "archiv") return t.archiviert === true && !isDeleted(t);
      return t.archiviert !== true && !isDeleted(t);
    });

    const q = query.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;

    return base.filter((t) => {
      if (fromTs || toTs) {
        const ts = getLastAt(t) ? new Date(getLastAt(t)).getTime() : 0;
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      if (onlyUnread && view !== "trash" && !(getUnread(t) > 0)) return false;

      if (!q) return true;
      const name = (computeDisplayName(t) || "").toLowerCase();
      const msg = (getPreview(t) || "").toLowerCase();
      const aid = String(t.auftragId || "").toLowerCase();
      const mail = (t.email || "").toLowerCase();
      return name.includes(q) || msg.includes(q) || aid.includes(q) || mail.includes(q);
    });
  }, [threads, query, onlyUnread, dateFrom, dateTo, view]);

  const visible = filtered.slice(0, showCount);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* Aktionen */
  const openAuftragChat = async (auftragId) => {
    setThreads((prev) =>
      prev.map((t) => (t.auftragId === auftragId ? { ...t, unreadCount: 0 } : t))
    );
    try {
      await fetch(`/api/nachrichten/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auftragId: String(auftragId) }),
      });
    } catch {}
    router.push(`/dienstleister/auftrag/${auftragId}#chat`);
  };

  const archiveThread = async (thread, indexIfMissing) => {
    const threadId = getThreadId(thread);
    const auftragId = getAuftragId(thread);
    const localKey = getLocalKey(thread);

    setThreads((prev) => {
      if (localKey) return prev.filter((t) => getLocalKey(t) !== localKey);
      const copy = [...prev];
      const idx = typeof indexIfMissing === "number" ? indexIfMissing : -1;
      if (idx >= 0 && idx < copy.length) copy.splice(idx, 1);
      return copy;
    });
    setOpenMenuId(null);

    await tryJson("/api/nachrichten/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId || undefined,
        auftragId: auftragId || undefined,
        archivieren: view === "inbox",
      }),
    });

    await forceReload();
  };

  const moveToTrash = async (thread, indexIfMissing) => {
    const threadId = getThreadId(thread);
    const auftragId = getAuftragId(thread);
    const localKey = getLocalKey(thread);

    setThreads((prev) => {
      if (localKey) return prev.filter((t) => getLocalKey(t) !== localKey);
      const copy = [...prev];
      const idx = typeof indexIfMissing === "number" ? indexIfMissing : -1;
      if (idx >= 0 && idx < copy.length) copy.splice(idx, 1);
      return copy;
    });
    setOpenMenuId(null);

    await tryJson("/api/nachrichten/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId || undefined,
        auftragId: auftragId || undefined,
      }),
    });

    await forceReload();
  };

  const restoreFromTrash = async (thread, indexIfMissing) => {
    const threadId = getThreadId(thread);
    const auftragId = getAuftragId(thread);
    const localKey = getLocalKey(thread);

    setThreads((prev) => {
      if (localKey) return prev.filter((t) => getLocalKey(t) !== localKey);
      const copy = [...prev];
      const idx = typeof indexIfMissing === "number" ? indexIfMissing : -1;
      if (idx >= 0 && idx < copy.length) copy.splice(idx, 1);
      return copy;
    });
    setOpenMenuId(null);

    await tryJson("/api/nachrichten/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId || undefined,
        auftragId: auftragId || undefined,
      }),
    });

    await forceReload();
  };

  const hardDelete = async (thread, indexIfMissing) => {
    const threadId = getThreadId(thread);
    const auftragId = getAuftragId(thread);
    const localKey = getLocalKey(thread);

    setThreads((prev) => {
      if (localKey) return prev.filter((t) => getLocalKey(t) !== localKey);
      const copy = [...prev];
      const idx = typeof indexIfMissing === "number" ? indexIfMissing : -1;
      if (idx >= 0 && idx < copy.length) copy.splice(idx, 1);
      return copy;
    });
    setOpenMenuId(null);

    await tryJson("/api/nachrichten/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: threadId || undefined,
        auftragId: auftragId || undefined,
      }),
    });

    await forceReload();
  };

  const unreadTotal = useMemo(
    () => threads.reduce((sum, t) => sum + (getUnread(t) || 0), 0),
    [threads]
  );

  if (!user) return <p className="text-center mt-10">Lade…</p>;

  return (
    <DienstleisterLayout active="nachrichten">
      <div className="p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">💬 Nachrichten</h1>
            <p className="text-gray-600">
              Hallo {firstName}, hier sind deine Konversationen.
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Ungelesen:{" "}
            <span className="inline-block min-w-[2ch] text-center font-semibold">
              {unreadTotal}
            </span>
          </div>
        </div>

        {/* Tabs – linksbündig, kompakt, graue Umrandung */}
        <div className="mb-4">
          <div className="inline-grid grid-cols-3 gap-2 w-full max-w-xl border border-gray-200 rounded-xl p-1 bg-white">
            {[
              { key: "inbox", label: "Posteingang" },
              { key: "archiv", label: "Archiv" },
              { key: "trash", label: "Papierkorb" },
            ].map(({ key, label }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={[
                    "w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                    "bg-transparent text-gray-800 border-gray-300",
                    "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
                    active ? "text-blue-700 border-blue-500" : "",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suche & Filter */}
        <div className="rounded-2xl bg-white shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Suche</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, letzte Nachricht, E-Mail, Auftrags-ID…"
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Von</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bis</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-3 py-2"
              />
            </div>
            {view !== "trash" && (
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={onlyUnread}
                    onChange={(e) => setOnlyUnread(e.target.checked)}
                  />
                  Nur ungelesene
                </label>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pro Seite</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  const v = Number(e.target.value) || 20;
                  setPageSize(v);
                  setShowCount(v);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white text-gray-900 px-3 py-2"
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="bg-white p-6 rounded shadow">Lade Threads…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600">
              {view === "trash" ? "Papierkorb ist leer." : "Keine passenden Konversationen gefunden."}
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-6">
              {visible.map((t, idx) => {
                const id = getLocalKey(t) || String(idx);
                const displayName = computeDisplayName(t);
                const preview = getPreview(t) || "—";
                const unread = getUnread(t);
                const lastAt = getLastAt(t);

                return (
                  <li key={id} className="relative">
                    {/* Aktion oben rechts */}
                    <div className="flex justify-end mb-1">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId((cur) => (cur === id ? null : id));
                          }}
                          className="text-sm px-0 py-0 text-gray-700 hover:underline bg-transparent border-none"
                          style={{ background: "transparent" }}
                          aria-haspopup="menu"
                          aria-expanded={openMenuId === id}
                        >
                          Aktion ▾
                        </button>

                        {openMenuId === id && (
                          <div
                            className="absolute right-0 mt-1 w-56 rounded-md border border-gray-200 bg-white shadow-md z-10 text-gray-700"
                            onClick={(e) => e.stopPropagation()}
                            role="menu"
                          >
                            <button
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                              onClick={() => {
                                setOpenMenuId(null);
                                const aid = t.auftragId;
                                if (aid) router.push(`/dienstleister/auftrag/${aid}`);
                              }}
                              role="menuitem"
                            >
                              🔎 Zum Auftrag
                            </button>

                            {view === "inbox" && (
                              <>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => archiveThread(t, idx)}
                                  role="menuitem"
                                >
                                  📂 Archivieren
                                </button>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => moveToTrash(t, idx)}
                                  role="menuitem"
                                >
                                  🗑️ In Papierkorb verschieben
                                </button>
                              </>
                            )}

                            {view === "archiv" && (
                              <>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => archiveThread(t, idx)}
                                  role="menuitem"
                                >
                                  📤 Aus Archiv holen
                                </button>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => moveToTrash(t, idx)}
                                  role="menuitem"
                                >
                                  🗑️ In Papierkorb verschieben
                                </button>
                              </>
                            )}

                            {view === "trash" && (
                              <>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => restoreFromTrash(t, idx)}
                                  role="menuitem"
                                >
                                  ♻️ Wiederherstellen
                                </button>
                                <button
                                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 bg-transparent text-gray-700"
                                  onClick={() => hardDelete(t, idx)}
                                  role="menuitem"
                                >
                                  ❌ Endgültig löschen
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blaue Leiste ohne Hover-Farbwechsel */}
                    <div className="w-full rounded shadow overflow-hidden select-none">
                      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-4 hover:bg-blue-600 focus:bg-blue-600 active:bg-blue-700 transition-none">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            const aid = t.auftragId;
                            if (aid) openAuftragChat(aid);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              const aid = t.auftragId;
                              if (aid) openAuftragChat(aid);
                            }
                          }}
                          className="flex-1 text-left outline-none ring-0 bg-transparent"
                          style={{ cursor: "pointer" }}
                        >
                          <div className="font-semibold leading-snug flex items-center gap-3">
                            <span>{displayName}</span>
                            {unread > 0 && view !== "trash" && (
                              <span className="inline-flex items-center text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5">
                                {unread} neu
                              </span>
                            )}
                          </div>
                          <div className="text-sm opacity-90 truncate max-w-[80ch]">
                            {preview}
                          </div>
                          {lastAt && (
                            <div className="text-xs opacity-80 mt-1">
                              {formatDateTime(lastAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {showCount < filtered.length && (
              <div className="mt-6 flex items-center justify-center">
                <button
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => setShowCount((n) => Math.min(n + pageSize, filtered.length))}
                >
                  Mehr laden
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DienstleisterLayout>
  );
}
