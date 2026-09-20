// Finds a real, freely-licensed photo for each of several short search
// phrases. Tries Openverse (openverse.org) first — a free, keyless search
// engine over Creative Commons / public domain images — and, if it comes
// back empty for a phrase, falls back to Wikimedia Commons (also free,
// keyless, and CC/public-domain licensed) before giving up. Both sources
// require no API key, matching the project's keyless-tools architecture.
async function searchOpenverse(query) {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      query
    )}&page_size=1&mature=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const top = data.results?.[0];
    if (!top?.thumbnail && !top?.url) return null;
    return { imageUrl: top.thumbnail || top.url, credit: top.creator || "Unknown" };
  } catch {
    return null;
  }
}

function stripHtml(value) {
  return value ? value.replace(/<[^>]+>/g, "").trim() : "";
}

async function searchWikimediaCommons(query) {
  try {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
      `&gsrnamespace=6&gsrlimit=1&gsrsearch=${encodeURIComponent(`${query} filetype:bitmap`)}` +
      `&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    const info = page?.imageinfo?.[0];
    if (!info) return null;
    const artist = stripHtml(info.extmetadata?.Artist?.value);
    return { imageUrl: info.thumburl || info.url, credit: artist || "Wikimedia Commons" };
  } catch {
    return null;
  }
}

export async function fetchImages(queries) {
  const safeQueries = (queries || []).slice(0, 8);

  return Promise.all(
    safeQueries.map(async (query) => {
      const hit = (await searchOpenverse(query)) || (await searchWikimediaCommons(query));
      return { query, imageUrl: hit?.imageUrl || null, credit: hit?.credit || null };
    })
  );
}
