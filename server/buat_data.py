"""Bikin js/pelanggan.js dari raw.csv (dibersihkan dulu), lengkap dengan kode_segmen dari model.

Jalankan dari folder ML:
    python server/buat_data.py raw.csv js/pelanggan.js
"""
import json
import sys
from pathlib import Path

import pandas as pd

import segmen

TGL_REF = "2026-05-31"
KOLOM = [
    "id_pelanggan", "tanggal_daftar", "umur", "kecamatan", "channel_utama",
    "metode_bayar", "kategori_favorit", "jumlah_transaksi_6bln",
    "total_belanja_rp", "hari_sejak_transaksi_terakhir",
    "persen_pakai_promo", "rating_rata",
]

# ejaan kecamatan yang berantakan -> nama baku (kunci: huruf kecil tanpa spasi)
KECAMATAN = {
    "bdgwetan": "Bandung Wetan", "bandungwetan": "Bandung Wetan",
    "buahbatu": "Buahbatu", "sukajadi": "Sukajadi", "coblong": "Coblong",
    "cibeunyingkidul": "Cibeunying Kidul", "cidadap": "Cidadap",
    "sumurbandung": "Sumur Bandung", "arcamanik": "Arcamanik",
    "lengkong": "Lengkong", "antapani": "Antapani",
}


def bersihkan(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # "Rp 1.044.300" -> 1044300
    df["total_belanja_rp"] = pd.to_numeric(
        df["total_belanja_rp"].astype(str).str.replace(r"[^\d]", "", regex=True))

    # kecamatan: samakan ejaan
    kunci = df["kecamatan"].astype(str).str.lower().str.replace(r"\s+", "", regex=True)
    df["kecamatan"] = kunci.map(KECAMATAN).fillna(df["kecamatan"].str.strip())

    # umur mustahil (<10 atau >90) dikosongkan, barisnya tetap dipakai
    df["umur"] = pd.to_numeric(df["umur"], errors="coerce")
    df.loc[(df["umur"] < 10) | (df["umur"] > 90), "umur"] = None
    df["umur"] = df["umur"].astype("Int64")

    # baris ganda (ID yang sama) cukup satu
    df = df.drop_duplicates("id_pelanggan", keep="first")
    return df.sort_values("id_pelanggan").reset_index(drop=True)


def main(csv_path, out_path):
    mentah = pd.read_csv(csv_path)
    df = bersihkan(mentah)
    print(f"{len(mentah)} baris mentah -> {len(df)} pelanggan setelah dibersihkan")

    hasil = segmen.prediksi(df)
    df["kode_segmen"] = [h["kode"] for h in hasil]

    uniq = {h["kode"]: h for h in hasil}
    segmen_model = [uniq[k] for k in sorted(uniq)]

    kolom = KOLOM + ["kode_segmen"]
    baris = []
    for r in df[kolom].astype(object).where(df[kolom].notna(), None).values.tolist():
        baris.append(json.dumps(r, ensure_ascii=False))

    isi = (
        "/* dibuat otomatis oleh buat_data.py, jangan diedit manual */\n"
        f'window.TGL_REF = "{TGL_REF}";\n'
        f"window.KOLOM = {json.dumps(kolom, ensure_ascii=False)};\n"
        f"window.SEGMEN_MODEL = {json.dumps(segmen_model, ensure_ascii=False)};\n"
        "window.PELANGGAN = [\n" + ",\n".join(baris) + "\n];"
    )
    Path(out_path).write_text(isi, encoding="utf-8")
    print("Jumlah per segmen:")
    print(df["kode_segmen"].value_counts().sort_index().to_string())
    print("Ditulis ke", out_path)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])