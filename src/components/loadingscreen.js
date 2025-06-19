import React from "react";
import "../style/loadingscreen.css"

export default function LoadingScreen ({ onEnter, showProgress, progressValue }) {
    return (
        <div className="loading-screen">
            <div className="sun-icon top-right">☀️</div>
            <div className="sun-icon top-left">☀️</div>
            <div className="loading-content">
                <h1 className="glow-text">HALO SEMUA!<br /> SELAMAT DATANG DI WEBGIS KARYA SAYA</h1>
                <h2>Eksplorasi Potensi Energi Matahari di Manyar Sabrangan<br />Melalui Visualisasi Interaktif & Animatif</h2>
                <p className="creator">
                    Dibuat oleh:<br /> 
                    <strong>Juan Vincent Elfonda</strong><br />
                    Mahasiswa Teknik Lingkungan<br />
                    Universitas Pembangunan Nasional "Veteran" Jawa Timur
                </p>

                {!showProgress ? (
                    <button className="enter-btn" onClick={onEnter}>
                        Masuk
                    </button>
                ) : (
                  <>
                    <p className="progress-title">Memuat Peta dan Komponen WebGIS...</p>
                    <div className="progress-bar">
                        <div
                           className="progress-fill"
                           style={{ width: `${progressValue}%`}}
                        ></div>
                    </div>
                    <p className="progress-value">{progressValue}%</p>
                  </>
                )}
            </div>
        </div>
    );
}