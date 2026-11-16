export interface AboutFaq {
  question: string;
  answer: string;
}

export interface AboutPlatform {
  id: "codeforces" | "atcoder" | "leetcode";
  name: string;
  summary: string;
}

export const ABOUT_FAQS: AboutFaq[] = [
  {
    question: "Does cptracer store my handles on a server?",
    answer:
      "No. Handles and cached statistics stay in browser local storage. Requests go directly from the browser to the public platform APIs.",
  },
  {
    question: "Do I need an account?",
    answer: "No. There is no sign-up, login, or database.",
  },
  {
    question: "Why is a platform marked unavailable?",
    answer:
      "A platform API may be rate-limited or temporarily offline. The rest of the dashboard keeps working, and you can retry with the refresh button.",
  },
  {
    question: "Which difficulty values are shown?",
    answer:
      "Codeforces and AtCoder use official problem ratings. LeetCode uses Easy, Medium, or Hard.",
  },
  {
    question: "Is cptracer free?",
    answer: "Yes. cptracer is free and open source under the MIT licence.",
  },
];

export const ABOUT_PLATFORMS: AboutPlatform[] = [
  {
    id: "codeforces",
    name: "Codeforces",
    summary:
      "Official public API for ratings, submissions, and problem ratings.",
  },
  {
    id: "atcoder",
    name: "AtCoder",
    summary:
      "AtCoder Problems API for submissions, problem titles, and difficulty.",
  },
  {
    id: "leetcode",
    name: "LeetCode",
    summary:
      "Public community API for solved counts, calendars, and recent solves.",
  },
];
