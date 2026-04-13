import { Header } from "@/components/layout/header";
import { SettingsForms } from "./_components/settings-forms";

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Settings" />
      <div className="flex-1 p-4 md:p-6 max-w-3xl space-y-6 animate-fade-in">
        <SettingsForms />
      </div>
    </div>
  );
}
