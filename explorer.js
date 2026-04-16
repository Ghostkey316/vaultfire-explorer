/* ===== Vaultfire Explorer — On-Chain Data Fetching ===== */

const CHAINS = {
  base: {
    name: 'Base', chainId: 8453, rpc: 'https://mainnet.base.org',
    identity: '0x35978DB675576598F0781dA2133E94cdCf4858bC',
    partnership: '0xC574CF2a09B0B470933f0c6a3ef422e3fb25b4b4',
    accountability: '0xf92baef9523BC264144F80F9c31D5c5C017c6Da8',
    reputation: '0xdB54B8925664816187646174bdBb6Ac658A55a5F',
    symbol: 'ETH', explorer: 'https://basescan.org'
  },
  avalanche: {
    name: 'Avalanche', chainId: 43114, rpc: 'https://api.avax.network/ext/bc/C/rpc',
    identity: '0x57741F4116925341d8f7Eb3F381d98e07C73B4a3',
    partnership: '0xea6B504827a746d781f867441364C7A732AA4b07',
    accountability: '0xaeFEa985E0C52f92F73606657B9dA60db2798af3',
    reputation: '0x11C267C8A75B13A4D95357CEF6027c42F8e7bA24',
    symbol: 'AVAX', explorer: 'https://snowscan.xyz'
  },
  arbitrum: {
    name: 'Arbitrum', chainId: 42161, rpc: 'https://arbitrum-one.publicnode.com',
    identity: '0x6298c62FDA57276DC60de9E716fbBAc23d06D5F1',
    partnership: '0x0E777878C5b5248E1b52b09Ab5cdEb2eD6e7Da58',
    accountability: '0xfDdd2B1597c87577543176AB7f49D587876563D2',
    reputation: '0x8aceF0Bc7e07B2dE35E9069663953f41B5422218',
    symbol: 'ETH', explorer: 'https://arbiscan.io'
  },
  polygon: {
    name: 'Polygon', chainId: 137, rpc: 'https://polygon-bor-rpc.publicnode.com',
    identity: '0x6298c62FDA57276DC60de9E716fbBAc23d06D5F1',
    partnership: '0x0E777878C5b5248E1b52b09Ab5cdEb2eD6e7Da58',
    accountability: '0xfDdd2B1597c87577543176AB7f49D587876563D2',
    reputation: '0x8aceF0Bc7e07B2dE35E9069663953f41B5422218',
    symbol: 'MATIC', explorer: 'https://polygonscan.com'
  }
};

const IDENTITY_ABI = [
  'function getTotalAgents() view returns (uint256)',
  'function getAgent(address) view returns (string agentURI, bool active, string agentType, uint256 registeredAt)',
  'function isAgentActive(address) view returns (bool)'
];
const PARTNERSHIP_ABI = [
  'function nextBondId() view returns (uint256)',
  'function totalActiveBondValue() view returns (uint256)',
  'function getBondsByParticipant(address) view returns (uint256[])'
];
const PARTNERSHIP_BOND_ABI = ['function bonds(uint256) view returns (uint256 bondId, address creator, address aiAgent, string partnershipType, uint256 stake, uint256 createdAt, bool active, uint256 lastReviewTimestamp, uint8 currentHealth)'];
const ACCOUNTABILITY_ABI = [
  'function nextBondId() view returns (uint256)',
  'function totalActiveBondValue() view returns (uint256)'
];
const ACCOUNTABILITY_BOND_ABI = ['function bonds(uint256) view returns (uint256 bondId, address creator, string companyName, uint256 quarterlyRevenue, uint256 stake, uint256 createdAt, bool active, uint256 maturityDate, uint8 bondHealth)'];
const REPUTATION_ABI = [
  'function getReputation(address) view returns (uint256 averageRating, uint256 totalFeedbacks, uint256 verifiedFeedbacks, uint256 lastUpdated)'
];

// ========== Tab Navigation ==========
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ========== Chain Data Fetching ==========
const chainData = {};

