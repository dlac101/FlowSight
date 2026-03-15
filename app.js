// ===== GeoIP Lookup =====
const WAN_IP = '99.39.42.110';

// Will be populated by GeoIP lookup
let ROUTER_LOCATION = { lat: 28.0, lng: -82.0, city: 'Loading...', state: '', country: '' };

async function geoipLookup(ip) {
  try {
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,isp,org,as`);
    const data = await resp.json();
    if (data.status === 'success') {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        state: data.regionName,
        country: data.country,
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
    const resp = await fetch('http://ip-api.com/batch?fields=status,query,country,regionName,city,lat,lon,isp,org,as', {
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
          state: r.regionName,
          country: r.country,
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
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps' },
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
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -52, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 11, txPhyRate: '1201 Mbps', rxPhyRate: '1081 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
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
    wifi: { rssi: -71, channel: 6, band: '2.4 GHz', standard: '802.11n', mcs: 7, txPhyRate: '72 Mbps', rxPhyRate: '65 Mbps' },
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
    wifi: { rssi: -61, channel: 149, band: '5 GHz', standard: '802.11ax', mcs: 9, txPhyRate: '866 Mbps', rxPhyRate: '780 Mbps' },
    risk: { risk_score: 200, risks: ['Malware Host Contact', 'TLS Certificate Expired', 'Known Protocol on Non-Standard Port'] },
    dscp: { class: 'BE', label: 'Best Effort' },
    pathChanged: false
  }
];

// Traceroute mock data for the first flow (Google - Miami)
const mockTraceroute = {
  target: mockFlows[0],
  hops: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.5, minRtt: 0.3, maxRtt: 0.8, loss: 0, jitter: 0.2, asn: null, network: 'Local Network', location: 'Miami, FL, US' },
    { hop: 2, hostname: '99-39-40-1.lightspeed.gnvlsc.sbcglobal.net', ip: '99.39.40.1', avgRtt: 8.2, minRtt: 7.1, maxRtt: 10.4, loss: 0, jitter: 1.5, asn: 'AS7018', network: 'AT&T', location: 'Gainesville, FL, US' },
    { hop: 3, hostname: 'te-0-7-0-17-sur02.miami.fl.pompano.comcast.net', ip: '68.87.218.61', avgRtt: 9.8, minRtt: 8.5, maxRtt: 12.1, loss: 0, jitter: 1.8, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 4, hostname: 'be-1301-cr01.miami.fl.ibone.comcast.net', ip: '68.86.91.133', avgRtt: 10.2, minRtt: 9.0, maxRtt: 14.5, loss: 0, jitter: 2.1, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 5, hostname: 'be-301-ar01.northdade.fl.pompano.comcast.net', ip: '68.86.93.66', avgRtt: 11.5, minRtt: 10.1, maxRtt: 15.2, loss: 0, jitter: 2.8, asn: 'AS7922', pathChanged: true, previousIp: '68.86.166.17', previousHostname: 'be-302-ar02.westdade.fl.pompano.comcast.net', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 6, hostname: 'be-33491-cs04.miami.fl.ibone.comcast.net', ip: '96.110.43.65', avgRtt: 12.0, minRtt: 10.8, maxRtt: 16.3, loss: 0, jitter: 3.5, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 7, hostname: '* * *', ip: '—', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '—', location: '—' },
    { hop: 8, hostname: '108.170.248.33', ip: '108.170.248.33', avgRtt: 14.2, minRtt: 12.8, maxRtt: 18.7, loss: 0, jitter: 2.2, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 9, hostname: '142.251.60.15', ip: '142.251.60.15', avgRtt: 15.6, minRtt: 13.2, maxRtt: 20.1, loss: 0, jitter: 3.1, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 10, hostname: '142.251.227.131', ip: '142.251.227.131', avgRtt: 17.1, minRtt: 14.5, maxRtt: 22.8, loss: 2, jitter: 4.5, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 11, hostname: 'mia07s68-in-f7.1e100.net', ip: '142.251.152.119', avgRtt: 18.4, minRtt: 15.2, maxRtt: 24.3, loss: 0, jitter: 3.8, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' }
  ]
};

// Historical traceroute for comparison (Feature 2)
const mockTracerouteHistorical = {
  timestamp: '2 hours ago',
  target: mockFlows[0],
  hops: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.6, minRtt: 0.4, maxRtt: 1.0, loss: 0, jitter: 0.3, asn: null, network: 'Local Network', location: 'Gainesville, FL, US' },
    { hop: 2, hostname: '99-39-40-1.lightspeed.gnvlsc.sbcglobal.net', ip: '99.39.40.1', avgRtt: 9.5, minRtt: 8.2, maxRtt: 12.0, loss: 0, jitter: 1.8, asn: 'AS7018', network: 'AT&T', location: 'Gainesville, FL, US' },
    { hop: 3, hostname: 'te-0-7-0-17-sur02.miami.fl.pompano.comcast.net', ip: '68.87.218.61', avgRtt: 11.2, minRtt: 9.8, maxRtt: 14.5, loss: 0, jitter: 2.1, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 4, hostname: 'be-1301-cr01.miami.fl.ibone.comcast.net', ip: '68.86.91.133', avgRtt: 12.0, minRtt: 10.5, maxRtt: 16.2, loss: 0, jitter: 2.4, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 5, hostname: 'be-302-ar02.westdade.fl.pompano.comcast.net', ip: '68.86.166.17', avgRtt: 13.8, minRtt: 11.5, maxRtt: 18.1, loss: 0, jitter: 3.2, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 6, hostname: 'be-33491-cs04.miami.fl.ibone.comcast.net', ip: '96.110.43.65', avgRtt: 14.5, minRtt: 12.2, maxRtt: 19.0, loss: 0, jitter: 3.8, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 7, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 8, hostname: '108.170.248.33', ip: '108.170.248.33', avgRtt: 16.0, minRtt: 14.0, maxRtt: 20.5, loss: 0, jitter: 2.8, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 9, hostname: '142.251.60.15', ip: '142.251.60.15', avgRtt: 17.2, minRtt: 14.8, maxRtt: 22.0, loss: 0, jitter: 3.5, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 10, hostname: '142.251.227.131', ip: '142.251.227.131', avgRtt: 19.8, minRtt: 16.5, maxRtt: 25.4, loss: 3, jitter: 5.1, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 11, hostname: 'mia07s68-in-f7.1e100.net', ip: '142.251.152.119', avgRtt: 20.1, minRtt: 17.0, maxRtt: 26.8, loss: 0, jitter: 4.2, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' }
  ]
};

// Alt traceroute for YouTube flow (Feature 3 - multi-trace)
const mockTracerouteAlt = {
  target: mockFlows[9],
  hops: [
    { hop: 1, hostname: 'gateway.lan', ip: '192.168.0.1', avgRtt: 0.4, minRtt: 0.2, maxRtt: 0.7, loss: 0, jitter: 0.2, asn: null, network: 'Local Network', location: 'Gainesville, FL, US' },
    { hop: 2, hostname: '99-39-40-1.lightspeed.gnvlsc.sbcglobal.net', ip: '99.39.40.1', avgRtt: 7.8, minRtt: 6.5, maxRtt: 9.8, loss: 0, jitter: 1.4, asn: 'AS7018', network: 'AT&T', location: 'Gainesville, FL, US' },
    { hop: 3, hostname: 'te-0-7-0-17-sur02.miami.fl.pompano.comcast.net', ip: '68.87.218.61', avgRtt: 9.2, minRtt: 7.8, maxRtt: 11.5, loss: 0, jitter: 1.6, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 4, hostname: 'be-1301-cr01.miami.fl.ibone.comcast.net', ip: '68.86.91.133', avgRtt: 10.0, minRtt: 8.5, maxRtt: 13.2, loss: 0, jitter: 2.0, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 5, hostname: 'be-33658-cs02.miami.fl.ibone.comcast.net', ip: '96.110.40.85', avgRtt: 11.8, minRtt: 10.0, maxRtt: 14.8, loss: 0, jitter: 2.5, asn: 'AS7922', network: 'Comcast', location: 'Miami, FL, US' },
    { hop: 6, hostname: '* * *', ip: '\u2014', avgRtt: null, minRtt: null, maxRtt: null, loss: 100, jitter: null, asn: null, network: '\u2014', location: '\u2014' },
    { hop: 7, hostname: '108.170.248.65', ip: '108.170.248.65', avgRtt: 12.5, minRtt: 10.8, maxRtt: 16.0, loss: 0, jitter: 2.0, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 8, hostname: '142.251.71.35', ip: '142.251.71.35', avgRtt: 13.8, minRtt: 11.5, maxRtt: 17.5, loss: 0, jitter: 2.6, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' },
    { hop: 9, hostname: 'rr3--sn-hp57yn7y.googlevideo.com', ip: '172.217.14.206', avgRtt: 14.2, minRtt: 12.0, maxRtt: 18.8, loss: 0, jitter: 2.9, asn: 'AS15169', network: 'Google LLC', location: 'Miami, FL, US' }
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

    // Arc from router to endpoint
    const arcPoints = generateArc(
      [ROUTER_LOCATION.lat, ROUTER_LOCATION.lng],
      [location.lat, location.lng],
      20
    );

    // Invisible fat polyline for easy click target
    const arcHitArea = L.polyline(arcPoints, {
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

    const arc = L.polyline(arcPoints, {
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

function generateArc(start, end, numPoints) {
  const points = [];
  const latlngs = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = start[0] + (end[0] - start[0]) * t;
    const lng = start[1] + (end[1] - start[1]) * t;

    // Add curvature
    const d = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
    const curve = Math.sin(Math.PI * t) * d * 0.15;
    latlngs.push([lat + curve, lng]);
  }

  return latlngs;
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
    }
    addFlowsToMap();
    renderFlowList();
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
    const hops = flowId === 10 ? mockTracerouteAlt.hops : mockTraceroute.hops;

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

function plotRouteOnMap(hops, flow, flowId) {
  // Clear previous route for this specific flow
  if (routeLayers[flowId]) {
    routeLayers[flowId].forEach(item => map.removeLayer(item));
  }
  routeLayers[flowId] = [];

  // Pick color based on trace index
  const traceIdx = [...activeTraceFlowIds].indexOf(flowId);
  const traceColor = TRACE_COLORS[traceIdx % TRACE_COLORS.length];

  // Re-render flow arcs (so traced flows don't show duplicate arcs)
  addFlowsToMap();

  // Collect waypoints: router -> each hop with geo -> destination
  const waypoints = [
    { lat: ROUTER_LOCATION.lat, lng: ROUTER_LOCATION.lng, label: 'Router', hop: 0, data: null }
  ];

  // Assign geo to hops; if a hop has no geo, interpolate or skip
  let lastKnownGeo = { lat: ROUTER_LOCATION.lat, lng: ROUTER_LOCATION.lng };

  hops.forEach(hop => {
    if (hop.geo) {
      // Add slight jitter if same location as previous to avoid overlapping
      let lat = hop.geo.lat;
      let lng = hop.geo.lng;
      const prev = waypoints[waypoints.length - 1];
      if (Math.abs(lat - prev.lat) < 0.01 && Math.abs(lng - prev.lng) < 0.01) {
        lat += (Math.random() - 0.5) * 0.15;
        lng += (Math.random() - 0.5) * 0.15;
      }
      waypoints.push({ lat, lng, label: hop.hostname, hop: hop.hop, data: hop });
      lastKnownGeo = { lat: hop.geo.lat, lng: hop.geo.lng };
    } else if (hop.ip === '—') {
      // Timeout hop - interpolate position between last known and next known
      waypoints.push({ lat: null, lng: null, label: '* * *', hop: hop.hop, data: hop, timeout: true });
    }
  });

  // Resolve null positions by interpolation
  for (let i = 0; i < waypoints.length; i++) {
    if (waypoints[i].lat === null) {
      const prev = waypoints[i - 1] || waypoints[0];
      let next = null;
      for (let j = i + 1; j < waypoints.length; j++) {
        if (waypoints[j].lat !== null) { next = waypoints[j]; break; }
      }
      if (!next) next = prev;
      waypoints[i].lat = (prev.lat + next.lat) / 2 + (Math.random() - 0.5) * 0.1;
      waypoints[i].lng = (prev.lng + next.lng) / 2 + (Math.random() - 0.5) * 0.1;
    }
  }

  // Draw route segments between consecutive waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const isTimeout = to.timeout;

    const segment = L.polyline(
      [[from.lat, from.lng], [to.lat, to.lng]],
      {
        color: isTimeout ? '#ef4444' : traceColor,
        weight: 2,
        opacity: isTimeout ? 0.15 : 0.2,
        dashArray: isTimeout ? '4, 8' : null,
        lineCap: 'round'
      }
    ).addTo(map);
    routeLayers[flowId].push(segment);
  }

  // Draw hop markers
  waypoints.forEach((wp, idx) => {
    if (idx === 0) return; // Skip router (already has its own marker)

    const isTimeout = wp.timeout;
    const hop = wp.data;
    const size = 8;

    const hopIcon = L.divIcon({
      className: 'hop-marker',
      html: `<div style="
        width: ${size}px; height: ${size}px;
        background: ${isTimeout ? '#ef4444' : traceColor};
        border: 2px solid ${isTimeout ? '#7f1d1d' : traceColor + '80'};
        border-radius: 50%;
        box-shadow: 0 0 6px ${isTimeout ? '#ef444480' : traceColor + '80'};
      "></div>
      <div style="
        position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
        font-size: 9px; color: ${traceColor}; font-weight: 700;
        text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        white-space: nowrap;
      ">${wp.hop}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });

    const popupHtml = isTimeout
      ? `<div class="popup-title">Hop ${wp.hop} — Timeout</div><div style="color:#ef4444">100% packet loss</div>`
      : `<div class="popup-title">Hop ${wp.hop} — ${hop.hostname}</div>
         <div class="popup-row"><span class="popup-label">IP</span><span class="popup-value">${hop.ip}</span></div>
         <div class="popup-row"><span class="popup-label">RTT</span><span class="popup-value" style="color:#34d399">${hop.avgRtt} ms</span></div>
         <div class="popup-row"><span class="popup-label">Loss</span><span class="popup-value" style="color:${hop.loss > 0 ? '#ef4444' : '#34d399'}">${hop.loss}%</span></div>
         ${hop.geo ? `<div class="popup-row"><span class="popup-label">Network</span><span class="popup-value">${hop.geo.isp || hop.geo.org || ''}</span></div>
         <div class="popup-row"><span class="popup-label">Location</span><span class="popup-value">${hop.geo.city}, ${hop.geo.state}</span></div>` : ''}`;

    const marker = L.marker([wp.lat, wp.lng], { icon: hopIcon })
      .addTo(map)
      .bindPopup(popupHtml);
    routeLayers[flowId].push(marker);
  });

  // Start fuse animation along the route
  const animPath = waypoints.map(wp => [wp.lat, wp.lng]);
  startTraceAnimation(flowId, animPath, traceColor);

  // Fit to all traced routes
  const allWaypoints = [];
  Object.values(routeLayers).forEach(layers => {
    layers.forEach(item => {
      if (item.getLatLng) allWaypoints.push(item.getLatLng());
    });
  });
  if (allWaypoints.length > 0) {
    const routeBounds = L.latLngBounds(allWaypoints);
    map.fitBounds(routeBounds.pad(0.2), { animate: true, duration: 0.5 });
  }
}

