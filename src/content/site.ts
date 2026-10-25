// Every word on the site lives here. Components only render it.
// Source of truth: the CV (Oct 2026, on Google Drive) + the published blog and repos.
// Rules: no lab paths, no VM names, no raw domains or IPs. Phone only inside the CV PDF.
// Unfinished work links to its coming-soon page (blog post / repo) with `soon: true`; never a dead link.

// `soon`: the target exists but only says "coming soon" for now; the link shows a small tag
export type Link = { label: string; href: string; soon?: boolean }

export type CaseFile = {
  id: string
  kind: 'malware' | 'cti'
  tags: string[] // used by the case-file filters
  title: string
  codename: string // the wizarding name on the folder tab
  status: 'published' | 'brewing'
  date: string
  chain: string[] // infection / research chain, shown as steps
  summary: string
  details: string[] // the full case page
  tools: string[]
  links: Link[]
  note?: string // the handwritten margin note
}

const BLOG = 'https://artfuldodger10.github.io'
const GH = 'https://github.com/ArtfulDodger10'

export const profile = {
  name: 'Nader Ayman',
  handle: 'Artful Dodger',
  roles: ['Malware Analyst', 'Reverse Engineer', 'Threat Intelligence Analyst'],
  house: 'House Gryffindor',
  tower: 'Defence Against the Dark Arts',
  tagline:
    'I take in-the-wild malware from the delivery chain to the final payload, and turn it into intelligence: config extractors, detections, infrastructure pivots and confidence-rated reports.',
  margin: 'the dark arts here are other people’s packers',
  education: {
    school: 'Menoufia University',
    faculty: 'Faculty of Electronic Engineering',
    department: 'Computer Science & Engineering Department',
    degree: 'B.Sc. Computer Science and Engineering',
    dates: 'Oct 2021 – Feb 2026',
    coursework: [
      'Operating Systems',
      'Network Security',
      'Cryptography',
      'Cyber Security',
      'Computer Architecture',
      'Cloud Computing',
    ],
  },
  location: 'Egypt',
  languages: 'Arabic (native) · English (professional working proficiency)',
}

export const links = {
  email: 'mailto:naderelsehrawii@gmail.com',
  github: GH,
  linkedin: 'https://www.linkedin.com/in/nader-ayman-569358286/',
  blog: `${BLOG}/`,
  medium: 'https://medium.com/@naderayman2829',
  // The CV lives on Google Drive so it can be updated without touching the site.
  resume: 'https://drive.google.com/file/d/1YjMK6lSwwpSh8dem5ERzQz6J0u4FHIsg/view?usp=drive_link',
}

export const about = [
  'I studied Computer Science & Engineering at the Faculty of Electronic Engineering, Menoufia University, and spent most of it inside debuggers.',
  'Since April 2026 I have been an independent malware and threat intelligence researcher: five families from real campaigns reversed in an isolated lab, each one turned into finished intelligence and detection content.',
  'I work across x86/x64 PE, .NET, Go and Android, and I write for two audiences: the analyst who needs the offsets, and the CISO who needs the bottom line.',
]

export const sortingVerdict =
  'Plenty of nerve, a mind that enjoys a locked puzzle, and a stubborn habit of checking every claim twice. Better be… GRYFFINDOR!'

export const traits = [
  { trait: 'Daring', line: 'Takes live samples from real campaigns apart, inside an isolated lab with host-only detonation.' },
  { trait: 'Nerve', line: 'Stays with the obfuscated loader until the config falls out: RC4, ChaCha20, AES, HC-128.' },
  { trait: 'Chivalry', line: 'Reports live phishing sites to the targeted brands and hosts before publishing anything.' },
]

export const experience = [
  {
    role: 'Independent Malware & Threat Intelligence Researcher',
    title: 'Auror in training',
    org: 'Self-directed, published on the blog and GitHub',
    dates: 'Apr 2026 – Present',
    place: 'Remote',
    points: [
      'Reverse engineered and documented 5 malware families from real campaigns: Lumma Stealer, XWorm, AgentTesla, KryBit ransomware and the AntiDot Android banker.',
      'Turned each case into finished intelligence: intelligence requirements, key judgments with confidence levels, Diamond Model, infrastructure pivots, STIX 2.1 in MISP and OpenCTI.',
      'Shipped detection content: Python config extractors, YARA with 0 false positives on 145,000+ clean files, Sigma to SPL and KQL, Suricata, IOC sets and ATT&CK layers.',
    ],
  },
  {
    role: 'Cyber Security Instructor',
    title: 'Defence professor',
    org: 'Udacity / EYouth · part-time',
    dates: 'Jul 2024 – Aug 2025',
    place: 'On-site',
    points: [
      'Mentored 100+ students in cybersecurity fundamentals, malware analysis and threat detection; reviewed projects and gave technical feedback.',
      'Designed and led workshops on reverse engineering methodology, Sysmon telemetry and threat hunting, built around real detection scenarios.',
    ],
  },
]

