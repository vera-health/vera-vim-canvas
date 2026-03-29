"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useVimOS } from "@/integrations/vim/VimProvider";
import { useVimContext } from "@/integrations/vim/hooks/useVimContext";
import { useVimWriter } from "@/integrations/vim/hooks/useVimWriter";
import { useEhrNotifications } from "@/integrations/vim/hooks/useEhrNotifications";
import { mapVimToEhrContext } from "@/integrations/vim/mappers";
import { formatEhrContext } from "@/core/utils/formatContext";
import { ChatView } from "@/core/components/ChatView";
import { AdminPanel } from "@/integrations/vim/components/AdminPanel";
import { EhrWriterContext } from "@/core/contexts/EhrWriterContext";
import { AppSizeContext } from "@/core/contexts/AppSizeContext";
import { getSupabase } from "@/core/utils/supabase";
import type { EhrWriter, EncounterWritePayload, EhrSectionKey } from "@/core/types/ehr";

export function VimChatView() {
  const vimOS = useVimOS();
  const vimData = useVimContext();
  const vimWriter = useVimWriter();
  const { activeSuggestedQuestions, activePromptText } = useEhrNotifications();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  const isAdmin = userEmail === "maxime@verahealth.ai";

  const ehrContext = useMemo(() => mapVimToEhrContext(vimData), [vimData]);
  const ehrContextString = useMemo(
    () =>
      formatEhrContext(
        ehrContext.patient,
        ehrContext.encounter,
        ehrContext.problems,
        ehrContext.medications,
        ehrContext.allergies,
        ehrContext.labs,
        ehrContext.vitals,
      ),
    [ehrContext],
  );

  const ehrWriter: EhrWriter = useMemo(
    () => ({
      getWriteAvailability: (section: EhrSectionKey) => vimWriter.getWriteAvailability(section),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridging core EncounterWritePayload to Vim SDK payload type
      writeToEncounter: (payload: EncounterWritePayload) => vimWriter.writeToEncounter(payload as any),
      writeStatus: vimWriter.writeStatus,
      buildSectionPayload: (section: EhrSectionKey, text: string) =>
        vimWriter.buildSectionPayload(section, text) as unknown as EncounterWritePayload,
    }),
    [vimWriter],
  );

  const canResize = !!vimOS?.hub?.setDynamicAppSize;

  const handleExpandChange = useCallback(
    (expanded: boolean) => {
      vimOS?.hub?.setDynamicAppSize?.(expanded ? "LARGE" : "CLASSIC");
    },
    [vimOS],
  );

  return (
    <AppSizeContext value={{ canResize }}>
      <EhrWriterContext value={ehrWriter}>
        <ChatView
          ehrContextString={ehrContextString}
          activeSuggestedQuestions={activeSuggestedQuestions}
          activePromptText={activePromptText}
          onExpandChange={handleExpandChange}
          isAdmin={isAdmin}
          renderAdminPanel={() => <AdminPanel onBack={() => {}} />}
        />
      </EhrWriterContext>
    </AppSizeContext>
  );
}
