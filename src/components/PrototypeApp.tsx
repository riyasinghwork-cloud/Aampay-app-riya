"use client";

import { AppShell } from "@/components/AppShell";
import { OverviewScreen, TimelineScreen } from "@/components/screens/LoanHubScreens";
import { HelpScreen, ProfileScreen } from "@/components/screens/ProfileHelpScreens";
import { PrototypeProvider, usePrototype } from "@/lib/state";

/** Journey lives on overview; step forms open as bottom sheets. */
function ScreenRouter() {
  const { state } = usePrototype();

  switch (state.screen) {
    case "profile":
      return <ProfileScreen />;
    case "help":
      return <HelpScreen />;
    case "timeline":
      return <TimelineScreen />;
    default:
      return <OverviewScreen />;
  }
}

export function PrototypeApp() {
  return (
    <PrototypeProvider>
      <AppShell>
        <ScreenRouter />
      </AppShell>
    </PrototypeProvider>
  );
}