export const caseFiles: CaseFile[] = [
  {
    id: 'lumma',
    kind: 'malware',
    tags: ['Infostealers & RATs', 'Windows'],
    title: 'Lumma Stealer: two delivery chains, one config extractor',
    codename: 'The Twin Serpents',
    status: 'published',
    date: 'Oct 2026',
    chain: ['RAR lure', 'RC4 crypter', 'Dropper', '.NET clipper', 'Lumma in MSBuild.exe'],
    summary:
      'Two unrelated loaders, a Go RunPE loader and a trojanized "AIO Checker" tool, deliver Lumma payloads that hide their C2 table the same way. One extractor handles both.',
    details: [
      'Go loader: RunPE that hollows Lumma into explorer.exe. AIO Checker: an RC4 C++ crypter, a dropper and a .NET crypto clipper before hollowing Lumma into MSBuild.exe.',
      'Recovered the payload’s protections statically: ChaCha20-encrypted C2 table, MBA-obfuscated stack strings, FNV-1a hashing, Steam dead-drop resolver, Russian-locale geofence and a hypervisor check.',
      'Built static unpackers and one config extractor for both chains, from disk or from a memory dump of the hollowed process, validated on all 7 campaign samples.',
      'Released YARA rules, IOCs, an ATT&CK layer and two reports.',
      'In progress: memory forensics of the hollowed processes with Volatility 3 (malfind, yarascan, handles).',
    ],
    tools: ['IDA Pro', 'x64dbg', 'Volatility 3', 'Python', 'YARA', 'FakeNet-NG'],
    links: [
      { label: 'Go loader post', href: `${BLOG}/posts/Lumma-GO-Analysis/` },
      { label: 'C++ crypter post', href: `${BLOG}/posts/Lumma-crypter-Analysis/` },
      { label: 'Repo', href: `${GH}/lumma-stealer-campaign` },
    ],
    note: 'two loaders that share nothing, one extractor',
  },
  {
    id: 'krybit',
    kind: 'malware',
    tags: ['Ransomware', 'Windows'],
    title: 'KryBit ransomware (Babuk-derived): encryptor reversing',
    codename: 'The Locked Vault',
    status: 'brewing',
    date: 'Oct 2026',
    chain: ['CLI options', 'Recovery inhibition', 'Share enumeration', 'HC-128 encryption', 'Ransom note'],
    summary:
      'Family confirmed from its extension and mutex rather than AV labels, then the hybrid encryption scheme and the encrypted-file footer mapped and compared against published Babuk analyses.',
    details: [
      'Hybrid scheme: Curve25519 key exchange, HC-128 file encryption, SHA-512 key derivation, CRC-32 key check; encrypted-file footer layout documented.',
      'Recovery inhibition mapped: shadow copy deletion, service and process termination, hidden volume mounting.',
      'Command-line options, network share enumeration and exclusion lists; build compared against published Babuk analyses.',
      '2 YARA and 2 Sigma rules written and tested.',
    ],
    tools: ['IDA Pro', 'capa', 'FLOSS', 'YARA', 'Sigma'],
    links: [
      { label: 'Report', href: `${BLOG}/posts/KryBit-Ransomware-Analysis/`, soon: true },
      { label: 'Repo', href: `${GH}/krybit-ransomware-analysis`, soon: true },
    ],
    note: 'the write-up is still in the cauldron',
  },
  {
    id: 'antidot',
    kind: 'malware',
    tags: ['Android'],
    title: 'AntiDot Android banking trojan: threat to Egyptian banking customers',
    codename: 'The Mimic',
    status: 'brewing',
    date: 'Oct 2026',
    chain: ['Native packer', 'Hidden DEX', 'Accessibility abuse', 'Overlays + SMS role', 'C2 + target list'],
    summary:
      'A native-backed Android packer unwrapped down to the banker inside, then its abuse of Accessibility, overlays and the default SMS role documented for banks.',
    details: [
      'Packer: XOR-decoded asset manifest, per-ABI native library loaded with System.load, hidden DEX decrypted in native code and dumped with Frida.',
      'String decryption reimplemented in Python.',
      'Documented abuse of Accessibility services, overlays, the default SMS role (OTP theft), call screening and screen capture.',
      'Extracted C2 and the target-app list; mapped to ATT&CK for Mobile with detections and recommendations for banks.',
    ],
    tools: ['jadx', 'apktool', 'Frida', 'IDA Pro (ARM64)', 'Python'],
    links: [
      { label: 'Report', href: `${BLOG}/posts/AntiDot-Android-Banker-Analysis/`, soon: true },
      { label: 'Repo', href: `${GH}/antidot-android-banker`, soon: true },
    ],
    note: 'Frida did the heavy lifting here',
  },
  {
    id: 'xworm',
    kind: 'malware',
    tags: ['Infostealers & RATs', 'Windows'],
    title: 'XWorm V7.1: from phishing email to RAT',
    codename: 'The Worm in the Letter',
    status: 'published',
    date: 'Jul – Sep 2026',
    chain: ['Phishing RAR', 'JS dropper', 'PowerShell loader', 'Hollowed MSBuild.exe'],
    summary:
      'A phishing campaign traced from the RAR attachment through a gated JavaScript dropper and a PowerShell loader to XWorm loaded reflectively into MSBuild.exe.',
    details: [
      'JavaScript dropper with AES-256-CBC, ChaCha20 and XOR layers, gated behind fake-activity counters; PowerShell loader with a custom base52 decoder.',
      'Broke the config encryption (AES-256-ECB keyed by an offset-duplicated MD5 of the mutex).',
      'Static config extractor tested on 9 builds from V3.0 to V7.4, plus a MalwareBazaar hunting script.',
      'Suricata rules for the XWorm TCP C2 protocol, tested against captured traffic.',
    ],
    tools: ['dnSpy', 'x64dbg', 'PowerShell', 'Python', 'YARA', 'Suricata', 'Wireshark'],
    links: [
      { label: 'Campaign post', href: `${BLOG}/posts/Xworm-Analysis/` },
      { label: 'VBScript post', href: `${BLOG}/posts/XWorm-RAT-Malware-Analysis/` },
      { label: 'Repo', href: `${GH}/XWorm-Analysis` },
    ],
  },
  {
    id: 'agenttesla',
    kind: 'malware',
    tags: ['Infostealers & RATs', 'Windows'],
    title: 'AgentTesla: four-stage .NET loader to SMTP credential stealer',
    codename: 'The Silent Courier',
    status: 'published',
    date: 'Jun 2026',
    chain: ['XOR resource', 'ConfuserEx loader', 'Payload in image pixels', 'DeepSea hollowing', 'SMTP exfil'],
    summary:
      'Four .NET stages unpacked, from an XOR-encoded resource to a payload hidden in image pixels and DeepSea 4.1 process hollowing, ending in the SMTP exfiltration config.',
    details: [
      'Unpacked four .NET stages: XOR-encoded resource, ConfuserEx loader with a payload hidden in image pixels, DeepSea 4.1 process hollowing.',
      'Recovered the SMTP exfiltration config.',
      'Released a config extractor, YARA rules, a Splunk hunting query, IOCs and an ATT&CK layer.',
    ],
    tools: ['dnSpy', 'x64dbg', 'FakeNet-NG', 'Process Monitor', 'Wireshark', 'Splunk'],
    links: [{ label: 'Report', href: `${BLOG}/posts/AgentTesla-RAT-Full-Malware-Analysis-Report/` }],
  },
  {
    id: 'injection',
    kind: 'malware',
    tags: ['Research'],
    title: 'Process injection telemetry: WinAPI vs. direct vs. indirect syscalls',
    codename: 'The Invisible Hand',
    status: 'published',
    date: 'May 2026',
    chain: ['Classic WinAPI', 'Direct syscalls', 'Indirect syscalls', 'Sysmon telemetry', 'Sigma → SPL / KQL'],
    summary:
      'Three T1055 variants built from scratch with the same payload and target, so every telemetry difference comes from the injection method alone.',
    details: [
      'Three Sigma rules from live Sysmon telemetry (GrantedAccess masks, CallTrace, StartModule), converted to Splunk SPL and Microsoft Sentinel KQL.',
      'Five documented findings, e.g. an unexpected Event ID 8 for indirect syscalls.',
      'Corrected two widely cited documentation errors.',
      'Published false-positive tuning and a detection gap analysis (stack spoofing, BYOVD).',
    ],
    tools: ['C', 'x64 Assembly', 'Sysmon', 'Sigma', 'Splunk SPL', 'KQL'],
    links: [
      { label: 'Post', href: `${BLOG}/posts/Sysmon-mirage-v2/` },
      { label: 'Repo', href: `${GH}/sysmon-mirage-v2` },
    ],
    note: 'the docs were wrong twice',
  },
  {
    id: 'unpacking',
    kind: 'malware',
    tags: ['Research', 'Windows'],
    title: 'Manual unpacking and CTF reverse engineering',
    codename: 'The Unwrapping',
    status: 'published',
    date: '2025 – 2026',
    chain: ['Tail jump', 'Memory write', 'DEP trick', 'Call-stack backtrace', 'Injected payload'],
    summary:
      'Manual UPX and custom-packer unpacking (OEP, memory reconstruction, IAT repair) and reverse engineering writeups. Competed nationally with team Sp3c0ps, Top 5 in Egypt.',
    details: [
      'Five distinct ways to find the OEP of a 64-bit UPX binary and rebuild it, with IAT repair.',
      'CTF reverse engineering writeups on the blog and Medium.',
      'Team Sp3c0ps: ranked Top 5 in Egypt in national competitions.',
    ],
    tools: ['x64dbg', 'IDA Pro'],
    links: [
      { label: 'Unpacking post', href: `${BLOG}/posts/manual-unpacking/` },
      { label: 'Medium', href: 'https://medium.com/@naderayman2829' },
    ],
  },
  // ---- threat intelligence (shown on the Marauder's Map) ----
  {
    id: 'lumma-cti',
    kind: 'cti',
    tags: ['Threat intel'],
    title: 'Lumma Stealer campaign intelligence: from config to infrastructure',
    codename: 'Footprints on the Map',
    status: 'brewing',
    date: 'Oct 2026',
    chain: ['17 C2 domains', 'Passive enrichment', 'Clustering', 'Hunting queries', 'Diamond Model + STIX'],
    summary:
      'The 17 C2 domains recovered by my extractor, enriched from passive sources only and clustered by registrar, name servers, TLS certificates, hosting ASN and registration timing.',
    details: [
      'Clustered by registrar, name servers, TLS certificates, hosting ASN and registration timing.',
      'urlscan and Censys hunting queries written from the shared traits, each one’s precision measured (hits vs. confirmed C2s).',
      'Pivoted on campaign IDs across ThreatFox and MalwareBazaar to build a timeline.',
      'A Diamond Model per delivery chain, key judgments with confidence levels and stated gaps, and a STIX 2.1 bundle imported into MISP and OpenCTI.',
    ],
    tools: ['RDAP', 'crt.sh', 'passive DNS', 'urlscan', 'Shodan', 'Censys', 'ThreatFox', 'MISP', 'OpenCTI'],
    links: [
      { label: 'Report', href: `${BLOG}/posts/Lumma-CTI-Infrastructure/`, soon: true },
      { label: 'Campaign repo', href: `${GH}/lumma-stealer-campaign` },
    ],
  },
  {
    id: 'egypt-phishing',
    kind: 'cti',
    tags: ['Threat intel'],
    title: 'Phishing infrastructure targeting Egyptian banks and fintechs',
    codename: 'The Polyjuice Domains',
    status: 'brewing',
    date: 'Nov 2026',
    chain: ['CT logs', 'Lookalike domains', 'Clustering', 'Takedown reports', 'Open-source monitor'],
    summary:
      'Lookalike domains impersonating five Egyptian financial brands, tracked over a fixed window with passive sources only and clustered by certificates, hosting, registrars and kit traits.',
    details: [
      'Passive collection only over a fixed window: crt.sh, CertStream, urlscan, dnstwist, RDAP, Shodan, Censys.',
      'Clustered by certificates, hosting, registrars and phishing-kit traits.',
      'Open-source Python lookalike-domain monitor (certificate transparency, dnstwist, urlscan) with STIX 2.1 output.',
      'Live phishing sites reported to the brands and hosting providers before publication.',
    ],
    tools: ['crt.sh', 'CertStream', 'urlscan', 'dnstwist', 'Python', 'STIX 2.1'],
    links: [
      { label: 'Report', href: `${BLOG}/posts/Egypt-Phishing-Infrastructure/`, soon: true },
      { label: 'Monitor repo', href: `${GH}/egypt-phishing-monitor`, soon: true },
    ],
  },
  {
    id: 'ransomware-brief',
    kind: 'cti',
    tags: ['Threat intel'],
    title: 'Ransomware threat brief: Egypt and GCC',
    codename: 'The Howler',
    status: 'brewing',
    date: 'Nov 2026',
    chain: ['Leak-site claims', 'Victimology', 'TTPs from reversing', 'Detections', 'BLUF for CISOs'],
    summary:
      'A one-page BLUF brief for CISOs on a ransomware group active against Egypt and GCC organizations, with TTPs from my own reversing of its encryptor.',
    details: [
      'Victimology from leak-site data, treated as claims, not confirmed breaches.',
      'TTPs from my own reversing of the group’s encryptor.',
      'Detections and prioritized recommendations.',
    ],
    tools: ['ransomware.live', 'MITRE ATT&CK', 'IDA Pro', 'YARA', 'Sigma'],
    links: [{ label: 'Brief', href: `${BLOG}/posts/Ransomware-Brief-Egypt-GCC/`, soon: true }],
  },
]

