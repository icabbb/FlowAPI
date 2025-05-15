// En pages/your-library-page-route/page.tsx (o donde esté LibraryPage)
import { getActivePublicFlowsWithDetails } from "@/services/storage/public-flow-share";
import { LibraryInterface } from "./components/library-interface";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LibraryPage() {
  // Obtener los flujos públicos
  const flows = await getActivePublicFlowsWithDetails(50, 0);
  
  return (
    // Contenedor principal que ocupa toda la altura disponible
    <div className="h-full w-full overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-neutral-900 dark:to-neutral-950">
      <LibraryInterface flows={flows} />
    </div>
  );
}