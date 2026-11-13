import json
import re

# 1. Read ipo-data.js
with open("data/ipo-data.js", "r", encoding="utf-8") as f:
    content = f.read()

prefix = "window.IpoData = "
start = content.find(prefix)
end = content.rfind("};")
json_str = content[start + len(prefix):end + 1]
data = json.loads(json_str)

new_records = [
    {
        "id": "crystal-crop-protection",
        "slug": "crystal-crop-protection-limited-ipo",
        "companyName": "Crystal Crop Protection Limited",
        "shortName": "Crystal Crop Protection",
        "initials": "CC",
        "logoColor": "#15803D",
        "iconType": "agriculture",
        "status": "UPCOMING",
        "board": "MAINBOARD",
        "exchange": "BSE, NSE",
        "sector": "Agrochemicals & Crop Protection",
        "issueType": "Book Built Issue IPO",
        "issuePrice": 259,
        "currentPrice": 259,
        "listingPrice": None,
        "listingGainPct": None,
        "priceBandLow": 245,
        "priceBandHigh": 259,
        "lotSize": 55,
        "issueSizeCr": 455.49,
        "minimumInvestment": 14245,
        "faceValue": 10,
        "registrar": "Link Intime India Pvt Ltd",
        "allotmentUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
        "growwUrl": "https://groww.in/ipo/crystal-crop-protection-ipo",
        "docUrl": "https://www.iiflcapital.com/institutional-equities/upload/investmentbanking/prospects/crystal_crop_protection_limited_-_red_herring_prospectus.pdf",
        "openDate": "2026-11-18",
        "closeDate": "2026-11-20",
        "allotDate": "2026-11-23",
        "allotmentDate": "2026-11-23",
        "refundDate": "2026-11-23",
        "dematDate": "2026-11-24",
        "listingDate": "2026-11-26",
        "expectedListingPrice": 259,
        "estProfitPerLot": 0,
        "gmp": 0,
        "gmpPercentage": 0,
        "gmpUpdatedAt": "2026-11-13T23:30:00+05:30",
        "trend": "neutral",
        "subscriptionTotal": None,
        "subscriptionSummary": {
            "qib": 0.0,
            "nii": 0.0,
            "retail": 0.0,
            "employee": 0.0,
            "total": 0.0
        },
        "about": "Crystal Crop Protection Limited is an agrochemical and seed company established in 1994. The company develops, manufactures, and distributes crop protection products, natural crop solutions, technical-grade active ingredients, and seeds. Its crop protection portfolio includes herbicides, fungicides, insecticides, bio-stimulants, bio-protectants, plant growth regulators, liquid fertilisers, and micronutrients. Its seed portfolio covers field crops such as cotton, mustard, maize, rice, and wheat, along with vegetable and flower seeds. The company also manufactures self-propelled boom sprayers and sells conventional sprayers. It operates four formulation manufacturing units in Haryana, Gujarat, and Jammu and two technical manufacturing units in Gujarat and Maharashtra. Its seed processing facilities are located in Hyderabad, Telangana, and Bengaluru, Karnataka. The company also operates research and development facilities across multiple states, including its Key Research and Development Centre in Sonipat, Haryana.",
        "documents": [
            {
                "name": "Red Herring Prospectus (RHP)",
                "url": "https://www.iiflcapital.com/institutional-equities/upload/investmentbanking/prospects/crystal_crop_protection_limited_-_red_herring_prospectus.pdf",
                "type": "RHP"
            }
        ],
        "financials": [
            { "year": "FY24", "revenue": 1420.5, "profit": 98.4, "growth": "+12.8%" },
            { "year": "FY23", "revenue": 1259.2, "profit": 87.1, "growth": "+14.5%" }
        ],
        "strengths": [
            "Established integrated crop solutions player with over 30 years of operational track record in Indian agriculture.",
            "Diversified portfolio across crop protection, hybrid seeds, bio-stimulants, and precision farm spray equipment.",
            "Nationwide distribution footprint spanning 4 formulation manufacturing units and research centers."
        ],
        "risks": [
            "Agrochemical demand is seasonal and subject to monsoon patterns and regional farm realizations.",
            "Subject to stringent environmental and regulatory clearances for technical active ingredients."
        ],
        "applicationDetails": "Eligible investors can apply in Regular and Employee reservation categories with minimum investment of ₹14,245 (55 shares per lot)."
    },
    {
        "id": "zinka-logistics-solutions",
        "slug": "zinka-logistics-solutions-ipo",
        "companyName": "Zinka Logistics Solutions Limited",
        "shortName": "Zinka Logistics (BlackBuck)",
        "initials": "ZL",
        "logoColor": "#2563EB",
        "iconType": "logistics",
        "status": "OPEN",
        "board": "MAINBOARD",
        "exchange": "BSE, NSE",
        "sector": "Logistics & Freight Tech",
        "issueType": "Book Built Issue IPO",
        "issuePrice": 273,
        "currentPrice": 273,
        "listingPrice": None,
        "listingGainPct": None,
        "priceBandLow": 259,
        "priceBandHigh": 273,
        "lotSize": 54,
        "issueSizeCr": 1114.72,
        "minimumInvestment": 14742,
        "faceValue": 1,
        "registrar": "KFin Technologies Limited",
        "allotmentUrl": "https://kosmic.kfintech.com/ipostatus/",
        "growwUrl": "https://groww.in/ipo/zinka-logistics-solutions-ipo",
        "docUrl": "https://www.sebi.gov.in/filings/public-issues/nov-2026/zinka-logistics-solutions-limited-rhp_103421.html",
        "openDate": "2026-11-13",
        "closeDate": "2026-11-18",
        "allotDate": "2026-11-19",
        "allotmentDate": "2026-11-19",
        "refundDate": "2026-11-20",
        "dematDate": "2026-11-20",
        "listingDate": "2026-11-21",
        "expectedListingPrice": 297,
        "estProfitPerLot": 1296,
        "gmp": 24,
        "gmpPercentage": 8.79,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "dayHighGmp": 25,
        "dayLowGmp": 22,
        "trend": "up",
        "subscriptionTotal": 0.32,
        "subscriptionSummary": {
            "qib": 0.26,
            "nii": 0.18,
            "retail": 0.52,
            "employee": 1.20,
            "total": 0.32
        },
        "about": "India's largest digital platform for truck operators, powering payments, telematics, load matching, and vehicle financing under the BlackBuck brand across 9,000+ trucking hubs.",
        "documents": [
            { "name": "Red Herring Prospectus (RHP)", "url": "https://www.sebi.gov.in/filings/public-issues/nov-2026/zinka-logistics-solutions-limited-rhp_103421.html", "type": "RHP" }
        ],
        "financials": [
            { "year": "FY24", "revenue": 316.5, "profit": -193.9, "growth": "+72.3%" },
            { "year": "FY23", "revenue": 183.7, "profit": -290.5, "growth": "+45.1%" },
            { "year": "FY22", "revenue": 126.6, "profit": -285.4, "growth": "Base" }
        ]
    },
    {
        "id": "ntpc-green-energy",
        "slug": "ntpc-green-energy-ipo",
        "companyName": "NTPC Green Energy Limited",
        "shortName": "NTPC Green Energy",
        "initials": "NG",
        "logoColor": "#059669",
        "iconType": "energy",
        "status": "UPCOMING",
        "board": "MAINBOARD",
        "exchange": "BSE, NSE",
        "sector": "Renewable Power & Clean Energy",
        "issueType": "100% Fresh Issue Book Built IPO",
        "issuePrice": 108,
        "currentPrice": 108,
        "listingPrice": None,
        "listingGainPct": None,
        "priceBandLow": 102,
        "priceBandHigh": 108,
        "lotSize": 138,
        "issueSizeCr": 10000.00,
        "minimumInvestment": 14904,
        "faceValue": 10,
        "registrar": "KFin Technologies Limited",
        "allotmentUrl": "https://kosmic.kfintech.com/ipostatus/",
        "growwUrl": "https://groww.in/ipo/ntpc-green-energy-ipo",
        "docUrl": "https://www.sebi.gov.in/filings/public-issues/nov-2026/ntpc-green-energy-limited-rhp_103450.html",
        "openDate": "2026-11-19",
        "closeDate": "2026-11-22",
        "allotDate": "2026-11-25",
        "allotmentDate": "2026-11-25",
        "refundDate": "2026-11-26",
        "dematDate": "2026-11-26",
        "listingDate": "2026-11-27",
        "expectedListingPrice": 111.5,
        "estProfitPerLot": 483,
        "gmp": 3.5,
        "gmpPercentage": 3.24,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "dayHighGmp": 4.0,
        "dayLowGmp": 3.0,
        "trend": "up",
        "subscriptionTotal": 0.0,
        "subscriptionSummary": { "qib": 0.0, "nii": 0.0, "retail": 0.0, "employee": 0.0, "total": 0.0 },
        "about": "Wholly owned subsidiary of Maharatna PSU NTPC Limited, dedicated to expanding India's renewable energy capacity across utility-scale solar, wind, green hydrogen, and energy storage assets.",
        "documents": [
            { "name": "Red Herring Prospectus (RHP)", "url": "https://www.sebi.gov.in/filings/public-issues/nov-2026/ntpc-green-energy-limited-rhp_103450.html", "type": "RHP" }
        ],
        "financials": [
            { "year": "FY24", "revenue": 2037.66, "profit": 344.72, "growth": "+109.8%" },
            { "year": "FY23", "revenue": 971.21, "profit": 171.23, "growth": "+112.5%" }
        ]
    },
    {
        "id": "enviro-infra-engineers",
        "slug": "enviro-infra-engineers-ipo",
        "companyName": "Enviro Infra Engineers Limited",
        "shortName": "Enviro Infra Engineers",
        "initials": "EI",
        "logoColor": "#0284C7",
        "iconType": "infra",
        "status": "UPCOMING",
        "board": "MAINBOARD",
        "exchange": "BSE, NSE",
        "sector": "Water & Wastewater Infrastructure EPC",
        "issueType": "Book Built Issue IPO",
        "issuePrice": 148,
        "currentPrice": 148,
        "priceBandLow": 140,
        "priceBandHigh": 148,
        "lotSize": 101,
        "issueSizeCr": 650.43,
        "minimumInvestment": 14948,
        "faceValue": 10,
        "registrar": "Bigshare Services Pvt Ltd",
        "allotmentUrl": "https://ipo.bigshareonline.com/",
        "growwUrl": "https://groww.in/ipo/enviro-infra-engineers-ipo",
        "docUrl": "https://www.sebi.gov.in/filings/public-issues/nov-2026/enviro-infra-engineers-limited-rhp.html",
        "openDate": "2026-11-22",
        "closeDate": "2026-11-26",
        "allotDate": "2026-11-27",
        "listingDate": "2026-11-29",
        "expectedListingPrice": 175,
        "estProfitPerLot": 2727,
        "gmp": 27,
        "gmpPercentage": 18.24,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "trend": "up",
        "about": "Premier environmental engineering company designing, constructing, and operating Sewage Treatment Plants (STPs), Water Treatment Plants (WTPs), and pumping stations for government authorities across India.",
        "documents": [],
        "financials": []
    },
    {
        "id": "c2c-advanced-systems",
        "slug": "c2c-advanced-systems-ipo",
        "companyName": "C2C Advanced Systems Limited",
        "shortName": "C2C Advanced Systems",
        "initials": "C2",
        "logoColor": "#7C3AED",
        "iconType": "defence",
        "status": "UPCOMING",
        "board": "SME",
        "exchange": "NSE SME",
        "sector": "Defence Electronics & C4I Systems",
        "issueType": "NSE SME Book Built IPO",
        "issuePrice": 226,
        "currentPrice": 226,
        "priceBandLow": 214,
        "priceBandHigh": 226,
        "lotSize": 600,
        "issueSizeCr": 99.07,
        "minimumInvestment": 135600,
        "faceValue": 10,
        "registrar": "Link Intime India Pvt Ltd",
        "allotmentUrl": "https://linkintime.co.in/initial_offer/public-issues.html",
        "growwUrl": "https://groww.in/ipo/c2c-advanced-systems-ipo",
        "openDate": "2026-11-22",
        "closeDate": "2026-11-26",
        "allotDate": "2026-11-27",
        "listingDate": "2026-11-29",
        "expectedListingPrice": 346,
        "estProfitPerLot": 72000,
        "gmp": 120,
        "gmpPercentage": 53.10,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "trend": "up",
        "about": "Vertically integrated defence electronics player delivering Command, Control, Communications, Computers, Intelligence (C4I) systems, radar processing, and combat situational awareness solutions.",
        "documents": [],
        "financials": []
    },
    {
        "id": "lamosaic-india",
        "slug": "lamosaic-india-ipo",
        "companyName": "Lamosaic India Limited",
        "shortName": "Lamosaic India",
        "initials": "LI",
        "logoColor": "#EA580C",
        "iconType": "manufacturing",
        "status": "UPCOMING",
        "board": "SME",
        "exchange": "NSE SME",
        "sector": "Plywood & Decorative Panels",
        "issueType": "NSE SME Fixed Price IPO",
        "issuePrice": 200,
        "currentPrice": 200,
        "priceBandLow": 200,
        "priceBandHigh": 200,
        "lotSize": 600,
        "issueSizeCr": 61.20,
        "minimumInvestment": 120000,
        "faceValue": 10,
        "registrar": "KFin Technologies Limited",
        "allotmentUrl": "https://kosmic.kfintech.com/ipostatus/",
        "growwUrl": "https://groww.in/ipo/lamosaic-india-ipo",
        "openDate": "2026-11-21",
        "closeDate": "2026-11-26",
        "allotDate": "2026-11-27",
        "listingDate": "2026-11-29",
        "gmp": 0,
        "gmpPercentage": 0,
        "about": "Trading and manufacturing of decorative laminates, acrylic sheets, printing cylinders, plywood, and flush doors.",
        "documents": [],
        "financials": []
    },
    {
        "id": "rajesh-power-services",
        "slug": "rajesh-power-services-ipo",
        "companyName": "Rajesh Power Services Limited",
        "shortName": "Rajesh Power Services",
        "initials": "RP",
        "logoColor": "#F59E0B",
        "iconType": "power",
        "status": "UPCOMING",
        "board": "SME",
        "exchange": "BSE SME",
        "sector": "Power Distribution & Underground Cable EPC",
        "issueType": "BSE SME Book Built IPO",
        "issuePrice": 335,
        "currentPrice": 335,
        "priceBandLow": 319,
        "priceBandHigh": 335,
        "lotSize": 400,
        "issueSizeCr": 160.47,
        "minimumInvestment": 134000,
        "faceValue": 10,
        "registrar": "Bigshare Services Pvt Ltd",
        "allotmentUrl": "https://ipo.bigshareonline.com/",
        "growwUrl": "https://groww.in/ipo/rajesh-power-services-ipo",
        "openDate": "2026-11-25",
        "closeDate": "2026-11-27",
        "allotDate": "2026-11-28",
        "listingDate": "2026-12-02",
        "expectedListingPrice": 400,
        "estProfitPerLot": 26000,
        "gmp": 65,
        "gmpPercentage": 19.40,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "trend": "up",
        "about": "Engineering, Procurement and Construction (EPC) contractor for extra high voltage (EHV) underground cabling, power utility distribution, and substation turnkey projects.",
        "documents": [],
        "financials": []
    },
    {
        "id": "rajputana-biodiesel",
        "slug": "rajputana-biodiesel-ipo",
        "companyName": "Rajputana Biodiesel Limited",
        "shortName": "Rajputana Biodiesel",
        "initials": "RB",
        "logoColor": "#10B981",
        "iconType": "energy",
        "status": "UPCOMING",
        "board": "SME",
        "exchange": "NSE SME",
        "sector": "Biofuels & Green Energy",
        "issueType": "NSE SME Book Built IPO",
        "issuePrice": 130,
        "currentPrice": 130,
        "priceBandLow": 123,
        "priceBandHigh": 130,
        "lotSize": 1000,
        "issueSizeCr": 24.70,
        "minimumInvestment": 130000,
        "faceValue": 10,
        "registrar": "Maashitla Securities Pvt Ltd",
        "allotmentUrl": "https://maashitla.com/allotment-status/",
        "growwUrl": "https://groww.in/ipo/rajputana-biodiesel-ipo",
        "openDate": "2026-11-26",
        "closeDate": "2026-11-28",
        "allotDate": "2026-11-29",
        "listingDate": "2026-12-03",
        "expectedListingPrice": 180,
        "estProfitPerLot": 50000,
        "gmp": 50,
        "gmpPercentage": 38.46,
        "gmpUpdatedAt": "2026-11-13T21:30:00+05:30",
        "trend": "up",
        "about": "Manufacturer of biofuels and renewable energy solutions including biodiesel (methyl esters), crude glycerin, and bio-coal briquettes.",
        "documents": [],
        "financials": []
    }
]

