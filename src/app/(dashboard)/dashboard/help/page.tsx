import { Header } from "@/components/layout/header";
import { HelpClient } from "./help-client";

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Help & Documentation" />
      <HelpClient />
    </div>
  );
}
