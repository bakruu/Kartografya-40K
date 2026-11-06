import { matchesSearch } from '../i18n/search';
import type { MapApp, MapWorld } from '../map/MapApp';

const WORLD_PARAM = 'world';
const TOOLTIP_OFFSET = 14;

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

/**
 * Wires the map page together. The list and dossier work on their own and the 3D map joins when
 * it has loaded, so every world stays reachable where WebGL is unavailable.
 */
export function startMapUi(): void {
  const canvas = required<HTMLCanvasElement>('[data-galaxy-map]');
  const fallback = required<HTMLElement>('[data-map-fallback]');
  const tooltip = required<HTMLElement>('[data-map-tooltip]');
  const sidebar = required<HTMLElement>('[data-sidebar]');
  const sidebarToggle = required<HTMLButtonElement>('[data-sidebar-toggle]');
  const search = required<HTMLInputElement>('[data-world-search]');
  const searchEmpty = required<HTMLElement>('[data-search-empty]');
  const panel = required<HTMLElement>('[data-dossier-panel]');
  const closeButton = required<HTMLButtonElement>('[data-dossier-close]');
  const announcer = required<HTMLElement>('[data-map-announcer]');
  const langSwitch = required<HTMLAnchorElement>('[data-lang-switch]');
  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-world-link]')];
  const dossiers = [...document.querySelectorAll<HTMLElement>('[data-dossier]')];

  const worlds: MapWorld[] = JSON.parse(canvas.dataset.worlds ?? '[]');
  const nameOf = (slug: string) => worlds.find((world) => world.slug === slug)?.name ?? slug;
  const isWorld = (slug: string | null): slug is string =>
    worlds.some((world) => world.slug === slug);

  let map: MapApp | null = null;
  let current: string | null = null;

  const setSidebarOpen = (open: boolean) => {
    sidebar.toggleAttribute('data-open', open);
    sidebarToggle.setAttribute('aria-expanded', String(open));
  };

  /** Keeps the language link pointing at the same world. */
  const syncLangSwitch = () => {
    langSwitch.search = window.location.search;
  };

  const writeUrl = (slug: string | null, mode: 'push' | 'replace') => {
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set(WORLD_PARAM, slug);
    else url.searchParams.delete(WORLD_PARAM);
    if (mode === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(null, '', url);
    syncLangSwitch();
  };

  const showSelection = (slug: string | null) => {
    panel.hidden = slug === null;
    for (const dossier of dossiers) dossier.hidden = dossier.dataset.dossier !== slug;
    for (const link of links) {
      if (link.dataset.worldLink === slug) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    const template = slug ? announcer.dataset.selected : announcer.dataset.cleared;
    announcer.textContent = (template ?? '').replace('{name}', slug ? nameOf(slug) : '');
  };

  /** A user choice: updates the page, adds a history entry and tells the map. */
  const choose = (slug: string | null) => {
    if (slug !== current) {
      current = slug;
      showSelection(slug);
      writeUrl(slug, 'push');
    }
    map?.select(slug);
  };

  /** Applies whatever the address bar says, on page load and on back/forward. */
  const readUrl = (options: { instant: boolean }) => {
    const requested = new URLSearchParams(window.location.search).get(WORLD_PARAM);
    const slug = isWorld(requested) ? requested : null;
    if (requested !== null && slug === null) writeUrl(null, 'replace');
    syncLangSwitch();
    const changed = slug !== current;
    current = slug;
    if (changed) showSelection(slug);
    map?.select(slug, options);
  };

  for (const link of links) {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      setSidebarOpen(false);
      choose(link.dataset.worldLink ?? null);
    });
  }

  search.addEventListener('input', () => {
    let visible = 0;
    for (const link of links) {
      const matches = matchesSearch(link.dataset.worldName ?? '', search.value);
      const item = link.closest('li');
      if (item) item.hidden = !matches;
      if (matches) visible += 1;
    }
    searchEmpty.hidden = visible > 0;
  });

  sidebarToggle.addEventListener('click', () => {
    setSidebarOpen(!sidebar.hasAttribute('data-open'));
  });

  const closeDossier = () => {
    const link = links.find((candidate) => candidate.dataset.worldLink === current);
    choose(null);
    link?.focus();
  };

  closeButton.addEventListener('click', closeDossier);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && current !== null) closeDossier();
  });

  window.addEventListener('popstate', () => readUrl({ instant: false }));

  readUrl({ instant: true });

  void (async () => {
    try {
      const { init } = await import('../map/MapApp');
      const app = init(canvas, { worlds }, { debug: import.meta.env.DEV });
      app.on('select', ({ slug }) => choose(slug));
      app.on('hover', ({ slug, x, y }) => {
        tooltip.hidden = slug === null;
        if (slug === null) return;
        tooltip.textContent = nameOf(slug);
        tooltip.style.transform = `translate(${x + TOOLTIP_OFFSET}px, ${y + TOOLTIP_OFFSET}px)`;
      });
      map = app;
      if (current) app.select(current, { instant: true });
      canvas.dataset.state = 'ready';
    } catch (error) {
      console.error(error);
      canvas.hidden = true;
      fallback.hidden = false;
    }
  })();
}