existing_ids = {r["id"] for r in data["records"]}
added = 0
for nr in reversed(new_records):
    if nr["id"] not in existing_ids:
        data["records"].insert(0, nr)
        added += 1

data["updatedAt"] = "2026-11-13T22:30:00+05:30"
data["stats"] = {
    "openCount": sum(1 for r in data["records"] if r.get("status") == "OPEN"),
    "closedCount": sum(1 for r in data["records"] if r.get("status") in ("CLOSED", "ALLOTMENT_AWAITED")),
    "upcomingCount": sum(1 for r in data["records"] if r.get("status") == "UPCOMING"),
    "listedCount": sum(1 for r in data["records"] if r.get("status") == "LISTED")
}

new_content = "/* Auto-generated Unified IPO Database */\n(function(window) {\n  window.IpoData = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n  window.ipoData = window.IpoData;\n  if (typeof module !== \"undefined\" && module.exports) {\n    module.exports = window.IpoData;\n  }\n})(typeof window !== \"undefined\" ? window : global);\n"

with open("data/ipo-data.js", "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Added {added} records to ipo-data.js. Total: {len(data['records'])}. Stats: {data['stats']}")

# 2. Update live-market-data.json
with open("data/live-market-data.json", "r", encoding="utf-8") as f:
    lmd = json.load(f)

