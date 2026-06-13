# RobuTrace Website

Statische Unternehmenswebsite fuer `robutrace.de`. Sie benoetigt kein CMS und kann bei fast
jedem Static-Hosting-Anbieter veroeffentlicht werden.

## Lokale Vorschau

```powershell
python -m http.server 4174 --bind 127.0.0.1 --directory robutrace-website
```

Danach `http://127.0.0.1:4174/` aufrufen.

## Vor dem Livegang

1. Vollstaendige Angaben in `impressum.html` eintragen und rechtlich pruefen.
2. `datenschutz.html` an den gewaehlten Hosting- und Kontaktanbieter anpassen.
3. Unternehmens-E-Mails `info@robutrace.de` und `sara.hofmann@robutrace.de` testen.
4. LinkedIn-Link testen.
5. Domain-DNS mit dem gewaehlten Hosting verbinden.
6. Website bei Google Search Console und Bing Webmaster Tools anmelden.

## Neue Insights veroeffentlichen

1. Eine bestehende Datei unter `insights/` kopieren und Inhalt, Titel, Description, Canonical URL
   und Datum anpassen.
2. Auf `insights/index.html` eine neue Artikelkarte ergaenzen.
3. Den Beitrag auf der Startseite anzeigen oder die aelteste Karte ersetzen.
4. Die neue URL in `sitemap.xml` aufnehmen und `lastmod` aktualisieren.
5. Nach Veroeffentlichung die URL in der Google Search Console zur Indexierung einreichen.

## SEO-Grundlage

- Eindeutige Seitentitel und Meta-Descriptions
- Canonical URLs
- Semantische Ueberschriftenstruktur
- Strukturierte Organisationsdaten auf der Startseite
- Open-Graph-Vorschaubild
- `robots.txt` und XML-Sitemap
- Cookie-freie Grundversion ohne externe Fonts oder Tracking

SEO ist kein einmaliger Schalter. Sichtbarkeit entsteht aus technischer Qualitaet, klarer
Positionierung, hilfreichen Fachbeitraegen, Verlinkungen und regelmaessiger Pflege.
