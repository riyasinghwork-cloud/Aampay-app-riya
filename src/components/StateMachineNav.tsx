"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrototype } from "@/lib/state";
import {
  SM_NODES,
  ancestorIds,
  resolveActiveSmNodeId,
  type SmNavApi,
} from "@/lib/stateMachineNav";

const RESIDENCY_ROOTS = new Set(["user.resident", "user.nri"]);
const DEPTH_INDENT_PX = 16;

function descendantIds(rootId: string): string[] {
  const ids: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    for (const n of SM_NODES) {
      if (n.parentId === id) {
        ids.push(n.id);
        queue.push(n.id);
      }
    }
  }
  return ids;
}

/** Expand a residency root and every nested section under it. */
function expandResidencyTree(
  collapsed: Record<string, boolean>,
  rootId: string,
): Record<string, boolean> {
  const next = { ...collapsed, [rootId]: false };
  for (const id of descendantIds(rootId)) next[id] = false;
  return next;
}

export function StateMachineNav() {
  const proto = usePrototype();
  const api: SmNavApi = {
    state: proto.state,
    goTo: proto.goTo,
    reset: proto.reset,
    loadPersona: proto.loadPersona,
    openSheet: proto.openSheet,
    closeSheet: proto.closeSheet,
    setField: proto.setField,
    startLoan: proto.startLoan,
    setResidency: proto.setResidency,
    setDiscoverStep: proto.setDiscoverStep,
    setApplyStep: proto.setApplyStep,
    setKycStep: proto.setKycStep,
  };
  const { state } = api;
  const activeId = useMemo(() => resolveActiveSmNodeId(state), [state]);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => ({
    "user.resident": true,
    "user.nri": true,
  }));

  const expandedAncestors = useMemo(() => {
    if (!activeId) return new Set<string>();
    return new Set(ancestorIds(activeId));
  }, [activeId]);

  // When the active node falls under a residency, fully open that tree
  useEffect(() => {
    if (!activeId) return;
    const chain = [activeId, ...ancestorIds(activeId)];
    const root = chain.find((id) => RESIDENCY_ROOTS.has(id));
    if (!root) return;
    setCollapsed((c) => expandResidencyTree(c, root));
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const el = rowRefs.current.get(activeId);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const isSectionHidden = (parentId?: string) => {
    if (!parentId) return false;
    let id: string | undefined = parentId;
    const byId = new Map(SM_NODES.map((n) => [n.id, n]));
    while (id) {
      if (collapsed[id] && !expandedAncestors.has(id) && activeId !== id) return true;
      id = byId.get(id)?.parentId;
    }
    return false;
  };

  const toggleSection = (id: string) => {
    setCollapsed((c) => {
      const currentlyCollapsed = !!c[id];
      if (RESIDENCY_ROOTS.has(id) && currentlyCollapsed) {
        return expandResidencyTree(c, id);
      }
      return { ...c, [id]: !currentlyCollapsed };
    });
  };

  const childrenOf = (id: string) => SM_NODES.some((n) => n.parentId === id);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-black text-[#cfcfcf]">
      <div className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-black px-4 py-4">
        <p className="text-[16px] font-semibold uppercase tracking-[0.12em] text-white/50">State machine</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-[16px] text-white/80">
            {state.loanStatus}
          </span>
          {state.sheet && (
            <span className="rounded-full bg-lime/20 px-4 py-1 font-mono text-[16px] text-[#c8e86a]">
              sheet:{state.sheet}
            </span>
          )}
          {state.kyc.case?.caseStatus && (
            <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-[16px] text-white/80">
              case:{state.kyc.case.caseStatus}
            </span>
          )}
          {state.kyc.case?.risk.phase && state.kyc.case.risk.phase !== "not_started" && (
            <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-[16px] text-white/80">
              risk:{state.kyc.case.risk.phase}
            </span>
          )}
          {state.residency && (
            <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-[16px] text-white/80">
              {state.residency}
            </span>
          )}
          {state.loanType && (
            <span className="rounded-full bg-white/10 px-4 py-1 font-mono text-[16px] text-white/80">
              {state.loanType}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {SM_NODES.map((n) => {
          if (n.parentId && isSectionHidden(n.parentId)) return null;
          const active = n.id === activeId;
          const hasKids = childrenOf(n.id);
          const isCollapsed = !!collapsed[n.id] && !expandedAncestors.has(n.id);

          return (
            <div
              key={n.id}
              className="mb-1 flex items-start gap-1"
              style={{ paddingLeft: `${n.depth * DEPTH_INDENT_PX}px` }}
            >
              {hasKids ? (
                <button
                  type="button"
                  onClick={() => toggleSection(n.id)}
                  className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-[16px] text-white/40 hover:text-white/80"
                  aria-label={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? "▸" : "▾"}
                </button>
              ) : (
                <span className="mt-1 h-5 w-5 shrink-0" />
              )}
              <button
                type="button"
                ref={(el) => {
                  if (el) rowRefs.current.set(n.id, el);
                  else rowRefs.current.delete(n.id);
                }}
                onClick={() => n.apply(api)}
                className={`min-w-0 flex-1 rounded-md px-1 py-1 text-left transition ${
                  active
                    ? "bg-white/10 text-white ring-1 ring-[#c8e86a]/80"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="block truncate text-[16px] font-normal leading-snug">{n.label}</span>
                <span className="block truncate font-mono text-[16px] text-white/35">{n.path}</span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
