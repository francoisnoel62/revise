// ABOUTME: Settings page - migrated from old metadata page
// ABOUTME: Displays project metadata analyses

import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { projectId } = await params;

  // Temporarily redirect to the old metadata page
  // TODO: Migrate metadata page content here
  redirect(`/project/${projectId}/metadata`);
}