async function fetchChainData(key, config) {
  try {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const identity = new ethers.Contract(config.identity, IDENTITY_ABI, provider);
    const partnership = new ethers.Contract(config.partnership, PARTNERSHIP_ABI, provider);
    const accountability = new ethers.Contract(config.accountability, ACCOUNTABILITY_ABI, provider);

    const [agents, nextPartner, nextAcct, partnerValue, acctValue] = await Promise.all([
      identity.getTotalAgents(),
      partnership.nextBondId(),
      accountability.nextBondId(),
      partnership.totalActiveBondValue().catch(() => 0n),
      accountability.totalActiveBondValue().catch(() => 0n)
    ]);

    const partnerCount = Number(nextPartner) - 1;
    const acctCount = Number(nextAcct) - 1;

    // Fetch individual bonds using bonds() mapping instead of getBond()
    const partnerBondContract = new ethers.Contract(config.partnership, PARTNERSHIP_BOND_ABI, provider);
    const partnerBonds = [];
    for (let i = 1; i <= partnerCount; i++) {
      try {
        const bond = await partnerBondContract.bonds(i);
        partnerBonds.push({
          id: i, chain: key, creator: bond[1], aiAgent: bond[2],
          type: bond[3], stake: bond[4], createdAt: Number(bond[5]),
          active: bond[6], health: Number(bond[8])
        });
      } catch (e) { /* skip unreadable bonds */ }
    }

    const acctBondContract = new ethers.Contract(config.accountability, ACCOUNTABILITY_BOND_ABI, provider);
    const acctBonds = [];
    for (let i = 1; i <= acctCount; i++) {
      try {
        const bond = await acctBondContract.bonds(i);
        acctBonds.push({
          id: i, chain: key, creator: bond[1], companyName: bond[2],
          quarterlyRevenue: bond[3], stake: bond[4], createdAt: Number(bond[5]),
          active: bond[6], maturityDate: Number(bond[7]), health: Number(bond[8])
        });
      } catch (e) { /* skip */ }
    }

    chainData[key] = {
      online: true, agents: Number(agents),
      partnershipBonds: partnerCount, accountabilityBonds: acctCount,
      partnershipValue: partnerValue, accountabilityValue: acctValue,
      partnerBondList: partnerBonds, acctBondList: acctBonds
    };
  } catch (e) {
    chainData[key] = { online: false, agents: 0, partnershipBonds: 0, accountabilityBonds: 0, partnershipValue: 0n, accountabilityValue: 0n, partnerBondList: [], acctBondList: [] };
  }
}

function renderChainCards() {
  const grid = document.getElementById('chain-grid');
  grid.innerHTML = '';
  for (const [key, config] of Object.entries(CHAINS)) {
    const d = chainData[key] || { online: false };
    const card = document.createElement('div');
    card.className = `chain-card ${key}`;
    const pVal = d.partnershipValue ? ethers.formatEther(d.partnershipValue) : '0';
    const aVal = d.accountabilityValue ? ethers.formatEther(d.accountabilityValue) : '0';
    card.innerHTML = `
      <div class="chain-name"><span class="chain-dot ${d.online ? 'live' : 'offline'}"></span>${config.name}</div>
      <div class="chain-id">Chain ID: ${config.chainId}</div>
      <div class="chain-stat"><span class="chain-stat-label">Registered Agents</span><span class="chain-stat-value">${d.agents}</span></div>
      <div class="chain-stat"><span class="chain-stat-label">Partnership Bonds</span><span class="chain-stat-value">${d.partnershipBonds}</span></div>
      <div class="chain-stat"><span class="chain-stat-label">Accountability Bonds</span><span class="chain-stat-value">${d.accountabilityBonds}</span></div>
      <div class="chain-stat"><span class="chain-stat-label">Partnership TVL</span><span class="chain-stat-value">${parseFloat(pVal).toFixed(4)} ${config.symbol}</span></div>
      <div class="chain-stat"><span class="chain-stat-label">Accountability TVL</span><span class="chain-stat-value">${parseFloat(aVal).toFixed(5)} ${config.symbol}</span></div>
    `;
    grid.appendChild(card);
  }
}

function renderHeroStats() {
  let totalAgents = 0, totalBonds = 0, totalValue = 0n;
  for (const d of Object.values(chainData)) {
    totalAgents += d.agents || 0;
    totalBonds += (d.partnershipBonds || 0) + (d.accountabilityBonds || 0);
    totalValue += (d.partnershipValue || 0n) + (d.accountabilityValue || 0n);
  }
  document.getElementById('total-agents').textContent = totalAgents;
  document.getElementById('total-bonds').textContent = totalBonds;
  document.getElementById('total-value').textContent = parseFloat(ethers.formatEther(totalValue)).toFixed(4) + ' (native)';
}

