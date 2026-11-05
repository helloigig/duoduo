// All homepage copy lives here — edit this file to change the site.
// Images come from the Figma "content" section (node 20:124360), exported to public/projects/.

// Every tile is a 4:3 image built by scripts/build-project-images.mjs (1600×1200 + an 800px version).
const img = (name, full) => ({
  src: `/projects/${name}.webp`,
  small: `/projects/${name}-800.webp`,
  ratio: 4 / 3,
  ...(full ? { full: `/projects/${full}.webp` } : {}),
});
// A long web page: three sections as tiles; Pop out shows the whole page
const page = (name) => [img(`${name}-a`, `${name}-full`), img(`${name}-b`), img(`${name}-c`)];

export const SITE = {
  name: "duoduo",
  role: "Product Engineering Studio",
  url: "https://www.duoduo.global/",
  // Header "Contact" link: the 15-minute call booking from duoduo.global
  contact: "https://cal.com/duo-duo/15min",

  // Intro paragraph. Wrap highlighted words in [square brackets] (they render grey).
  intro:
    "[duoduo] is a product engineering studio founded by two designers who also write production code. " +
    "We partner with [founders], and the investors behind them, at the point where an idea has to become a credible product, " +
    "and we carry it from [brand and experience] through to [launch]. Our backgrounds span fashion, branding, advertising and UI/UX, " +
    "which gives the studio a refined visual sensibility alongside rigorous structural thinking, so every product we deliver is " +
    "both considered in its craft and clear in its logic.",

  // Filter categories, from the projects' scopes. Tag order = dot order; colours are the Figma "pops" plus one violet.
  tags: [
    { id: "brand", label: "Brand", color: "#C7578F" },
    { id: "website", label: "Website", color: "#235789" },
    { id: "app", label: "App", color: "#28A472" },
    { id: "product", label: "Product UI", color: "#7A5CC2" },
    { id: "print", label: "Print", color: "#F5A300" },
    { id: "illustration", label: "Illustration", color: "#C1292E" },
  ],

  // images: { src, ratio (w/h), full? (long page shown by Pop out) }
  selected: [
    {
      title: "Basecamp Research",
      client: "Basecamp Research",
      years: "2024", // TODO: confirm (was "2024?")
      tags: ["website"],
      disciplines: "Website design, Expedition: Iceland feature",
      description:
        "A London biotech company building the world’s largest biological database and using AI to learn from nature.",
      images: [img("basecamp-2"), img("basecamp-1"), img("basecamp-3")],
    },
    {
      title: "The Fenway",
      client: "The Fenway",
      years: "2023", // TODO: confirm (was "2023?")
      tags: ["brand", "website", "app"],
      disciplines: "Brand guidelines, Website, Mobile experience, Construction hoarding",
      description: "A destination brand for Boston’s Fenway neighbourhood.",
      images: [img("fenway-1"), img("fenway-2"), img("fenway-3"), img("fenway-4")],
    },
    {
      title: "Let’s Vision 2025",
      client: "SwiftGG",
      years: "2025",
      tags: ["brand", "print"],
      disciplines: "Conference identity, Invitation letter, Speaker posters",
      description:
        "SwiftGG’s developer conference for the Apple ecosystem, themed AI + Spatial Computing, held 1–2 March 2025 at Flower Port, Pudong, Shanghai.",
      images: [img("vision-2"), img("vision-1")],
    },
    {
      title: "Dify Creator Program",
      client: "Dify",
      years: "2025",
      tags: ["website"],
      disciplines: "Landing page, Creator Center dashboard",
      description: "A program for creators to publish templates and plugins on Dify and earn from them.",
      images: page("dify-2"),
    },
    {
      title: "CUTO",
      client: "CUTO",
      years: "2026",
      tags: ["app"],
      disciplines: "App UI, Membership paywall",
      description: "A wallpaper app with a paid membership.",
      images: [img("cuto-1")],
    },
  ],

  // Newest to oldest
  archive: [
    {
      title: "AI Widget Creator App",
      client: "", // name TBC
      years: "2026",
      tags: ["brand", "app"],
      disciplines: "Brand mark, App UI, Conversational flow",
      description:
        "An iOS app where users describe the widget they want in a chat, such as daily English vocabulary, and AI builds it, with controls for size, update frequency and style.",
      images: [img("widget-0"), img("widget-1"), img("widget-2"), img("widget-3"), img("widget-4")],
    },
    {
      title: "The Arsenal on the Charles",
      client: "The Arsenal on the Charles",
      years: "2026",
      tags: ["brand", "print"],
      disciplines: "Brand book, Editorial design, Storytelling",
      description:
        "A historic campus in Watertown, Boston, now an innovation hub. The brand book, The Foundations of a Legacy, covers its editorial design and storytelling.",
      images: [img("arsenal-1"), img("arsenal-2")],
    },
    {
      title: "Ponder",
      client: "Ponder",
      years: "2026",
      tags: ["product"],
      disciplines: "Product UI",
      description: "An AI research workspace that brings files, an editor and an agent together.",
      images: [img("workspace-1")],
    },
    {
      title: "Illustrated Avatar Series",
      client: "Self initiated",
      years: "2026",
      tags: ["illustration"],
      disciplines: "Illustration",
      description: "A set of illustrated character avatars.",
      images: [img("characters-1")],
    },
    {
      title: "WWDC25.playground Watch Party",
      client: "WWDC25.playground",
      years: "2025",
      tags: ["brand", "print"],
      disciplines: "Event key visual",
      description: "A WWDC25 watch party held on 9 June 2025 in Beijing, Shanghai and Shenzhen.",
      images: [img("wwdc-1")],
    },
    {
      title: "Dify Marketplace",
      client: "Dify",
      years: "2025",
      tags: ["website"],
      disciplines: "Homepage design",
      description: "Dify’s marketplace for plugins.",
      images: page("dify-1"),
    },
    {
      title: "Dify Affiliate Program",
      client: "Dify",
      years: "2025",
      tags: ["website"],
      disciplines: "Landing page",
      description: "Dify’s referral and commission program.",
      images: page("dify-3"),
    },
    {
      title: "Dify Developer",
      client: "Dify",
      years: "2025",
      tags: ["website", "product"],
      disciplines: "Landing page, Product UI illustrations",
      description: "A developer-facing product page covering workflows, debugging and plugins.",
      images: page("dify-4"),
    },
    {
      title: "BLOC1",
      client: "BLOC1",
      years: "2025",
      tags: ["app"],
      disciplines: "App UI, Visual system",
      description: "A membership app for a climbing gym, with a class calendar, passes and a wallet.",
      images: [img("bloc-1")],
    },
    {
      title: "ult",
      client: "ult",
      years: "2025",
      tags: ["product"],
      disciplines: "Product UI",
      description:
        "An AI networking tool that recommends people to meet from a plain-language description and your résumé.",
      images: [img("ult-1")],
    },
    {
      title: "Fenway Landmark Campus / 421 Park",
      client: "",
      years: "2023", // TODO: confirm (was "2023?")
      tags: ["brand", "print"],
      disciplines: "Leasing deck, Wayfinding maps, Brand exploration",
      description: "A life-sciences campus in the Fenway.",
      images: [img("data-1")],
    },
  ],
};

// ── Derived data shared by the homepage, project pages, sitemap and llms.txt ──
export const slugify = (s) =>
  s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const PROJECTS = [
  ...SITE.selected.map((p) => ({ ...p, group: "selected", key: slugify(p.title) })),
  ...SITE.archive.map((p) => ({ ...p, group: "archive", key: slugify(p.title) })),
];

export const projectBySlug = (key) => PROJECTS.find((p) => p.key === key);
export const tagLabel = (id) => SITE.tags.find((t) => t.id === id)?.label ?? id;

// Founders and places, used in structured data (from the live duoduo.global copy)
export const STUDIO = {
  founders: ["Gigi", "Kiwi"],
  locations: ["London", "Shenzhen"],
  services: [
    "Product design",
    "Brand identity",
    "UI/UX design",
    "Website design",
    "Front-end engineering",
    "App design",
  ],
};
