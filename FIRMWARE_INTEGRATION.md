# FlowSight — Firmware Integration Guide

This document describes the data contracts, OpenWrt data sources, API endpoints, and performance considerations that firmware engineers need to implement for the FlowSight feature.

The UI mockup uses mock data. This guide maps each mock field to the real data source on the router.

---

## 1. Core Flow Discovery

### Data Source
- **flowstatd**: `ubus call flowstatd flows` — event-driven flow statistics daemon
- **classifi**: eBPF + nDPI deep packet inspection daemon — provides DPI classification and risk scoring via ubus events (`classifi.classified`)
- **Poll interval**: Every 10 seconds (flowstatd maintains live state; UI polls via ubus)

### Flow Object Schema

```json
{
  "id": "integer — unique flow identifier (conntrack ID via flowstatd)",
  "device_mac": "string — source device MAC address (flowstatd groups by Device→Host→Flow)",
  "source": "string — resolved LAN hostname (from /etc/hosts, DHCP leases, or mDNS)",
  "srcPort": "integer",
  "destination": "string — reverse DNS of destIp",
  "destIp": "string — IPv4/IPv6 address",
  "dstPort": "integer",
  "protocol": "string — 'TCP' | 'UDP'",
  "master_protocol": "string — nDPI master protocol (e.g., 'TLS', 'QUIC', 'MDNS')",
  "app_protocol": "string — nDPI application protocol (e.g., 'YouTube', 'Tailscale', 'Unknown')",
  "hostname": "string — SNI/DNS hostname extracted by classifi",
  "ja4_client": "string|null — JA4 TLS client fingerprint (classifi)",
  "protocol_stack": "string[] — protocol layers (e.g., ['Ethernet','IPv4','UDP','QUIC'])",
  "os_hint": "string|null — OS detection from TCP fingerprint (classifi)",
  "category": "string — nDPI category ('Web' | 'Media' | 'VPN' | 'Network' | '-')",
  "iface": "string — ingress interface name (lan1, wlan0, etc.)",
  "rx_bps": "integer — downstream rate in bits/sec (from fsd_stats_t)",
  "tx_bps": "integer — upstream rate in bits/sec (from fsd_stats_t)",
  "network": "string — ISP/org name from GeoIP or AS lookup"
}
```

### Rate Calculation
- flowstatd tracks byte counters per flow via conntrack netlink
- Rates are reported as `uint64_t` integers in bits/sec (`fsd_stats_t.rx_bps`, `fsd_stats_t.tx_bps`)
- Frontend formats using `formatRate(bps)` utility — no string parsing needed

---

## 2. GeoIP Resolution

### Data Source
- **Recommended**: MaxMind GeoLite2 City database (free, downloadable, runs locally)
- **Alternative**: ip-api.com batch POST API (requires internet, rate limited)
- **Fallback**: DB-IP lite

### Implementation Notes
- Download GeoLite2 `.mmdb` and use `libmaxminddb` C library on the router
- Resolve on first flow appearance, then cache by IP (TTL: 24 hours)
- Batch resolve all unique destination IPs on startup

### Fields Needed
```
lat, lon, city, regionName, country, isp, org, as (AS number + name)
```

---

## 3. WiFi Client Context (Feature 5 — "Hop 0")

### Data Source
- **iwinfo**: `iwinfo wlan0 assoclist` or `iwinfo wlan1 assoclist`
- **hostapd**: `hostapd_cli all_sta`
- **ubus**: `ubus call iwinfo assoclist '{"device":"wlan0"}'`

### Schema (per associated client)

```json
{
  "rssi": "integer — signal strength in dBm (e.g., -52)",
  "channel": "integer — operating channel (e.g., 149)",
  "band": "string — '2.4 GHz' | '5 GHz' | '6 GHz'",
  "standard": "string — '802.11n' | '802.11ac' | '802.11ax' | '802.11be'",
  "mcs": "integer — MCS index (0-11 for ax)",
  "txPhyRate": "string — TX PHY rate (e.g., '1201 Mbps')",
  "rxPhyRate": "string — RX PHY rate (e.g., '1081 Mbps')"
}
```

