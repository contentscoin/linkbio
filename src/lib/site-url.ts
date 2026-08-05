export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.LINKBIO_PUBLIC_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
