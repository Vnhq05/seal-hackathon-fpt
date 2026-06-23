import { EnrollmentManagementPage } from "@/features/admin/components/enrollment-management-page";

export default async function EnrollmentsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnrollmentManagementPage eventId={id} />;
}
