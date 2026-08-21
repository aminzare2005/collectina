import HomeSectionHeader from "@/components/home-section-header";
import PosterGrid from "@/components/poster-grid";

export default async function PosterPage() {
  return (
    <div className="flex flex-col gap-4">
      <HomeSectionHeader title="پوستر" children />
      <PosterGrid />
    </div>
  );
}
