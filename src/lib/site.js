// All homepage copy lives here — edit this file to change the site.
// Images come from the Figma "content" section (node 20:124360), exported to public/projects/.

const img = (name, ratio, full) => ({ src: `/projects/${name}.webp`, ratio, ...(full ? { full: `/projects/${full}.webp` } : {}) });
const R43 = 4 / 3;    // 800×600 frames
const R169 = 16 / 9;  // 1920×1080 frames
const PHONE = 402 / 874;

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

  // Tag order = dot order. Colours come from the Figma "pops" styles.
  tags: [
    { id: "digital", label: "Digital", color: "#C7578F" },
    { id: "print", label: "Print", color: "#F5A300" },
    { id: "website", label: "Website", color: "#235789" },
    { id: "passion", label: "Passion", color: "#28A472" },
    { id: "undisclosed", label: "Undisclosed", color: "#C1292E" },
  ],

  // images: { src, ratio (w/h), full? (long page shown by Pop out) }
  selected: [
    {
      title: "Basecamp Research",
      client: "Basecamp Research",
      years: "2024", // TODO: confirm (was "2024?")
      tags: ["digital", "website"],
      disciplines: "Website design, Expedition: Iceland feature",
      description:
        "A London biotech company building the world’s largest biological database and using AI to learn from nature.",
      images: [img("basecamp-2", 1200 / 675), img("basecamp-1", R43), img("basecamp-3", R43)],
    },
    {
      title: "The Fenway",
      client: "The Fenway",
      years: "2023", // TODO: confirm (was "2023?")
      tags: ["digital", "print", "website"],
      disciplines: "Brand guidelines, Website, Mobile experience, Construction hoarding",
      description: "A destination brand for Boston’s Fenway neighbourhood.",
      images: [img("fenway-1", R43), img("fenway-2", R169), img("fenway-3", R43), img("fenway-4", R43)],
    },
    {
      title: "Let’s Vision 2025",
      client: "SwiftGG",
      years: "2025",
      tags: ["digital", "print"],
      disciplines: "Conference identity, Invitation letter, Speaker posters",
      description:
        "SwiftGG’s developer conference for the Apple ecosystem, themed AI + Spatial Computing, held 1–2 March 2025 at Flower Port, Pudong, Shanghai.",
      images: [img("vision-2", R43), img("vision-1", R43)],
    },
    {
      title: "Dify Creator Program",
      client: "Dify",
      years: "2025",
      tags: ["digital", "website"],
      disciplines: "Landing page, Creator Center dashboard",
      description: "A program for creators to publish templates and plugins on Dify and earn from them.",
      images: [img("dify-2", 0.75, "dify-2-full")],
    },
    {
      title: "CUTO",
      client: "CUTO",
      years: "2026",
      tags: ["digital"],
      disciplines: "App UI, Membership paywall",
      description: "A wallpaper app with a paid membership.",
      images: [img("cuto-1", R43)],
    },
  ],

  // Newest to oldest
  archive: [
    {
      title: "AI Widget Creator App",
      client: "", // name TBC
      years: "2026",
      tags: ["digital"],
      disciplines: "Brand mark, App UI, Conversational flow",
      description:
        "An iOS app where users describe the widget they want in a chat, such as daily English vocabulary, and AI builds it, with controls for size, update frequency and style.",
      images: [img("widget-0", R43), img("widget-1", PHONE), img("widget-2", PHONE), img("widget-3", PHONE), img("widget-4", PHONE)],
    },
    {
      title: "The Arsenal on the Charles",
      client: "The Arsenal on the Charles",
      years: "2026",
      tags: ["print"],
      disciplines: "Brand book, Editorial design, Storytelling",
      description:
        "A historic campus in Watertown, Boston, now an innovation hub. The brand book, The Foundations of a Legacy, covers its editorial design and storytelling.",
      images: [img("arsenal-1", R169), img("arsenal-2", R169)],
    },
    {
      title: "Ponder",
      client: "Ponder",
      years: "2026",
      tags: ["digital"],
      disciplines: "Product UI",
      description: "An AI research workspace that brings files, an editor and an agent together.",
      images: [img("workspace-1", R43)],
    },
    {
      title: "Illustrated Avatar Series",
      client: "Self initiated",
      years: "2026",
      tags: ["passion"],
      disciplines: "Illustration",
      description: "A set of illustrated character avatars.",
      images: [img("characters-1", 2496 / 1411)],
    },
    {
      title: "WWDC25.playground Watch Party",
      client: "WWDC25.playground",
      years: "2025",
      tags: ["print"],
      disciplines: "Event key visual",
      description: "A WWDC25 watch party held on 9 June 2025 in Beijing, Shanghai and Shenzhen.",
      images: [img("wwdc-1", R43)],
    },
    {
      title: "Dify Marketplace",
      client: "Dify",
      years: "2025",
      tags: ["digital", "website"],
      disciplines: "Homepage design",
      description: "Dify’s marketplace for plugins.",
      images: [img("dify-1", 0.75, "dify-1-full")],
    },
    {
      title: "Dify Affiliate Program",
      client: "Dify",
      years: "2025",
      tags: ["digital", "website"],
      disciplines: "Landing page",
      description: "Dify’s referral and commission program.",
      images: [img("dify-3", 0.75, "dify-3-full")],
    },
    {
      title: "Dify Developer",
      client: "Dify",
      years: "2025",
      tags: ["digital", "website"],
      disciplines: "Landing page, Product UI illustrations",
      description: "A developer-facing product page covering workflows, debugging and plugins.",
      images: [img("dify-4", 0.75, "dify-4-full")],
    },
    {
      title: "BLOC1",
      client: "BLOC1",
      years: "2025",
      tags: ["digital"],
      disciplines: "App UI, Visual system",
      description: "A membership app for a climbing gym, with a class calendar, passes and a wallet.",
      images: [img("bloc-1", R43)],
    },
    {
      title: "ult",
      client: "ult",
      years: "2025",
      tags: ["digital"],
      disciplines: "Product UI",
      description:
        "An AI networking tool that recommends people to meet from a plain-language description and your résumé.",
      images: [img("ult-1", R43)],
    },
    {
      title: "Fenway Landmark Campus / 421 Park",
      client: "",
      years: "2023", // TODO: confirm (was "2023?")
      tags: ["print"],
      disciplines: "Leasing deck, Wayfinding maps, Brand exploration",
      description: "A life-sciences campus in the Fenway.",
      images: [img("data-1", R169)],
    },
  ],
};
