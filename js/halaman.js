/* Halaman Pesanan, Menu, dan Promo.
   Data di bawah ini CONTOH. Ganti dengan data asli / fetch dari API kamu. */
(function () {
  const idr = new Intl.NumberFormat("id-ID");
  const rp = (n) => "Rp " + idr.format(n);
  const $ = (id) => document.getElementById(id);

  const el = (tag, kelas, teks) => {
    const e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks != null) e.textContent = teks;
    return e;
  };

  function kepala(judul, sub) {
    const h = el("div", "page-head");
    h.append(el("h2", "", judul), el("p", "", sub));
    return h;
  }

  function chips(opsi, aktif, onPilih) {
    const box = el("div", "chips");
    opsi.forEach(([nilai, label]) => {
      const b = el("button", "chip" + (nilai === aktif ? " is-active" : ""), label);
      b.type = "button";
      b.addEventListener("click", () => {
        box.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
        b.classList.add("is-active");
        onPilih(nilai);
      });
      box.append(b);
    });
    return box;
  }

  /* =============== PESANAN =============== */
  const CHANNEL = { toko: "Toko", gofood: "GoFood", grabfood: "GrabFood", shopeefood: "ShopeeFood" };
  const STATUS = { selesai: "Selesai", diproses: "Diproses", batal: "Dibatalkan" };
  const PESANAN = [
    { id: "ORD-2051", plg: "PLG-10001", item: "Kopi Susu Aren ×2, Croissant Butter", channel: "toko", total: 64000, status: "selesai", waktu: "31 Mei · 09.12" },
    { id: "ORD-2050", plg: "PLG-10482", item: "Paket Snack Box 10 pcs", channel: "gofood", total: 135000, status: "diproses", waktu: "31 Mei · 08.47" },
    { id: "ORD-2049", plg: "PLG-10233", item: "Latte, Roti Cokelat Keju", channel: "grabfood", total: 47000, status: "selesai", waktu: "31 Mei · 08.31" },
    { id: "ORD-2048", plg: "PLG-10977", item: "Kue Red Velvet 16 cm", channel: "toko", total: 210000, status: "selesai", waktu: "30 Mei · 16.05" },
    { id: "ORD-2047", plg: "PLG-10019", item: "Americano ×2", channel: "shopeefood", total: 41000, status: "batal", waktu: "30 Mei · 14.20" },
    { id: "ORD-2046", plg: "PLG-10654", item: "Cold Brew, Roti Sosis", channel: "gofood", total: 48000, status: "selesai", waktu: "30 Mei · 12.58" },
    { id: "ORD-2045", plg: "PLG-10311", item: "Paket Rapat 25 pcs", channel: "toko", total: 290000, status: "selesai", waktu: "30 Mei · 10.14" },
    { id: "ORD-2044", plg: "PLG-10802", item: "Kopi Susu Aren, Sourdough Loaf", channel: "grabfood", total: 70000, status: "selesai", waktu: "29 Mei · 17.40" },
    { id: "ORD-2043", plg: "PLG-10140", item: "Latte ×2", channel: "toko", total: 50000, status: "selesai", waktu: "29 Mei · 15.22" },
    { id: "ORD-2042", plg: "PLG-10590", item: "Kue Tiramisu 18 cm", channel: "shopeefood", total: 230000, status: "diproses", waktu: "29 Mei · 11.03" },
  ];

  function renderPesanan() {
    const v = $("view-pesanan");
    v.replaceChildren(kepala("Pesanan", "Pesanan terbaru dari semua channel."));

    const stat = el("div", "stats");
    const panel = el("div", "panel");
    let aktif = "semua";

    function gambar() {
      const data = PESANAN.filter((p) => aktif === "semua" || p.channel === aktif);
      const sah = data.filter((p) => p.status !== "batal");
      const omzet = sah.reduce((a, p) => a + p.total, 0);

      stat.replaceChildren();
      [["Jumlah pesanan", idr.format(data.length)], ["Omzet", rp(omzet)], ["Rata-rata per pesanan", rp(sah.length ? Math.round(omzet / sah.length) : 0)]].forEach(([l, n]) => {
        const k = el("div", "kpi");
        k.append(el("small", "", l), el("strong", "", n));
        stat.append(k);
      });

      const wrap = el("div", "table-wrap");
      const t = document.createElement("table");
      const head = document.createElement("thead");
      const hr = document.createElement("tr");
      [["Pesanan"], ["Item"], ["Channel"], ["Status"], ["Total", "num"]].forEach(([h, c]) => hr.append(Object.assign(el("th", c || "", h))));
      head.append(hr);
      const body = document.createElement("tbody");
      data.forEach((p) => {
        const tr = document.createElement("tr");
        const sel = (teks, kelas) => el("td", kelas || "", teks);
        const st = document.createElement("td");
        st.append(el("span", "badge badge--" + p.status, STATUS[p.status]));
        tr.append(sel(p.id + " · " + p.plg), sel(p.item), sel(CHANNEL[p.channel]), st, sel(rp(p.total), "num"));
        body.append(tr);
      });
      t.append(head, body);
      wrap.append(t);
      panel.replaceChildren(wrap);
    }

    v.append(
      chips([["semua", "Semua channel"], ...Object.entries(CHANNEL)], aktif, (n) => { aktif = n; gambar(); }),
      stat,
      panel
    );
    gambar();
  }

  /* =============== MENU =============== */
  const KATEGORI = { kopi: "Kopi", roti: "Roti", kue_ulang_tahun: "Kue ulang tahun", paket_snack: "Paket snack" };
  const MENU = [
    { nama: "Kopi Susu Aren", kat: "kopi", harga: 22000, ket: "Espresso, susu segar, gula aren.", top: true },
    { nama: "Americano", kat: "kopi", harga: 18000, ket: "Double shot espresso dengan air panas." },
    { nama: "Latte", kat: "kopi", harga: 25000, ket: "Espresso dengan susu steamed yang lembut." },
    { nama: "Cold Brew", kat: "kopi", harga: 28000, ket: "Diseduh dingin 16 jam, rasa halus." },
    { nama: "Croissant Butter", kat: "roti", harga: 20000, ket: "Berlapis, renyah di luar, lembut di dalam.", top: true },
    { nama: "Roti Sosis", kat: "roti", harga: 15000, ket: "Roti empuk isi sosis dan saus." },
    { nama: "Roti Cokelat Keju", kat: "roti", harga: 17000, ket: "Cokelat leleh dengan parutan keju." },
    { nama: "Sourdough Loaf", kat: "roti", harga: 45000, ket: "Fermentasi alami, kerak tebal." },
    { nama: "Kue Cokelat 16 cm", kat: "kue_ulang_tahun", harga: 185000, ket: "Sponge cokelat, ganache, serut cokelat." },
    { nama: "Kue Red Velvet 16 cm", kat: "kue_ulang_tahun", harga: 210000, ket: "Cream cheese frosting.", top: true },
    { nama: "Kue Tiramisu 18 cm", kat: "kue_ulang_tahun", harga: 230000, ket: "Kopi, mascarpone, taburan kakao." },
    { nama: "Paket Snack Box 10 pcs", kat: "paket_snack", harga: 120000, ket: "Campuran roti dan kue kecil." },
    { nama: "Paket Rapat 25 pcs", kat: "paket_snack", harga: 290000, ket: "Cocok untuk meeting dan acara kantor." },
  ];

  function renderMenu() {
    const v = $("view-menu");
    v.replaceChildren(kepala("Menu", "Daftar produk dan harga saat ini."));
    const grid = el("div", "card-grid");
    let aktif = "semua";

    function gambar() {
      grid.replaceChildren();
      MENU.filter((m) => aktif === "semua" || m.kat === aktif).forEach((m) => {
        const c = el("article", "card");
        const atas = el("div", "card__top");
        atas.append(el("small", "", KATEGORI[m.kat]));
        if (m.top) atas.append(el("span", "badge badge--top", "Terlaris"));
        c.append(atas, el("h3", "", m.nama), el("p", "", m.ket), el("strong", "", rp(m.harga)));
        grid.append(c);
      });
    }

    v.append(chips([["semua", "Semua"], ...Object.entries(KATEGORI)], aktif, (n) => { aktif = n; gambar(); }), grid);
    gambar();
  }

  /* =============== PROMO =============== */
  const PROMO = [
    { judul: "Program Poin Loyalitas", detail: "Stamp card: beli 8 kopi, gratis 1 roti.", kode: 1, periode: "Berjalan terus", aktif: true },
    { judul: "Bundling Kopi + Roti", detail: "Diskon 15% untuk paket kopi dan roti pilihan.", kode: 2, periode: "1 Mei – 30 Jun 2026", aktif: true },
    { judul: "Voucher Weekend", detail: "Potongan Rp 10.000 untuk belanja minimal Rp 50.000 di akhir pekan.", kode: 3, periode: "Setiap Sabtu–Minggu", aktif: true },
    { judul: "Voucher Kembali Lagi", detail: "Diskon 25% (maks Rp 20.000), berlaku 14 hari untuk pelanggan yang lama tidak datang.", kode: 4, periode: "Berlaku 14 hari sejak dikirim", aktif: true },
    { judul: "Gratis Ongkir Aplikasi", detail: "Gratis ongkir GoFood dan GrabFood, minimal belanja Rp 60.000.", kode: null, periode: "1 – 30 Apr 2026", aktif: false },
  ];

  function renderPromo() {
    const v = $("view-promo");
    v.replaceChildren(kepala("Promo", "Promo yang berjalan dan target segmennya."));
    const grid = el("div", "card-grid");
    const segmen = (window.DATA && window.DATA.segmen) || [];

    PROMO.forEach((p) => {
      const s = segmen.find((x) => x.kode === p.kode);
      const c = el("article", "card");
      const atas = el("div", "card__top");
      const target = el("small", "", s ? s.nama : "Semua pelanggan");
      if (s && s.warna) {
        const dot = el("i", "dot");
        dot.style.background = s.warna;
        target.prepend(dot);
      }
      atas.append(target, el("span", "badge " + (p.aktif ? "badge--selesai" : "badge--batal"), p.aktif ? "Aktif" : "Berakhir"));
      c.append(atas, el("h3", "", p.judul), el("p", "", p.detail), el("small", "card__foot", p.periode));
      grid.append(c);
    });

    v.append(grid);
  }

  renderPesanan();
  renderMenu();
  renderPromo();
})();