export const charms = {
  intro:
    'Every rule comes from a sample I reversed myself, with a written reason for every string. 0 false positives across 145,000+ clean Windows files, and CI that compiles and tests each rule on every commit.',
  rules: [
    { name: 'XWorm_Payload_Generic', hits: 'any unpacked XWorm payload, V3.0 to V7.4' },
    { name: 'XWorm_Campaign_202609_PS_Loader', hits: 'the Sep 2026 PowerShell loader, scripts + memory' },
    { name: 'AgentTesla_Loader_FF_Resource', hits: 'loader decrypting resource FF with a 22-byte XOR key' },
  ],
  kinds: ['YARA', 'Sigma → SPL / KQL', 'Suricata', 'IOC sets', 'ATT&CK layers'],
  repo: `${GH}/yara-rules`,
}

export const roomOfRequirement = {
  line: 'An AI-assisted analysis workflow: an LLM agent drives IDA Pro and x64dbg under guard rules, every finding is tagged with its evidence, and a fact-check pass runs before anything is published.',
  points: ['Guard rules: no sample ever touches the host', 'Evidence-tagged findings: seen vs. inferred', 'Fact-check agent before publishing'],
  link: { label: 'Write-up', href: `${BLOG}/posts/AI-Assisted-Malware-Lab/`, soon: true },
}

