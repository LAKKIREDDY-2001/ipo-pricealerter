<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap — IPO Pricealerter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0B0E17;
            color: #E2E8F0;
            margin: 0;
            padding: 30px 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 8px 0;
            color: #FFFFFF;
          }
          p {
            font-size: 14px;
            color: #94A3B8;
            margin: 0;
            line-height: 1.5;
          }
          .meta-pill {
            display: inline-block;
            background: rgba(37, 99, 235, 0.2);
            color: #60A5FA;
            border: 1px solid rgba(59, 130, 246, 0.4);
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #111827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            overflow: hidden;
            font-size: 13px;
          }
          th {
            background: #1E293B;
            color: #F8FAFC;
            text-align: left;
            padding: 12px 16px;
            font-weight: 700;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: #CBD5E1;
          }
          tr:hover td {
            background: rgba(255, 255, 255, 0.02);
          }
          a {
            color: #38BDF8;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .priority-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            background: rgba(16, 185, 129, 0.15);
            color: #34D399;
          }
          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 12px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IPO Pricealerter XML Sitemap</h1>
            <p>This is the official machine-readable XML sitemap consumed by search engines such as Googlebot, Bingbot, and Perplexity.</p>
            <div class="meta-pill">
              Total Indexed URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:attribute>
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <span class="priority-tag">
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <div class="footer">
            Generated for <a href="https://pricealerter.in/">IPO Pricealerter (pricealerter.in)</a> • All Rights Reserved.
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
