/* Dashboard Kafe.
   Semua angka dihitung di browser dari js/pelanggan.js (dibuat oleh buat_data.py dari raw.csv).
   Filter tanggal di atas halaman berlaku untuk Ringkasan, Pesanan, Menu, dan Promo. */
(function () {
  const idr = new Intl.NumberFormat("id-ID");
  const rp = (n) => "Rp " + idr.format(Math.round(n));
  const $ = (id) => document.getElementById(id);
  const el = (tag, kelas, teks) => {
    const e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks != null) e.textContent = teks;
    return e;
  };
  const jumlah = (a, fn) => a.reduce((s, x) => s + fn(x), 0);
  const rata = (a, fn) => (a.length ? jumlah(a, fn) / a.length : 0);

  // ---------- Tab ----------
  const tabs = document.querySelectorAll(".tab");
  function bukaTab(nama) {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === nama));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + nama));
    $("filterBar").hidden = nama === "pelanggan"; // tab Pelanggan = cek satu pelanggan, tidak pakai filter
  }
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      bukaTab(t.dataset.tab);
      history.replaceState(null, "", "#" + t.dataset.tab);
    })
  );

  // ---------- Toast ----------
  const toast = $("toast");
  let timer;
  function tampilToast(teks) {
    toast.textContent = teks;
    toast.classList.add("is-show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("is-show"), 2200);
  }

  // ---------- Referensi ----------
  const CHANNEL = { toko: "Toko", gofood: "GoFood", grabfood: "GrabFood", shopeefood: "ShopeeFood" };
  const BAYAR = { qris: "QRIS", tunai: "Tunai", ewallet: "E-wallet", transfer: "Transfer" };
  const KAT = { kopi: "Kopi", roti: "Roti", kue_ulang_tahun: "Kue ulang tahun", paket_snack: "Paket snack" };

  // Segmen berasal dari model (js/pelanggan.js -> SEGMEN_MODEL). Teks "ket" diambil dari profil di notebook.
  const WARNA = { 1: "#5c7a4f", 2: "#6b4a38", 3: "#c9953c", 4: "#c8553d" };
  const KET = {
    1: "Median 28 transaksi, terakhir 5 hari lalu",
    2: "Belanja per transaksi besar (±Rp 276 rb)",
    3: "Median 82% transaksi pakai promo",
    4: "Median 110 hari tidak transaksi",
  };
  const SEGMEN_CADANGAN = [
    { kode: 1, nama: "Pelanggan Setia Harian", promo_judul: "Program Poin Loyalitas (Stamp Card: Beli 8 Kopi Gratis 1 Roti)", promo_detail: "Hindari potongan harga agar margin keuntungan tetap terjaga." },
    { kode: 2, nama: "Pembeli Borongan & Acara", promo_judul: "Paket Bundling Acara & Pengingat Momen Spesial", promo_detail: "Gratis kartu ucapan/lilin ulang tahun atau ekstra minuman untuk pesanan snack box." },
    { kode: 3, nama: "Pemburu Promo Online", promo_judul: "Voucher Diskon Bersyarat Minimum Belanja", promo_detail: "Potongan Rp 10.000 dengan min. belanja Rp 50.000 untuk paket bundling kopi + roti." },
    { kode: 4, nama: "Pelanggan Mulai Menghilang", promo_judul: "Voucher Win-Back Terbatas", promo_detail: "Diskon 40% untuk kunjungan berikutnya (berlaku 7 hari) disertai survei singkat kepuasan." },
  ];
  const SEGMEN = (window.SEGMEN_MODEL && window.SEGMEN_MODEL.length ? window.SEGMEN_MODEL : SEGMEN_CADANGAN).map((m) => ({
    kode: m.kode, nama: m.nama, warna: WARNA[m.kode], ket: KET[m.kode] || "", promo: m.promo_judul, detail: m.promo_detail,
  }));

  // ---------- Tanggal ----------
  const REF = window.TGL_REF || "2026-05-31";
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const geser = (tgl, hari) => {
    const d = new Date(tgl + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + hari);
    return d.toISOString().slice(0, 10);
  };
  const tglID = (s) => { const [y, m, d] = s.split("-"); return Number(d) + " " + BULAN[m - 1] + " " + y; };

  // ---------- Data ----------
  const K = window.KOLOM || [];
  const SEMUA = (window.PELANGGAN || []).map((r) => {
    const p = {};
    K.forEach((k, i) => (p[k] = r[i]));
    return {
      id: p.id_pelanggan, daftar: p.tanggal_daftar, umur: p.umur, kec: p.kecamatan,
      channel: p.channel_utama, bayar: p.metode_bayar, kat: p.kategori_favorit,
      trx: p.jumlah_transaksi_6bln, belanja: p.total_belanja_rp, hari: p.hari_sejak_transaksi_terakhir,
      promo: p.persen_pakai_promo, rating: p.rating_rata,
      terakhir: geser(REF, -p.hari_sejak_transaksi_terakhir),
      seg: p.kode_segmen == null ? 0 : p.kode_segmen,
    };
  });
  const ADA_SEGMEN = K.includes("kode_segmen");
  const BY_ID = new Map(SEMUA.map((p) => [p.id, p]));
  if (!SEMUA.length) console.warn("js/pelanggan.js belum dimuat / kosong. Jalankan buat_data.py dulu.");

  // ---------- Filter ----------
  const f = { basis: "daftar", dari: "", sampai: "", preset: "semua" };
  const PRESET = [["semua", "Semua"], ["d30", "30 hari terakhir"], ["d90", "90 hari terakhir"], ["d180", "6 bulan terakhir"]];
  const RENTANG = {
    semua: ["", ""], d30: [geser(REF, -29), REF], d90: [geser(REF, -89), REF], d180: [geser(REF, -179), REF],
  };
  let tersaring = [];
  let segAktif = null;

  function saring() {
    const k = f.basis === "daftar" ? "daftar" : "terakhir";
    return SEMUA.filter((p) => (!f.dari || p[k] >= f.dari) && (!f.sampai || p[k] <= f.sampai));
  }

  let chipsBox, inDari, inSampai, selBasis, info;
  function bangunFilter() {
    const bar = $("filterBar");
    chipsBox = el("div", "chips chips--tight");
    PRESET.forEach(([k, label]) => {
      const b = el("button", "chip", label);
      b.type = "button";
      b.dataset.p = k;
      b.addEventListener("click", () => { f.preset = k; [f.dari, f.sampai] = RENTANG[k]; sinkron(); render(); });
      chipsBox.append(b);
    });

    selBasis = el("select");
    [["daftar", "Tanggal daftar"], ["terakhir", "Transaksi terakhir"]].forEach(([v, t]) => {
      const o = el("option", "", t); o.value = v; selBasis.append(o);
    });
    selBasis.addEventListener("change", () => { f.basis = selBasis.value; render(); });

    inDari = el("input"); inDari.type = "date"; inDari.max = REF;
    inSampai = el("input"); inSampai.type = "date"; inSampai.max = REF;
    inDari.addEventListener("change", () => { f.dari = inDari.value; f.preset = "custom"; sinkron(); render(); });
    inSampai.addEventListener("change", () => { f.sampai = inSampai.value; f.preset = "custom"; sinkron(); render(); });

    const lab = (teks, input) => { const l = el("label", "filters__field"); l.append(el("span", "", teks), input); return l; };
    info = el("p", "filters__info");
    bar.append(chipsBox, lab("Berdasarkan", selBasis), lab("Dari", inDari), lab("Sampai", inSampai), info);
  }
  function sinkron() {
    chipsBox.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.p === f.preset));
    inDari.value = f.dari;
    inSampai.value = f.sampai;
    selBasis.value = f.basis;
  }

  // ---------- Ringkasan ----------
  function renderRingkasan(data) {
    const hilang = data.filter((p) => p.seg === 4).sort((a, b) => a.hari - b.hari);
    $("riskCount").textContent = idr.format(hilang.length);
    document.querySelector(".hero__text").textContent = hilang.length
      ? "Median " + hilang[Math.floor(hilang.length / 2)].hari + " hari sejak transaksi terakhir. Kirim voucher sebelum mereka pindah ke tempat lain."
      : "Tidak ada pelanggan di segmen ini pada periode yang dipilih.";

    const bucket = [["0–7 hari", 0, 7, false], ["8–30", 8, 30, false], ["31–60", 31, 60, false], ["61–90", 61, 90, true], [">90", 91, 1e9, true]];
    $("bar").replaceChildren();
    $("barLabels").replaceChildren();
    bucket.forEach(([label, a, b, risiko]) => {
      const n = data.filter((p) => p.hari >= a && p.hari <= b).length;
      const seg = el("div", risiko ? "is-risk" : "");
      seg.style.flex = n;
      seg.title = label + ": " + idr.format(n);
      $("bar").append(seg);
      const lab = el("span", "", label);
      lab.style.flex = n;
      $("barLabels").append(lab);
    });

    const dgRating = data.filter((p) => p.rating != null);
    const kpi = [
      ["Total pelanggan", idr.format(data.length)],
      ["Total belanja", rp(jumlah(data, (p) => p.belanja))],
      ["Rata-rata belanja per pelanggan", rp(rata(data, (p) => p.belanja))],
      ["Rata-rata rating", dgRating.length ? rata(dgRating, (p) => p.rating).toFixed(2) : "-"],
    ];
    $("kpis").replaceChildren(...kpi.map(([l, v]) => {
      const box = el("div", "kpi");
      box.append(el("small", "", l), el("strong", "", v));
      return box;
    }));

    $("segmentCards").replaceChildren(...SEGMEN.map((s) => {
      const kartu = el("button", "seg" + (segAktif === s.kode ? " is-active" : ""));
      const dot = document.createElement("i"); dot.style.background = s.warna;
      kartu.append(dot, el("h3", "", s.nama), el("strong", "", idr.format(data.filter((p) => p.seg === s.kode).length)), el("p", "", s.ket));
      kartu.addEventListener("click", () => tampilDaftar(s.kode, true));
      return kartu;
    }));

    if (segAktif) tampilDaftar(segAktif, false);
    else $("list").hidden = true;
  }

  function tampilDaftar(kode, gulir) {
    segAktif = kode;
    const s = SEGMEN.find((x) => x.kode === kode);
    const semua = tersaring.filter((p) => p.seg === kode).sort((a, b) => b.belanja - a.belanja);
    const isi = semua.slice(0, 50);
    document.querySelectorAll(".seg").forEach((c, i) => c.classList.toggle("is-active", SEGMEN[i].kode === kode));
    $("listTitle").textContent = s.nama + " · " + idr.format(semua.length) + " pelanggan" + (semua.length > 50 ? " (50 teratas menurut belanja)" : "");
    const body = $("listBody");
    body.replaceChildren();
    isi.forEach((p) => {
      const tr = document.createElement("tr");
      const td = (teks, kelas) => el("td", kelas || "", teks);
      const aksi = el("td", "num");
      const b = el("button", "btn", "Kirim voucher");
      b.addEventListener("click", () => tampilToast("Voucher dikirim ke " + p.id));
      aksi.append(b);
      tr.append(td(p.id + " · " + p.kec), td(p.hari + " hari lalu"), td(rp(p.belanja), "num"), aksi);
      body.append(tr);
    });
    $("list").hidden = false;
    if (gulir) $("list").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  $("listClose").addEventListener("click", () => {
    segAktif = null;
    $("list").hidden = true;
    document.querySelectorAll(".seg").forEach((c) => c.classList.remove("is-active"));
  });
  $("riskBtn").addEventListener("click", () => {
    tampilDaftar(4, false);
    document.querySelector(".segments").scrollIntoView({ behavior: "smooth" });
  });

  // ---------- Tren per bulan (selalu seluruh data, klik batang untuk memfilter bulan) ----------
  function renderTren() {
    const box = $("trend");
    box.replaceChildren();
    const kunci = (p) => (f.basis === "daftar" ? p.daftar : p.terakhir).slice(0, 7);
    const g = {};
    SEMUA.forEach((p) => { const k = kunci(p); g[k] = (g[k] || 0) + 1; });
    const bulan = Object.keys(g).sort();
    if (!bulan.length) return;
    const maks = Math.max(...Object.values(g));

    const head = el("div", "trend__head");
    head.append(el("h3", "", f.basis === "daftar" ? "Pelanggan baru per bulan" : "Pelanggan terakhir transaksi per bulan"), el("small", "", "klik batang untuk memfilter bulan itu"));
    const bars = el("div", "trend__bars");
    const labs = el("div", "trend__labels");
    const langkah = Math.ceil(bulan.length / 10);
    bulan.forEach((k, i) => {
      const [y, m] = k.split("-");
      const awal = k + "-01";
      const akhir = new Date(Date.UTC(Number(y), Number(m), 0)).toISOString().slice(0, 10);
      const masuk = (!f.dari || akhir >= f.dari) && (!f.sampai || awal <= f.sampai);
      const b = el("button", "trend__bar" + (masuk ? " is-in" : ""));
      b.type = "button";
      b.style.height = Math.max(3, (g[k] / maks) * 100) + "%";
      b.title = BULAN[m - 1] + " " + y + ": " + idr.format(g[k]) + " pelanggan";
      b.addEventListener("click", () => { f.dari = awal; f.sampai = akhir; f.preset = "custom"; sinkron(); render(); });
      bars.append(b);
      labs.append(el("span", "", i % langkah === 0 ? BULAN[m - 1] + " " + y.slice(2) : ""));
    });
    box.append(head, bars, labs);
  }

  // ---------- Pesanan / Menu / Promo (dihitung dari data pelanggan) ----------
  function kepala(judul, sub) {
    const h = el("div", "page-head");
    h.append(el("h2", "", judul), el("p", "", sub));
    return h;
  }
  function stat(daftar) {
    const box = el("div", "stats");
    daftar.forEach(([l, v]) => { const k = el("div", "kpi"); k.append(el("small", "", l), el("strong", "", v)); box.append(k); });
    return box;
  }
  // Daftar rinci: tiap baris = nama, total belanja, batang porsi, lalu info kecil (tanpa tabel, jadi tidak ada scroll samping)
  function panelRinci(judul, data, kunci, label) {
    const g = {};
    data.forEach((p) => {
      const x = g[p[kunci]] || (g[p[kunci]] = { n: 0, trx: 0, belanja: 0 });
      x.n++; x.trx += p.trx; x.belanja += p.belanja;
    });
    const total = jumlah(data, (p) => p.belanja) || 1;
    const baris = Object.entries(g).sort((a, b) => b[1].belanja - a[1].belanja);
    const maks = baris.length ? baris[0][1].belanja : 1;
    const panel = el("div", "panel panel--rinci");
    panel.append(el("h3", "panel__judul", judul));
    baris.forEach(([k, x]) => {
      const row = el("div", "rinci__row");
      const atas = el("div", "rinci__top");
      atas.append(el("span", "rinci__nama", (label && label[k]) || k), el("strong", "", rp(x.belanja)));
      const meter = el("div", "meter");
      const i = document.createElement("i");
      i.style.width = (x.belanja / maks) * 100 + "%";
      meter.append(i);
      row.append(atas, meter, el("small", "", idr.format(x.n) + " pelanggan · " + idr.format(x.trx) + " transaksi · " + Math.round((x.belanja / total) * 100) + "% dari total"));
      panel.append(row);
    });
    return panel;
  }

  function renderPesanan(data) {
    const v = $("view-pesanan");
    const trx = jumlah(data, (p) => p.trx), omzet = jumlah(data, (p) => p.belanja);
    const kiri = el("div", "stack");
    kiri.append(panelRinci("Per channel", data, "channel", CHANNEL), panelRinci("Per metode bayar", data, "bayar", BAYAR));
    const grid = el("div", "pesanan-grid");
    grid.append(kiri, panelRinci("Per kecamatan", data, "kec"));
    v.replaceChildren(
      kepala("Pesanan", "Total transaksi 6 bulan dari pelanggan pada periode yang dipilih."),
      stat([["Total transaksi", idr.format(trx)], ["Total belanja", rp(omzet)], ["Rata-rata per transaksi", rp(trx ? omzet / trx : 0)]]),
      grid
    );
  }

  function renderMenu(data) {
    const v = $("view-menu");
    const grid = el("div", "card-grid");
    const g = Object.keys(KAT).map((k) => {
      const d = data.filter((p) => p.kat === k);
      const r = d.filter((p) => p.rating != null);
      return { k, n: d.length, trx: jumlah(d, (p) => p.trx), belanja: jumlah(d, (p) => p.belanja), rating: r.length ? rata(r, (p) => p.rating) : null, promo: rata(d, (p) => p.promo) };
    });
    const top = Math.max(...g.map((x) => x.belanja));
    g.forEach((x) => {
      const c = el("article", "card");
      const atas = el("div", "card__top");
      atas.append(el("small", "", "Kategori favorit"));
      if (x.belanja === top && top > 0) atas.append(el("span", "badge badge--top", "Terlaris"));
      c.append(atas, el("h3", "", KAT[x.k]), el("p", "", idr.format(x.n) + " pelanggan · " + idr.format(x.trx) + " transaksi"), el("strong", "", rp(x.belanja)),
        el("small", "card__foot", (x.rating ? "Rating " + x.rating.toFixed(2) + " · " : "") + "pakai promo " + Math.round(x.promo) + "%"));
      grid.append(c);
    });
    v.replaceChildren(kepala("Menu", "Performa tiap kategori berdasarkan kategori favorit pelanggan."), grid);
  }

  function renderPromo(data) {
    const v = $("view-promo");
    const grid = el("div", "card-grid");
    SEGMEN.forEach((s) => {
      const d = data.filter((p) => p.seg === s.kode);
      const c = el("article", "card");
      const atas = el("div", "card__top");
      const nama = el("small", "", s.nama);
      const dot = el("i", "dot"); dot.style.background = s.warna; nama.prepend(dot);
      atas.append(nama, el("span", "badge badge--diproses", idr.format(d.length) + " pelanggan"));
      c.append(atas, el("h3", "", s.promo), el("p", "", s.detail),
        el("small", "card__foot", "Rata-rata pakai promo " + Math.round(rata(d, (p) => p.promo)) + "% · belanja rata-rata " + rp(rata(d, (p) => p.belanja))));
      grid.append(c);
    });
    v.replaceChildren(kepala("Promo", "Promo yang disarankan untuk tiap segmen pada periode yang dipilih."), grid);
  }

  // ---------- Render semua ----------
  function render() {
    tersaring = saring();
    info.textContent = "Menampilkan " + idr.format(tersaring.length) + " dari " + idr.format(SEMUA.length) + " pelanggan" +
      (f.dari || f.sampai ? " · " + (f.dari ? tglID(f.dari) : "awal") + " – " + (f.sampai ? tglID(f.sampai) : "sekarang") : "")
      + (ADA_SEGMEN ? "" : " · Segmen belum dihitung: jalankan python server/buat_data.py raw.csv js/pelanggan.js");
    renderRingkasan(tersaring);
    renderTren();
    renderPesanan(tersaring);
    renderMenu(tersaring);
    renderPromo(tersaring);
  }

  // ---------- Form cek segmen (tab Pelanggan) ----------
  const form = $("cekForm");
  const hasil = $("cekResult");
  const errBox = $("cekError");
  const cekBtn = $("cekBtn");
  const tampilError = (teks) => { errBox.textContent = teks; errBox.hidden = false; };

  function tampilHasil(data) {
    hasil.dataset.kode = data.kode ?? "";
    hasil.replaceChildren();
    hasil.append(el("p", "cek__label", data.id_pelanggan ? "Segmen " + data.id_pelanggan : "Segmen pelanggan"));
    const judul = el("h3", "cek__segmen");
    judul.append(el("i", "cek__dot"), document.createTextNode(data.nama || "Hasil analisis"));
    hasil.append(judul);
    if (data.ringkasan) hasil.append(el("p", "cek__stat", data.ringkasan));
    if (data.promo_judul || data.promo_detail) {
      const blok = el("div", "cek__block");
      blok.append(el("h4", "", "Promo yang cocok"));
      if (data.promo_judul) blok.append(el("p", "cek__promo-judul", data.promo_judul));
      if (data.promo_detail) blok.append(el("p", "cek__teks", data.promo_detail));
      hasil.append(blok);
    }
  }

  if (form) {
    // ketik ID yang ada di dataset -> kolom lain terisi otomatis
    form.elements.namedItem("id_pelanggan").addEventListener("change", (e) => {
      const p = BY_ID.get(e.target.value.trim().toUpperCase());
      if (!p) return;
      const isi = (n, v) => (form.elements.namedItem(n).value = v);
      isi("jumlah_transaksi_6bln", p.trx);
      isi("total_belanja_rp", idr.format(p.belanja));
      isi("hari_sejak_transaksi_terakhir", p.hari);
      isi("persen_pakai_promo", p.promo);
      isi("kategori_favorit", p.kat);
      isi("channel_utama", p.channel);
      tampilToast("Data " + p.id + " diisi dari dataset");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errBox.hidden = true;
      const fd = new FormData(form);
      const angka = (v) => Number(String(v).replace(/\./g, "").replace(/,/g, "").trim());
      const payload = {
        id_pelanggan: (fd.get("id_pelanggan") || "").trim() || null,
        jumlah_transaksi_6bln: angka(fd.get("jumlah_transaksi_6bln")),
        total_belanja_rp: angka(fd.get("total_belanja_rp")),
        hari_sejak_transaksi_terakhir: angka(fd.get("hari_sejak_transaksi_terakhir")),
        persen_pakai_promo: angka(fd.get("persen_pakai_promo")),
        kategori_favorit: fd.get("kategori_favorit"),
        channel_utama: fd.get("channel_utama"),
      };
      const wajib = [payload.jumlah_transaksi_6bln, payload.total_belanja_rp, payload.hari_sejak_transaksi_terakhir, payload.persen_pakai_promo];
      if (wajib.some((n) => !Number.isFinite(n))) return tampilError("Lengkapi semua kolom dengan angka yang valid.");
      if (payload.persen_pakai_promo < 0 || payload.persen_pakai_promo > 100) return tampilError("Persen pakai promo harus antara 0 dan 100.");

      cekBtn.disabled = true;
      cekBtn.textContent = "Menganalisis...";
      try {
        const res = await fetch("/api/prediksi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) {
          // tampilkan pesan error dari server (format {"error": ...} atau {"detail": ...})
          let pesan = "Server menjawab " + res.status;
          try {
            const j = await res.json();
            const d = j.error || j.errors || j.detail || j.pesan;
            if (d) pesan = Array.isArray(d) ? d.join(" ") : typeof d === "string" ? d : JSON.stringify(d);
          } catch (_) {}
          throw new Error(pesan);
        }
        tampilHasil(await res.json());
      } catch (err) {
        tampilError("Gagal menganalisis: " + err.message);
      } finally {
        cekBtn.disabled = false;
        cekBtn.textContent = "Analisis pelanggan";
      }
    });
  }

  // ---------- Mulai ----------
  bangunFilter();
  sinkron();
  render();
  const awal = location.hash.slice(1);
  bukaTab(awal && $("view-" + awal) ? awal : "ringkasan");
})();