// The blog stays its own site. These are the latest editions; titles match the posts.
export const prophet = {
  editions: [
    { title: 'Lumma Campaign C++ Crypter', date: 'Oct 2026', href: `${BLOG}/posts/Lumma-crypter-Analysis/`, dek: 'An obfuscated C++ crypter hollows MSBuild.exe to run a dropper, a .NET crypto clipper and Lumma.' },
    { title: 'Lumma Campaign GO Loader', date: 'Oct 2026', href: `${BLOG}/posts/Lumma-GO-Analysis/`, dek: 'A Go loader that hides Lumma Stealer inside itself and injects it into explorer.exe.' },
    { title: 'XWorm: From Phishing Email to RAT', date: 'Sep 2026', href: `${BLOG}/posts/Xworm-Analysis/`, dek: 'A multi-stage XWorm V7.1 chain, from a spoofed email to a RAT in a hollowed process.' },
    { title: 'XWorm Downloader: VBScript Analysis', date: 'Jul 2026', href: `${BLOG}/posts/XWorm-RAT-Malware-Analysis/`, dek: 'Deobfuscation and payload extraction of a dead-C2 VBScript downloader.' },
    { title: 'AgentTesla RAT', date: 'Jun 2026', href: `${BLOG}/posts/AgentTesla-RAT-Full-Malware-Analysis-Report/`, dek: 'Loader chain, steganographic payload recovery and process hollowing.' },
    { title: 'Sysmon Mirage v2', date: 'May 2026', href: `${BLOG}/posts/Sysmon-mirage-v2/`, dek: 'Three T1055 techniques and what Sysmon really sees of each.' },
  ],
  // next editions: each links to its coming-soon post (same address the real post will use)
  upcoming: [
    { title: 'KryBit ransomware report', href: `${BLOG}/posts/KryBit-Ransomware-Analysis/` },
    { title: 'AntiDot Android banker', href: `${BLOG}/posts/AntiDot-Android-Banker-Analysis/` },
    { title: 'Lumma: from config to infrastructure', href: `${BLOG}/posts/Lumma-CTI-Infrastructure/` },
    { title: 'Phishing infrastructure targeting Egyptian banks', href: `${BLOG}/posts/Egypt-Phishing-Infrastructure/` },
  ],
}