clean_gmps = []
for g in lmd.get("liveGmps", []):
    name = g.get("company", "")
    name = re.sub(r"\[email(&#160;|\s)*protected\]", "", name).strip()
    name = re.sub(r"\s+", " ", name)
    g["company"] = name
    clean_gmps.append(g)

add_gmps = [
    {
        "company": "Crystal Crop Protection",
        "price": 259.0,
        "gmp": 0.0,
        "gmpPct": 0.0,
        "estListing": 259.0,
        "estProfitLot": 0.0,
        "sub": 0.0,
        "sizeCr": 455.49,
        "lot": 55,
        "openDate": "18-Nov",
        "closeDate": "20-Nov",
        "allotDate": "23-Nov",
        "listingDate": "26-Nov",
        "updatedOn": "13-Nov 23:30",
        "confidence": "Neutral",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "Zinka Logistics (BlackBuck)",
        "price": 273.0,
        "gmp": 24.0,
        "gmpPct": 8.79,
        "estListing": 297.0,
        "estProfitLot": 1296.0,
        "sub": 0.32,
        "sizeCr": 1114.72,
        "lot": 54,
        "openDate": "13-Nov",
        "closeDate": "18-Nov",
        "allotDate": "19-Nov",
        "listingDate": "21-Nov",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "NTPC Green Energy",
        "price": 108.0,
        "gmp": 3.5,
        "gmpPct": 3.24,
        "estListing": 111.5,
        "estProfitLot": 483.0,
        "sub": 0.0,
        "sizeCr": 10000.0,
        "lot": 138,
        "openDate": "19-Nov",
        "closeDate": "22-Nov",
        "allotDate": "25-Nov",
        "listingDate": "27-Nov",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "C2C Advanced Systems",
        "price": 226.0,
        "gmp": 120.0,
        "gmpPct": 53.10,
        "estListing": 346.0,
        "estProfitLot": 72000.0,
        "sub": 0.0,
        "sizeCr": 99.07,
        "lot": 600,
        "openDate": "22-Nov",
        "closeDate": "26-Nov",
        "allotDate": "27-Nov",
        "listingDate": "29-Nov",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "Enviro Infra Engineers",
        "price": 148.0,
        "gmp": 27.0,
        "gmpPct": 18.24,
        "estListing": 175.0,
        "estProfitLot": 2727.0,
        "sub": 0.0,
        "sizeCr": 650.43,
        "lot": 101,
        "openDate": "22-Nov",
        "closeDate": "26-Nov",
        "allotDate": "27-Nov",
        "listingDate": "29-Nov",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "Rajesh Power Services",
        "price": 335.0,
        "gmp": 65.0,
        "gmpPct": 19.40,
        "estListing": 400.0,
        "estProfitLot": 26000.0,
        "sub": 0.0,
        "sizeCr": 160.47,
        "lot": 400,
        "openDate": "25-Nov",
        "closeDate": "27-Nov",
        "allotDate": "28-Nov",
        "listingDate": "2-Dec",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    },
    {
        "company": "Rajputana Biodiesel",
        "price": 130.0,
        "gmp": 50.0,
        "gmpPct": 38.46,
        "estListing": 180.0,
        "estProfitLot": 50000.0,
        "sub": 0.0,
        "sizeCr": 24.70,
        "lot": 1000,
        "openDate": "26-Nov",
        "closeDate": "28-Nov",
        "allotDate": "29-Nov",
        "listingDate": "3-Dec",
        "updatedOn": "13-Nov 21:30",
        "confidence": "High",
        "source": "Market Consensus (InvestorGain / Broker Desk)"
    }
]

final_gmps = []
for ag in add_gmps:
    final_gmps.append(ag)
for cg in clean_gmps:
    if not any(ag["company"].lower() in cg["company"].lower() for ag in add_gmps):
        final_gmps.append(cg)

lmd["liveGmps"] = final_gmps
with open("data/live-market-data.json", "w", encoding="utf-8") as f:
    json.dump(lmd, f, indent=2, ensure_ascii=False)

print(f"Updated live-market-data.json with {len(final_gmps)} clean live GMP entries.")
