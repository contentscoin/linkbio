import { ProfileDesigner } from "./designer-client";

export const dynamic = "force-dynamic";

export default async function DesignerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const handle =
    typeof params.handle === "string" ? params.handle : "";
  const embed = params.embed === "1" || params.embed === "true";
  const step = typeof params.step === "string" ? params.step : "guide";
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <ProfileDesigner
      handle={handle}
      embed={embed}
      initialStep={step}
      token={token}
    />
  );
}
