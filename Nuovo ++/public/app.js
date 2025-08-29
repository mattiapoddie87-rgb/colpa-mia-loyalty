
const els = {
  login: document.getElementById('login-btn'),
  logout: document.getElementById('logout-btn'),
  balance: document.getElementById('balance'),
  pending: document.getElementById('pending'),
  expiring: document.getElementById('expiring'),
  ledger: document.getElementById('ledger'),
  tier: document.getElementById('tier-chip'),
  redeem: document.getElementById('redeem'),
  redeemVal: document.getElementById('redeem-val'),
  redeemEur: document.getElementById('redeem-eur'),
  cap: document.getElementById('cap'),
  service: document.getElementById('service'),
  checkout: document.getElementById('checkout'),
  refLink: document.getElementById('ref-link'),
};

function euros(v){ return (Math.round(v*100)/100).toFixed(2); }

netlifyIdentity.on('init', user => { updateUI(user); });
netlifyIdentity.on('login', user => { updateUI(user); netlifyIdentity.close(); });
netlifyIdentity.on('logout', () => { updateUI(null); });

function updateUI(user){
  if(!user){
    els.login.classList.remove('hidden');
    els.logout.classList.add('hidden');
    document.getElementById('redeem').max = 0;
    els.ledger.innerHTML = '<div class="muted">Accedi per vedere il wallet.</div>';
    els.tier.textContent = 'TIER: —';
    els.cap.textContent = '—';
    els.balance.textContent = '—';
    els.pending.textContent = '—';
    els.expiring.textContent = '—';
    els.refLink.textContent = '—';
    return;
  }
  document.getElementById('login-btn').classList.add('hidden');
  document.getElementById('logout-btn').classList.remove('hidden');
  loadWallet();
  fetch('/.netlify/functions/redeem-cap').then(r=>r.json()).then(d=>{
    els.cap.textContent = d.cap_percent;
  }).catch(()=>{});
  fetch('/.netlify/functions/get-site-url').then(r=>r.json()).then(d=>{
    if(d.site && user){ els.refLink.textContent = d.site + '?ref=' + (user.id || user.sub || 'me'); }
  }).catch(()=>{});
}

document.getElementById('login-btn').onclick = () => netlifyIdentity.open();
document.getElementById('logout-btn').onclick = () => netlifyIdentity.logout();

async function loadWallet(){
  const res = await fetch('/.netlify/functions/get-wallet');
  const data = await res.json().catch(()=>({}));
  if(!res.ok){ els.ledger.innerHTML = '<div class="muted">Errore wallet.</div>'; return; }
  els.balance.textContent = data.balance;
  els.pending.textContent = data.pending;
  els.expiring.textContent = (data.expiringSoon||[]).join(', ') || '—';
  els.tier.textContent = 'TIER: ' + (data.tier||'—').toUpperCase();
  document.getElementById('redeem').max = Math.max(0, Math.floor((data.redeemableMax||0)/15)*15);
  document.getElementById('redeem').value = 0;
  els.redeemVal.textContent = '0';
  els.redeemEur.textContent = '0.00';
  els.ledger.innerHTML = (data.ledger||[]).slice(-10).reverse().map(x=>`<div class="muted">${x.created_at} · ${x.type} · ${x.delta} min · ${x.status}</div>`).join('');
}

document.getElementById('redeem').addEventListener('input', async (e)=>{
  const mins = parseInt(e.target.value||'0',10);
  els.redeemVal.textContent = mins;
  const d = await fetch('/.netlify/functions/conversion').then(r=>r.json());
  els.redeemEur.textContent = euros(mins * d.eur_per_min);
});

els.checkout.onclick = async ()=>{
  const user = netlifyIdentity.currentUser();
  if(!user){ netlifyIdentity.open(); return; }
  const selected = els.service.options[els.service.selectedIndex];
  const price = parseFloat(selected.dataset.price);
  const redeem = parseInt(document.getElementById('redeem').value||'0',10);
  const body = { service: selected.value, price_eur: price, redeem_minutes: redeem };
  const r = await fetch('/.netlify/functions/create-checkout-session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const d = await r.json();
  if(!r.ok){ alert(d.error||'Errore checkout'); return; }
  location.href = d.url;
};

Array.from(document.querySelectorAll('[data-plan]')).forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const plan = btn.dataset.plan;
    const r = await fetch('/.netlify/functions/create-subscription', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ plan })});
    const d = await r.json();
    if(!r.ok){ alert(d.error||'Errore abbonamento'); return; }
    if(d.url){ location.href = d.url; }
  });
});