### Mapping Client to Flow
- Match flow source MAC/IP to hostapd station list
- The WiFi interface the client is associated with determines band/channel
- If client is wired (connected via Ethernet), `wifi` should be `null`

### OpenWrt Commands
```bash
# Get associated stations with signal info
iwinfo wlan0 assoclist
# Output: AA:BB:CC:DD:EE:FF  -52 dBm / -95 dBm (SNR 43)  1080 ms ago
#         RX: 780.0 MBit/s, MCS 9, 80MHz, VHT-NSS 2
#         TX: 866.7 MBit/s, MCS 9, 80MHz, VHT-NSS 2

# Get channel info
iwinfo wlan0 info | grep Channel

# ubus alternative
ubus call iwinfo assoclist '{"device":"wlan0"}'
```

---

## 4. Traceroute / MTR (Hop Data)

### Data Source
- **mtr**: `mtr --json -c 10 <destination_ip>` (preferred — includes jitter)
- **traceroute**: `traceroute -A <destination_ip>` (includes AS numbers)
- Install: `opkg install mtr-json` or `opkg install traceroute`

### Hop Schema

```json
{
  "hop": "integer — hop number (1-based)",
  "hostname": "string — reverse DNS or '* * *' for timeout",
  "ip": "string — hop IP or '—' for timeout",
  "avgRtt": "float|null — average RTT in ms",
  "minRtt": "float|null",
  "maxRtt": "float|null",
  "loss": "float — packet loss percentage (0-100)",
  "jitter": "float|null — standard deviation of RTT in ms (mtr 'StDev' column)",
  "asn": "string|null — AS number (e.g., 'AS7922')",
  "network": "string — ISP/org name from GeoIP",
  "location": "string — city, state from GeoIP"
}
```

### MTR JSON Output Mapping
```
mtr.hubs[i].host     → hostname
mtr.hubs[i].Avg      → avgRtt
mtr.hubs[i].Best     → minRtt
mtr.hubs[i].Wrst     → maxRtt
mtr.hubs[i].Loss%    → loss
mtr.hubs[i].StDev    → jitter
mtr.hubs[i].ASN      → asn (if using mtr -z)
```

### Performance Note
- `mtr` with 10 probes takes ~10 seconds to complete
- Run traces on-demand (user clicks "Trace Route"), not continuously
- Cache results for 5 minutes per destination

### Multi-Trace Concurrency
- The UI supports tracing up to 4 flows simultaneously (multi-trace)
- The backend must handle concurrent mtr processes — use a semaphore or queue (max 2-3 parallel `mtr` processes to avoid CPU saturation on MIPS/ARM SoCs)
- Each concurrent trace uses its own color on the map; the backend does not need to coordinate colors — that's purely frontend
- When multiple traces are active, the UI dims all non-traced flow arcs and animates each trace path independently

---

## 5. Risk Scoring (Feature 7 — nDPI via classifi)

### Data Source
- **classifi daemon**: eBPF + nDPI deep packet inspection. Risk scoring is built into nDPI — no external threat feeds needed.
- classifi emits `classifi.classified` ubus events with risk data for each classified flow
- flowstatd subscribes to these events and caches risk info per flow

### How It Works
1. classifi inspects packets via eBPF and runs nDPI protocol analysis
2. nDPI assigns a `risk_score` (integer) and a `risks` array (list of risk type strings) per flow
3. flowstatd caches the classification + risk data in its `classifi_data_t` struct
4. The UI queries `ubus call flowstatd flows` and reads the risk fields

### Risk Thresholds (from nDPI)
```
LOW:    risk_score >= 10
MEDIUM: risk_score >= 50
HIGH:   risk_score >= 100
SEVERE: risk_score >= 150
```

### Schema

