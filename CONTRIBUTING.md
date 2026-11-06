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

Veri şeması Phase 1 ile tamamlanacak. Taslak şema [CLAUDE.md](CLAUDE.md) dosyasının 4. bölümünde.

1. `src/content/worlds/` altına iki dosya ekleyin: `<slug>.tr.md` ve `<slug>.en.md`.
2. `position` ve `eras` alanları iki dosyada aynı olmalı.
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

The data schema lands in Phase 1. The draft is in section 4 of [CLAUDE.md](CLAUDE.md).

1. Add two files under `src/content/worlds/`: `<slug>.tr.md` and `<slug>.en.md`.
2. `position` and `eras` must match in both files.
3. Keep the summary to about 250 words at most, and list source books under `sources`.

### Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