// ===== Comet / Fuse Trace Animation =====
const traceAnimations = {};

function getPositionAtFraction(points, fraction) {
  if (fraction <= 0) return points[0];
  if (fraction >= 1) return points[points.length - 1];

  // Compute segment lengths and total
  const segLens = [];
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    totalLen += len;
  }

  let target = fraction * totalLen;
  let cum = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (cum + segLens[i] >= target) {
      const t = (target - cum) / segLens[i];
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * t,
        points[i][1] + (points[i + 1][1] - points[i][1]) * t
      ];
    }
    cum += segLens[i];
  }
  return points[points.length - 1];
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
      // Update comet head position
      const pos = getPositionAtFraction(pathPoints, progress);
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
function rssiToPercent(rssi) {
  return Math.max(0, Math.min(100, ((rssi + 90) / 60) * 100));
}

function rssiClass(rssi) {
  if (rssi >= -50) return 'excellent';
  if (rssi >= -60) return 'good';
  if (rssi >= -70) return 'fair';
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
    const sigPct = rssiToPercent(w.rssi);
    const sigClass = rssiClass(w.rssi);
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
            <span class="rtt-val" style="color: var(--wifi-accent)">${w.rssi} dBm</span>
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
            <div class="hop-stat-label">RSSI</div>
            <div class="hop-stat-value" style="color: var(--wifi-accent)">${w.rssi}</div>
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

  // Generate initial sparkline rate history
  mockFlows.forEach(flow => {
    flow.rateHistory = generateRateHistory(flow.rx_bps);
  });

  renderFlowList();
  initMap();

  // Auto-trace two flows to demonstrate multi-trace with different colors
  setTimeout(async () => {
    await traceRoute(1);   // Google - amber trace
    await traceRoute(10);  // YouTube - pink trace
  }, 1500);

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
