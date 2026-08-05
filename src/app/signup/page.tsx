import { SignupWizard } from "@/components/signup-wizard";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <SignupWizard error={error} />;
}
