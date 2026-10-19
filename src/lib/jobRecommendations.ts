export type RecommendationProfile = {
  role_title: string;
  past_titles?: string[] | null;
  skills?: string[] | null;
  tools?: string[] | null;
};

export type RecommendableJob = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  must_have_tools?: string[] | null;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "or", "the", "of", "for", "in", "to", "with", "at", "on",
  "remote", "full", "part", "time", "senior", "junior", "expert", "specialist",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}+#.]+/gu, " ").trim().replace(/\s+/g, " ");
}

function words(value: string): string[] {
  return [...new Set(normalize(value).split(" ").filter((word) => word && !STOP_WORDS.has(word)))];
}

function containsPhrase(text: string, phrase: string): boolean {
  return Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
}

/** Local relevance ranking: profile titles first, then named skills and tools. */
export function recommendJobs<T extends RecommendableJob>(
  jobs: T[],
  profiles: RecommendationProfile[],
  appliedJobIds: ReadonlySet<string> = new Set(),
) {
  return jobs
    .filter((job) => !appliedJobIds.has(job.id))
    .map((job) => {
      const title = normalize(job.title);
      const content = normalize(`${job.title} ${job.description} ${(job.must_have_tools ?? []).join(" ")}`);
      let bestScore = 0;
      let reason = "";
      for (const profile of profiles) {
        const titles = [profile.role_title, ...(profile.past_titles ?? [])].filter(Boolean);
        let titleScore = 0;
        for (const role of titles) {
          const phrase = normalize(role);
          const roleWords = words(role);
          const titleMatches = roleWords.filter((word) => containsPhrase(title, word)).length;
          const contentMatches = roleWords.filter((word) => containsPhrase(content, word)).length;
          const score = containsPhrase(title, phrase) ? 100
            : titleMatches > 0 ? 20 + 40 * titleMatches / roleWords.length
            : contentMatches > 0 ? 15 * contentMatches / roleWords.length : 0;
          titleScore = Math.max(titleScore, score);
        }
        const matches = [...new Set([...(profile.skills ?? []), ...(profile.tools ?? [])])]
          .filter((term) => containsPhrase(content, normalize(term)));
        const score = titleScore + Math.min(matches.length * 5, 25);
        if (score > bestScore) {
          bestScore = score;
          reason = titleScore > 0 ? `Matches your ${profile.role_title} profile`
            : `Matches ${matches.slice(0, 2).join(" · ")}`;
        }
      }
      return { job, score: bestScore, reason };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.job.created_at.localeCompare(a.job.created_at))
    .slice(0, 6);
}