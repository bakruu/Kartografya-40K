# Katkıda Bulunma / Contributing

[Türkçe](#türkçe) · [English](#english)

## Türkçe

### Temel kurallar

- Lore metinlerini **kendi cümlelerinizle** yazın. Kitaplardan, wikilerden veya başka sitelerden metin yapıştırmayın.
- Başka bir haritanın verisini, kodunu veya görselini kopyalamayın. Koordinatlar bize ait, yaklaşık tahminlerdir.
- Resmî Games Workshop çizimi, logosu, yazı tipi veya taranmış haritası eklemeyin.
- Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) biçiminde ve İngilizce olur.
- Yeni bağımlılık eklerseniz gerekçesini PR açıklamasında tek satırla belirtin.

### Yeni dünya ekleme

Alanlar [src/content/schemas.ts](src/content/schemas.ts) dosyasında tanımlı. Örnek için [src/content/worlds/](src/content/worlds/) klasörüne bakın. Yeni bir `classification` eklerseniz çevirisini `src/i18n/tr.json` ve `en.json` dosyalarına da ekleyin.

1. `src/content/worlds/` altına iki dosya ekleyin: `<slug>.tr.md` ve `<slug>.en.md`.
2. `lang` dışındaki tüm alanlar iki dosyada aynı olmalı.
3. Özet en fazla yaklaşık 250 kelime olmalı ve `sources` alanında kaynak kitaplar listelenmeli.

### PR açmadan önce

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## English

### Ground rules

- Write lore text **in your own words**. Do not paste from books, wikis or other sites.
- Do not copy data, code or visuals from another map. Coordinates are our own approximate estimates.
- Do not add official Games Workshop artwork, logos, fonts or scanned maps.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), in English.
- If you add a dependency, justify it in one line in the PR description.

### Adding a world

The fields are defined in [src/content/schemas.ts](src/content/schemas.ts). See [src/content/worlds/](src/content/worlds/) for examples. If you add a new `classification`, add its translation to `src/i18n/tr.json` and `en.json` too.

1. Add two files under `src/content/worlds/`: `<slug>.tr.md` and `<slug>.en.md`.
2. Every field except `lang` must match in both files.
3. Keep the summary to about 250 words at most, and list source books under `sources`.

### Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