function renderBondTables() {
  // Partnership bonds
  const allPartner = Object.values(chainData).flatMap(d => d.partnerBondList || []);
  const partnerEl = document.getElementById('partnership-bonds');
  if (allPartner.length === 0) {
    partnerEl.innerHTML = '<div class="loading-msg">No partnership bonds found</div>';
  } else {
    let html = '<table class="bond-table"><thead><tr><th>Chain</th><th>Type</th><th>Stake</th><th>Created</th><th>Status</th></tr></thead><tbody>';
    for (const b of allPartner) {
      const date = b.createdAt ? new Date(b.createdAt * 1000).toLocaleDateString() : '—';
      const cfg = CHAINS[b.chain];
      html += `<tr>
        <td><span class="bond-chain ${b.chain}">${cfg.name}</span></td>
        <td class="bond-type">${b.type}</td>
        <td>${parseFloat(ethers.formatEther(b.stake)).toFixed(4)} ${cfg.symbol}</td>
        <td>${date}</td>
        <td class="${b.active ? 'bond-active' : 'bond-inactive'}">${b.active ? 'Active' : 'Inactive'}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    partnerEl.innerHTML = html;
  }

  // Accountability bonds
  const allAcct = Object.values(chainData).flatMap(d => d.acctBondList || []);
  const acctEl = document.getElementById('accountability-bonds');
  if (allAcct.length === 0) {
    acctEl.innerHTML = '<div class="loading-msg">No accountability bonds found</div>';
  } else {
    let html = '<table class="bond-table"><thead><tr><th>Chain</th><th>Company</th><th>Stake</th><th>Created</th><th>Status</th></tr></thead><tbody>';
    for (const b of allAcct) {
      const date = b.createdAt ? new Date(b.createdAt * 1000).toLocaleDateString() : '—';
      const cfg = CHAINS[b.chain];
      html += `<tr>
        <td><span class="bond-chain ${b.chain}">${cfg.name}</span></td>
        <td class="bond-type">${b.companyName}</td>
        <td>${parseFloat(ethers.formatEther(b.stake)).toFixed(4)} ${cfg.symbol}</td>
        <td>${date}</td>
        <td class="${b.active ? 'bond-active' : 'bond-inactive'}">${b.active ? 'Active' : 'Inactive'}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    acctEl.innerHTML = html;
  }
}

// ========== Agent Lookup ==========
document.getElementById('lookup-btn').addEventListener('click', lookupAgent);
document.getElementById('lookup-address').addEventListener('keydown', e => { if (e.key === 'Enter') lookupAgent(); });

async function lookupAgent() {
  const addr = document.getElementById('lookup-address').value.trim();
  if (!ethers.isAddress(addr)) { alert('Please enter a valid Ethereum address'); return; }

  const resultsEl = document.getElementById('lookup-results');
  const contentEl = document.getElementById('lookup-content');
  resultsEl.style.display = 'block';
  contentEl.innerHTML = '<div class="loading-msg">Scanning all 4 chains...</div>';

  const results = {};
  for (const [key, config] of Object.entries(CHAINS)) {
    try {
      const provider = new ethers.JsonRpcProvider(config.rpc);
      const identity = new ethers.Contract(config.identity, IDENTITY_ABI, provider);
      const reputation = new ethers.Contract(config.reputation, REPUTATION_ABI, provider);

      const agent = await identity.getAgent(addr);
      const isActive = agent[1];
      let rep = { averageRating: 0n, totalFeedbacks: 0n, verifiedFeedbacks: 0n };
      try { rep = await reputation.getReputation(addr); } catch(e) {}

      // Count bonds for this agent
      const pd = chainData[key] || {};
      const partnerBonds = (pd.partnerBondList || []).filter(b => b.creator === addr || b.aiAgent === addr);
      const acctBonds = (pd.acctBondList || []).filter(b => b.creator === addr);

      results[key] = {
        registered: isActive,
        agentType: agent[2] || '—',
        agentURI: agent[0] || '—',
        registeredAt: Number(agent[3]),
        partnerBonds: partnerBonds.length,
        acctBonds: acctBonds.length,
        totalBonds: partnerBonds.length + acctBonds.length,
        activeBonds: partnerBonds.filter(b => b.active).length + acctBonds.filter(b => b.active).length,
        reputation: { avg: Number(rep[0]), total: Number(rep[1]), verified: Number(rep[2]) }
      };
    } catch(e) {
      results[key] = { registered: false, agentType: '—', partnerBonds: 0, acctBonds: 0, totalBonds: 0, activeBonds: 0 };
    }
  }

  // Calculate Street Cred
  const cred = calculateStreetCred(results);

  // Render
  let html = `<div class="street-cred-card">
    <div class="cred-score">${cred.score}</div>
    <div class="cred-tier ${cred.tier.toLowerCase()}">${cred.tier} Tier</div>
    <div class="cred-breakdown">
      <div class="cred-item"><div class="cred-item-val">${cred.identity}</div><div class="cred-item-label">Identity</div></div>
      <div class="cred-item"><div class="cred-item-val">${cred.hasBond}</div><div class="cred-item-label">Has Bond</div></div>
      <div class="cred-item"><div class="cred-item-val">${cred.bondActive}</div><div class="cred-item-label">Active</div></div>
      <div class="cred-item"><div class="cred-item-val">${cred.tierBonus}</div><div class="cred-item-label">Tier Bonus</div></div>
      <div class="cred-item"><div class="cred-item-val">${cred.multiBonus}</div><div class="cred-item-label">Multi-Bond</div></div>
    </div>
  </div>`;

  html += '<div class="lookup-results-grid" style="margin-top:20px">';
  for (const [key, config] of Object.entries(CHAINS)) {
    const r = results[key];
    const regDate = r.registeredAt ? new Date(r.registeredAt * 1000).toLocaleDateString() : '—';
    html += `<div class="lookup-chain-card">
      <div class="lookup-chain-name"><span class="chain-dot ${r.registered ? 'live' : 'offline'}"></span>${config.name}</div>
      <div class="lookup-field"><span class="lookup-field-label">Registered</span><span class="lookup-field-value">${r.registered ? 'Yes' : 'No'}</span></div>
      <div class="lookup-field"><span class="lookup-field-label">Agent Type</span><span class="lookup-field-value">${r.agentType}</span></div>
      <div class="lookup-field"><span class="lookup-field-label">Since</span><span class="lookup-field-value">${regDate}</span></div>
      <div class="lookup-field"><span class="lookup-field-label">Partnership Bonds</span><span class="lookup-field-value">${r.partnerBonds}</span></div>
      <div class="lookup-field"><span class="lookup-field-label">Accountability Bonds</span><span class="lookup-field-value">${r.acctBonds}</span></div>
    </div>`;
  }
  html += '</div>';

  contentEl.innerHTML = html;
}

function calculateStreetCred(results) {
  let isRegistered = false, totalBonds = 0, activeBonds = 0, chainsActive = 0;
  for (const r of Object.values(results)) {
    if (r.registered) { isRegistered = true; chainsActive++; }
    totalBonds += r.totalBonds || 0;
    activeBonds += r.activeBonds || 0;
  }

  const identity = isRegistered ? 30 : 0;
  const hasBond = Math.min(25, totalBonds * 10);
  const bondActive = Math.min(15, activeBonds * 5);
  const tierBonus = totalBonds >= 5 ? 20 : totalBonds >= 3 ? 15 : totalBonds >= 1 ? 10 : 0;
  const multiBonus = Math.min(5, (chainsActive - 1) * 2);

  const score = identity + hasBond + bondActive + tierBonus + multiBonus;
  let tier = 'None';
  if (score >= 76) tier = 'Platinum';
  else if (score >= 56) tier = 'Gold';
  else if (score >= 31) tier = 'Silver';
  else if (score >= 1) tier = 'Bronze';

  return { score, tier, identity, hasBond, bondActive, tierBonus, multiBonus };
}

// ========== Initialize ==========
async function init() {
  const fetches = Object.entries(CHAINS).map(([key, config]) => fetchChainData(key, config));
  await Promise.all(fetches);
  renderHeroStats();
  renderChainCards();
  renderBondTables();
}

init();
