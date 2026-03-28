"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Check, Trash2 } from "lucide-react";
import { useVimOS } from "@/integrations/vim/VimProvider";

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, badge, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-gray-50"
        style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        {title}
        {badge && (
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: "#EDF2F7", color: "#687076" }}
          >
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 pb-3" style={{ borderTop: "1px solid #E2E8F0" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function JsonBlock({ data, label }: { data: unknown; label?: string }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  if (data === null || data === undefined) {
    return (
      <p className="py-2 text-xs italic" style={{ color: "#8090A6" }}>
        {label ? `No ${label} data` : "No data"}
      </p>
    );
  }

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-100"
        style={{ color: "#687076" }}
        title="Copy JSON"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      <pre
        className="overflow-auto rounded p-2 text-xs leading-relaxed"
        style={{
          backgroundColor: "#F7FAFC",
          color: "#37475E",
          maxHeight: 300,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

interface OrderCreatedEvent {
  id: string;
  order: unknown;
  receivedAt: Date;
  dismiss: () => void;
}

/**
 * Admin debug panel — mirrors vim-canvas-demo-app.
 * Subscribes directly to the VimOS SDK exactly like the demo's context providers do.
 */
export function AdminPanel({ onBack }: { onBack: () => void }) {
  const vimOS = useVimOS();

  // ---- State for each EHR entity (matches demo providers) ----
  const [patient, setPatient] = useState<any>(undefined);
  const [encounter, setEncounter] = useState<any>(undefined);
  const [orders, setOrders] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(undefined);
  const [claim, setClaim] = useState<any>(undefined);
  const [orderCreatedEvents, setOrderCreatedEvents] = useState<OrderCreatedEvent[]>([]);
  const [idToken, setIdToken] = useState<string | undefined>(undefined);

  // ---- Session context (read directly from SDK, same as demo) ----
  const sessionContext = (vimOS as any)?.sessionContext;

  // ---- Fetch ID token (same as demo's useIdToken) ----
  useEffect(() => {
    if (sessionContext?.getIdToken) {
      sessionContext.getIdToken().then((res: any) => {
        setIdToken(res?.idToken);
      }).catch(() => { /* ignore */ });
    }
  }, [sessionContext]);

  // ---- Subscribe to all EHR entities (same as demo's context providers) ----
  useEffect(() => {
    const ehr = vimOS?.ehr;
    if (!ehr?.subscribe) return;

    const onPatient = (data: any) => setPatient(data ?? undefined);
    const onEncounter = (data: any) => setEncounter(data ?? undefined);
    const onOrders = (data: any) => setOrders(data ?? []);
    const onReferral = (data: any) => setReferral(data ?? undefined);
    const onClaim = (data: any) => setClaim(data ?? undefined);

    ehr.subscribe("patient", onPatient);
    ehr.subscribe("encounter", onEncounter);
    ehr.subscribe("orders", onOrders);
    ehr.subscribe("referral", onReferral);
    ehr.subscribe("claim", onClaim);

    return () => {
      try { ehr.unsubscribe("patient", onPatient); } catch { /* */ }
      try { ehr.unsubscribe("encounter", onEncounter); } catch { /* */ }
      try { ehr.unsubscribe("orders", onOrders); } catch { /* */ }
      try { ehr.unsubscribe("referral", onReferral); } catch { /* */ }
      try { ehr.unsubscribe("claim", onClaim); } catch { /* */ }
    };
  }, [vimOS]);

  // ---- Order created workflow events (same as demo's OrdersContext) ----
  useEffect(() => {
    const onOrderCreated = vimOS?.ehr?.workflowEvents?.order?.onOrderCreated;
    if (!onOrderCreated) return;

    const unsub = onOrderCreated((order: any) => {
      const id = order?.identifiers?.ehrOrderId ?? `${Date.now()}`;
      setOrderCreatedEvents((prev) => {
        if (prev.some((e) => e.id === id)) return prev;
        const event: OrderCreatedEvent = {
          id,
          order,
          receivedAt: new Date(),
          dismiss: () => setOrderCreatedEvents((p) => p.filter((e) => e.id !== id)),
        };
        return [event, ...prev].slice(0, 10);
      });
    });

    return () => { if (typeof unsub === "function") unsub(); };
  }, [vimOS]);

  // ---- Patient enhancement lists (same as demo's PatientEnhancements) ----
  const [problems, setProblems] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);

  useEffect(() => {
    if (!patient) {
      setProblems([]); setMedications([]); setAllergies([]); setLabs([]); setVitals([]);
      return;
    }
    if (typeof patient.getProblemList === "function") {
      patient.getProblemList().then((r: any) => setProblems(Array.isArray(r) ? r : [])).catch(() => setProblems([]));
    }
    if (typeof patient.getMedicationList === "function") {
      patient.getMedicationList().then((r: any) => setMedications(Array.isArray(r) ? r : [])).catch(() => setMedications([]));
    }
    if (typeof patient.getAllergyList === "function") {
      patient.getAllergyList().then((r: any) => setAllergies(Array.isArray(r) ? r : [])).catch(() => setAllergies([]));
    }
    if (typeof patient.getLabResults === "function") {
      patient.getLabResults({ page: 1 }).then((r: any) => setLabs(Array.isArray(r?.data) ? r.data : [])).catch(() => setLabs([]));
    }
    if (typeof patient.getVitals === "function") {
      patient.getVitals({ page: 1 }).then((r: any) => setVitals(Array.isArray(r?.data) ? r.data : [])).catch(() => setVitals([]));
    }
  }, [patient]);

  // Helper to get patient display name
  const patientName = patient?.demographics?.firstName
    ? `${patient.demographics.firstName} ${patient.demographics.lastName ?? ""}`.trim()
    : undefined;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: "1px solid #EDF2F7" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "#687076" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
        >
          Admin — EHR Context
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {/* Session Context — same fields as demo's SessionContextContent */}
        <CollapsibleSection title="Session Context" defaultOpen>
          {sessionContext ? (
            <div className="mt-2 space-y-1.5 text-xs" style={{ color: "#37475E" }}>
              <Field label="Session ID" value={sessionContext?.sessionId} />
              <Field label="EHR Username" value={sessionContext?.user?.identifiers?.ehrUsername} />
              <Field label="NPI" value={sessionContext?.user?.identifiers?.npi} />
              <Field label="Vim User ID" value={sessionContext?.user?.identifiers?.vimUserID} />
              <Field label="Roles" value={sessionContext?.user?.identifiers?.roles?.join(", ")} />
              <Field label="Name" value={[sessionContext?.user?.demographics?.firstName, sessionContext?.user?.demographics?.lastName].filter(Boolean).join(" ")} />
              <Field label="Email" value={sessionContext?.user?.contactInfo?.email} />
              <Field label="EHR Type" value={sessionContext?.ehrType} />
              <Field label="Organization" value={sessionContext?.organization?.identifiers?.name} />
              <Field label="Org ID" value={sessionContext?.organization?.identifiers?.id} />
              <Field label="TIN" value={Array.isArray(sessionContext?.organization?.identifiers?.tin) ? sessionContext.organization.identifiers.tin.join(", ") : undefined} />
              {idToken && <Field label="ID Token" value={idToken} truncate />}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs" style={{ color: "#8090A6" }}>Raw JSON</summary>
                <JsonBlock data={sessionContext} />
              </details>
            </div>
          ) : (
            <p className="py-2 text-xs italic" style={{ color: "#8090A6" }}>No session context</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Patient" badge={patientName} defaultOpen>
          <JsonBlock data={patient} label="patient" />
        </CollapsibleSection>

        <CollapsibleSection title="Encounter" badge={encounter?.identifiers?.ehrEncounterId}>
          <JsonBlock data={encounter} label="encounter" />
        </CollapsibleSection>

        <CollapsibleSection title="Orders" badge={orders.length > 0 ? String(orders.length) : undefined}>
          {orders.length === 0 ? (
            <p className="py-2 text-xs italic" style={{ color: "#8090A6" }}>No orders</p>
          ) : (
            orders.map((order: any, i: number) => (
              <div key={order?.identifiers?.ehrOrderId ?? i} className="mt-2">
                <span className="text-xs font-medium" style={{ color: "#486081" }}>
                  {order?.basicInformation?.type ?? "Order"} — {order?.basicInformation?.orderName ?? order?.identifiers?.ehrOrderId ?? `#${i + 1}`}
                </span>
                <JsonBlock data={order} />
              </div>
            ))
          )}
        </CollapsibleSection>

        {orderCreatedEvents.length > 0 && (
          <CollapsibleSection title="Order Created Events" badge={String(orderCreatedEvents.length)} defaultOpen>
            {orderCreatedEvents.map((event) => (
              <div
                key={event.id}
                className="mt-2 rounded border p-2"
                style={{ borderColor: "#E2E8F0", borderStyle: "dashed" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#486081" }}>
                    {event.receivedAt.toLocaleTimeString()}
                  </span>
                  <button
                    type="button"
                    onClick={event.dismiss}
                    className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-gray-100"
                    style={{ color: "#8090A6" }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <JsonBlock data={event.order} />
              </div>
            ))}
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Referral" badge={referral?.basicInformation?.specialty}>
          <JsonBlock data={referral} label="referral" />
        </CollapsibleSection>

        <CollapsibleSection title="Claim">
          <JsonBlock data={claim} label="claim" />
        </CollapsibleSection>

        <CollapsibleSection title="Problems" badge={problems.length > 0 ? String(problems.length) : undefined}>
          <JsonBlock data={problems.length > 0 ? problems : null} label="problems" />
        </CollapsibleSection>

        <CollapsibleSection title="Medications" badge={medications.length > 0 ? String(medications.length) : undefined}>
          <JsonBlock data={medications.length > 0 ? medications : null} label="medications" />
        </CollapsibleSection>

        <CollapsibleSection title="Allergies" badge={allergies.length > 0 ? String(allergies.length) : undefined}>
          <JsonBlock data={allergies.length > 0 ? allergies : null} label="allergies" />
        </CollapsibleSection>

        <CollapsibleSection title="Lab Results" badge={labs.length > 0 ? String(labs.length) : undefined}>
          <JsonBlock data={labs.length > 0 ? labs : null} label="lab results" />
        </CollapsibleSection>

        <CollapsibleSection title="Vitals" badge={vitals.length > 0 ? String(vitals.length) : undefined}>
          <JsonBlock data={vitals.length > 0 ? vitals : null} label="vitals" />
        </CollapsibleSection>

        <CollapsibleSection title="Raw VimOS ehrState">
          <p className="py-1 text-xs" style={{ color: "#8090A6" }}>
            Snapshot from vimOS.ehr.ehrState
          </p>
          <JsonBlock data={vimOS?.ehr?.ehrState ?? null} label="ehrState" />
        </CollapsibleSection>
      </div>
    </div>
  );
}

/** Simple key-value field for session context display */
function Field({ label, value, truncate }: { label: string; value?: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 font-medium" style={{ color: "#8090A6", minWidth: 90 }}>{label}</span>
      <span
        className={truncate ? "truncate" : ""}
        style={{ color: "#37475E" }}
        title={typeof value === "string" ? value : undefined}
      >
        {value || "—"}
      </span>
    </div>
  );
}
