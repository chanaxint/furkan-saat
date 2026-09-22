import type { Story } from "./types";

export const STORIES: Story[] = [
  {
    id: "art-of-horology",
    category: "Craft",
    title: "The Art of Horology",
    excerpt:
      "Anglage, perlage, black polish: the hours of invisible handwork that separate a fine watch from a merely expensive one.",
    readTime: "8 min read",
    tone: "stone",
    media: { image: null, video: null },
    href: "/journal/art-of-horology",
  },
  {
    id: "inside-the-movement",
    category: "Mechanics",
    title: "Inside the Movement",
    excerpt:
      "From mainspring to escapement — a slow walk through the beating heart of a self-winding calibre.",
    readTime: "11 min read",
    tone: "green",
    media: { image: null, video: null },
    href: "/journal/inside-the-movement",
  },
  {
    id: "independent-watchmaking",
    category: "Independents",
    title: "The World of Independent Watchmaking",
    excerpt:
      "Small ateliers, tiny outputs, years-long waiting lists. Why the most interesting watches today are made by a handful of people.",
    readTime: "9 min read",
    tone: "champagne",
    media: { image: null, video: null },
    href: "/journal/independent-watchmaking",
  },
];