```json
{
  "risk_score": "integer — cumulative nDPI risk score (0 = safe)",
  "risks": ["string — list of nDPI risk type names"]
}
```

### Example Risk Types (56 total in nDPI)
- `Malware Host Contact` — connection to known malware C2
- `Known Protocol on Non-Standard Port` — e.g., HTTP on port 8443
- `TLS Certificate Expired` — expired or self-signed cert
- `Unidirectional Traffic` — asymmetric data flow (exfiltration indicator)
- `DNS Suspicious Traffic` — DNS tunneling or anomalous queries
- `TLS Not Carrying HTTPS` — TLS wrapper around non-HTTP protocol

### Frontend Risk Utilities
```javascript
const RISK_THRESHOLDS = { LOW: 10, MEDIUM: 50, HIGH: 100, SEVERE: 150 };
isRisky(flow)       // → true if risk_score >= 10
riskSeverity(flow)  // → 'low' | 'medium' | 'high' | 'severe'
riskReason(flow)    // → comma-separated risk names
```

### Memory Budget
- No external blocklists needed — risk scoring is inline in nDPI
- classifi_data_t per flow: ~700 bytes (cached in flowstatd)

---

## 6. QoS / DSCP Classification (Feature 6)

### Data Source
- **conntrack**: The DSCP/TOS field is visible in conntrack entries
- **nftables marks**: If QoS is configured via nftables, read the DSCP mark
- **iptables**: `iptables -t mangle -L -v` shows DSCP marking rules

### Reading DSCP from conntrack
```bash
# conntrack entries include the TOS byte
conntrack -L -o extended | grep "tos="
# Or parse /proc/net/nf_conntrack — field contains TOS value
```

### DSCP to Class Mapping
```
DSCP 0   (TOS 0x00)  → BE   (Best Effort)
DSCP 10  (TOS 0x28)  → AF11
DSCP 18  (TOS 0x48)  → AF21
DSCP 26  (TOS 0x68)  → AF31
DSCP 34  (TOS 0x88)  → AF41 (Video)
DSCP 46  (TOS 0xB8)  → EF   (Voice/Expedited)
DSCP 24  (TOS 0x60)  → CS3  (Signaling)
DSCP 32  (TOS 0x80)  → CS4  (Realtime Interactive)
DSCP 40  (TOS 0xA0)  → CS5  (Broadcast Video)
DSCP 48  (TOS 0xC0)  → CS6  (Network Control)
```

### Schema
```json
{
  "class": "string — DSCP class name (e.g., 'AF41', 'EF', 'CS3', 'BE')",
  "label": "string — human-readable label (e.g., 'AF41 - Video')"
}
```

---

## 7. Rate History / Sparklines (Feature 8)

### Data Source
- flowstatd maintains per-flow statistics via `fsd_stats_t` struct
- Rate data (`rx_bps`, `tx_bps`) is available as `uint64_t` integers (bits/sec)
- flowstatd's time-series module can optionally store historical rate samples

### Implementation
- flowstatd tracks byte counters per flow via conntrack netlink events
- `ubus call flowstatd flows` returns current `rx_bps` / `tx_bps` per flow
- For sparkline history, the frontend samples the current rate every 5 seconds and maintains a 12-point ring buffer client-side
- Alternatively, flowstatd's time-series module (`fsd_timeseries_*`) can provide server-side history

### API Response
Rates are returned as integers (bits/sec) in the flow object — no string formatting server-side.

### Memory Budget
- 14 flows × 12 samples × 8 bytes = ~1.3 KB (negligible, client-side)
- flowstatd time-series: configurable via `max_entries` per series

---

## 8. Historical Trace Comparison (Feature 2)

### Implementation
- Store the last N traceroute results per destination (suggest N=3)
- Each stored trace includes a timestamp and the full hop array
- Storage: JSON file in `/tmp/flowsight/trace_history/` (tmpfs, survives reboots via backup)