export const spellbook: { school: string; spells: string[] }[] = [
  { school: 'Reverse engineering', spells: ['IDA Pro', 'IDAPython', 'Ghidra', 'Binary Ninja', 'x64dbg', 'WinDbg', 'dnSpy', 'ILSpy', 'de4dot', 'jadx', 'apktool', 'Frida', 'capa', 'FLOSS'] },
  { school: 'Malware analysis', spells: ['Unpacking', 'Process injection & hollowing', 'API hashing', 'Config & string decryption', 'Anti-analysis', 'Crypto ID: AES, RC4, ChaCha20, HC-128, Curve25519', 'PE, .NET, ELF, DEX, APK'] },
  { school: 'Threat intelligence', spells: ['Intelligence requirements', 'ATT&CK (Enterprise + Mobile)', 'Diamond Model', 'MISP', 'OpenCTI', 'STIX 2.1 / TAXII', 'Infrastructure pivoting', 'Confidence-rated reporting', 'Executive briefings'] },
  { school: 'Intelligence sources', spells: ['VirusTotal hunting', 'MalwareBazaar', 'ThreatFox', 'URLhaus', 'urlscan', 'Shodan', 'Censys', 'crt.sh', 'CertStream', 'passive DNS', 'ransomware.live'] },
  { school: 'Detection & hunting', spells: ['YARA', 'Sigma', 'Suricata', 'Snort', 'Sysmon', 'ETW', 'Splunk SPL', 'KQL', 'Detection-as-code'] },
  { school: 'Sandboxes & forensics', spells: ['ANY.RUN', 'Triage', 'CAPE', 'REMnux', 'FLARE-VM', 'FakeNet-NG', 'Volatility 3', 'Wireshark', 'Zeek', 'Sysinternals'] },
  { school: 'Programming', spells: ['Python', 'C', 'C++', 'C#', 'x86/x64 Assembly', 'PowerShell', 'Bash', 'reading Go, ARM64, JS, VBScript'] },
  { school: 'Systems', spells: ['Windows Internals', 'Linux', 'VMware', 'Docker', 'Git', 'GitHub Actions'] },
]

