import data from "./journal.json";
import type { Article } from "./types";

/** Dergi — editorial articles, stored in journal.json and edited from /yonetim/dergi. */
export const ARTICLES = data as Article[];
