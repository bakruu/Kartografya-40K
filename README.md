# Kartografya 40K

> Çalışma adı, kesinleşmedi. / Working name, not final.

[Türkçe](#türkçe) · [English](#english)

## Türkçe

Warhammer 40,000 galaksisinin açık kaynaklı, hayran yapımı, interaktif 3B haritası. Önce Türkçe, sonra İngilizce.

**Durum:** Erken aşama. Şu an yalnızca proje iskeleti var; harita henüz yok. Yol haritası için [CLAUDE.md](CLAUDE.md) dosyasının 10. bölümüne bakın.

### Hedefler

- Eski bir Android telefonda da oyun bilgisayarında da akıcı çalışmak; hiçbir şey hareket etmiyorsa hiçbir şey çizmemek
- Her dünya için arama motorlarına uygun, iki dilli statik sayfa
- M41 (Great Rift öncesi) ve M42 (Indomitus) arasında çağ geçişi
- Rotalar, etiketler, Great Rift ve Segmentum sınırları için katmanlar
- İçerik üreticileri için 9:16 ekran görüntüsü dışa aktarımı

### Geliştirme

Node.js 22.23.4 veya üstü ve [Corepack](https://nodejs.org/api/corepack.html) gerekir.

```bash
corepack enable
pnpm install
pnpm dev
```

| Komut            | Açıklama                                                                        |
| ---------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`       | Yerel geliştirme sunucusu                                                       |
| `pnpm build`     | `dist/` klasörüne statik derleme                                                |
| `pnpm preview`   | Derlemeyi yerelde önizleme                                                      |
| `pnpm lint`      | Biome denetimi                                                                  |
| `pnpm typecheck` | `astro check` ve `tsc --noEmit`                                                 |
| `pnpm test`      | Vitest birim testleri                                                           |
| `pnpm test:e2e`  | Playwright duman testleri (ilk seferde `pnpm exec playwright install`) |

Katkıda bulunmak için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını okuyun.

### Lisans

Kod [MIT](LICENSE), bize ait metin ve görseller [CC BY-SA 4.0](LICENSE-CONTENT.md) lisanslıdır.

### Yasal uyarı

Resmî olmayan, hayranlar tarafından yapılmış bir projedir. Games Workshop ile bağlantılı değildir ve Games Workshop tarafından onaylanmamıştır. Warhammer 40,000 ile ilişkili tüm isimler, ırklar, konumlar ve markalar © Games Workshop Ltd. İzinsiz kullanılmıştır, statülerine itiraz amacı taşımaz. Konumlar yaklaşık, hayran tahminleridir.

## English

An open-source, fan-made, interactive 3D map of the Warhammer 40,000 galaxy. Turkish first, English second.

**Status:** Early days. Only the project scaffold exists so far; there is no map yet. See section 10 of [CLAUDE.md](CLAUDE.md) for the roadmap.

### Goals

- Run smoothly from an old Android phone to a gaming PC, and render nothing when nothing moves
- A static, SEO-friendly page in both languages for every world
- Era switch between M41 (pre-Rift) and M42 (Indomitus)
- Layers for routes, labels, the Great Rift and Segmentum borders
- 9:16 screenshot export for content creators

### Development

Requires Node.js 22.23.4 or newer and [Corepack](https://nodejs.org/api/corepack.html).

```bash
corepack enable
pnpm install
pnpm dev
```

| Command          | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `pnpm dev`       | Local dev server                                                            |
| `pnpm build`     | Static build to `dist/`                                                     |
| `pnpm preview`   | Preview the build locally                                                   |
| `pnpm lint`      | Biome check                                                                 |
| `pnpm typecheck` | `astro check` and `tsc --noEmit`                                            |
| `pnpm test`      | Vitest unit tests                                                           |
| `pnpm test:e2e`  | Playwright smoke tests (first run: `pnpm exec playwright install`) |

See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute.

### License

Code is [MIT](LICENSE). Our original texts and visuals are [CC BY-SA 4.0](LICENSE-CONTENT.md).

### Legal

Unofficial fan-made project. Not affiliated with or endorsed by Games Workshop. Warhammer 40,000 and all associated names, races, locations and marks are © Games Workshop Ltd. Used without permission, no challenge to their status intended. Positions are approximate fan estimates.
