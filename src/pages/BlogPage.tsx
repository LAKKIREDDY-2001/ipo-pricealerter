import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import type { BlogArticle } from '../types/financial';
import { formatDateIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { AdSlot } from '../components/ads/AdSlot';
import {
  Breadcrumbs,
  DisclaimerBanner,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/common/StateViews';

export function BlogPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [related, setRelated] = useState<BlogArticle[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (slug) {
        const res = await api.getBlogBySlug(slug);
        setArticle(res.article);
        setRelated(res.related);
      } else {
        const res = await api.getBlogs();
        setArticles(res.articles);
        setArticle(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load educational guides.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        <ErrorRetryState message={error} onRetry={loadData} />
      </main>
    );
  }

  if (slug && article) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <SEOHead
          title={article.seoTitle}
          description={article.metaDescription}
          canonicalPath={`/blog/${article.slug}`}
        />
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Investor Education', to: '/blog' },
            { label: article.category },
          ]}
        />

        <article className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400">
              {article.category} · By {article.author} · Published {formatDateIN(article.publishedAt)} · Updated {formatDateIN(article.updatedAt)} · {article.readMinutes} min read
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white mt-2">
              {article.title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#64748B] dark:text-slate-300 leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          {/* Table of Contents */}
          <nav
            aria-label="Table of Contents"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 p-4"
          >
            <div className="text-xs font-semibold text-[#152338] dark:text-white mb-2">
              In This Guide
            </div>
            <ul className="space-y-1 text-xs">
              {article.toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-[#2563EB] dark:text-blue-400 hover:underline">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <div className="space-y-6">
            {article.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="space-y-2.5 scroll-mt-24">
                <h2 className="font-display text-lg font-bold text-[#14263F] dark:text-white">
                  {sec.heading}
                </h2>
                {sec.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-sm text-[#152338]/90 dark:text-slate-300 leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
                {sec.bullets && (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm text-[#152338]/90 dark:text-slate-300">
                    {sec.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Official References */}
          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Official References
            </h3>
            <div className="flex flex-wrap gap-3 text-xs">
              {article.officialReferences.map((ref) => (
                <a
                  key={ref.label}
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-medium"
                >
                  {ref.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>

          <DisclaimerBanner
            title="Educational Disclaimer"
            text="This article is published for investor literacy and informational clarity. It does not constitute SEBI-registered investment advice or a solicitation to buy or sell any security."
          />

          <AdSlot slotId="blog-article-bottom" format="horizontal" />
        </article>

        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#14263F] dark:text-white">
              Related Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-4 hover:border-[#2563EB]/60"
                >
                  <div className="text-[11px] text-[#64748B]">{r.category}</div>
                  <div className="text-sm font-semibold text-[#152338] dark:text-white mt-1">
                    {r.title}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Education Library
        </Link>
      </main>
    );
  }

  const categories = ['All', ...Array.from(new Set(articles.map((a) => a.category)))];
  const visible =
    category === 'All' ? articles : articles.filter((a) => a.category === category);

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="Investor Education Library – IPO, GMP, Ratios & Stock Market Guides"
        description="Original Indian investor education articles covering IPO applications, ASBA/UPI, allotment rules, GMP limitations, financial ratios, and risk management."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Investor Education' }]} />

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
          Investor Education &amp; Financial Literacy
        </h1>
        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
          In-depth, reference-backed educational guides on Indian primary markets and equity analysis.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
              category === cat
                ? 'bg-[#14263F] text-white border-[#14263F] dark:bg-[#2563EB] dark:border-[#2563EB]'
                : 'bg-white dark:bg-[#111C2E] text-[#64748B] border-[#E2E8F0] dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((a) => (
          <Link
            key={a.id}
            to={`/blog/${a.slug}`}
            className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-5 hover:border-[#2563EB]/60 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                {a.category} · {a.readMinutes} min read · Updated {formatDateIN(a.updatedAt)}
              </div>
              <h2 className="mt-1.5 text-base font-bold text-[#152338] dark:text-white leading-snug">
                {a.title}
              </h2>
              <p className="mt-2 text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
                {a.excerpt}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
              <BookOpen className="w-3.5 h-3.5" /> Read Full Guide
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