### Schema
```json
{
  "timestamp": "ISO 8601 string",
  "target_ip": "string",
  "hops": ["... same schema as Section 4 ..."]
}
```

### Comparison Logic
- UI requests current trace + historical traces
- Frontend computes deltas (RTT difference, path changes) client-side

---

## 9. Path Change Detection (Feature 9)

### Implementation
- After each traceroute, compare hop IPs against the previous stored trace
- If any hop IP differs at the same hop number → flag `pathChanged: true`
- Store previous IP/hostname for the changed hop

### Schema (on flow)
```json
{
  "pathChanged": "boolean",
  "changedAt": "ISO 8601 timestamp"
}
```

### Schema (on hop, when changed)
```json
{
  "pathChanged": "boolean",
  "previousIp": "string",
  "previousHostname": "string"
}
```

---

## 10. API Integration (ubus)

All data access uses the OpenWrt ubus IPC mechanism. No custom REST API needed — JUCI's RPC gateway translates ubus calls to HTTP automatically.

### Primary Data Source — flowstatd

```bash
# Get all flows with stats, classification, and risk data
ubus call flowstatd flows
# Response: { "flows": [{ "id": N, "device_mac": "...", "src_ip": "...",
#   "dst_ip": "...", "rx_bps": 1520000, "tx_bps": 3930,
#   "master_protocol": "QUIC", "app_protocol": "Google",
#   "risk_score": 0, "risks": [], ... }] }

# Get device list (MAC-keyed hierarchy)
ubus call flowstatd devices
# Response: { "devices": [{ "mac": "AA:BB:CC:...", "hostname": "...",
#   "hosts": [{ "ip": "...", "flows": [...] }] }] }

# Get single flow detail
ubus call flowstatd flow '{"id": 1}'

# Get flow statistics
ubus call flowstatd stats '{"flow_id": 1}'

# Get all flows for a specific device
ubus call flowstatd device_flows '{"mac": "AA:BB:CC:11:22:01"}'
```

### DPI Classification — classifi

```bash
# Get classified flow data (typically consumed via flowstatd, not directly)
ubus call classifi get_flows
# Response includes: master_protocol, app_protocol, hostname, risk_score,
#   risks[], ja4_client, protocol_stack[], os_hint

# Subscribe to classification events (for real-time updates)
ubus subscribe classifi.classified
# Event payload: { "flow_id": N, "master_protocol": "TLS",
#   "app_protocol": "YouTube", "risk_score": 0, "risks": [], ... }
```

### Traceroute (on-demand)

```bash
# Run mtr trace to destination (on-demand, user-initiated)
# mtr is not a ubus service — invoke via shell or create a ubus wrapper
mtr --json -c 10 <destination_ip>

# Must support 2-3 concurrent mtr processes (multi-trace)
# Use a semaphore to cap parallel processes on MIPS/ARM SoCs
```

### GeoIP

```bash
# GeoIP resolution via local MaxMind DB
# Resolved server-side and cached — no per-request API calls
ubus call geoip lookup '{"ip": "142.251.152.119"}'
```

---

## 11. Performance Budget

| Resource | Budget | Notes |
|----------|--------|-------|
| RAM (total feature) | < 5 MB | Blocklists ~200KB, flow state ~50KB, traces ~100KB |
| DOM elements | < 500 | 14 flow items + 12 hops + map layers |
| CPU (per poll) | < 100ms | conntrack parsing + rate calc + threat check |
| Network (GeoIP) | 0 after init | Use local MaxMind DB, not API calls |
| Storage (traces) | < 1 MB | /tmp/flowsight/ on tmpfs |

---

## 12. Feature Flags

Each feature can be independently enabled/disabled. Suggested uci config:

```
config flowsight 'settings'
    option enabled '1'
    option poll_interval '10'
    option wifi_context '1'
    option risk_scoring '1'
    option dscp_overlay '1'
    option sparklines '1'
    option trace_history '1'
    option trace_history_count '3'
    option path_detection '1'
    option multi_trace '1'
    option geoip_provider 'maxmind'
```