export const owls = {
  certifications: ['Cyber Threat Intelligence 101 (CTI101), arcX'],
  training: [
    'Advanced Malware Analysis, Mahara-Tech',
    'Reverse Code Engineering, Mahara-Tech',
    'Cyber Security Training Camp, ITI',
    'eJPT preparation, Netriders Academy',
    'RHCSA preparation, Mahara-Tech',
    'TryHackMe Cyber Threat Intelligence path',
  ],
  ost2: ['Architecture 1001 (x86-64)', 'Symbolic Analysis', 'Reversing C++ Binaries', 'GDB'],
  reading: [
    'Practical Malware Analysis',
    'Mastering Malware Analysis',
    'Windows Internals',
    'Visual Threat Intelligence (Roccia)',
    'Intelligence-Driven Incident Response (Roberts & Brown)',
  ],
  ctf: 'Team Sp3c0ps: Top 5 in Egypt in national CTFs.',
}

// Owl-post notes: one small note per section, delivered the first time it scrolls into view.
// `section` is the element id; 'top' arrives a few seconds after the page loads.
export const owlNotes: { section: string; from: string; text: string }[] = [
  { section: 'top', from: 'Owl Post', text: 'Hover any button to hear its incantation. Click it to cast the spell.' },
  { section: 'cases', from: 'A note from the Defence classroom', text: 'Every case file is locked. Alohomora opens it.' },
  { section: 'map', from: 'Mischief afoot', text: 'These footprints follow a real Lumma infection chain, stage by stage.' },
  { section: 'room', from: 'A whisper in the corridor', text: 'This door only opens for those who say Revelio.' },
  { section: 'prophet', from: 'Hot off the press', text: 'The full write-ups live on the blog, the Daily Prophet of this castle.' },
  { section: 'spellbook', from: 'A tip from the library', text: 'Type lumos, nox or accio anywhere on the page.' },
  { section: 'owl-post', from: 'One last secret', text: 'Type expecto patronum. Someone has to.' },
  { section: 'hall', from: 'Overheard in the Great Hall', text: 'Remember: we don’t say his name. Around here he is an "unattributed threat actor".' },
  { section: 'charms', from: 'Mad-Eye’s advice', text: 'Constant vigilance. Also: test every rule against clean files first.' },
  { section: 'sorting', from: 'A note from the Ministry', text: 'Leak-site claims are claims, not confirmed breaches. Even in the wizarding world.' },
]

