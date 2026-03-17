// ===== GeoIP Lookup =====
const WAN_IP = '99.39.42.110';

// Will be populated by GeoIP lookup
let ROUTER_LOCATION = { lat: 28.0, lng: -82.0, city: 'Loading...', state: '', country: '' };

async function geoipLookup(ip) {
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,isp,org,as`);
    const data = await resp.json();
    if (data.status === 'success') {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        state: data.region,
        country: data.countryCode,
        isp: data.isp,
        org: data.org,
        as: data.as
      };
    }
  } catch (e) {
    console.warn(`GeoIP lookup failed for ${ip}:`, e);
  }
  return null;
}

// Batch lookup (ip-api.com supports batch POST, max 100)
async function geoipBatchLookup(ips) {
  try {
    const resp = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,region,city,lat,lon,isp,org,as', {
      method: 'POST',
      body: JSON.stringify(ips.map(ip => ({ query: ip })))
    });
    const results = await resp.json();
    const map = {};
    results.forEach(r => {
      if (r.status === 'success') {
        map[r.query] = {
          lat: r.lat,
          lng: r.lon,
          city: r.city,
          state: r.region,
          country: r.countryCode,
          isp: r.isp,
          org: r.org,
          as: r.as
        };
      }
    });
    return map;
  } catch (e) {
    console.warn('Batch GeoIP lookup failed:', e);
    return {};
  }
}

const mockFlows = [
  {
    id: 1, device_mac: 'AA:BB:CC:11:22:01', source: 'DLiPhone15Pro.lan', srcPort: 62971,
    destination: 'mia07s68-in-f7.1e100.net', destIp: '142.251.152.119',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'Google', hostname: 'mia07s68-in-f7.1e100.net',
    ja4_client: 'q13d0312h3_55b375c704af_eb2ee418070c', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'iOS',
    category: 'Web', iface: 'lan1', rx_bps: 1520000, tx_bps: 3930,
    network: 'Google LLC', location: { lat: 25.78, lng: -80.18, city: 'Miami', state: 'FL', country: 'US' },
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps', qoe: { score: 87, snrScore: 100, phyRateScore: 82, retransScore: 78, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'AF41', label: 'AF41 - Video' },
    pathChanged: true
  },
  {
    id: 2, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan', srcPort: 64722,
    destination: 'server-3-171-171-45.atl59.r.cloudfront.net', destIp: '3.171.171.45',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'Amazon', hostname: 'server-3-171-171-45.atl59.r.cloudfront.net',
    ja4_client: 'q13d0312h3_55b375c704af_3c5d4a27e31b', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 30740, tx_bps: 8200,
    network: 'AWS CloudFront', location: { lat: 33.75, lng: -84.39, city: 'Atlanta', state: 'GA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 3, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan', srcPort: 56858,
    destination: 'server-3-161-174-101.atl59.r.cloudfront.net', destIp: '3.161.174.101',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'Amazon', hostname: 'server-3-161-174-101.atl59.r.cloudfront.net',
    ja4_client: 'q13d0312h3_55b375c704af_3c5d4a27e31b', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 17260, tx_bps: 9030,
    network: 'AWS CloudFront', location: { lat: 33.75, lng: -84.39, city: 'Atlanta', state: 'GA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 4, device_mac: 'AA:BB:CC:11:22:01', source: 'DLiPhone15Pro.lan', srcPort: 64554,
    destination: 'anonymous.ads.brave.com', destIp: '104.18.32.68',
    dstPort: 443, protocol: 'TCP',
    master_protocol: 'TLS', app_protocol: 'Unknown', hostname: 'anonymous.ads.brave.com',
    ja4_client: 't13d1517h2_8daaf6152771_b0da82dd1658', protocol_stack: ['Ethernet', 'IPv4', 'TCP', 'TLS'], os_hint: 'iOS',
    category: 'Web', iface: 'lan1', rx_bps: 8700, tx_bps: 3060,
    network: 'Cloudflare', location: { lat: 37.77, lng: -122.42, city: 'San Francisco', state: 'CA', country: 'US' },
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps', qoe: { score: 87, snrScore: 100, phyRateScore: 82, retransScore: 78, stabilityScore: 100 } },
    risk: { risk_score: 100, risks: ['Known Protocol on Non-Standard Port', 'Unidirectional Traffic'] },
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 5, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan [Chrome]', srcPort: 62546,
    destination: 'sync-v2.brave.com', destIp: '54.230.56.12',
    dstPort: 443, protocol: 'TCP',
    master_protocol: 'TLS', app_protocol: 'Brave', hostname: 'sync-v2.brave.com',
    ja4_client: 't13d1516h2_8daaf6152771_e5627efa2ab1', protocol_stack: ['Ethernet', 'IPv4', 'TCP', 'TLS'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 6370, tx_bps: 4920,
    network: 'AWS EC2', location: { lat: 39.04, lng: -77.49, city: 'Ashburn', state: 'VA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 6, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan', srcPort: 41641,
    destination: 'derp17d.tailscale.com', destIp: '206.83.1.210',
    dstPort: 41643, protocol: 'UDP',
    master_protocol: 'UDP', app_protocol: 'Tailscale', hostname: 'derp17d.tailscale.com',
    ja4_client: null, protocol_stack: ['Ethernet', 'IPv4', 'UDP'], os_hint: 'Windows',
    category: 'VPN', iface: 'lan1', rx_bps: 1690, tx_bps: 1420,
    network: 'Tailscale Inc', location: { lat: 37.39, lng: -122.08, city: 'Mountain View', state: 'CA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'CS3', label: 'CS3 - Signaling' },
    pathChanged: false
  },
  {
    id: 7, device_mac: 'AA:BB:CC:11:22:01', source: 'DLiPhone15Pro.lan', srcPort: 61669,
    destination: '216.239.34.223', destIp: '216.239.34.223',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'Google', hostname: '216.239.34.223',
    ja4_client: 'q13d0312h3_55b375c704af_eb2ee418070c', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'iOS',
    category: 'Web', iface: 'lan1', rx_bps: 1670, tx_bps: 3090,
    network: 'Google LLC', location: { lat: 37.42, lng: -122.08, city: 'Mountain View', state: 'CA', country: 'US' },
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps', qoe: { score: 87, snrScore: 100, phyRateScore: 82, retransScore: 78, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 8, device_mac: 'AA:BB:CC:11:22:01', source: 'DLiPhone15Pro.lan', srcPort: 51019,
    destination: 'mask.icloud.com', destIp: '172.224.235.45',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'iCloudPrivateRelay', hostname: 'mask.icloud.com',
    ja4_client: 'q13d0312h3_55b375c704af_4c12a5720e19', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'iOS',
    category: 'VPN', iface: 'lan1', rx_bps: 1450, tx_bps: 1500,
    network: 'Akamai / Apple', location: { lat: 47.61, lng: -122.33, city: 'Seattle', state: 'WA', country: 'US' },
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps', qoe: { score: 87, snrScore: 100, phyRateScore: 82, retransScore: 78, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'EF', label: 'EF - Voice' },
    pathChanged: false
  },
  {
    id: 9, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan [Chrome]', srcPort: 62065,
    destination: 'api.anthropic.com', destIp: '104.18.37.171',
    dstPort: 443, protocol: 'TCP',
    master_protocol: 'TLS', app_protocol: 'Anthropic', hostname: 'api.anthropic.com',
    ja4_client: 't13d1516h2_8daaf6152771_e5627efa2ab1', protocol_stack: ['Ethernet', 'IPv4', 'TCP', 'TLS'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 29700, tx_bps: 5100,
    network: 'Cloudflare', location: { lat: 37.77, lng: -122.42, city: 'San Francisco', state: 'CA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 10, device_mac: 'AA:BB:CC:11:22:01', source: 'DLiPhone15Pro.lan', srcPort: 57800,
    destination: 'rr3--sn-hp57yn7y.googlevideo.com', destIp: '172.217.14.206',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'QUIC', app_protocol: 'YouTube', hostname: 'rr3--sn-hp57yn7y.googlevideo.com',
    ja4_client: 'q13d0312h3_55b375c704af_eb2ee418070c', protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'QUIC'], os_hint: 'iOS',
    category: 'Media', iface: 'lan1', rx_bps: 47820000, tx_bps: 312500,
    network: 'Google LLC', location: { lat: 25.78, lng: -80.18, city: 'Miami', state: 'FL', country: 'US' },
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps', qoe: { score: 87, snrScore: 100, phyRateScore: 82, retransScore: 78, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'AF41', label: 'AF41 - Video' },
    pathChanged: false
  },
  {
    id: 11, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan [Chrome]', srcPort: 63626,
    destination: 'api.segment.io', destIp: '3.162.45.88',
    dstPort: 443, protocol: 'TCP',
    master_protocol: 'TLS', app_protocol: 'Segment', hostname: 'api.segment.io',
    ja4_client: 't13d1516h2_8daaf6152771_e5627efa2ab1', protocol_stack: ['Ethernet', 'IPv4', 'TCP', 'TLS'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 6790, tx_bps: 5180,
    network: 'AWS EC2', location: { lat: 39.04, lng: -77.49, city: 'Ashburn', state: 'VA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 12, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan [Chrome]', srcPort: 60931,
    destination: 'lastpass.com', destIp: '23.47.52.170',
    dstPort: 443, protocol: 'TCP',
    master_protocol: 'TLS', app_protocol: 'LastPass', hostname: 'lastpass.com',
    ja4_client: 't13d1516h2_8daaf6152771_e5627efa2ab1', protocol_stack: ['Ethernet', 'IPv4', 'TCP', 'TLS'], os_hint: 'Windows',
    category: 'Web', iface: 'lan1', rx_bps: 5460, tx_bps: 12240,
    network: 'Akamai', location: { lat: 40.71, lng: -74.01, city: 'New York', state: 'NY', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 13, device_mac: 'AA:BB:CC:11:22:03', source: '55TCLRokuTV.lan', srcPort: 5353,
    destination: '74.0.168.192.in-addr.arpa', destIp: '192.168.0.74',
    dstPort: 5353, protocol: 'UDP',
    master_protocol: 'MDNS', app_protocol: 'Unknown', hostname: '74.0.168.192.in-addr.arpa',
    ja4_client: null, protocol_stack: ['Ethernet', 'IPv4', 'UDP', 'MDNS'], os_hint: 'Linux',
    category: 'Network', iface: 'lan3', rx_bps: 0, tx_bps: 2340,
    network: 'Local', location: null,
    wifi: { rssi: -71, channel: 6, band: '2.4 GHz', standard: '802.11n', mcs: 7, txPhyRate: '72 Mbps', rxPhyRate: '65 Mbps', qoe: { score: 42, snrScore: 45, phyRateScore: 28, stabilityScore: 96 } },
    risk: null,
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  },
  {
    id: 14, device_mac: 'AA:BB:CC:11:22:02', source: 'DESKTOP-KGB3BNU.lan', srcPort: 53272,
    destination: '160.79.104.10', destIp: '160.79.104.10',
    dstPort: 443, protocol: 'UDP',
    master_protocol: 'Unknown', app_protocol: 'Unknown', hostname: '160.79.104.10',
    ja4_client: null, protocol_stack: ['Ethernet', 'IPv4', 'UDP'], os_hint: 'Windows',
    category: '-', iface: 'lan1', rx_bps: 5510, tx_bps: 5880,
    network: 'Comcast', location: { lat: 39.95, lng: -75.16, city: 'Philadelphia', state: 'PA', country: 'US' },
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps', qoe: { score: 72, snrScore: 79, phyRateScore: 80, retransScore: 65, stabilityScore: 100 } },
    risk: { risk_score: 200, risks: ['Malware Host Contact', 'TLS Certificate Expired', 'Known Protocol on Non-Standard Port'] },
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  }
];

// Traceroute data for the first flow (Google)
const mockTraceroute = {
  target: mockFlows[0],
  hops: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.7, minRtt: 0.5, maxRtt: 1.0, loss: 0, jitter: 0.5, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.7, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 12.0, minRtt: 11.0, maxRtt: 13.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.68', ip: '32.130.20.68', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 67, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.58', ip: '32.130.20.58', avgRtt: 11.3, minRtt: 11.0, maxRtt: 12.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.88.135', ip: '32.130.88.135', avgRtt: 16.0, minRtt: 15.0, maxRtt: 18.0, loss: 0, jitter: 3.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 9, hostname: 'gar5.cgcil.ip.att.net', ip: '12.123.6.57', avgRtt: 11.3, minRtt: 11.0, maxRtt: 12.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 10, hostname: '142.251.152.119', ip: '142.251.152.119', avgRtt: 12.0, minRtt: 12.0, maxRtt: 12.0, loss: 0, jitter: 0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' }
  ]
};

// Historical traceroute for comparison (Feature 2)
const mockTracerouteHistorical = {
  timestamp: '2 hours ago',
  target: mockFlows[0],
  hops: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 1.0, minRtt: 0.7, maxRtt: 1.5, loss: 0, jitter: 0.8, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 2.0, minRtt: 1.5, maxRtt: 2.5, loss: 0, jitter: 1.0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 2.7, minRtt: 2.0, maxRtt: 3.5, loss: 0, jitter: 1.5, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 6.0, minRtt: 5.0, maxRtt: 7.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.26', ip: '32.130.90.26', avgRtt: 14.0, minRtt: 13.0, maxRtt: 15.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.68', ip: '32.130.20.68', avgRtt: 13.0, minRtt: 12.0, maxRtt: 14.0, loss: 67, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.58', ip: '32.130.20.58', avgRtt: 13.3, minRtt: 12.0, maxRtt: 14.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.88.135', ip: '32.130.88.135', avgRtt: 18.0, minRtt: 16.0, maxRtt: 20.0, loss: 3, jitter: 4.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 9, hostname: 'gar5.cgcil.ip.att.net', ip: '12.123.6.57', avgRtt: 13.3, minRtt: 12.0, maxRtt: 14.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 10, hostname: '142.251.152.119', ip: '142.251.152.119', avgRtt: 14.0, minRtt: 13.0, maxRtt: 15.0, loss: 0, jitter: 2.0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' }
  ]
};

// Per-flow traceroute hop arrays keyed by flow ID
const flowTraceroutes = {
  // Flow 1: Google (142.251.152.119)
  1: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.7, minRtt: 0.5, maxRtt: 1.0, loss: 0, jitter: 0.5, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.7, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 12.0, minRtt: 11.0, maxRtt: 13.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.68', ip: '32.130.20.68', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 67, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.58', ip: '32.130.20.58', avgRtt: 11.3, minRtt: 11.0, maxRtt: 12.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.88.135', ip: '32.130.88.135', avgRtt: 16.0, minRtt: 15.0, maxRtt: 18.0, loss: 0, jitter: 3.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 9, hostname: 'gar5.cgcil.ip.att.net', ip: '12.123.6.57', avgRtt: 11.3, minRtt: 11.0, maxRtt: 12.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 10, hostname: '142.251.152.119', ip: '142.251.152.119', avgRtt: 12.0, minRtt: 12.0, maxRtt: 12.0, loss: 0, jitter: 0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' }
  ],
  // Flow 2: CloudFront (3.171.171.45)
  2: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.3, minRtt: 0.5, maxRtt: 1.0, loss: 0, jitter: 0.5, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.7, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '32.130.89.189', ip: '32.130.89.189', avgRtt: 11.3, minRtt: 11.0, maxRtt: 12.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 9, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 10, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 11, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 12, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 13, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 14, hostname: '3.171.171.45', ip: '3.171.171.45', avgRtt: 20.3, minRtt: 20.0, maxRtt: 21.0, loss: 0, jitter: 1.0, asn: 'AS16509', network: 'Amazon CloudFront', location: 'Atlanta, GA, US' }
  ],
  // Flow 3: CloudFront (3.161.174.101)
  3: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 33, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 3.0, minRtt: 3.0, maxRtt: 3.0, loss: 33, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 2.0, minRtt: 2.0, maxRtt: 2.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '32.130.89.189', ip: '32.130.89.189', avgRtt: 20.0, minRtt: 11.0, maxRtt: 30.0, loss: 0, jitter: 19.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 9, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 10, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 11, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 12, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 13, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 14, hostname: '3.161.174.101', ip: '3.161.174.101', avgRtt: 24.3, minRtt: 20.0, maxRtt: 33.0, loss: 0, jitter: 13.0, asn: 'AS16509', network: 'Amazon CloudFront', location: 'Atlanta, GA, US' }
  ],
  // Flow 4: Cloudflare/Brave (104.18.32.68)
  4: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 2.0, minRtt: 2.0, maxRtt: 2.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 16.7, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.47', ip: '32.130.20.47', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.48', ip: '32.130.20.48', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 33, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.17.17', ip: '32.130.17.17', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 9, hostname: '108.162.235.91', ip: '108.162.235.91', avgRtt: 29.3, minRtt: 22.0, maxRtt: 36.0, loss: 0, jitter: 14.0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' },
    { hop: 10, hostname: '104.18.32.68', ip: '104.18.32.68', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' }
  ],
  // Flow 5: Brave sync via Telia (54.230.56.12) - incomplete, ICMP blocked after hop 12
  5: [
    { hop: 1, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 2.0, minRtt: 2.0, maxRtt: 2.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.0, minRtt: 4.0, maxRtt: 4.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: 'mia-b2-link.ip.twelve99.net', ip: '62.115.196.64', avgRtt: 16.0, minRtt: 12.0, maxRtt: 20.0, loss: 33, jitter: 8.0, asn: 'AS1299', network: 'Telia Carrier', location: 'Miami, FL, US' },
    { hop: 9, hostname: 'rest-bb1-link.ip.twelve99.net', ip: '62.115.119.230', avgRtt: 36.7, minRtt: 36.0, maxRtt: 37.0, loss: 0, jitter: 1.0, asn: 'AS1299', network: 'Telia Carrier', location: 'Reston, VA, US' },
    { hop: 10, hostname: 'nyk-bb5-link.ip.twelve99.net', ip: '62.115.139.34', avgRtt: 39.0, minRtt: 39.0, maxRtt: 39.0, loss: 0, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'New York, NY, US' },
    { hop: 11, hostname: 'ldn-bb1-link.ip.twelve99.net', ip: '62.115.139.245', avgRtt: 108.0, minRtt: 108.0, maxRtt: 108.0, loss: 0, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'London, UK' },
    { hop: 12, hostname: 'ldn-b3-link.ip.twelve99.net', ip: '62.115.140.73', avgRtt: 108.0, minRtt: 108.0, maxRtt: 108.0, loss: 0, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'London, UK' },
    { hop: 13, hostname: '54.230.56.12', ip: '54.230.56.12', avgRtt: 110.0, minRtt: 109.0, maxRtt: 111.0, loss: 0, jitter: 2.0, asn: 'AS16509', network: 'Amazon CloudFront', location: 'London, UK' }
  ],
  // Flow 6: Tailscale via Lumen (206.83.1.210)
  6: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 5.0, minRtt: 5.0, maxRtt: 5.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: 'ae14.edge6.mia1.sp.lumen.tech', ip: '4.68.111.49', avgRtt: 12.7, minRtt: 12.0, maxRtt: 13.0, loss: 0, jitter: 1.0, asn: 'AS3356', network: 'Lumen Technologies', location: 'Miami, FL, US' },
    { hop: 9, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 10, hostname: 'IMPULSE-INT.ear3.LosAngeles1.Level3.net', ip: '4.79.136.26', avgRtt: 63.7, minRtt: 63.0, maxRtt: 65.0, loss: 0, jitter: 2.0, asn: 'AS3356', network: 'Lumen Technologies', location: 'Los Angeles, CA, US' },
    { hop: 11, hostname: 'te3-2-403.edge0.snbbcaxf.impulse.net', ip: '205.254.246.27', avgRtt: 67.0, minRtt: 67.0, maxRtt: 67.0, loss: 0, jitter: 0, asn: 'AS6079', network: 'Impulse Internet', location: 'San Bernardino, CA, US' },
    { hop: 12, hostname: 'sb0-cf9a6622.dsl.impulse.net', ip: '207.154.102.34', avgRtt: 67.3, minRtt: 67.0, maxRtt: 68.0, loss: 0, jitter: 1.0, asn: 'AS6079', network: 'Impulse Internet', location: 'San Bernardino, CA, US' },
    { hop: 13, hostname: 'net-cf9a4c81.iis.impulse.net', ip: '207.154.76.129', avgRtt: 67.7, minRtt: 67.0, maxRtt: 68.0, loss: 0, jitter: 1.0, asn: 'AS6079', network: 'Impulse Internet', location: 'Ventura, CA, US' },
    { hop: 14, hostname: '206.83.1.210', ip: '206.83.1.210', avgRtt: 67.7, minRtt: 67.0, maxRtt: 68.0, loss: 0, jitter: 1.0, asn: 'AS6079', network: 'Impulse Internet', location: 'Ventura, CA, US' }
  ],
  // Flow 7: Google NTP (216.239.34.223)
  7: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 33, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.7, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.68', ip: '32.130.20.68', avgRtt: 10.5, minRtt: 10.0, maxRtt: 11.0, loss: 33, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.58', ip: '32.130.20.58', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.88.135', ip: '32.130.88.135', avgRtt: 18.0, minRtt: 16.0, maxRtt: 20.0, loss: 0, jitter: 4.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 9, hostname: 'gar5.cgcil.ip.att.net', ip: '12.123.6.57', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 10, hostname: '12.255.10.134', ip: '12.255.10.134', avgRtt: 12.0, minRtt: 12.0, maxRtt: 12.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 11, hostname: '216.239.40.101', ip: '216.239.40.101', avgRtt: 13.0, minRtt: 13.0, maxRtt: 13.0, loss: 0, jitter: 0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' },
    { hop: 12, hostname: '142.251.68.235', ip: '142.251.68.235', avgRtt: 12.3, minRtt: 12.0, maxRtt: 13.0, loss: 0, jitter: 1.0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' },
    { hop: 13, hostname: '216.239.34.223', ip: '216.239.34.223', avgRtt: 13.0, minRtt: 13.0, maxRtt: 13.0, loss: 0, jitter: 0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' }
  ],
  // Flow 8: iCloud/Akamai (172.224.235.45) - incomplete, ICMP blocked after hop 10
  8: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.47', ip: '32.130.20.47', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: '32.130.17.13', ip: '32.130.17.13', avgRtt: 16.7, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 9, hostname: 'ae6.r21.atl01.mag.netarch.akamai.com', ip: '23.192.0.94', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 0, jitter: 0, asn: 'AS20940', network: 'Akamai Technologies', location: 'Atlanta, GA, US' },
    { hop: 10, hostname: 'ae0.r22.atl01.icn.netarch.akamai.com', ip: '23.192.0.73', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS20940', network: 'Akamai Technologies', location: 'Atlanta, GA, US' },
    { hop: 11, hostname: '172.224.235.45', ip: '172.224.235.45', avgRtt: 17.0, minRtt: 16.5, maxRtt: 17.5, loss: 0, jitter: 1.0, asn: 'AS20940', network: 'Akamai Technologies', location: 'Atlanta, GA, US' }
  ],
  // Flow 9: Anthropic/Cloudflare (104.18.37.171)
  9: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.0, minRtt: 4.0, maxRtt: 4.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 16.5, minRtt: 16.0, maxRtt: 17.0, loss: 33, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.47', ip: '32.130.20.47', avgRtt: 17.3, minRtt: 16.0, maxRtt: 20.0, loss: 0, jitter: 4.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.48', ip: '32.130.20.48', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 67, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.17.17', ip: '32.130.17.17', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 9, hostname: '108.162.235.91', ip: '108.162.235.91', avgRtt: 30.7, minRtt: 24.0, maxRtt: 35.0, loss: 0, jitter: 11.0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' },
    { hop: 10, hostname: '104.18.37.171', ip: '104.18.37.171', avgRtt: 17.0, minRtt: 17.0, maxRtt: 17.0, loss: 0, jitter: 0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' }
  ],
  // Flow 10: YouTube (172.217.14.206) - incomplete, ICMP blocked after hop 9
  10: [
    { hop: 1, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 2, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.7, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.68', ip: '32.130.20.68', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 67, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '32.130.20.58', ip: '32.130.20.58', avgRtt: 11.0, minRtt: 11.0, maxRtt: 11.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 8, hostname: '32.130.88.135', ip: '32.130.88.135', avgRtt: 14.0, minRtt: 12.0, maxRtt: 15.0, loss: 0, jitter: 3.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 9, hostname: 'gar5.cgcil.ip.att.net', ip: '12.123.6.57', avgRtt: 12.3, minRtt: 11.0, maxRtt: 14.0, loss: 0, jitter: 3.0, asn: 'AS7018', network: 'AT&T', location: 'Chicago, IL, US' },
    { hop: 10, hostname: '172.217.14.206', ip: '172.217.14.206', avgRtt: 12.0, minRtt: 11.5, maxRtt: 12.5, loss: 0, jitter: 1.0, asn: 'AS15169', network: 'Google LLC', location: 'Chicago, IL, US' }
  ],
  // Flow 11: Segment via Telia (3.162.45.88)
  11: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.3, minRtt: 1.0, maxRtt: 2.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.7, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: 'mia-b2-link.ip.twelve99.net', ip: '62.115.196.64', avgRtt: 12.0, minRtt: 12.0, maxRtt: 12.0, loss: 33, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'Miami, FL, US' },
    { hop: 9, hostname: 'ash-bb2-link.ip.twelve99.net', ip: '62.115.120.176', avgRtt: 34.0, minRtt: 34.0, maxRtt: 34.0, loss: 33, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'Ashburn, VA, US' },
    { hop: 10, hostname: 'prs-bb2-link.ip.twelve99.net', ip: '62.115.140.106', avgRtt: 122.0, minRtt: 122.0, maxRtt: 122.0, loss: 0, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'Paris, FR' },
    { hop: 11, hostname: 'prs-b3-link.ip.twelve99.net', ip: '62.115.118.63', avgRtt: 116.0, minRtt: 116.0, maxRtt: 116.0, loss: 0, jitter: 0, asn: 'AS1299', network: 'Telia Carrier', location: 'Paris, FR' },
    { hop: 12, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 13, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 14, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 15, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 16, hostname: '3.162.45.88', ip: '3.162.45.88', avgRtt: 115.0, minRtt: 115.0, maxRtt: 115.0, loss: 0, jitter: 0, asn: 'AS16509', network: 'Amazon CloudFront', location: 'Paris, FR' }
  ],
  // Flow 12: LastPass/Akamai (23.47.52.170)
  12: [
    { hop: 1, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 2, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 2.0, minRtt: 2.0, maxRtt: 2.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.3, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 29.0, minRtt: 29.0, maxRtt: 29.0, loss: 33, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.142', ip: '32.130.20.142', avgRtt: 29.0, minRtt: 29.0, maxRtt: 29.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 7, hostname: '32.130.20.14', ip: '32.130.20.14', avgRtt: 29.0, minRtt: 29.0, maxRtt: 29.0, loss: 67, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 8, hostname: '32.130.17.31', ip: '32.130.17.31', avgRtt: 29.0, minRtt: 29.0, maxRtt: 29.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 9, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 10, hostname: '192.168.234.137', ip: '192.168.234.137', avgRtt: 30.0, minRtt: 30.0, maxRtt: 30.0, loss: 0, jitter: 0, asn: 'AS20940', network: 'Akamai Technologies', location: 'Dallas, TX, US' },
    { hop: 11, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 12, hostname: '23.47.52.170', ip: '23.47.52.170', avgRtt: 30.3, minRtt: 30.0, maxRtt: 31.0, loss: 0, jitter: 1.0, asn: 'AS20940', network: 'Akamai Technologies', location: 'Dallas, TX, US' }
  ],
  // Flow 14: Cloudflare (160.79.104.10)
  14: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.5, maxRtt: 0.5, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 2, hostname: '192.168.1.254', ip: '192.168.1.254', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 67, jitter: 0, asn: null, network: 'Local Network', location: 'Local Network' },
    { hop: 3, hostname: '23.123.104.1', ip: '23.123.104.1', avgRtt: 1.0, minRtt: 1.0, maxRtt: 1.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 4, hostname: '99.168.25.112', ip: '99.168.25.112', avgRtt: 4.7, minRtt: 4.0, maxRtt: 5.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 5, hostname: '32.130.90.22', ip: '32.130.90.22', avgRtt: 16.0, minRtt: 16.0, maxRtt: 16.0, loss: 0, jitter: 0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 6, hostname: '32.130.20.47', ip: '32.130.20.47', avgRtt: 16.7, minRtt: 16.0, maxRtt: 18.0, loss: 0, jitter: 2.0, asn: 'AS7018', network: 'AT&T', location: 'Atlanta, GA, US' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: '32.130.17.17', ip: '32.130.17.17', avgRtt: 16.3, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS7018', network: 'AT&T', location: 'Dallas, TX, US' },
    { hop: 9, hostname: '108.162.235.87', ip: '108.162.235.87', avgRtt: 16.7, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' },
    { hop: 10, hostname: '160.79.104.10', ip: '160.79.104.10', avgRtt: 16.7, minRtt: 16.0, maxRtt: 17.0, loss: 0, jitter: 1.0, asn: 'AS13335', network: 'Cloudflare', location: 'Dallas, TX, US' }
  ]
};

// ===== State =====
let map;
let selectedFlowId = 1;
let currentView = 'map';
let markers = [];
let arcs = [];
let tileLayer;
let routeLayers = {};      // Hop markers + segments per traced route (keyed by flow id)
let activeTraceFlowIds = new Set(); // Which flows have their routes plotted
let traceWaypoints = {};   // flowId -> [[lat,lng], ...] for bounds fitting
let traceCache = {};       // Cache resolved traces by flow id

const TRACE_COLORS = ['#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
let traceCompareMode = '2h'; // 'none' | '2h' — default to '2h' so comparison is visible

// ===== Block Threat State =====
const blockedIps = new Map(); // key: IP, value: { ip, hostname, reason, source, severity, duration, durationLabel, blockedAt, expiresAt }
const BLOCK_DURATIONS = {
  '1h': { label: '1 hour', ms: 3600000 },
  '24h': { label: '24 hours', ms: 86400000 },
  'reboot': { label: 'Until reboot', ms: null },
  'permanent': { label: 'Permanently', ms: null }
};

function isProtectedIp(ip) {
  if (ip === WAN_IP) return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') || ip.startsWith('172.21.') || ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') || ip.startsWith('172.24.') || ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') || ip.startsWith('172.27.') || ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') || ip.startsWith('172.30.') || ip.startsWith('172.31.')) return true;
  if (ip === '8.8.8.8' || ip === '8.8.4.4' || ip === '1.1.1.1' || ip === '1.0.0.1') return true;
  return false;
}

function blockIp(ip, hostname, reason, source, severity, durationKey) {
  if (isProtectedIp(ip)) return false;
  const dur = BLOCK_DURATIONS[durationKey];
  const now = Date.now();
  blockedIps.set(ip, {
    ip, hostname: hostname || ip, reason: reason || 'Manual block',
    source: source || 'User', severity: severity || 'medium',
    duration: durationKey, durationLabel: dur.label, blockedAt: now,
    expiresAt: dur.ms ? now + dur.ms : null
  });
  updateBlockedBadge();
  renderFlowList();
  addFlowsToMap();
  return true;
}

function unblockIp(ip) {
  blockedIps.delete(ip);
  updateBlockedBadge();
  renderFlowList();
  addFlowsToMap();
}

function isIpBlocked(ip) {
  if (!blockedIps.has(ip)) return false;
  const entry = blockedIps.get(ip);
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    blockedIps.delete(ip);
    return false;
  }
  return true;
}

function formatTimeRemaining(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ===== SmartOS Risk Utilities (nDPI thresholds from classifi) =====
const RISK_THRESHOLDS = { LOW: 10, MEDIUM: 50, HIGH: 100, SEVERE: 150 };

function isRisky(flow) {
  return flow.risk && flow.risk.risk_score >= RISK_THRESHOLDS.LOW;
}

function riskSeverity(flow) {
  if (!flow.risk) return null;
  const s = flow.risk.risk_score;
  if (s >= RISK_THRESHOLDS.SEVERE) return 'severe';
  if (s >= RISK_THRESHOLDS.HIGH)   return 'high';
  if (s >= RISK_THRESHOLDS.MEDIUM) return 'medium';
  if (s >= RISK_THRESHOLDS.LOW)    return 'low';
  return null;
}

function riskReason(flow) {
  if (!flow.risk || !flow.risk.risks.length) return '';
  return flow.risk.risks.join(', ');
}

function formatRate(bps) {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
  return `${bps} bps`;
}

function flowDisplayProtocol(flow) {
  if (flow.app_protocol && flow.app_protocol !== 'Unknown')
    return flow.app_protocol;
  return flow.master_protocol || flow.protocol;
}

const TILE_URLS = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
};

// ===== Theme Toggle =====
document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeToggle').textContent = next === 'dark' ? '🌙' : '☀️';

  // Swap map tiles for theme change
  if (map && tileLayer) {
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(TILE_URLS[next], {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);
    // Re-render markers with updated theme colors
    addFlowsToMap();
  }

  // Re-render hops if in trace view
  if (currentView === 'trace') {
    renderTraceHops();
  }
});

// ===== View Switching =====
function switchView(view) {
  currentView = view;
  document.getElementById('mapView').classList.toggle('hidden', view !== 'map');
  document.getElementById('traceView').classList.toggle('hidden', view !== 'trace');
  document.getElementById('mapViewBtn').classList.toggle('active', view === 'map');
  document.getElementById('traceViewBtn').classList.toggle('active', view === 'trace');

  if (view === 'map' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  if (view === 'trace') {
    renderTraceHops();
  }
}

// ===== Filter =====
function setMinRate(btn, rate) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Filter logic would go here
}

// Generate mock rate history based on current rate (bps integer)
function generateRateHistory(bps) {
  const points = [];
  for (let i = 0; i < 12; i++) {
    points.push(Math.max(0, bps + (Math.random() - 0.5) * bps * 0.4));
  }
  return points;
}

// Render inline SVG sparkline
function renderSparkline(dataPoints, width, height) {
  width = width || 60;
  height = height || 20;
  if (!dataPoints || dataPoints.length < 2) return '';

  const max = Math.max(...dataPoints);
  const min = Math.min(...dataPoints);
  const range = max - min || 1;

  const coords = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = coords.join(' ');
  const fillPath = `M${coords[0]} L${polyline} L${width},${height} L0,${height} Z`;

  return `<svg class="sparkline-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <path d="${fillPath}" fill="var(--sparkline-fill)" />
    <polyline points="${polyline}" fill="none" stroke="var(--sparkline-stroke)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
  </svg>`;
}

// ===== Flow List =====
function renderFlowList() {
  const container = document.getElementById('flowList');
  container.innerHTML = '';

  mockFlows.forEach(flow => {
    if (!flow.location) return; // Skip local flows

    const blocked = isIpBlocked(flow.destIp);
    const div = document.createElement('div');
    div.className = `flow-item${flow.id === selectedFlowId ? ' selected' : ''}${isRisky(flow) ? ' threat-flagged' : ''}${blocked ? ' flow-blocked' : ''}`;
    div.onclick = () => selectFlow(flow.id);

    const locStr = flow.location
      ? `${flow.location.city}, ${flow.location.state}`
      : 'Local';

    const isTraced = activeTraceFlowIds.has(flow.id);
    const isSelected = flow.id === selectedFlowId;

    const threatBadge = isRisky(flow)
      ? `<span class="threat-badge" title="${riskReason(flow)} (Score: ${flow.risk.risk_score})">⚠</span>`
      : '';

    const dscpBadge = flow.dscp && flow.dscp.class !== 'BE'
      ? `<span class="dscp-badge dscp-${flow.dscp.class.toLowerCase()}">${flow.dscp.label}</span>`
      : '';

    const blockedInfo = blocked ? blockedIps.get(flow.destIp) : null;
    const blockedBadge = blockedInfo
      ? `<span class="blocked-badge">BLOCKED</span>${blockedInfo.expiresAt ? `<span class="blocked-timer">${formatTimeRemaining(blockedInfo.expiresAt)}</span>` : ''}`
      : '';

    const pathBadge = flow.pathChanged
      ? `<span class="path-alert-badge" title="Route path has changed">⚡</span>`
      : '';

    div.innerHTML = `
      <div class="flow-item-header">
        <span class="flow-destination" title="${flow.destination}">${threatBadge}${pathBadge}${flow.destination}${blockedBadge}</span>
        <div class="flow-rate-group">
          <span class="flow-rate">${formatRate(flow.rx_bps)}</span>
          ${renderSparkline(flow.rateHistory)}
        </div>
      </div>
      <div class="flow-item-meta">
        <span class="protocol-badge ${flow.protocol.toLowerCase()}">${flow.protocol}</span>
        ${dscpBadge}
        <span class="flow-source">${flow.source}</span>
        <span class="flow-location">${locStr}</span>
      </div>
      ${isSelected ? `<button class="trace-route-btn ${isTraced ? 'traced' : ''}" data-flow-id="${flow.id}" onclick="event.stopPropagation(); traceRoute(${flow.id})" title="Trace route to destination">
        ${isTraced ? '✕ Clear Route' : '◎ Trace Route'}
      </button>` : ''}
      ${isSelected && isRisky(flow) && !blocked ? `<button class="block-threat-btn" onclick="event.stopPropagation(); showBlockDialog(${flow.id})" title="Block traffic to ${flow.destIp}">🛡️ Block Threat</button>` : ''}
      ${blocked ? `<button class="unblock-threat-btn" onclick="event.stopPropagation(); unblockIp('${flow.destIp}')" title="Unblock ${flow.destIp}">✕ Unblock</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function selectFlow(id) {
  // Selecting a different flow clears all active traces to restore the full map view
  if (activeTraceFlowIds.size > 0) {
    stopAllTraceAnimations();
    Object.values(routeLayers).forEach(layers => {
      layers.forEach(item => map.removeLayer(item));
    });
    routeLayers = {};
    activeTraceFlowIds.clear();
    closeMapTracePanel();
  }
  selectedFlowId = id;
  renderFlowList();
  highlightFlowOnMap(id);
}

// ===== Map =====
function initMap() {
  map = L.map('map', {
    center: [32, -95],
    zoom: 4,
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false
  });

  // Use CartoDB tiles - dark for dark theme, light for light theme
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  tileLayer = L.tileLayer(TILE_URLS[theme], {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // Add router marker (home)
  const homeIcon = L.divIcon({
    className: 'home-marker',
    html: `<div style="
      width: 16px; height: 16px;
      background: #22d3ee;
      border: 3px solid #0b0f19;
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(34,211,238,0.6);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

  L.marker([ROUTER_LOCATION.lat, ROUTER_LOCATION.lng], { icon: homeIcon })
    .addTo(map)
    .bindPopup(`
      <div class="popup-title">🏠 Router (SDG-8733)</div>
      <div class="popup-row"><span class="popup-label">WAN IP</span><span class="popup-value">${WAN_IP}</span></div>
      <div class="popup-row"><span class="popup-label">ISP</span><span class="popup-value">${ROUTER_LOCATION.isp || ''}</span></div>
      <div class="popup-row"><span class="popup-label">Location</span><span class="popup-value">${ROUTER_LOCATION.city}, ${ROUTER_LOCATION.state}, ${ROUTER_LOCATION.country}</span></div>
    `);

  // Click empty map area to deselect
  map.on('click', () => {
    if (selectedFlowId !== null) {
      selectedFlowId = null;
      renderFlowList();
      addFlowsToMap();
    }
  });

  // Add flow endpoints and arcs
  addFlowsToMap();
}

function getCategoryColor(category) {
  switch (category) {
    case 'Web': return '#22d3ee';
    case 'VPN': return '#a78bfa';
    case 'Media': return '#f59e0b';
    default: return '#6b7280';
  }
}

function addFlowsToMap() {
  // Clear existing
  markers.forEach(m => map.removeLayer(m));
  arcs.forEach(a => map.removeLayer(a));
  markers = [];
  arcs = [];

  // Group flows by unique destination location to avoid overlapping markers
  const locationGroups = {};

  mockFlows.forEach(flow => {
    if (!flow.location) return;

    const key = `${flow.location.lat},${flow.location.lng}`;
    if (!locationGroups[key]) {
      locationGroups[key] = { location: flow.location, flows: [] };
    }
    locationGroups[key].flows.push(flow);
  });

  const hasActiveTraces = activeTraceFlowIds.size > 0;

  Object.values(locationGroups).forEach(group => {
    const { location, flows } = group;
    const primaryFlow = flows[0];
    const color = getCategoryColor(primaryFlow.category);
    const isSelected = flows.some(f => f.id === selectedFlowId);
    const isTracedGroup = flows.some(f => activeTraceFlowIds.has(f.id));
    const dimmed = hasActiveTraces && !isTracedGroup && !isSelected;

    // Endpoint marker — shrink and fade non-traced endpoints when traces are active
    const size = dimmed ? 5 : (isSelected ? 14 : 10);
    const markerOpacity = dimmed ? 0.15 : 1;
    const hasThreat = !dimmed && flows.some(f => isRisky(f));
    const hasBlocked = flows.some(f => isIpBlocked(f.destIp));
    const pulseRing = hasThreat
      ? `<div style="position:absolute;top:${-4}px;left:${-4}px;width:${size+8}px;height:${size+8}px;border-radius:50%;border:2px solid var(--threat-red);animation:threatPulse 1.5s ease-in-out infinite;pointer-events:none;"></div>`
      : '';
    const endIcon = hasBlocked ? L.divIcon({
      className: 'endpoint-marker blocked-marker',
      html: `<div style="
        width: ${size + 4}px; height: ${size + 4}px;
        border: 2px solid var(--threat-red);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        opacity: 0.5;
        position: relative;
      "><div style="
        position: absolute;
        width: ${size}px; height: 2px;
        background: var(--threat-red);
        transform: rotate(-45deg);
      "></div></div>`,
      iconSize: [size + 4, size + 4],
      iconAnchor: [(size + 4) / 2, (size + 4) / 2]
    }) : L.divIcon({
      className: 'endpoint-marker',
      html: `${pulseRing}<div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 2px solid ${isSelected ? '#ffffff' : '#0b0f19'};
        border-radius: 50%;
        box-shadow: 0 0 ${isSelected ? '10' : '6'}px ${color}80;
        transition: all 0.2s;
        opacity: ${markerOpacity};
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    const popupContent = flows.map(f => `
      <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid var(--border-color);">
        <div class="popup-title">${f.destination}</div>
        <div class="popup-row"><span class="popup-label">IP</span><span class="popup-value">${f.destIp}</span></div>
        <div class="popup-row"><span class="popup-label">Network</span><span class="popup-value">${f.network}</span></div>
        <div class="popup-row"><span class="popup-label">RX</span><span class="popup-value" style="color:#34d399">${formatRate(f.rx_bps)}</span></div>
        <div class="popup-row"><span class="popup-label">Category</span><span class="popup-value">${f.category}</span></div>
        ${f.dscp && f.dscp.class !== 'BE' ? `<div class="popup-row"><span class="popup-label">DSCP</span><span class="popup-value">${f.dscp.label}</span></div>` : ''}
        ${isRisky(f) ? `<div class="popup-row"><span class="popup-label">⚠ Risk</span><span class="popup-value" style="color:var(--threat-red)">${riskReason(f)}</span></div><div class="popup-row"><span class="popup-label">Score</span><span class="popup-value" style="color:var(--threat-red)">${f.risk.risk_score} (${riskSeverity(f)})</span></div>` : ''}
      </div>
    `).join('');

    const marker = L.marker([location.lat, location.lng], { icon: endIcon })
      .addTo(map)
      .bindPopup(`
        <div style="max-height: 200px; overflow-y: auto;">
          ${popupContent}
          <div class="popup-row"><span class="popup-label">Location</span><span class="popup-value">${location.city}, ${location.state}, ${location.country}</span></div>
        </div>
      `);
    markers.push(marker);

    // Arc from router to endpoint — quadratic bezier control point
    const arcStart = [ROUTER_LOCATION.lat, ROUTER_LOCATION.lng];
    const arcEnd   = [location.lat, location.lng];
    const arcDLat  = arcEnd[0] - arcStart[0];
    const arcDLng  = arcEnd[1] - arcStart[1];
    const arcD     = Math.sqrt(arcDLat * arcDLat + arcDLng * arcDLng);
    const arcCtrl  = [(arcStart[0] + arcEnd[0]) / 2 + arcD * 0.3,
                      (arcStart[1] + arcEnd[1]) / 2];

    // Invisible fat polyline for easy click target
    const arcHitArea = L.polyline([arcStart, arcCtrl, arcEnd], {
      color: 'transparent',
      weight: 16,
      opacity: 0,
      interactive: true
    }).addTo(map);
    arcHitArea.bindPopup(`
      <div style="max-height: 200px; overflow-y: auto;">
        ${popupContent}
        <div class="popup-row"><span class="popup-label">Location</span><span class="popup-value">${location.city}, ${location.state}, ${location.country}</span></div>
      </div>
    `);
    arcHitArea.on('click', () => selectFlow(primaryFlow.id));
    arcs.push(arcHitArea);

    // Determine dominant traffic direction for this location group
    const totalRx = flows.reduce((sum, f) => sum + f.rx_bps, 0);
    const totalTx = flows.reduce((sum, f) => sum + f.tx_bps, 0);
    const arcClass = totalRx >= totalTx ? 'flow-arc-download' : 'flow-arc-upload';

    // Dim all arcs when traces are active — the trace route lines take over visually
    const arcOpacity = hasBlocked ? 0.08 : hasActiveTraces ? 0.08 : (isSelected ? 1.0 : 0.55);
    const arcWeight = hasBlocked ? 1 : hasActiveTraces ? 1 : (isSelected ? 3.5 : 2);

    // L.curve uses quadraticCurveTo on canvas — hardware-smooth at every zoom, bypasses RDP
    const arc = L.curve(['M', arcStart, 'Q', arcCtrl, arcEnd], {
      color: hasBlocked ? '#6b7280' : color,
      weight: arcWeight,
      opacity: arcOpacity,
      dashArray: hasActiveTraces ? '4, 8' : (isSelected ? null : '8, 6'),
      className: hasActiveTraces ? '' : (isSelected ? '' : arcClass),
      lineCap: 'round',
      interactive: false
    }).addTo(map);
    arcs.push(arc);
  });
}

// Build a smooth quadratic bezier spline path through an array of anchor points.
// Uses the midpoint algorithm: each anchor is a bezier control point, and the
// actual curve passes through the midpoints between consecutive anchors (C1 continuous).
function buildBezierPath(anchors) {
  if (anchors.length < 2) return ['M', anchors[0] || [0, 0]];
  if (anchors.length === 2) return ['M', anchors[0], 'L', anchors[1]];
  const path = ['M', anchors[0]];
  for (let j = 1; j < anchors.length - 1; j++) {
    const mid = [(anchors[j][0] + anchors[j + 1][0]) / 2,
                 (anchors[j][1] + anchors[j + 1][1]) / 2];
    path.push('Q', anchors[j], mid);
  }
  // Final segment ends at the last anchor exactly
  path.push('Q', anchors[anchors.length - 2], anchors[anchors.length - 1]);
  return path;
}

function highlightFlowOnMap(flowId) {
  addFlowsToMap();
  const flow = mockFlows.find(f => f.id === flowId);
  if (flow && flow.location) {
    // Gently pan to show both router and destination
    const bounds = L.latLngBounds(
      [ROUTER_LOCATION.lat, ROUTER_LOCATION.lng],
      [flow.location.lat, flow.location.lng]
    );
    map.fitBounds(bounds.pad(0.3), { animate: true, duration: 0.5 });
  }
}

// ===== Trace Route on Map =====
function clearRouteLayer() {
  stopAllTraceAnimations();
  Object.values(routeLayers).forEach(layers => {
    layers.forEach(item => map.removeLayer(item));
  });
  routeLayers = {};
  traceWaypoints = {};
}

async function traceRoute(flowId) {
  // Toggle this flow's trace
  if (activeTraceFlowIds.has(flowId)) {
    activeTraceFlowIds.delete(flowId);
    stopTraceAnimation(flowId);
    // Remove just this flow's route layer
    if (routeLayers[flowId]) {
      routeLayers[flowId].forEach(item => map.removeLayer(item));
      delete routeLayers[flowId];
      delete traceWaypoints[flowId];
    }
    addFlowsToMap();
    renderFlowList();
    if (activeTraceFlowIds.size === 0) closeMapTracePanel();
    return;
  }

  const flow = mockFlows.find(f => f.id === flowId);
  if (!flow) return;

  activeTraceFlowIds.add(flowId);
  renderFlowList();

  // Update button to show loading
  const btn = document.querySelector(`.trace-route-btn[data-flow-id="${flowId}"]`);
  if (btn) {
    btn.textContent = '⟳ Tracing...';
    btn.disabled = true;
  }

  let resolvedHops;

  if (traceCache[flowId]) {
    resolvedHops = traceCache[flowId];
  } else {
    // Use appropriate mock traceroute data
    const hops = flowTraceroutes[flowId] || mockTraceroute.hops;

    // Collect routable hop IPs for GeoIP batch lookup
    const hopIps = hops
      .filter(h => h.ip && h.ip !== '—' && !h.ip.startsWith('192.168.') && !h.ip.startsWith('10.'))
      .map(h => h.ip);

    const geoResults = await geoipBatchLookup([...new Set(hopIps)]);

    // Build resolved hop list with geo locations
    resolvedHops = hops.map(hop => ({
      ...hop,
      geo: geoResults[hop.ip] || null
    }));

    traceCache[flowId] = resolvedHops;
  }

  plotRouteOnMap(resolvedHops, flow, flowId);
  renderFlowList();
}

// City coordinates for hop location lookup (from reverse DNS city codes)
const CITY_COORDS = {
  'Atlanta, GA, US': { lat: 33.749, lng: -84.388 },
  'Chicago, IL, US': { lat: 41.878, lng: -87.630 },
  'Dallas, TX, US': { lat: 32.777, lng: -96.797 },
  'Miami, FL, US': { lat: 25.761, lng: -80.192 },
  'Reston, VA, US': { lat: 38.969, lng: -77.341 },
  'New York, NY, US': { lat: 40.713, lng: -74.006 },
  'London, UK': { lat: 51.507, lng: -0.128 },
  'Los Angeles, CA, US': { lat: 34.052, lng: -118.244 },
  'San Bernardino, CA, US': { lat: 34.108, lng: -117.289 },
  'Ventura, CA, US': { lat: 34.275, lng: -119.229 },
  'Ashburn, VA, US': { lat: 39.044, lng: -77.487 },
  'Paris, FR': { lat: 48.857, lng: 2.352 },
  'Seattle, WA, US': { lat: 47.606, lng: -122.332 },
  'Mountain View, CA, US': { lat: 37.386, lng: -122.084 },
  'San Francisco, CA, US': { lat: 37.775, lng: -122.418 },
  'Toronto, ON, CA': { lat: 43.653, lng: -79.383 },
  'Philadelphia, PA, US': { lat: 39.953, lng: -75.164 },
  'Gainesville, FL, US': { lat: 29.652, lng: -82.325 }
};

// Compute great-circle interpolated points between two lat/lng coords.
// Segment count scales with angular distance so all arcs appear equally smooth.
// Returns n evenly-spaced great-circle points between two lat/lng coords.
// nOverride sets a fixed count; default 50 is sufficient for smooth animation paths.
function geodesicPoints(lat1, lng1, lat2, lng2, nOverride) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const φ1 = toRad(lat1), λ1 = toRad(lng1);
  const φ2 = toRad(lat2), λ2 = toRad(lng2);
  const dφ = φ2 - φ1, dλ = λ2 - λ1;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  const d = 2 * Math.asin(Math.sqrt(a));
  if (d < 0.001) return [[lat1, lng1], [lat2, lng2]];
  const n = nOverride !== undefined ? nOverride : 50;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    pts.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return pts;
}

function plotRouteOnMap(hops, flow, flowId) {
  // Clear previous route for this specific flow
  if (routeLayers[flowId]) {
    routeLayers[flowId].forEach(item => map.removeLayer(item));
  }
  routeLayers[flowId] = [];
  traceWaypoints[flowId] = [];

  const traceIdx = [...activeTraceFlowIds].indexOf(flowId);
  const traceColor = TRACE_COLORS[traceIdx % TRACE_COLORS.length];
  addFlowsToMap();

  // Resolve hop coordinates from embedded location strings, not GeoIP
  const resolvedHops = hops.map(hop => {
    const isTimeout = hop.ip === '\u2014';
    const coords = (!isTimeout && hop.location)
      ? (hop.location === 'Local Network' ? { lat: ROUTER_LOCATION.lat, lng: ROUTER_LOCATION.lng } : CITY_COORDS[hop.location])
      : null;
    return { ...hop, coords, isTimeout };
  });

  // Item 2: skip timeout/ICMP-blocked hops from map — only show responsive hops with known coords
  const mapHops = resolvedHops.filter(h => !h.isTimeout && h.coords);

  // Collapse consecutive hops at the same city into groups
  const groups = [];
  mapHops.forEach(hop => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && hop.location === lastGroup.location) {
      lastGroup.hops.push(hop);
    } else {
      groups.push({ location: hop.location, coords: hop.coords, hops: [hop] });
    }
  });

  // Build waypoints from collapsed groups
  const waypoints = [
    { lat: ROUTER_LOCATION.lat, lng: ROUTER_LOCATION.lng, label: 'Router', hopLabel: '0', data: null, hops: [] }
  ];

  groups.forEach(group => {
    const firstHop = group.hops[0].hop;
    const lastHop = group.hops[group.hops.length - 1].hop;
    const hopLabel = firstHop === lastHop ? `${firstHop}` : `${firstHop}-${lastHop}`;
    waypoints.push({
      lat: group.coords.lat,
      lng: group.coords.lng,
      label: group.location,
      hopLabel,
      data: group.hops[0],
      hops: group.hops
    });
  });

  // Store waypoints for this flow so fitBounds can use them (L.curve has no getLatLngs)
  traceWaypoints[flowId] = waypoints.map(wp => [wp.lat, wp.lng]);

  // Item 4: per-trace perpendicular offset so overlapping segments stay distinct
  const OFFSET_STEP = 0.007; // degrees
  const numTraces = activeTraceFlowIds.size;
  const offsetMag = (traceIdx - (numTraces - 1) / 2) * OFFSET_STEP;

  // Build geodesic+offset path for animation and L.curve bezier for visual rendering
  const fullAnimPath = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    // Perpendicular unit vector for this segment (in lat/lng space)
    const dx = to.lat - from.lat;
    const dy = to.lng - from.lng;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpLat = (-dy / len) * offsetMag;
    const perpLng = (dx / len) * offsetMag;

    const fromPt = [from.lat + perpLat, from.lng + perpLng];
    const toPt   = [to.lat   + perpLat, to.lng   + perpLng];

    // Dense points (50) for comet animation interpolation
    const animPts = geodesicPoints(fromPt[0], fromPt[1], toPt[0], toPt[1], 50);
    if (fullAnimPath.length === 0) {
      fullAnimPath.push(...animPts);
    } else {
      fullAnimPath.push(...animPts.slice(1));
    }

    // 9 geodesic anchors fed into quadratic bezier spline — hardware-smooth, no RDP
    const anchors = geodesicPoints(fromPt[0], fromPt[1], toPt[0], toPt[1], 9);
    const segment = L.curve(buildBezierPath(anchors), {
      color: traceColor,
      weight: 2,
      opacity: 0.65,
      lineCap: 'round',
      interactive: false
    }).addTo(map);
    routeLayers[flowId].push(segment);
  }

  // Draw hop markers at actual (non-offset) coordinates
  waypoints.forEach((wp, idx) => {
    if (idx === 0) return;
    const size = 8;

    const hopIcon = L.divIcon({
      className: 'hop-marker',
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: ${traceColor};
        border: 2px solid ${traceColor}80;
        border-radius: 50%;
        box-shadow: 0 0 6px ${traceColor}80;
      "></div>
      <div style="
        position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
        font-size: 9px; color: ${traceColor}; font-weight: 700;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        white-space: nowrap;
      ">${wp.hopLabel}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    const hopRows = wp.hops.map(h =>
      `<div class="popup-row"><span class="popup-label">Hop ${h.hop}</span><span class="popup-value">${h.ip} (${h.avgRtt} ms${h.loss > 0 ? ', ' + h.loss + '% loss' : ''})</span></div>`
    ).join('');
    const firstHop = wp.hops[0];
    const popupHtml = `
      <div class="popup-title">${wp.label}</div>
      <div class="popup-row"><span class="popup-label">Network</span><span class="popup-value">${firstHop.network || ''}</span></div>
      <div style="margin-top:4px; border-top: 1px solid var(--border-color); padding-top:4px;">
        ${hopRows}
      </div>`;

    const marker = L.marker([wp.lat, wp.lng], { icon: hopIcon })
      .addTo(map)
      .bindPopup(popupHtml);
    routeLayers[flowId].push(marker);
  });

  // Start fuse animation along the geodesic+offset path
  startTraceAnimation(flowId, fullAnimPath, traceColor);

  // Show hop list on map (full unfiltered list for the textual panel)
  updateMapTracePanel(hops, flow);

  // Item 1: Fit bounds with extra right/bottom padding for the map-trace-panel
  const allPoints = [];
  // Collect waypoints from ALL active traces for bounds (L.curve has no getLatLngs)
  Object.values(traceWaypoints).forEach(wps => wps.forEach(p => allPoints.push(p)));
  if (allPoints.length > 0) {
    const routeBounds = L.latLngBounds(allPoints);
    // The panel sits in the bottom-right corner only — not the full right or bottom edge.
    // Reserve horizontal space for it (shift route left) but use the full map height
    // so zoom is as tight as possible.  A small symmetric vertical margin gives breathing room.
    const PANEL_RIGHT_PAD = 356; // panel width (320) + right edge (16) + buffer (20)
    const MARGIN = 24;
    map.fitBounds(routeBounds, {
      animate: true,
      duration: 0.5,
      paddingTopLeft:     [MARGIN, MARGIN],
      paddingBottomRight: [PANEL_RIGHT_PAD, MARGIN]
    });
  }
}

// ===== Map Trace Panel =====
function updateMapTracePanel(hops, flow) {
  const panel = document.getElementById('mapTracePanel');
  const title = document.getElementById('mapTraceTitle');
  const container = document.getElementById('mapTraceHops');
  if (!panel || !container) return;

  title.textContent = `Traceroute to ${flow.destination}`;
  container.innerHTML = hops.map(hop => {
    const isTimeout = hop.ip === '\u2014';
    const lossClass = (!isTimeout && hop.loss > 0) ? ' has-loss' : '';
    return `<div class="map-trace-hop${isTimeout ? ' timeout' : ''}${lossClass}">
      <span class="map-trace-hop-num">${hop.hop}</span>
      <span class="map-trace-hop-host" title="${isTimeout ? '* * *' : hop.hostname + ' (' + hop.ip + ')'}">${isTimeout ? '* * *' : hop.hostname}</span>
      <span class="map-trace-hop-rtt">${isTimeout ? '*' : hop.avgRtt + ' ms'}</span>
      ${!isTimeout && hop.loss > 0 ? `<span class="map-trace-hop-loss">${hop.loss}%</span>` : ''}
    </div>`;
  }).join('');
  panel.classList.remove('hidden');
}

function closeMapTracePanel() {
  const panel = document.getElementById('mapTracePanel');
  if (panel) panel.classList.add('hidden');
}

// ===== Comet / Fuse Trace Animation =====
const traceAnimations = {};

// Pre-compute cumulative arc-length table for a point array.
// Returns { cumDist, totalLen } so per-frame lookups are O(log n) not O(n).
function buildPathMetrics(points) {
  const cumDist = new Float64Array(points.length); // cumDist[i] = dist from points[0] to points[i]
  cumDist[0] = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    cumDist[i] = cumDist[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }
  return { cumDist, totalLen: cumDist[points.length - 1] };
}

// O(log n) position lookup using pre-built metrics — safe to call every animation frame.
function getPositionAtFraction(points, fraction, metrics) {
  if (fraction <= 0) return points[0];
  if (fraction >= 1) return points[points.length - 1];

  const { cumDist, totalLen } = metrics;
  const target = fraction * totalLen;

  // Binary search for the segment containing target distance
  let lo = 0, hi = points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumDist[mid + 1] < target) lo = mid + 1; else hi = mid;
  }
  const segLen = cumDist[lo + 1] - cumDist[lo];
  const t = segLen > 0 ? (target - cumDist[lo]) / segLen : 0;
  return [
    points[lo][0] + (points[lo + 1][0] - points[lo][0]) * t,
    points[lo][1] + (points[lo + 1][1] - points[lo][1]) * t
  ];
}

function getPathSlice(points, startFrac, endFrac) {
  // Compute segment lengths
  const segLens = [];
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    segLens.push(Math.sqrt(dx * dx + dy * dy));
    totalLen += segLens[segLens.length - 1];
  }

  const startDist = startFrac * totalLen;
  const endDist = endFrac * totalLen;
  const result = [getPositionAtFraction(points, startFrac)];

  // Include intermediate waypoints within range
  let cum = 0;
  for (let i = 1; i < points.length; i++) {
    cum += segLens[i - 1];
    if (cum > startDist && cum < endDist) {
      result.push(points[i]);
    }
  }

  result.push(getPositionAtFraction(points, endFrac));
  return result;
}

function startTraceAnimation(flowId, pathPoints, color) {
  stopTraceAnimation(flowId);

  // Comet head — bright glowing dot
  const cometIcon = L.divIcon({
    className: 'comet-head-marker',
    html: `<div class="comet-dot" style="
      background: ${color};
      box-shadow: 0 0 8px 2px ${color}, 0 0 16px 6px ${color}80, 0 0 3px 1px #fff;
    "></div>`,
    iconSize: [9, 9],
    iconAnchor: [4, 4]
  });

  const cometMarker = L.marker(pathPoints[0], {
    icon: cometIcon,
    interactive: false,
    zIndexOffset: 1000
  }).addTo(map);

  // Lit trail — the "fuse" path that stays lit behind the comet (disabled — comet-only mode)
  const litTrail = L.polyline([], {
    color: color,
    weight: 3.5,
    opacity: 0,
    lineCap: 'round',
    interactive: false
  }).addTo(map);

  // Bright glow tail — short intense segment right behind the head (disabled — comet-only mode)
  const glowTail = L.polyline([], {
    color: '#ffffff',
    weight: 5,
    opacity: 0,
    lineCap: 'round',
    interactive: false
  }).addTo(map);

  const CYCLE_DURATION = 4200; // ms for one full traversal (20% slower)
  const TAIL_LENGTH = 0.08;    // fraction of path for bright tail
  const FADE_DURATION = 600;   // ms the lit trail stays before fading
  const PAUSE_AT_END = 700;    // ms to pause at destination
  const TOTAL_CYCLE = CYCLE_DURATION + PAUSE_AT_END + FADE_DURATION;

  // Pre-compute arc-length metrics once — avoids O(n) recalc on every animation frame
  const pathMetrics = buildPathMetrics(pathPoints);

  let startTime = performance.now();

  function animate(time) {
    const elapsed = (time - startTime) % TOTAL_CYCLE;
    let progress;

    if (elapsed < CYCLE_DURATION) {
      // Comet traveling forward
      progress = elapsed / CYCLE_DURATION;
    } else if (elapsed < CYCLE_DURATION + PAUSE_AT_END) {
      // Paused at destination — trail fully lit
      progress = 1;
    } else {
      // Fade phase — trail fades, comet hidden, then restart
      progress = -1; // signal to hide
    }

    if (progress >= 0) {
      // O(log n) position lookup using pre-built metrics
      const pos = getPositionAtFraction(pathPoints, progress, pathMetrics);
      cometMarker.setLatLng(pos);
      cometMarker.setOpacity(1);
    } else {
      // Fade phase — hide comet, restart cycle
      cometMarker.setOpacity(0);
    }

    traceAnimations[flowId].frameId = requestAnimationFrame(animate);
  }

  traceAnimations[flowId] = {
    frameId: requestAnimationFrame(animate),
    cometMarker,
    litTrail,
    glowTail
  };

  // Add to routeLayers so they get cleaned up with the route
  if (!routeLayers[flowId]) routeLayers[flowId] = [];
  routeLayers[flowId].push(cometMarker, litTrail, glowTail);
}

function stopTraceAnimation(flowId) {
  if (traceAnimations[flowId]) {
    cancelAnimationFrame(traceAnimations[flowId].frameId);
    delete traceAnimations[flowId];
  }
}

function stopAllTraceAnimations() {
  Object.keys(traceAnimations).forEach(id => stopTraceAnimation(id));
}

// ===== Blocked IPs Badge & Panel =====
function updateBlockedBadge() {
  const badge = document.getElementById('blockedBadge');
  if (!badge) return;
  const count = blockedIps.size;
  if (count > 0) {
    badge.textContent = `🛡️ ${count} blocked`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    const panel = document.getElementById('blockedPanel');
    if (panel) panel.classList.add('hidden');
  }
}

function toggleBlockedPanel() {
  const panel = document.getElementById('blockedPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderBlockedPanel();
}

function renderBlockedPanel() {
  const list = document.getElementById('blockedPanelList');
  if (!list) return;
  if (blockedIps.size === 0) {
    list.innerHTML = '<div class="blocked-panel-empty">No blocked IPs</div>';
    return;
  }
  list.innerHTML = [...blockedIps.values()].map(entry => `
    <div class="blocked-panel-item">
      <div class="blocked-panel-item-info">
        <div class="blocked-panel-hostname">${entry.hostname}</div>
        <div class="blocked-panel-ip">${entry.ip}</div>
        <div class="blocked-panel-reason">${entry.reason} (${entry.source})</div>
        <div class="blocked-panel-meta">${entry.expiresAt ? formatTimeRemaining(entry.expiresAt) : entry.durationLabel}</div>
      </div>
      <button class="blocked-panel-unblock" onclick="unblockIp('${entry.ip}'); renderBlockedPanel();">Unblock</button>
    </div>
  `).join('');
}

// ===== FlowSight-style Hop Rows =====
function qoeClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

function setTraceComparison(mode) {
  traceCompareMode = mode;
  renderTraceHops();
}

// ===== Block Threat Dialog =====
let pendingBlockFlow = null;
let selectedBlockDuration = '24h';

function showBlockDialog(flowId) {
  const flow = mockFlows.find(f => f.id === flowId);
  if (!flow || !isRisky(flow)) return;
  if (isProtectedIp(flow.destIp)) {
    alert('Cannot block this IP — it is in the safeguard list (LAN/gateway/DNS).');
    return;
  }
  pendingBlockFlow = flow;
  selectedBlockDuration = '24h';

  const affectedFlows = mockFlows.filter(f => f.destIp === flow.destIp);
  const body = document.getElementById('blockDialogBody');
  body.innerHTML = `
    <div class="block-dialog-row">
      <span class="block-dialog-label">Destination</span>
      <span class="block-dialog-value">${flow.destination}</span>
    </div>
    <div class="block-dialog-row">
      <span class="block-dialog-label">IP Address</span>
      <span class="block-dialog-value">${flow.destIp}</span>
    </div>
    <div class="block-dialog-row">
      <span class="block-dialog-label">Threat</span>
      <span class="block-dialog-value threat-text">${riskReason(flow)}</span>
    </div>
    <div class="block-dialog-row">
      <span class="block-dialog-label">Source</span>
      <span class="block-dialog-value">nDPI / classifi</span>
    </div>
    <div class="block-dialog-row">
      <span class="block-dialog-label">Severity</span>
      <span class="block-dialog-value threat-text">${riskSeverity(flow).toUpperCase()}</span>
    </div>
    <div class="block-dialog-warning">
      All traffic to/from <strong>${flow.destIp}</strong> will be dropped at the firewall.${affectedFlows.length > 1 ? ` This will affect <strong>${affectedFlows.length} active flows</strong>.` : ''}
    </div>
    <div class="block-duration-options">
      ${Object.entries(BLOCK_DURATIONS).map(([key, d]) =>
        `<button class="block-duration-btn${key === '24h' ? ' selected' : ''}" onclick="selectBlockDuration('${key}', this)">${d.label}</button>`
      ).join('')}
    </div>
  `;

  const actions = document.getElementById('blockDialogActions');
  actions.innerHTML = `
    <button class="block-dialog-btn cancel" onclick="hideBlockDialog()">Cancel</button>
    <button class="block-dialog-btn confirm" onclick="confirmBlock()">🛡️ Block</button>
  `;

  document.getElementById('blockDialogOverlay').classList.remove('hidden');
}

function selectBlockDuration(key, btn) {
  selectedBlockDuration = key;
  document.querySelectorAll('.block-duration-btn').forEach(b => b.classList.remove('selected'));
  if (btn) btn.classList.add('selected');
}

function hideBlockDialog() {
  document.getElementById('blockDialogOverlay').classList.add('hidden');
  pendingBlockFlow = null;
}

function confirmBlock() {
  if (!pendingBlockFlow) return;
  const f = pendingBlockFlow;
  blockIp(f.destIp, f.destination, riskReason(f), 'nDPI', riskSeverity(f), selectedBlockDuration);
  hideBlockDialog();
}

function renderTraceHops() {
  const container = document.getElementById('traceHopsContainer');
  container.innerHTML = '';

  const hops = mockTraceroute.hops;
  const validHops = hops.filter(h => h.avgRtt !== null);
  const maxRtt = validHops.length > 0 ? Math.max(...validHops.map(h => h.maxRtt)) : 1;

  // Column header row
  const header = document.createElement('div');
  header.className = 'trace-hops-header';
  header.innerHTML = `
    <div class="hop-col-num">Hop</div>
    <div class="hop-col-bar">Latency</div>
    <div class="hop-col-info">Details</div>
  `;
  container.appendChild(header);

  // Comparison toggle
  const compareBar = document.createElement('div');
  compareBar.className = 'trace-compare-bar';
  compareBar.innerHTML = `
    <span class="trace-compare-label">Compare:</span>
    <select class="compare-select" onchange="setTraceComparison(this.value)">
      <option value="none" ${traceCompareMode === 'none' ? 'selected' : ''}>Current Only</option>
      <option value="2h" ${traceCompareMode === '2h' ? 'selected' : ''}>vs 2 hours ago</option>
    </select>
  `;
  container.appendChild(compareBar);

  // Wireless Hop 0 — WiFi leg from client to AP
  const flow = mockTraceroute.target;
  if (flow && flow.wifi) {
    const w = flow.wifi;
    const sigPct = w.qoe.score;
    const sigClass = qoeClass(w.qoe.score);
    const wifiRow = document.createElement('div');
    wifiRow.className = 'hop-row hop-row-wifi';
    wifiRow.innerHTML = `
      <div class="hop-col-num">
        <div class="hop-num-circle wifi">📶</div>
      </div>
      <div class="hop-col-bar">
        <div class="latency-bar-wrap">
          <div class="wifi-signal-bar">
            <div class="wifi-signal-fill signal-${sigClass}" style="width: ${sigPct}%"></div>
          </div>
          <div class="latency-bar-label">
            <span class="rtt-val" style="color: var(--wifi-accent)">QoE ${w.qoe.score}/100</span>
            <span>Ch ${w.channel}</span>
          </div>
        </div>
      </div>
      <div class="hop-col-info">
        <div class="hop-info-primary">
          <div class="hop-info-hostname wifi-hostname">${flow.source}</div>
          <div class="hop-info-ip">WiFi ${w.band} · ${w.standard}</div>
        </div>
        <div class="hop-info-stats">
          <div class="hop-stat">
            <div class="hop-stat-label">QoE</div>
            <div class="hop-stat-value" style="color: var(--wifi-accent)">${w.qoe.score}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">MCS</div>
            <div class="hop-stat-value">${w.mcs}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">TX PHY</div>
            <div class="hop-stat-value">${w.txPhyRate}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">RX PHY</div>
            <div class="hop-stat-value">${w.rxPhyRate}</div>
          </div>
        </div>
        <div class="hop-info-meta">
          <div class="hop-info-network">${w.band} · Ch ${w.channel}</div>
          <div class="hop-info-location">${w.standard} · MCS ${w.mcs}</div>
        </div>
      </div>
    `;
    container.appendChild(wifiRow);
  }

  // AS boundary tracking
  const asColors = ['var(--as-border-1)', 'var(--as-border-2)', 'var(--as-border-3)'];
  let asColorIdx = -1;
  let prevAsn = null;
  let prevAsnNetwork = null;
  const hopAsnColors = {};
  const asHeaders = {};

  hops.forEach((hop, idx) => {
    if (hop.asn && hop.asn !== prevAsn) {
      asColorIdx = (asColorIdx + 1) % asColors.length;
      // Insert AS header at the start of each AS group
      asHeaders[idx] = { asn: hop.asn, network: hop.network, fromNet: prevAsnNetwork };
      prevAsn = hop.asn;
      prevAsnNetwork = hop.network;
    }
    // Track the last real network name (skip timeouts with '—')
    if (hop.asn && hop.network && hop.network !== '—') {
      prevAsnNetwork = hop.network;
    }
    if (hop.asn) {
      hopAsnColors[idx] = asColors[asColorIdx];
    }
  });

  hops.forEach((hop, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === hops.length - 1;
    const isTimeout = hop.avgRtt === null;

    const row = document.createElement('div');
    row.className = `hop-row${isTimeout ? ' hop-timeout' : ''}`;

    // RTT classification
    const rttClass = isTimeout ? '' :
      hop.avgRtt < 15 ? 'good' :
      hop.avgRtt < 50 ? 'warn' : 'bad';

    const rttColorClass = isTimeout ? '' :
      hop.avgRtt < 15 ? 'rtt-good' :
      hop.avgRtt < 50 ? 'rtt-warn' : 'rtt-bad';

    const lossClass = hop.loss === 0 ? 'loss-none' :
      hop.loss < 10 ? 'loss-some' : 'loss-bad';

    // Circle class
    const circleClass = isFirst ? 'first' : isLast ? 'last' : isTimeout ? 'timeout' : '';

    // Latency bar width as % of max
    const barPct = isTimeout ? 0 : (hop.avgRtt / maxRtt) * 100;
    const minPct = isTimeout ? 0 : (hop.minRtt / maxRtt) * 100;
    const maxPct = isTimeout ? 0 : (hop.maxRtt / maxRtt) * 100;

    // Bar column HTML
    let barHtml;
    if (isTimeout) {
      barHtml = `
        <div class="latency-bar-wrap">
          <div class="latency-bar-bg">
            <div class="latency-bar-fill bad" style="width: 100%"></div>
          </div>
          <div class="latency-bar-label">
            <span class="rtt-val" style="color: var(--accent-red)">✕ timeout</span>
          </div>
        </div>
      `;
    } else {
      barHtml = `
        <div class="latency-bar-wrap">
          <div class="latency-bar-bg" style="position:relative">
            <div class="latency-range ${rttClass}" style="left:${minPct}%; width:${maxPct - minPct}%; background: currentColor;"></div>
            <div class="latency-bar-fill ${rttClass}" style="width: ${barPct}%"></div>
          </div>
          <div class="latency-bar-label">
            <span class="rtt-val ${rttColorClass}">${hop.avgRtt.toFixed(1)} ms</span>
            <span>${hop.minRtt.toFixed(1)}–${hop.maxRtt.toFixed(1)}</span>
          </div>
        </div>
      `;
    }

    // Historical comparison delta
    let deltaHtml = '';
    let pathChangeHtml = '';
    if (traceCompareMode === '2h' && !isTimeout) {
      const histHop = mockTracerouteHistorical.hops[idx];
      if (histHop && histHop.avgRtt !== null) {
        const delta = hop.avgRtt - histHop.avgRtt;
        const sign = delta > 0 ? '+' : '';
        const cls = delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : '';
        deltaHtml = `<span class="rtt-delta ${cls}">${delta > 0 ? '\u2191' : '\u2193'} ${sign}${delta.toFixed(1)}</span>`;
      }
      if (histHop && histHop.ip !== hop.ip) {
        pathChangeHtml = `<div class="hop-path-change"><span class="path-change-label">\u26A1 PATH CHANGED</span> <span class="hop-previous">was: ${histHop.hostname}</span></div>`;
      }
    }
    // Also show path change from hop's own pathChanged field (always visible)
    if (!pathChangeHtml && hop.pathChanged && hop.previousHostname) {
      pathChangeHtml = `<div class="hop-path-change"><span class="path-change-label">\u26A1 PATH CHANGED</span> <span class="hop-previous">was: ${hop.previousHostname}</span></div>`;
    }

    // Info column HTML
    let infoHtml;
    if (isTimeout) {
      infoHtml = `
        <div class="hop-info-primary">
          <div class="hop-info-hostname" style="color: var(--accent-red)">* * *</div>
          <div class="hop-info-ip">No response</div>
        </div>
        <div class="hop-info-stats">
          <div class="hop-stat">
            <div class="hop-stat-label">Loss</div>
            <div class="hop-stat-value loss-bad">100%</div>
          </div>
        </div>
      `;
    } else {
      infoHtml = `
        <div class="hop-info-primary">
          <div class="hop-info-hostname">${hop.hostname}</div>
          <div class="hop-info-ip">${hop.ip}</div>
          ${pathChangeHtml}
        </div>
        <div class="hop-info-stats">
          <div class="hop-stat">
            <div class="hop-stat-label">Avg</div>
            <div class="hop-stat-value ${rttColorClass}">${hop.avgRtt.toFixed(1)}${deltaHtml}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">Min</div>
            <div class="hop-stat-value">${hop.minRtt.toFixed(1)}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">Max</div>
            <div class="hop-stat-value">${hop.maxRtt.toFixed(1)}</div>
          </div>
          <div class="hop-stat">
            <div class="hop-stat-label">Loss</div>
            <div class="hop-stat-value ${lossClass}">${hop.loss}%</div>
          </div>
          ${hop.jitter != null ? `<div class="hop-stat">
            <div class="hop-stat-label">Jitter</div>
            <div class="hop-stat-value ${hop.jitter < 2 ? 'jitter-low' : hop.jitter < 5 ? 'jitter-med' : 'jitter-high'}">${hop.jitter.toFixed(1)}</div>
          </div>` : ''}
        </div>
        <div class="hop-info-meta">
          <div class="hop-info-network">${hop.network}</div>
          <div class="hop-info-location">${hop.location}</div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="hop-col-num">
        <div class="hop-num-circle ${circleClass}">${hop.hop}</div>
      </div>
      <div class="hop-col-bar">${barHtml}</div>
      <div class="hop-col-info">${infoHtml}</div>
    `;

    if (pathChangeHtml) {
      row.classList.add('hop-changed');
    }

    // AS group header
    if (asHeaders[idx]) {
      const divider = document.createElement('div');
      divider.className = 'as-transition-divider';
      const h = asHeaders[idx];
      if (h.fromNet) {
        divider.innerHTML = `<span class="as-transition-label">${h.fromNet} → ${h.asn} · ${h.network}</span>`;
      } else {
        divider.innerHTML = `<span class="as-transition-label">${h.asn} · ${h.network}</span>`;
      }
      container.appendChild(divider);
    }

    // AS border color
    if (hopAsnColors[idx]) {
      row.style.borderLeft = `3px solid ${hopAsnColors[idx]}`;
    }

    container.appendChild(row);
  });
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  // Collect all unique IPs to resolve (WAN IP + all destination IPs)
  const destIps = mockFlows
    .filter(f => f.destIp && !f.destIp.startsWith('192.168.'))
    .map(f => f.destIp);
  const allIps = [WAN_IP, ...new Set(destIps)];

  // Batch GeoIP lookup for all IPs at once
  const geoResults = await geoipBatchLookup(allIps);

  // Update router location from WAN IP lookup
  if (geoResults[WAN_IP]) {
    ROUTER_LOCATION = geoResults[WAN_IP];
    console.log('Router location resolved:', ROUTER_LOCATION.city + ', ' + ROUTER_LOCATION.state);
  }

  // Update flow locations from GeoIP results
  mockFlows.forEach(flow => {
    if (geoResults[flow.destIp]) {
      const geo = geoResults[flow.destIp];
      flow.location = geo;
      flow.network = geo.org || geo.isp || flow.network;
    }
  });

  // Reconcile flow destination location using a three-tier hierarchy:
  //   Tier 1: hop whose IP exactly matches destIp  — ground truth, no comparison needed
  //   Tier 2: last responsive hop city vs GeoIP city — heuristic for anycast/CDN endpoints
  //   Tier 3: keep GeoIP as-is
  // Parses city/state/country from traceroute location strings like "Dallas, TX, US"
  function applyTracertLocation(flow, locationStr, coords, geoipCity) {
    const parts = locationStr.split(',').map(p => p.trim());
    flow.location = {
      ...flow.location,
      lat: coords.lat,
      lng: coords.lng,
      city: parts[0] || flow.location.city,
      state: parts[1] || '',
      country: parts[2] || flow.location.country,
      geoipConflict: true,
      geoipCity
    };
  }

  mockFlows.forEach(flow => {
    const traceHops = flowTraceroutes[flow.id];
    if (!traceHops || !flow.location) return;

    const geoCity = (flow.location.city || '').trim();

    // Tier 1: exact destination IP match in traceroute — unambiguous ground truth
    const exactHop = traceHops.find(h =>
      h.ip === flow.destIp && h.location && h.location !== 'Local Network' && h.location !== '\u2014'
    );
    if (exactHop) {
      const coords = CITY_COORDS[exactHop.location];
      if (coords) {
        const traceCity = exactHop.location.split(',')[0].trim();
        if (traceCity.toLowerCase() !== geoCity.toLowerCase()) {
          console.info(`[FlowSight] Exact IP match flow ${flow.id}: tracert="${traceCity}" overrides GeoIP="${geoCity}"`);
          applyTracertLocation(flow, exactHop.location, coords, geoCity);
        }
        return; // exact match found — skip tier 2 regardless
      }
    }

    // Tier 2: last responsive hop city differs from GeoIP city — prefer traceroute
    const lastHop = [...traceHops].reverse().find(h =>
      h.ip !== '\u2014' && h.location && h.location !== 'Local Network' && h.location !== '\u2014'
    );
    if (!lastHop) return;

    const traceCity = lastHop.location.split(',')[0].trim();
    if (traceCity && geoCity && traceCity.toLowerCase() !== geoCity.toLowerCase()) {
      const traceCoords = CITY_COORDS[lastHop.location];
      if (traceCoords) {
        console.info(`[FlowSight] GeoIP conflict flow ${flow.id}: GeoIP="${geoCity}" vs tracert last-hop="${traceCity}" — using tracert`);
        applyTracertLocation(flow, lastHop.location, traceCoords, geoCity);
      }
    }
    // Tier 3: no conflict or no CITY_COORDS entry — keep GeoIP unchanged
  });

  // Generate initial sparkline rate history
  mockFlows.forEach(flow => {
    flow.rateHistory = generateRateHistory(flow.rx_bps);
  });

  renderFlowList();
  initMap();

  // Live sparkline updates every 5 seconds
  setInterval(() => {
    mockFlows.forEach(flow => {
      if (flow.rateHistory) {
        const base = flow.rx_bps;
        flow.rateHistory.shift();
        flow.rateHistory.push(Math.max(0, base + (Math.random() - 0.5) * base * 0.4));
      }
    });
    // Update only sparkline SVGs without re-rendering full list
    document.querySelectorAll('.flow-item').forEach((item, idx) => {
      const svg = item.querySelector('.sparkline-svg');
      const visibleFlows = mockFlows.filter(f => f.location);
      if (svg && visibleFlows[idx] && visibleFlows[idx].rateHistory) {
        svg.outerHTML = renderSparkline(visibleFlows[idx].rateHistory);
      }
    });
  }, 5000);

  // Check for expired blocks every 30 seconds
  setInterval(() => {
    let changed = false;
    for (const [ip, entry] of blockedIps) {
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        blockedIps.delete(ip);
        changed = true;
      }
    }
    if (changed) {
      updateBlockedBadge();
      renderFlowList();
      addFlowsToMap();
    }
  }, 30000);

  // Escape key closes block dialog
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideBlockDialog();
  });

  // Click outside dialog to close
  document.getElementById('blockDialogOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideBlockDialog();
  });
});

// Handle window resize
window.addEventListener('resize', () => {
  if (map) {
    map.invalidateSize();
  }
});
