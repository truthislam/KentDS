'use strict';
const fs = require('fs');

const pContact = 'C:/Users/slave/OneDrive/Desktop/DDS_Kent_SaaS/src/app/contact/page.tsx';
let dataContact = fs.readFileSync(pContact, 'utf8');
dataContact = dataContact.replace('Our Seattle Branch', 'Our Kent Branch');
dataContact = dataContact.replace('8816 Renton Ave S,\nKent, WA 98118', '23231 Pacific Hwy S,\nKent, WA 98032');
const iframeOld = 'src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2693.739433159503!2d-122.27706332367728!3d47.5357879711828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549041e23351c555%3A0x8232a223f85ed2a8!2s8816%20Renton%20Ave%20S%2C%20Seattle%2C%20WA%2098118!5e0!3m2!1sen!2sus!4v1727325039050!5m2!1sen!2sus"';
const iframeNew = 'src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2694.757041530669!2d-122.30232238437021!3d47.39707257917088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54905ea5d09f7a41%3A0xfa9ab3fa132d7ab!2s23231%20Pacific%20Hwy%20S%2C%20Kent%2C%20WA%2098032!5e0!3m2!1sen!2sus!4v1689625372951!5m2!1sen!2sus"';
dataContact = dataContact.replace(iframeOld, iframeNew);
dataContact = dataContact.replace('https://www.google.com/maps/dir/?api=1&destination=8816+Renton+Ave+S+Seattle+WA+98118', 'https://www.google.com/maps/dir/?api=1&destination=23231+Pacific+Hwy+S+Kent+WA+98032');
fs.writeFileSync(pContact, dataContact, 'utf8');

const pFooter = 'C:/Users/slave/OneDrive/Desktop/DDS_Kent_SaaS/src/components/Footer.tsx';
let dataFooter = fs.readFileSync(pFooter, 'utf8');
const searchFooter = `const locations = [
  {
    name: "Seattle",
    address: "8816 Renton Ave S",
    city: "Kent, WA 98118",
    phone: "206-551-9748",
    tel: "+12065519748",
  },
  {
    name: "Kent",
    address: "23231 Pacific Hwy S",
    city: "Kent, WA 98032",
    phone: "206-551-9748",
    tel: "+12065519748",
  },
];`;
const replaceFooter = `const locations = [
  {
    name: "Kent",
    address: "23231 Pacific Hwy S",
    city: "Kent, WA 98032",
    phone: "206-551-9748",
    tel: "+12065519748",
  },
  {
    name: "Seattle",
    address: "8816 Renton Ave S",
    city: "Seattle, WA 98118",
    phone: "206-851-6647",
    tel: "+12068516647",
  },
];`;
dataFooter = dataFooter.replace(searchFooter, replaceFooter);
fs.writeFileSync(pFooter, dataFooter, 'utf8');
console.log("Replaced footer and contact correctly.");