// Typed easter eggs that are not spells
export const whispers = {
  taboo: { from: 'The Taboo', text: 'You said the Name. Snatchers are tracing your IP… not really. But that cost you.', points: -10, reason: 'for saying the Name' },
  youKnowWho: { from: 'A nervous whisper', text: 'Shh! We don’t say his name. Not even in the logs.' },
  dementors: { from: 'A sudden chill', text: 'Dementors are drifting in. Cast a Patronus (bottom right) to send them off.' },
}

// Azkaban: every family I reversed, locked up. The cell door is the detection that catches it.
export const azkaban = {
  intro:
    'Wizard prison, malware edition. Every family I reversed is held here, and the cell door is the detection content that catches it.',
  inmates: [
    { no: '0010', name: 'Lumma Stealer', crime: 'Infostealer: browsers, wallets, sessions', sentence: 'One config extractor for both delivery chains, YARA, IOCs', status: 'locked' as const, caseId: 'lumma' },
    { no: '0071', name: 'XWorm V7.1', crime: 'Remote access trojan, sold as a service', sentence: 'Config extractor (V3.0–V7.4), YARA, Suricata', status: 'locked' as const, caseId: 'xworm' },
    { no: '0004', name: 'AgentTesla', crime: 'SMTP credential stealer in four .NET stages', sentence: 'Config extractor, YARA, Splunk hunting query', status: 'locked' as const, caseId: 'agenttesla' },
    { no: '0025', name: 'KryBit', crime: 'Babuk-derived ransomware, Curve25519 + HC-128', sentence: '2 YARA + 2 Sigma rules', status: 'trial' as const, caseId: 'krybit' },
    { no: '0128', name: 'AntiDot', crime: 'Android banker: overlays, OTP theft via SMS role', sentence: 'C2 + target list extracted, ATT&CK for Mobile', status: 'trial' as const, caseId: 'antidot' },
  ],
  dementorLine: 'The guards wander the whole castle. If it turns cold, the Patronus button is bottom right.',
}

// Points for actions that are not spells (spells carry their own in SPELLS)
export const points = {
  filter: { points: 2, reason: 'for narrowing the search' },
  prophet: { points: 10, reason: 'for reading the Daily Prophet' },
  owl: { points: 15, reason: 'for sending an owl' },
  end: { points: 25, reason: 'for reading to the very end' },
}

// The acceptance letter every visitor receives on arrival (once per browser session).
export const letter = {
  address: ['To the Visitor', 'The Glowing Screen', 'Wherever You Are Reading This'],
  school: 'The Grimoire',
  office: 'Office of Defence Against the Dark Arts',
  keeper: 'Keeper of the Case Files: Nader Ayman',
  greeting: 'Dear Visitor,',
  body: [
    'We are pleased to inform you that you have been granted a place at the Grimoire of Nader Ayman: malware analyst, reverse engineer and threat intelligence analyst.',
    'Enclosed you will find case files on the Dark Arts, a map of where the malware walked, and the charms that catch it.',
    'Term begins at once. Please present your wand.',
  ],
  signoff: 'Yours sincerely,',
  signature: 'Nader Ayman',
  title: 'Keeper of the Case Files',
  enter: 'Alohomora',
  enterHint: 'say the spell to unlock the castle',
  skip: 'Skip the letter',
  tapHint: 'tap the letter to finish writing',
  points: 10,
  reason: 'for accepting your letter',
}

// The Golden Snitch (src/magic/Snitch.tsx)
export const snitch = {
  label: 'The Golden Snitch: catch it',
  points: 150,
  reason: 'You caught the Golden Snitch!',
  owl: { from: 'Quidditch pitch', text: 'Was that the Golden Snitch? It comes back every couple of minutes. Catch it for 150 points.' },
}
