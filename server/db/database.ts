import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type {
  AdminAuditLog,
  AuthUser,
  BlogArticle,
  DataSourceStatus,
  IPOOffering,
  MarketIndexInstrument,
  MarketInsight,
  NotificationItem,
  PriceAlertRule,
  StockInstrument,
  WatchlistEntry,
} from '../../src/types/financial.ts';
import {
  SEED_BLOG_ARTICLES,
  SEED_DATA_SOURCES,
  SEED_INDICES,
  SEED_INSIGHTS,
  SEED_IPOS,
  SEED_STOCKS,
} from '../data/seedData.ts';

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface DataImportLog {
  id: string;
  actorEmail: string;
  timestamp: string;
  importType: string;
  recordsProcessed: number;
  status: 'SUCCESS' | 'FAILED';
  notes: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  topic: 'Data Correction' | 'IPO Verification' | 'Privacy & Cookie Request' | 'Advertising' | 'General';
  message: string;
  createdAt: string;
  status: 'RECEIVED' | 'REVIEWED';
}

export interface DatabaseSchema {
  indices: MarketIndexInstrument[];
  ipos: IPOOffering[];
  stocks: StockInstrument[];
  insights: MarketInsight[];
  blogs: BlogArticle[];
  users: StoredUser[];
  watchlists: WatchlistEntry[];
  priceAlerts: PriceAlertRule[];
  notifications: NotificationItem[];
  auditLogs: AdminAuditLog[];
  dataSources: DataSourceStatus[];
  importLogs: DataImportLog[];
  contactMessages: ContactSubmission[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let dbCache: DatabaseSchema | null = null;

function createInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  const investorId = 'usr-investor-demo';
  const adminId = 'usr-admin-root';

  const adminEmail =
    (process.env.ADMIN_EMAIL || 'admin@pricealerter.in').trim().toLowerCase() ||
    'admin@pricealerter.in';
  const adminPassword =
    process.env.ADMIN_PASSWORD?.trim() || crypto.randomBytes(18).toString('base64url');
  const investorPassword =
    process.env.DEMO_INVESTOR_PASSWORD?.trim() || crypto.randomBytes(16).toString('base64url');

  const users: StoredUser[] = [
    {
      id: investorId,
      name: 'Aarav Mehta',
      email: 'investor@pricealerter.in',
      role: 'user',
      emailVerified: true,
      createdAt: now,
      passwordHash: bcrypt.hashSync(investorPassword, 10),
      preferences: {
        emailAlerts: true,
        browserNotifications: false,
        ipoReminders: true,
        gmpAlerts: true,
      },
    },
    {
      id: adminId,
      name: 'PriceAlerter Compliance Admin',
      email: adminEmail,
      role: 'admin',
      emailVerified: true,
      createdAt: now,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      preferences: {
        emailAlerts: true,
        browserNotifications: true,
        ipoReminders: true,
        gmpAlerts: true,
      },
    },
  ];

  const watchlists: WatchlistEntry[] = [
    {
      id: 'wl-1',
      userId: investorId,
      itemType: 'ipo',
      itemKey: 'crystal-crop-protection-ipo',
      label: 'Crystal Crop Protection Ltd',
      createdAt: now,
    },
    {
      id: 'wl-2',
      userId: investorId,
      itemType: 'stock',
      itemKey: 'RELIANCE',
      label: 'Reliance Industries Ltd',
      createdAt: now,
    },
    {
      id: 'wl-3',
      userId: investorId,
      itemType: 'stock',
      itemKey: 'TCS',
      label: 'Tata Consultancy Services Ltd',
      createdAt: now,
    },
  ];

  const priceAlerts: PriceAlertRule[] = [
    {
      id: 'alrt-1',
      userId: investorId,
      symbol: 'TATAMOTORS',
      companyName: 'Tata Motors Ltd',
      conditionType: 'PRICE_BELOW',
      targetValue: 820,
      baselinePrice: 842.15,
      enabled: true,
      status: 'ACTIVE',
      triggeredAt: null,
      triggeredPrice: null,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          timestamp: now,
          event: 'Alert created: Notify when price falls below ₹820.00',
          priceAtEvent: 842.15,
        },
      ],
    },
    {
      id: 'alrt-2',
      userId: investorId,
      symbol: 'RELIANCE',
      companyName: 'Reliance Industries Ltd',
      conditionType: 'PRICE_ABOVE',
      targetValue: 1325,
      baselinePrice: 1284.5,
      enabled: true,
      status: 'ACTIVE',
      triggeredAt: null,
      triggeredPrice: null,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          timestamp: now,
          event: 'Alert created: Notify when price rises above ₹1,325.00',
          priceAtEvent: 1284.5,
        },
      ],
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: investorId,
      category: 'IPO_REMINDER',
      title: 'Crystal Crop Protection IPO Opening 18 Nov',
      message: 'Mainboard issue (₹455.71 Cr · Band ₹259–₹272) opens on 18 Nov 2026.',
      link: '/ipo/crystal-crop-protection-ipo',
      read: false,
      createdAt: now,
    },
    {
      id: 'notif-2',
      userId: investorId,
      category: 'GMP_CHANGE',
      title: 'Antala Industries Listed on BSE SME',
      message: 'Stock listed at ₹52.80 against ₹66.00 issue price (-20.00%).',
      link: '/ipo/antala-industries-ipo',
      read: false,
      createdAt: now,
    },
  ];

  const auditLogs: AdminAuditLog[] = [
    {
      id: 'aud-1',
      actorEmail: 'admin@pricealerter.in',
      actorRole: 'admin',
      timestamp: now,
      entityType: 'IPO',
      entityId: 'crystal-crop-protection-ipo',
      action: 'VERIFY_OFFER_DOCUMENTS',
      previousValue: 'DRHP',
      newValue: 'Verified RHP & Price Band',
      source: 'SEBI / Groww RHP Filing',
      verificationStatus: 'Verified',
    },
  ];

  return {
    indices: structuredClone(SEED_INDICES),
    ipos: structuredClone(SEED_IPOS),
    stocks: structuredClone(SEED_STOCKS),
    insights: structuredClone(SEED_INSIGHTS),
    blogs: structuredClone(SEED_BLOG_ARTICLES),
    users,
    watchlists,
    priceAlerts,
    notifications,
    auditLogs,
    dataSources: structuredClone(SEED_DATA_SOURCES),
    importLogs: [],
    contactMessages: [],
  };
}