If a feature is disabled, the API should omit the corresponding fields (or return null), and the UI will gracefully hide the related UI elements.

---

## 13. Firewall Blocking (Block Threat Flow)

### Overview
When a user identifies a threat-flagged flow, they can block it directly from the FlowSight UI. This adds the IP to an nftables set, dropping all traffic to/from that IP at the firewall.

### nftables Setup

Create a named set and drop rule at boot (via init script or hotplug):

```bash
# Create the blocked IP set (supports auto-expiry via timeout flag)
nft add set inet fw4 flowsight_blocked { type ipv4_addr \; flags timeout \; }

# Drop all traffic to the blocked IP (outbound)
nft add rule inet fw4 forward ip daddr @flowsight_blocked counter drop comment "flowsight-block-out"

# Drop all traffic from the blocked IP (inbound)
nft add rule inet fw4 forward ip saddr @flowsight_blocked counter drop comment "flowsight-block-in"
```

### API Endpoints

```
POST /api/flowsight/block
     Body: { "ip": "1.2.3.4", "duration": "1h"|"24h"|"reboot"|"permanent" }
     Action: nft add element inet fw4 flowsight_blocked { 1.2.3.4 timeout 3600s }
     Response: { "success": true, "ip": "1.2.3.4", "expiresAt": "ISO8601" }
     Notes: For "reboot" duration, omit timeout (element persists until reboot).
            For "permanent", also write to /etc/config/flowsight.

DELETE /api/flowsight/block/<ip>
     Action: nft delete element inet fw4 flowsight_blocked { <ip> }
     Response: { "success": true }

GET /api/flowsight/blocked
     Action: nft list set inet fw4 flowsight_blocked
     Response: { "blocked": [{ "ip": "1.2.3.4", "expiresAt": "ISO8601|null", "hostname": "...", "reason": "..." }] }
```

### Duration Mapping

| UI Duration | nftables Command | Persistence |
|-------------|-----------------|-------------|
| 1 hour | `timeout 3600s` | Auto-expires in nftables |
| 24 hours | `timeout 86400s` | Auto-expires in nftables |
| Until reboot | No timeout flag | Lost on reboot (RAM only) |
| Permanently | No timeout flag + UCI write | Restored by init script |

### Server-Side Safeguard Validation

**CRITICAL**: The backend MUST enforce safeguard checks independently of the frontend. Never trust client-side validation alone. Reject block requests for:

- Router WAN IP (from `uci get network.wan.ipaddr` or `ip addr show`)
- Gateway IP (typically `192.168.0.1` or from `uci get network.lan.ipaddr`)
- DNS server IPs (from `/tmp/resolv.conf.d/resolv.conf.auto`)
- All RFC1918 private ranges: `192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`
- Localhost: `127.0.0.0/8`

```bash
# Example validation in shell
validate_block_ip() {
    local ip="$1"
    local wan_ip=$(uci get network.wan.ipaddr 2>/dev/null)
    local lan_ip=$(uci get network.lan.ipaddr 2>/dev/null)

    # Reject private IPs
    echo "$ip" | grep -qE '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.)' && return 1
    # Reject WAN/LAN IPs
    [ "$ip" = "$wan_ip" ] && return 1
    [ "$ip" = "$lan_ip" ] && return 1
    # Reject configured DNS
    grep -q "$ip" /tmp/resolv.conf.d/resolv.conf.auto 2>/dev/null && return 1

    return 0
}
```

### Persistence (Permanent Blocks)

For blocks with `"permanent"` duration, write to UCI config and restore on boot:

```
# /etc/config/flowsight
config blocked_ip
    option ip '160.79.104.10'
    option hostname '160.79.104.10'
    option reason 'Malware Host Contact, TLS Certificate Expired, Known Protocol on Non-Standard Port'
    option source 'nDPI'
    option blocked_at '2026-03-07T22:00:00Z'
```

