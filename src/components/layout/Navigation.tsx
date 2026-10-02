"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { BagIcon, HeartIcon, PersonIcon, SearchIcon } from "@/components/product/icons";
import { NAV_LINKS } from "@/lib/data/site";
import { ScrollTrigger } from "@/lib/gsap";
import { useCart, useCartDrawer } from "@/lib/services/cart";
import { useWishlist } from "@/lib/services/wishlist";
import { CartDrawer } from "./CartDrawer";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import styles from "./Navigation.module.css";

type Mode = "immersive" | "visible" | "hidden";

/**
 * Navigation
 * - `immersive`: during the home page's opening film only a faint wordmark remains
 * - `visible`:   full bar; it takes a ground once the page has scrolled
 * - `hidden`:    tucks away while scrolling down deep in the page, returns on scroll up
 * Ink colour follows the section under the bar via [data-nav-theme].
 */
export function Navigation() {
  const [mode, setMode] = useState<Mode>("visible");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const lastY = useRef(0);
  const { scrollTo } = useSmoothScroll();
  const pathname = usePathname();
  const wishlist = useWishlist();
  const cart = useCart();
  const cartDrawer = useCartDrawer();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const down = y > lastY.current;
      lastY.current = y;
      // The opening film on the home page keeps the bar to a wordmark.
      const hero = document.getElementById("top");
      const heroEnd = hero ? hero.offsetTop + hero.offsetHeight - vh * 1.2 : -1;
      if (y < heroEnd) setMode("immersive");
      else if (down && y > vh * 1.5) setMode("hidden");
      else setMode("visible");
      setSolid(y > 24 && y >= heroEnd);

      // Sample the section beneath the bar.
      const probe = document.elementsFromPoint(window.innerWidth / 2, 40);
      const themed = probe.map((el) => el.closest<HTMLElement>("[data-nav-theme]")).find(Boolean);
      setTheme((themed?.dataset.navTheme as "dark" | "light") ?? "dark");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // The wordmark leads to the brand tiles on the home page.
  const onWordmark = (e: React.MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    scrollTo("#markalar");
    ScrollTrigger.refresh();
  };

  // Internal tools (the /kontrol page) run without the site navigation.
  if (pathname?.startsWith("/kontrol")) return null;

  return (
    <>
      <header className={styles.nav} data-mode={mode} data-theme={theme} data-solid={solid || undefined}>
        <div className={styles.inner}>
          <div className={styles.start}>
            <button className={styles.menuButton} aria-expanded={menu} onClick={() => setMenu(true)}>
              <span className={styles.menuIcon} aria-hidden>
                <span />
                <span />
              </span>
              <span className={styles.menuLabel}>Menü</span>
            </button>
            <nav className={styles.links} aria-label="Ana menü">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={styles.link} aria-current={pathname?.startsWith(l.href) ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link href="/#markalar" className={styles.wordmark} aria-label="Furkan Saat — markalar" onClick={onWordmark}>
            Furkan <span>Saat</span>
          </Link>

          <div className={styles.end}>
            <button className={styles.icon} onClick={() => setSearching(true)} aria-label="Ara">
              <SearchIcon />
            </button>
            <Link href="/favoriler" className={styles.icon} aria-label={`Favoriler (${wishlist.slugs.length})`}>
              <HeartIcon />
              {wishlist.slugs.length > 0 && <sup>{wishlist.slugs.length}</sup>}
            </Link>
            <Link href="/hesap" className={`${styles.icon} ${styles.account}`} aria-label="Hesabım">
              <PersonIcon />
            </Link>
            <button className={styles.icon} onClick={() => cartDrawer.setOpen(true)} aria-label={`Sepet (${cart.count})`}>
              <BagIcon />
              {cart.count > 0 && <sup>{cart.count}</sup>}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <SearchOverlay open={searching} onClose={() => setSearching(false)} />
      <CartDrawer />
    </>
  );
}
