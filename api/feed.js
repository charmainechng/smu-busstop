// RSS 2.0 Feed Generator for Zapier and Monitoring
import { fetchAllBoardStops } from './bus.js';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getSingaporeQuarterHourTime(now = new Date()) {
  // SGT is UTC+8
  const utcMillis = now.getTime();
  const sgtMillis = utcMillis + 8 * 3600 * 1000;
  const sgtDate = new Date(sgtMillis);

  const year = sgtDate.getUTCFullYear();
  const month = sgtDate.getUTCMonth(); // 0-11
  const date = sgtDate.getUTCDate();
  const day = sgtDate.getUTCDay(); // 0-6
  const hours = sgtDate.getUTCHours();
  const minutes = sgtDate.getUTCMinutes();
  const seconds = sgtDate.getUTCSeconds();

  const roundedMinutes = Math.floor(minutes / 15) * 15;

  const pad = (n) => String(n).padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ISO string with rounded quarter hour: YYYY-MM-DDTHH:mm+08:00
  const quarterIso = `${year}-${pad(month + 1)}-${pad(date)}T${pad(hours)}:${pad(roundedMinutes)}+08:00`;

  // GUID: g7-board-2026-11-11T14:15+08:00
  const guid = `g7-board-${quarterIso}`;

  // RFC 822 for rounded quarter hour: Wed, 11 Nov 2026 14:15:00 +0800
  const pubDate = `${days[day]}, ${pad(date)} ${months[month]} ${year} ${pad(hours)}:${pad(roundedMinutes)}:00 +0800`;

  // RFC 822 for current reading time: Wed, 11 Nov 2026 14:23:45 +0800
  const lastBuildDate = `${days[day]}, ${pad(date)} ${months[month]} ${year} ${pad(hours)}:${pad(minutes)}:${pad(seconds)} +0800`;

  // Plain text timestamp for description
  const readingTimeText = `${pad(date)} ${months[month]} ${year} ${pad(hours)}:${pad(minutes)}:${pad(seconds)} SGT (UTC+8)`;

  return {
    quarterIso,
    guid,
    pubDate,
    lastBuildDate,
    readingTimeText,
  };
}

export default async function feedHandler(req, res) {
  // Set headers
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') return res.status(200).end();
    res.writeHead(200);
    return res.end();
  }

  // 1. Determine site link from Host header without fetching self
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const siteUrl = `${proto}://${host}`;

  // 2. Compute Singapore timestamps
  const now = new Date();
  const timeInfo = getSingaporeQuarterHourTime(now);

  // 3. Fetch board readings reusing shared bus module
  const { stops, sourceError } = await fetchAllBoardStops();

  // 4. Construct Item Title:
  // "every stop on the board with its soonest bus, for example: 04121 bus 7 in 2 min; then the next stop the same way"
  const stopSummaryParts = stops.map((stop) => {
    if (!stop.services || stop.services.length === 0) {
      return `${stop.stopCode} no services`;
    }

    // Find soonest bus at this stop
    let soonest = stop.services[0];
    for (const s of stop.services) {
      if (s.next1Mins < soonest.next1Mins) {
        soonest = s;
      }
    }
    return `${stop.stopCode} bus ${soonest.serviceNo} in ${soonest.next1Mins} min`;
  });

  const baseTitle = stopSummaryParts.join('; ');

  // Requirement 6: If a source fails or a key is missing, title starts with "Check failed: <source> HTTP <status>"
  let itemTitle = baseTitle;
  if (sourceError && !sourceError.ok) {
    const errorPrefix = `Check failed: ${sourceError.source} HTTP ${sourceError.status}`;
    itemTitle = `${errorPrefix}; ${baseTitle}`;
  }

  // 5. Construct Item Description (plain text only, no HTML):
  // "For each stop on the board, the services there with their next two buses in minutes, then the time of the reading in Singapore time."
  const descriptionLines = [];
  stops.forEach((stop) => {
    descriptionLines.push(`Stop ${stop.stopCode} (${stop.stopName}):`);
    if (!stop.services || stop.services.length === 0) {
      descriptionLines.push('  No active services reported');
    } else {
      stop.services.forEach((s) => {
        let busesText = `${s.next1Mins} min`;
        if (s.next2Mins !== undefined && s.next2Mins !== null) {
          busesText += `, ${s.next2Mins} min`;
        }
        descriptionLines.push(`  Bus ${s.serviceNo}: ${busesText}`);
      });
    }
    descriptionLines.push('');
  });

  descriptionLines.push(`Reading time: ${timeInfo.readingTimeText}`);
  const plainTextDescription = descriptionLines.join('\n');

  // Item link with ?reading=<rounded quarter hour>
  const itemLink = `${siteUrl}?reading=${timeInfo.quarterIso}`;

  // 6. Generate RSS 2.0 XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml('SMU Lobby Bus Transit Board')}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml('Live bus arrival readings around Singapore Management University Main Lobby')}</description>
    <lastBuildDate>${escapeXml(timeInfo.lastBuildDate)}</lastBuildDate>
    <item>
      <title>${escapeXml(itemTitle)}</title>
      <description>${escapeXml(plainTextDescription)}</description>
      <link>${escapeXml(itemLink)}</link>
      <guid isPermaLink="false">${escapeXml(timeInfo.guid)}</guid>
      <pubDate>${escapeXml(timeInfo.pubDate)}</pubDate>
    </item>
  </channel>
</rss>`;

  if (typeof res.status === 'function') {
    return res.status(200).send(xml);
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=20, stale-while-revalidate=40',
    });
    return res.end(xml);
  }
}
