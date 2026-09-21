import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCctvOverviewData } from "@/lib/cctv/queries";
import { CctvViewHub } from "@/components/cctv/CctvViewHub";

export const metadata = {
  title: "CCTV & Video Surveillance | IT Asset Tracker",
  description: "Live 16-channel video surveillance grid and historical recording playback for office CCTV DVR",
};

export default async function CctvPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const overviewData = await getCctvOverviewData();

  return (
    <AppShell user={session.user}>
      <CctvViewHub overviewData={overviewData} />
    </AppShell>
  );
}
