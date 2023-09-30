import * as path from "path";
import { readFile, readdir } from "fs/promises";
import { Profile } from "./types";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/types";

const MSFS_DIR = "msfs2020";

await syncToSupabase();

async function syncToSupabase() {
  const airports = await readDirectory(MSFS_DIR);
  airports.forEach(async (airport) => {
    const addons = await readDirectory(MSFS_DIR, airport);
    addons.forEach(async (addon) => {
      const profileIds = await readDirectory(MSFS_DIR, airport, addon);
      profileIds.forEach(async (profileId) => {
        const profilePath = path.join(
          MSFS_DIR,
          airport,
          addon,
          profileId,
          "profile.json"
        );
        const changelogPath = path.join(
          MSFS_DIR,
          airport,
          addon,
          profileId,
          "CHANGELOG.md"
        );
        const profileJson = await readFile(profilePath, "utf-8");
        const changelogMd = await readFile(changelogPath, "utf-8");

        const profile = JSON.parse(profileJson);
        const changelog = parseChangelog(changelogMd);

        const mostRecentVersion = changelog[0];

        const assembledProfile: Profile = {
          airport,
          airportCreator: addon,
          ...(profile.requiresVersion && {
            requiredAirportVersion: profile.requiresVersion,
          }),
          authors: profile.authors,
          contributors: profile.contributors,
          description: profile.description,
          version: mostRecentVersion.version,
          variants: profile.profileVariants,
          profileId,
        };

        const profileSlug = getProfileSlug(assembledProfile);

        await syncWithSupabase(profileSlug, assembledProfile);
      });
    });
  });
}

async function syncWithSupabase(slug: string, profile: Profile) {
  console.log("syncing", slug);
  const supabase = createClient<Database>(
    "https://piymwrovuocnfoikcbwq.supabase.co",
    process.env.SUPABASE_KEY || ""
  );

  const authResponse = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_EMAIL || "",
    password: process.env.SUPABASE_PASSWORD || "",
  });

  const { error: profileError } = await supabase.from("profiles").upsert({
    slug,
    airport: profile.airport,
    airportCreator: profile.airportCreator,
    description: profile.description,
    version: profile.version,
    requiresAirportVersion: profile.requiredAirportVersion,
  });

  if (profileError) {
    console.error(profileError);
    process.exit(1);
  }

  const contributors = profile.contributors
    .map(
      (c) =>
        ({
          name: c,
          profileSlug: slug,
          author: false,
        } as Database["public"]["Tables"]["contributors"]["Insert"])
    )
    .concat(
      profile.authors.map(
        (a) =>
          ({
            name: a,
            author: true,
            profileSlug: slug,
          } as Database["public"]["Tables"]["contributors"]["Insert"])
      )
    );

  const { error: contributorsError } = await supabase
    .from("contributors")
    .upsert(contributors);

  if (contributorsError) {
    console.error(contributorsError);
    process.exit(1);
  }

  const files = profile.variants
    .map((variant) =>
      variant.files.map(
        (fileName) =>
          ({
            profileSlug: slug,
            profileVariant: variant.name,
            name: fileName,
          } as Database["public"]["Tables"]["files"]["Insert"])
      )
    )
    .flat();

  const { error: filesError } = await supabase.from("files").upsert(files);

  console.log({ error: filesError });
}

async function readDirectory(...dirs: string[]) {
  const dirPath = path.join(...dirs);
  const directories = await readdir(dirPath, { withFileTypes: true });
  return directories.filter((d) => d.isDirectory()).map((d) => d.name);
}

function parseChangelog(
  changelogContent: string
): { version: string; description: string }[] {
  const lines = changelogContent.split("\n");
  const versions = lines.filter((line) => line.startsWith("## "));

  return versions.map((version) => {
    const startIndex = lines.indexOf(version) + 1;
    const endIndex = lines.indexOf("## ", startIndex);
    const description = lines.slice(startIndex, endIndex).join("\n");
    return { version: version.replace("## ", ""), description };
  });
}

/**
 * Creates a slug that uniquely identifies a profile
 * @param p the profile
 * @returns the slug
 */
function getProfileSlug(p: Profile) {
  return `${MSFS_DIR}-${p.airport}-${p.airportCreator}-${p.profileId}`;
}