Init script (`/etc/init.d/flowsight-blocks`):

```bash
#!/bin/sh /etc/rc.common
START=99

start() {
    # Ensure set exists
    nft add set inet fw4 flowsight_blocked { type ipv4_addr \; flags timeout \; } 2>/dev/null
    nft add rule inet fw4 forward ip daddr @flowsight_blocked counter drop comment "flowsight-block-out" 2>/dev/null
    nft add rule inet fw4 forward ip saddr @flowsight_blocked counter drop comment "flowsight-block-in" 2>/dev/null

    # Restore permanent blocks from UCI
    config_load flowsight
    config_foreach restore_block blocked_ip
}

restore_block() {
    local ip
    config_get ip "$1" ip
    [ -n "$ip" ] && nft add element inet fw4 flowsight_blocked { "$ip" }
}
```

### UCI Config Extension

```
config flowsight 'blocking'
    option enabled '1'
    option max_blocked '100'
    list safeguard_ips '192.168.0.1'
    list safeguard_ips '8.8.8.8'
    list safeguard_ips '1.1.1.1'
```

### Memory & Performance

- nftables set lookup is O(1) hash — negligible CPU impact per packet
- Set storage: ~100 blocked IPs = ~4KB kernel memory
- No impact on non-blocked traffic throughput

---

## 14. Frontend-Only Features (No Firmware Work Needed)

The following capabilities are implemented entirely in the browser and require **no backend changes**. They are listed here so firmware engineers can skip them:

| Feature | Description |
|---------|-------------|
| **Map rendering** | Leaflet.js with CartoDB tiles — all client-side |
| **Arc animations** | CSS `stroke-dashoffset` animations for flow direction (download vs upload) |
| **Trace route animation** | Comet/fuse animation using `requestAnimationFrame` — a glowing dot travels the hop path with a lit trail behind it |
| **Non-traced flow dimming** | When traces are active, all other flow arcs fade to ~8% opacity and markers shrink — purely CSS/JS |
| **AS boundary detection** | Frontend groups consecutive hops by ASN field and inserts visual dividers |
| **Historical RTT deltas** | Frontend computes `current.avgRtt - historical.avgRtt` per hop — backend just provides the raw hop arrays |
| **Sparkline rendering** | Inline SVG generated from the `rateHistory` array — no canvas or chart library |
| **Theme switching** | CSS custom properties swap between dark/light; map tiles swap between CartoDB dark/light |
| **Multi-trace coloring** | Each traced flow gets a color from a fixed palette (`#f59e0b`, `#ec4899`, `#8b5cf6`, `#14b8a6`) — frontend only |
| **Block threat UI** | Confirmation dialog, blocked state styling, management panel — frontend only. Actual firewall rules require backend API |

---

## 15. Quick Start for Development

1. **Ensure SmartOS daemons are running:**
   ```bash
   # flowstatd and classifi should already be part of the SmartOS build
   # Verify they're active:
   ubus list | grep -E 'flowstatd|classifi'
   # Should show: flowstatd, classifi
   ```

2. **Install additional dependencies:**
   ```bash
   opkg update
   opkg install mtr-json libmaxminddb
   ```

3. **Download GeoLite2 database:**
   ```bash
   wget -O /usr/share/GeoIP/GeoLite2-City.mmdb \
     "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=YOUR_KEY&suffix=tar.gz"
   ```

4. **Verify data flow** — confirm flowstatd is receiving classifi events:
   ```bash
   ubus call flowstatd flows
   # Should return flows with master_protocol, app_protocol, risk_score fields populated
   ```

5. **Start with the UI integration** — the frontend is ready to consume flowstatd's ubus output. Connect the mock data replacement to real `ubus call flowstatd flows` responses.

6. **Add traceroute** second — on-demand mtr via shell or ubus wrapper, high user impact.

7. **Risk scoring works automatically** — nDPI provides risk_score and risks[] for every classified flow via classifi. No external threat feeds or cron jobs needed.
