'use strict';
const fs = require('fs');
const path = require('path');
const basePath = 'C:/Users/slave/OneDrive/Desktop/DDS_Kent_SaaS';

const fileMapping = [
  'functions/email-templates.js', 'functions/index.js', 'scripts/seed-firestore.ts',
  'src/app/about/page.tsx', 'src/app/admin/page.tsx', 'src/app/blog/page.tsx',
  'src/app/contact/page.tsx', 'src/app/dashboard/page.tsx', 'src/app/layout.tsx',
  'src/app/page.tsx', 'src/app/services/layout.tsx', 'src/app/services/page.tsx',
  'src/components/BookingPortal.tsx', 'src/components/EnrollmentModal.tsx',
  'src/components/Footer.tsx', 'src/components/ServiceTabs.tsx',
  'src/contexts/AuthContext.tsx', 'src/hooks/usePackages.ts',
  'src/app/globals.css', 'src/lib/clover-payment-links.ts'
];

const exactReplacements = [
  ['const appId = "seattle"', 'const appId = "kent"'],
  ['const APP_ID = "seattle"', 'const APP_ID = "kent"'],
  ['artifacts/seattle/', 'artifacts/kent/'],
  ['Discount Driving School - Seattle', 'Discount Driving School - Kent'],
  ['Seattle Discount Driving School', 'Kent Discount Driving School'],
  ['seattle@discountdrivingschool.net', 'kentdiscountdriving@gmail.com'],
  ['info@discountdrivingschool.net', 'kentdiscountdriving@gmail.com'],
  ['8816 Renton Ave S, Seattle, WA 98118', '23231 Pacific Hwy S, Kent, WA 98032'],
  ['(206) 851-6647', '(206) 551-9748'],
  ['206-851-6647', '206-551-9748'],
  ['+12068516647', '+12065519748'],
  ['discountdrivingschool.net', 'kentdiscountdrivingschool.com'],
  ['Teen Driving (Seattle, WA)', 'Teen Driving (Kent, WA)'],
  ['navy', 'forest'],
  ['amber', 'gold'],
  ['#1e3a5f', '#14532d'],
  ['#f59e0b', '#ca8a04'],
  ['#0f172a', '#052e16'],
  ['#1e293b', '#14532d'],
  ['#2563eb', '#16a34a'],
  ['#eff6ff', '#f0fdf4'],
  ['#d97706', '#a16207'],
  ['#fbbf24', '#facc15'],
  ['#fffbeb', '#fefce8'],
  ["'seattle'", "'kent'"],
  ['"seattle"', '"kent"'],
  ['seattle', 'kent'],
  ['seattle/packages', 'kent/packages'],
  ['locations/seattle', 'locations/kent'],
  ['seattle-students', 'kent-students'],
  ['seattle-bookings', 'kent-bookings']
];

const regexReplacements = [
  [/Seattle's top-rated DOL testing center/gi, "Kent's top-rated DOL testing center"],
  [/Seattle community/gi, 'Kent community'],
  [/Seattle drivers/gi, 'Kent drivers'],
  [/Seattle's roads/gi, "Kent's roads"],
  [/Seattle DOL/gi, 'Kent DOL'],
  [/in Seattle/gi, 'in Kent'],
  [/Seattle, WA/gi, 'Kent, WA'],
  [/I-5 S-curves/gi, 'SR-167'],
  [/Jefferson Park/gi, 'Green River Trail area'],
  [/Seward Park/gi, 'Kent Station area']
];

for (const rel of fileMapping) {
  const p = path.join(basePath, rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, "utf8");
    for (const [search, replace] of exactReplacements) {
      content = content.replaceAll(search, replace);
    }
    for (const [search, replace] of regexReplacements) {
      content = content.replace(search, replace);
    }
    content = content.replace(/Seattle Discount(?=\s|$|<)/g, 'Kent Discount');
    fs.writeFileSync(p, content, "utf8");
    console.log("Updated: " + rel);
  } else {
    console.log("Missing: " + rel);
  }
}
