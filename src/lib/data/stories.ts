import type { Story } from "./types";

export const STORIES: Story[] = [
  {
    id: "art-of-horology",
    category: "Zanaat",
    title: "Saatçilik Sanatı",
    excerpt:
      "Anglage, perlage, siyah cila: iyi bir saati yalnızca pahalı olandan ayıran, görünmeyen saatlerce süren el işçiliği.",
    readTime: "8 dk okuma",
    tone: "stone",
    media: { image: null, video: null },
    href: "/journal/art-of-horology",
  },
  {
    id: "inside-the-movement",
    category: "Mekanik",
    title: "Mekanizmanın İçinde",
    excerpt:
      "Ana yaydan eşapmana — otomatik bir kalibrenin atan kalbinde yavaş bir yürüyüş.",
    readTime: "11 dk okuma",
    tone: "green",
    media: { image: null, video: null },
    href: "/journal/inside-the-movement",
  },
  {
    id: "independent-watchmaking",
    category: "Bağımsızlar",
    title: "Bağımsız Saatçiliğin Dünyası",
    excerpt:
      "Küçük atölyeler, sınırlı üretim, yıllar süren bekleme listeleri. Bugünün en ilginç saatlerini neden bir avuç insan üretiyor?",
    readTime: "9 dk okuma",
    tone: "champagne",
    media: { image: null, video: null },
    href: "/journal/independent-watchmaking",
  },
];
