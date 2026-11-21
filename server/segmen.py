"""Satu-satunya tempat yang tahu cara memakai model_segmentasi_umkm.joblib.

Dipakai oleh server.py (prediksi satu pelanggan) dan build_data.py (seluruh CSV),
supaya hasil di form dan di dashboard SELALU dihitung dengan cara yang sama.
"""
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).with_name("model_segmentasi_umkm.joblib")

# Urutan kolom persis seperti saat scaler dilatih.
FITUR = [
    "jumlah_transaksi_6bln",
    "hari_sejak_transaksi_terakhir",
    "persen_pakai_promo",
    "rata_belanja_per_transaksi",
]

_bundle = joblib.load(MODEL_PATH)  # hanya muat file model yang kamu percaya
SCALER = _bundle["scaler"]
KMEANS = _bundle["model"]
NAMA = _bundle["mapping_nama"]          # {label_klaster: "1. Pelanggan Setia Harian", ...}
PROMO = _bundle["rekomendasi_promo"]    # {"1. Pelanggan Setia Harian": "Judul - detail", ...}


def hitung_fitur(df: pd.DataFrame) -> pd.DataFrame:
    """Transformasi yang dipakai saat training (dicocokkan dari mean/std scaler):
    log1p untuk transaksi, hari, dan rata-rata belanja; persen promo apa adanya."""
    rata = df["total_belanja_rp"] / df["jumlah_transaksi_6bln"].clip(lower=1)
    return pd.DataFrame({
        FITUR[0]: np.log1p(df["jumlah_transaksi_6bln"]),
        FITUR[1]: np.log1p(df["hari_sejak_transaksi_terakhir"]),
        FITUR[2]: df["persen_pakai_promo"],
        FITUR[3]: np.log1p(rata),
    })[FITUR]


def segmen_dari_label(label: int) -> dict:
    """Pecah "1. Pelanggan Setia Harian" jadi kode, nama bersih, dan teks promo."""
    penuh = NAMA[int(label)]
    kode, _, nama = penuh.partition(". ")
    judul, _, detail = PROMO[penuh].partition(" - ")
    return {"kode": int(kode), "nama": nama, "promo_judul": judul, "promo_detail": detail}


def prediksi(df: pd.DataFrame) -> list[dict]:
    """df wajib punya kolom: total_belanja_rp (angka), jumlah_transaksi_6bln,
    hari_sejak_transaksi_terakhir, persen_pakai_promo."""
    label = KMEANS.predict(SCALER.transform(hitung_fitur(df)))
    return [segmen_dari_label(l) for l in label]