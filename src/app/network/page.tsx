import { Metadata } from "next";
import { getCurrentUser } from "@/lib/permissions";
import { getNetworkTopologyData } from "@/lib/network";
import { NetworkViewHub } from "@/components/network/NetworkViewHub";

export const metadata: Metadata = {
  title: "Network Infrastructure & Topology | IT Asset Tracker",
  description: "Map office routers, switches, port allocations, and physical Ethernet cable runs",
};

export const dynamic = "force-dynamic";

export default async function NetworkPage() {
  const user = await getCurrentUser();
  const { networkDevices, inventoryDevices, printers, error } =
    await getNetworkTopologyData();

  if (error) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-destructive/30">
        <p className="text-destructive font-bold text-sm">{error}</p>
      </div>
    );
  }

  return (
    <NetworkViewHub
      initialNetworkDevices={networkDevices}
      inventoryDevices={inventoryDevices}
      printers={printers}
      userRole={user?.role || "MANAGER"}
    />
  );
}
