"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { BagIcon, HeartIcon, PersonIcon, SearchIcon } from "@/components/product/icons";
import { ScrollTrigger } from "@/lib/gsap";
import { useCart, useCartDrawer } from "@/lib/services/cart";
import { useWishlist } from "@/lib/services/wishlist";
import { CartDrawer } from "./CartDrawer";
import { SiteMenu } from "./SiteMenu";
import { SearchOverlay } from "./SearchOverlay";
import styles from "./Navigation.module.css";

type Mode = "immersive" | "visible" | "hidden";

/**
 * Navigation
 * - `immersive`: while the home page opening scrolls away only a faint wordmark remains
 * - `visible`:   full bar; it takes a ground once the page has scrolled
 * - `hidden`:    tucks away while scrolling down deep in the page, returns on scroll up
 * Ink colour follows the section under the bar via [data-nav-theme].
 */
export function Navigation() {
  const [mode, setMode] = useState<Mode>("visible");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [tone, setTone] = useState<string | undefined>();
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const lastY = useRef(0);
  const { scrollTo } = useSmoothScroll();
  const pathname = usePathname();
  const wishlist = useWishlist();
  const auth = useAuth();
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
      // Sample the section beneath the bar.
      const probe = document.elementsFromPoint(window.innerWidth / 2, 40);
      // Some sections (the campaign) always show the bar, even scrolling down.
      const keep = probe.some((el) => el.closest("[data-nav-keep]"));
      if (y < heroEnd) setMode("immersive");
      else if (down && y > vh * 1.5 && !keep) setMode("hidden");
      else setMode("visible");
      setSolid(y > 24 && y >= heroEnd);

      const themed = probe.map((el) => el.closest<HTMLElement>("[data-nav-theme]")).find(Boolean);
      setTheme((themed?.dataset.navTheme as "dark" | "light") ?? "dark");
      // A section can ask for a deeper ground so the bar does not melt into it.
      setTone(themed?.dataset.navTone);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // The wordmark leads to the campaign on the home page (past the opening film).
  const onWordmark = (e: React.MouseEvent) => {
    if (pathname !== "/") return;
    e.preventDefault();
    scrollTo("#kampanya");
    ScrollTrigger.refresh();
  };

  // The management panel (/yonetim) runs without the site navigation.
  if (pathname?.startsWith("/yonetim")) return null;

  return (
    <>
      <header className={styles.nav} data-mode={mode} data-theme={theme} data-tone={tone} data-solid={solid || undefined}>
        <div className={styles.inner}>
          <div className={styles.start}>
            <button className={styles.menuButton} aria-expanded={menu} onClick={() => setMenu(true)}>
              <span className={styles.menuIcon} aria-hidden>
                <span />
                <span />
              </span>
              <span className={styles.menuLabel}>Menü</span>
            </button>
          </div>

          <Link href="/#kampanya" className={styles.wordmark} aria-label="Furkan Saat — ana sayfa" onClick={onWordmark}>
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
            <Link
              href={auth.status === "authenticated" ? "/hesap" : "/giris"}
              className={`${styles.icon} ${styles.account}`}
              aria-label={auth.status === "authenticated" ? "Hesabım" : "Hesabım: giriş yapın veya üye olun"}
            >
              <PersonIcon />
            </Link>
            <button className={styles.icon} onClick={() => cartDrawer.setOpen(true)} aria-label={`Sepet (${cart.count})`}>
              <BagIcon />
              {cart.count > 0 && <sup>{cart.count}</sup>}
            </button>
          </div>
        </div>
      </header>
      <SiteMenu open={menu} onClose={() => setMenu(false)} />
      <SearchOverlay open={searching} onClose={() => setSearching(false)} />
      <CartDrawer />
    </>
  );
}