export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(raw) as DatabaseSchema;
      let dirty = false;
      if (!Array.isArray(dbCache.contactMessages)) {
        dbCache.contactMessages = [];
        dirty = true;
      }
      for (const seededBlog of SEED_BLOG_ARTICLES) {
        if (!dbCache.blogs.some((b) => b.slug === seededBlog.slug)) {
          dbCache.blogs.push(structuredClone(seededBlog));
          dirty = true;
        }
      }
      const envAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const envAdminPassword = process.env.ADMIN_PASSWORD?.trim();
      const adminUser = dbCache.users.find((u) => u.id === 'usr-admin-root');
      if (adminUser && (envAdminEmail || envAdminPassword)) {
        if (envAdminEmail && adminUser.email !== envAdminEmail) {
          adminUser.email = envAdminEmail;
          dirty = true;
        }
        if (envAdminPassword && !bcrypt.compareSync(envAdminPassword, adminUser.passwordHash)) {
          adminUser.passwordHash = bcrypt.hashSync(envAdminPassword, 10);
          dirty = true;
        }
      }
      if (dirty) saveDb();
      return dbCache;
    } catch {
      // Rebuild clean store if file is unreadable
    }
  }
  dbCache = createInitialDatabase();
  saveDb();
  return dbCache;
}

export function saveDb(): void {
  if (!dbCache) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dbCache, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function sanitizeUser(user: StoredUser): AuthUser {
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function appendAuditLog(entry: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
  const db = getDb();
  const fullEntry: AdminAuditLog = {
    ...entry,
    id: createId('aud'),
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(fullEntry);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  saveDb();
  return fullEntry;
}
