export const noticesQuery = `
*[_type == "notice"] | order(pinned desc, publishedAt desc)[0...30]{
  _id, title, "slug": slug.current, excerpt, category, publishedAt, pinned
}`;

export const noticeBySlugQuery = `
*[_type == "notice" && slug.current == $slug][0]{
  title,
  publishedAt,
  category,
  coverImage,
  body,
  pinned
}
`;



export const projectsQuery = `
*[_type == "project"] | order(publishedAt desc)[0...60]{
  _id, title, "slug": slug.current, excerpt, area, stack, publishedAt, repoUrl
}`;

export const projectBySlugQuery = `
*[_type == "project" && slug.current == $slug][0]{
  title,
  publishedAt,
  excerpt,
  area,
  stack,
  repoUrl,
  coverImage,
  body
}
`;


export const contestsQuery = `
*[_type == "contest"] | order(deadline asc, _createdAt desc)[0...40]{
  _id, title, "slug": slug.current, status, deadline, excerpt
}`;

export const contestBySlugQuery = `
*[_type == "contest" && slug.current == $slug][0]{
  title,
  status,
  deadline,
  excerpt,
  coverImage,
  body
}
`;

export const jobsQuery = `
*[_type == "job"] | order(publishedAt desc)[0...60]{
  _id, title, "slug": slug.current, company, location, type, publishedAt, applyUrl
}`;

export const jobBySlugQuery = `
*[_type == "job" && slug.current == $slug][0]{
  title, company, location, type, publishedAt, applyUrl, body
}`;


export const homeQuery = `{
  "notices": *[_type=="notice"] | order(pinned desc, publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, excerpt, category, publishedAt, pinned
  },
  "projects": *[_type=="project"] | order(publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, excerpt, area, stack, publishedAt
  },
  "contests": *[_type=="contest"] | order(deadline asc, _createdAt desc)[0...3]{
    _id, title, "slug": slug.current, status, deadline, excerpt
  },
  "jobs": *[_type=="job"] | order(publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, company, location, type, publishedAt
  }
}`;
