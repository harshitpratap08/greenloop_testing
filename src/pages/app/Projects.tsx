import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project, ProjectStatus } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";

const PROJECT_STATUS_LABEL: Record<ProjectStatus, "confirmed" | "hold" | "surveyed"> = {
  active: "confirmed",
  demolition: "hold",
  complete: "surveyed",
};

export default function Projects() {
  const { dataset } = useGreenLoopStore();

  const rows = dataset.projects.map((project: Project) => {
    const materials = dataset.materials.filter((m) => m.projectId === project.id);
    const recoverableT = materials.reduce((acc, m) => acc + m.quantityT, 0);
    const materialIds = new Set(materials.map((m) => m.id));
    const activeReservations = dataset.bookings.filter(
      (b) => materialIds.has(b.materialId) && b.status === "confirmed",
    ).length;
    const verifiedT = dataset.verifications
      .filter((v) => materialIds.has(v.materialId))
      .reduce((acc, v) => acc + v.acceptedT, 0);
    const recoveryRate = recoverableT > 0 ? Math.round((verifiedT / recoverableT) * 100) : 0;

    return {
      project,
      materialCount: materials.length,
      recoverableT,
      activeReservations,
      recoveryRate,
    };
  });

  return (
    <>
      <PageMeta
        title="Projects | GreenLoop"
        description="Demolition and construction projects on the GreenLoop recovery platform."
      />
      <PageBreadCrumb pageTitle="Projects" />

      <div className="surface-card overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Project</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Location</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Status</TableCell>
                <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Materials</TableCell>
                <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Recoverable</TableCell>
                <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Reservations</TableCell>
                <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Recovery rate</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => (
                <TableRow key={row.project.id}>
                  <TableCell className="px-5 py-4 text-start">
                    <span className="block text-theme-sm font-medium text-ink-900 dark:text-white/90">
                      {row.project.name}
                    </span>
                    <span className="ledger-numeral block text-theme-xs text-gray-500 dark:text-gray-400">
                      {row.project.id}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {row.project.location}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <StatusBadge status={PROJECT_STATUS_LABEL[row.project.status]} />
                  </TableCell>
                  <TableCell mono className="px-5 py-4 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                    {row.materialCount}
                  </TableCell>
                  <TableCell mono className="px-5 py-4 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                    {row.recoverableT.toFixed(1)} t
                  </TableCell>
                  <TableCell mono className="px-5 py-4 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                    {row.activeReservations}
                  </TableCell>
                  <TableCell mono className="px-5 py-4 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                    {row.recoveryRate}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
        Figures computed from the demo dataset — survey quantities, confirmed bookings and
        verified loads per project.
      </p>
    </>
  );
}
