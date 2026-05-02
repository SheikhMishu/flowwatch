import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { HelpClient } from "./help-client";

export default async function HelpPage() {
  const session = await getSession();
  const userEmail = session?.email ?? "";

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Help & Documentation" />
      <HelpClient userEmail={userEmail} />
    </div>
  );
}
