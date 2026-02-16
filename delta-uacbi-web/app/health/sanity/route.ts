import { sanityClient } from "@/lib/sanity/client";

export async function GET() {
  const data = await sanityClient.fetch(`{
    "noticeCount": count(*[_type=="notice"]),
    "projectCount": count(*[_type=="project"]),
    "contestCount": count(*[_type=="contest"]),
    "jobCount": count(*[_type=="job"])
  }`);

  return Response.json(data);
}
