import HomeSectionHeader from "@/components/home-section-header";
import PhonecaseGrid from "@/components/phonecase-grid";

export default async function PhonecasePage() {
  return (
    <div className="flex flex-col gap-4">
      <HomeSectionHeader title="قاب موبایل" children />
      <PhonecaseGrid />
    </div>
  );
}
