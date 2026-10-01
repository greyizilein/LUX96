/* ==========================================================
   LUX96 — personalised invoice
   The invoice travels inside the link (#i=…), so nothing is
   stored on a server and the workshop sees exactly what the
   customer sees when they open the same link.
   ========================================================== */
(function () {
  const L = window.LUX, X = window.LuxPrice, P = X.P;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const m = location.hash.match(/[#&]i=([^&]+)/);
  const got = m && X.unpack(m[1]);
  if (!got || !got.inv || !got.inv.items) { $(".inv-empty").hidden = false; $$(".inv-print, .inv-share").forEach((b) => (b.hidden = true)); return; }
  const inv = got.inv, t = inv.totals, c = inv.customer;
  const link = location.href;
  $(".inv-wrap").hidden = false;
  if (!got.ok) $(".inv-tamper").hidden = false;
  document.title = `Invoice ${inv.id} — LUX96 Furnitures`;

  /* header & parties */
  $(".inv-id").textContent = inv.id;
  $(".inv-date").textContent = day(inv.date);
  $(".inv-valid").textContent = day(inv.valid);
  const expired = Date.now() > new Date(inv.valid).getTime();
  if (expired) $(".inv-valid").insertAdjacentHTML("beforeend", ' <em class="inv-expired">expired</em>');
  $(".inv-to").innerHTML = [esc(c.name), esc(c.phone), esc(c.email)].filter(Boolean).join("<br>");
  $(".inv-ship").innerHTML = [esc(c.address), esc(c.state), inv.install ? "<em>With on-site installation</em>" : ""].filter(Boolean).join("<br>") || "—";

  /* line items */
  $(".inv-items tbody").innerHTML = inv.items.map((it) => `
    <tr>
      <td><b>${esc(it.title)}</b>${it.qty > 1 ? ` <span class="inv-qty">× ${it.qty}</span>` : ""}<small>${esc(it.detail)}</small></td>
      <td><i class="inv-sw" data-sp="${esc(it.species)}"></i>${esc(it.timber)}<small>${esc(it.finish)}</small></td>
      <td class="num">${X.fmt(it.unit * it.qty)}</td>
    </tr>`).join("") + (c.note ? `<tr class="inv-note"><td colspan="3"><span class="label">Note</span> ${esc(c.note)}</td></tr>` : "");
  $$(".inv-sw").forEach((i) => { try { i.style.backgroundImage = `url(${Wood.texture(i.dataset.sp, 48, 48, 5, 120).toDataURL()})`; } catch (e) {} });

  /* totals */
  const rows = [
    ["Pieces", X.fmt(t.sub)],
    [`Delivery to ${esc(c.state)}${t.km ? ` (≈ ${t.km.toLocaleString()} km)` : ""}`, t.delivery ? X.fmt(t.delivery) : "Free"],
  ];
  if (inv.install) rows.push(["Installation", X.fmt(t.install)]);
  if (t.discount) rows.push(["Pay-in-full discount", `− ${X.fmt(t.discount)}`]);
  $(".inv-totals").innerHTML = rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("") +
    `<div class="inv-grand"><dt>Total</dt><dd>${X.fmt(t.total)}</dd></div>` +
    (inv.plan === "full" ? "" : `<div><dt>Balance on delivery</dt><dd>${X.fmt(t.balance)}</dd></div>`);

  /* payment — the account details appear here, and only here */
  $(".inv-paynow").textContent = X.fmt(t.payNow);
  $(".inv-plan").textContent = inv.plan === "full" ? "Full payment" : `${t.depositPct}% deposit · balance ${X.fmt(t.balance)} on delivery`;
  $(".bank-name").textContent = P.bank.name;
  $(".bank-number").textContent = P.bank.accountNumber.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3");
  if (P.bank.accountName) { $(".bank-holder").hidden = false; $(".bank-holder-name").textContent = P.bank.accountName; }
  $(".bank-ref").textContent = inv.id;
  $$(".copy").forEach((b) => b.addEventListener("click", async () => {
    const val = b.dataset.copy === "number" ? P.bank.accountNumber : inv.id;
    try { await navigator.clipboard.writeText(val); } catch (e) {
      const ta = document.createElement("textarea"); ta.value = val; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    b.textContent = "Copied ✓"; b.classList.add("done");
    L.sound && L.sound.tap();
    setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1800);
  }));

  /* WhatsApp: "I've paid" and "send to the workshop" */
  const hello = L.hello();
  const paidMsg = `${hello}, LUX96! I've paid ${X.fmt(t.payNow)} (${inv.plan === "full" ? "full payment" : `${t.depositPct}% deposit`}) for invoice ${inv.id}, using ${inv.id} as the transfer reference. I'm attaching my receipt.\n\nInvoice: ${link}`;
  const sendMsg = `${hello}, LUX96! Here is my invoice ${inv.id} for ${inv.items.length} piece${inv.items.length > 1 ? "s" : ""} — total ${X.fmt(t.total)}, ${inv.plan === "full" ? "paying in full" : `deposit ${X.fmt(t.payNow)}`}. Could you confirm before I pay?\n\n${link}`;
  $(".inv-paid").href = L.wa(paidMsg);
  $(".inv-send").href = L.wa(sendMsg);

  /* QR code of the invoice link */
  try {
    const qr = qrcode(0, "L"); qr.addData(link); qr.make();
    $(".inv-qr").innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  } catch (e) { $(".inv-qr-wrap").hidden = true; }

  /* save / share */
  $(".inv-print").addEventListener("click", () => window.print());
  $(".inv-share").addEventListener("click", async () => {
    const b = $(".inv-share");
    try {
      if (navigator.share) await navigator.share({ title: `LUX96 invoice ${inv.id}`, url: link });
      else {
        await navigator.clipboard.writeText(link);
        const lbl = b.querySelector(".share-lbl"), was = lbl.innerHTML;
        lbl.textContent = "Copied ✓"; setTimeout(() => (lbl.innerHTML = was), 1800);
      }
    } catch (e) {}
  });

  /* edit: send the pieces back to the estimator */
  try { localStorage.setItem("lux-project", JSON.stringify(inv.items.map((it) => ({ ...it, total: it.unit })))); } catch (e) {}

  /* the invoice prints out of the slot, then gets stamped */
  const paper = $(".inv");
  if (!L.reduced) {
    paper.classList.add("printing");
    L.sound && setTimeout(() => L.sound.plane(), 200);
    setTimeout(() => { paper.classList.add("stamped"); L.sound && L.sound.tap(); }, 1500);
  } else paper.classList.add("stamped");
})();
