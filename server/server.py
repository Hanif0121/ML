"""Server dashboard Kafe: melayani halaman statis + API prediksi segmen.

Jalankan:  python server.py   lalu buka http://localhost:5000
"""
import re
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request, send_from_directory

import segmen

ROOT = Path(__file__).resolve().parent.parent   # folder ML/ (berisi index.html, css/, js/)
app = Flask(__name__, static_folder=None)  # tidak ada folder statis otomatis
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0  # data.js selalu diambil ulang

KATEGORI = {"kopi", "roti", "kue_ulang_tahun", "paket_snack"}
CHANNEL = {"toko", "gofood", "grabfood", "shopeefood"}


def angka(nilai, nama, lo, hi, bulat=True):
    """Ambil angka dari input. Titik/koma/'Rp' dibuang, jadi '360.000' dan 'Rp 360.000' sama-sama valid."""
    teks = re.sub(r"[^\d]", "", str(nilai if nilai is not None else ""))
    if not teks:
        raise ValueError(f"{nama} wajib diisi dengan angka.")
    n = int(teks)
    if not lo <= n <= hi:
        raise ValueError(f"{nama} harus antara {lo:,} dan {hi:,}.".replace(",", "."))
    return n


def rp(n):
    return "Rp " + f"{round(n):,}".replace(",", ".")


@app.post("/api/prediksi")
def api_prediksi():
    d = request.get_json(silent=True) or {}
    try:
        transaksi = angka(d.get("jumlah_transaksi_6bln"), "Jumlah transaksi", 1, 1000)
        total = angka(d.get("total_belanja_rp"), "Total belanja", 1, 10**10)
        hari = angka(d.get("hari_sejak_transaksi_terakhir"), "Hari sejak transaksi terakhir", 0, 3650)
        promo = angka(d.get("persen_pakai_promo"), "Persen pakai promo", 0, 100)
        if d.get("kategori_favorit", "kopi") not in KATEGORI:
            raise ValueError("Kategori favorit tidak dikenal.")
        if d.get("channel_utama", "toko") not in CHANNEL:
            raise ValueError("Channel utama tidak dikenal.")
    except ValueError as e:
        return jsonify(error=str(e)), 400

    df = pd.DataFrame([{
        "jumlah_transaksi_6bln": transaksi,
        "total_belanja_rp": total,
        "hari_sejak_transaksi_terakhir": hari,
        "persen_pakai_promo": promo,
    }])
    hasil = segmen.prediksi(df)[0]
    hasil["id_pelanggan"] = str(d.get("id_pelanggan") or "").strip()[:40]
    hasil["ringkasan"] = (
        f"{transaksi} transaksi · rata-rata {rp(total / transaksi)} per transaksi · "
        f"terakhir {hari} hari lalu · {promo}% pakai promo"
    )
    return jsonify(hasil)


@app.get("/api/health")
def health():
    return jsonify(ok=True, segmen=sorted(n.partition(". ")[2] for n in segmen.NAMA.values()))


# Hanya index.html, css/ dan js/ yang boleh diakses browser. Folder server/ (model, kode) tertutup.
@app.get("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.get("/css/<path:path>")
def css(path):
    return send_from_directory(ROOT / "css", path)


@app.get("/js/<path:path>")
def js(path):
    return send_from_directory(ROOT / "js", path)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)