import { useEffect, useRef, useState } from "react"; 
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { motion } from 'framer-motion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import LoadingScreen from "./components/loadingscreen";

// Konstanta Umum
const kategoriList = [
  'Sangat Tinggi', 'Tinggi', 'Sedang', 'Rendah', 'Sangat Rendah'
];

function App() {
  // State & Refs
  const mapRef = useRef(null);
  const highlightedRef = useRef(null);
  const buildingsLayerRef = useRef(null);
  const batasLayerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [theme, setTheme] = useState('light');
  const [basemap, setBasemap] = useState('osm');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [filterKategori, setFilterKategori] = useState([]);
  const [activePanel, setActivePanel] = useState(null);
  const [jumlahBangunan, setJumlahBangunan] = useState(0);
  const [totalEnergi, setTotalEnergi] = useState(0);
  const [totalEmisi, setTotalEmisi] = useState(0);
  const [totalBiaya, setTotalBiaya] = useState(0);
  const [statKategori, setStatKategori] = useState({});
  const [is3D, setIs3D] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load Animasi Awal
  const handleEnter = () => {
  setShowProgress(true);
  let value = 0;
  const interval = setInterval(() =>{
    value += Math.random() * 8;
    if (value > 100) {
      value = 100;
      clearInterval(interval);
      setTimeout(() => setIsLoading(false), 600);
    }
    setProgress(Math.floor(value));
  }, 300)
};

  // Set Tema
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  };
  
  // Layer Basemap
  const key = '3h5FQRtfKRw7KIgJw0nj';

  const osm = L.tileLayer(`https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${key}`, {
    attribution: '© MapTiler © OpenStreetMap contributors'
  });

  const satellite = L.tileLayer(`https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}.jpg?key=${key}`, {
    attribution: '© MapTiler © OpenStreetMap contributors'
  });

  const datavizDark = L.tileLayer(`https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${key}`, {
    attribution: '© MapTiler © OpenStreetMap contributors'
  });
  
  // Inisialisasi Leaflet
  useEffect(() => {
    if (isLoading) return;
    if (mapRef.current) return;

    const map = L.map('map', { zoomControl: false }).setView([-7.28000, 112.77000], 14);
    mapRef.current = map;
    osm.addTo(map);

    // Load Batas Wilayah
    fetch('/geojson/wilayah_mansab.geojson')
      .then(res => res.json())
      .then(data => {
        const batasLayer = L.geoJSON(data, {
          style: {
            color: '#003366', weight: 3, dashArray: '2,6', fillOpacity: 0
          }
        });
        batasLayer.addTo(map);
        batasLayerRef.current = batasLayer;
      });

    // Load Bangunan
      fetch('/geojson/bangunan_mansab_2.geojson')
      .then(res => res.json())
      .then(data => {
        const layer = L.geoJSON(data, {
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              setSelectedFeature(feature.properties);
              if (highlightedRef.current && buildingsLayerRef.current) {
                buildingsLayerRef.current.resetStyle(highlightedRef.current);
              }
              layer.setStyle({ color: '#ff7800', weight: 1, fillOpacity: 0.9 });
              highlightedRef.current = layer;
              layer.bindTooltip(feature.properties.name || 'Tanpa Nama');
            });
          },
          style: (feature) => {
            const kategori = feature.properties.kategori_energi;
            let fillColor = '#ccc';
            switch (kategori) {
              case 'Sangat Tinggi': fillColor = '#a50f15'; break;
              case 'Tinggi': fillColor = '#de2d26'; break;
              case 'Sedang': fillColor = '#fc9272'; break;
              case 'Rendah': fillColor = '#fcbba1'; break;
              case 'Sangat Rendah': fillColor = '#FFF2E0'; break;
            }
            return {
              color: '#333', fillColor, fillOpacity: 0.7, weight: 1
            };
          }
        });
        layer.addTo(map);
        buildingsLayerRef.current = layer;

        // Total data & kategori
        let count = 0, energiTotal = 0, kategoriCount = {};
        data.features.forEach(f => {
          const energi = f.properties.estimasi_energi_kwh_tahun || 0;
          const kategori = f.properties.kategori_energi || 'Tidak Diketahui';
          count++; energiTotal += energi;
          kategoriCount[kategori] = (kategoriCount[kategori] || 0) + 1;
        });
        setJumlahBangunan(count);
        setTotalEnergi(energiTotal);
        setTotalEmisi(energiTotal * 0.7);
        setTotalBiaya(energiTotal * 1444.7);
        setStatKategori(kategoriCount);
      });
  }, [isLoading]);

  // Update style
  useEffect(() => {
    if (buildingsLayerRef.current) {
      buildingsLayerRef.current.setStyle((feature) => {
        const kategori = feature.properties.kategori_energi;
        let fillColor = '#ccc';
        switch (kategori) {
          case 'Sangat Tinggi': fillColor = '#a50f15'; break;
          case 'Tinggi': fillColor = '#de2d26'; break;
          case 'Sedang': fillColor = '#fc9272'; break;
          case 'Rendah': fillColor = '#fcbba1'; break;
          case 'Sangat Rendah': fillColor = 'FFF2E0'; break;
        }
        return {
          color: basemap === 'dataviz' ? '#ffaa00' : '#333',
          fillColor,
          fillOpacity: 0.7,
          weight: 1
        };
      });
    }
    if (batasLayerRef.current) {
      batasLayerRef.current.setStyle({
        color: basemap === 'dataviz' ? '#ffaa00' : '#003366',
        weight: 3,
        dashArray: '2,6',
        fillOpacity: 0
      });
    }
  }, [basemap]);

  // 3D Mode
  useEffect(() => {
    if (!is3D) return;

    const container = document.getElementById('maplibre3d');
    if (!container) {
      console.warn("Element #maplibre3d belum siap di DOM.");
      return;
    }

    let mapInstance;
    let popupRef;
    let styleUrl = `https://api.maptiler.com/maps/basic/style.json?key=${key}`;
    if (basemap === 'dataviz') {
      styleUrl = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${key}`;
    } else if (basemap === 'satellite') {
      styleUrl = `https://api.maptiler.com/maps/satellite/style.json?key=${key}`;
    }

    fetch("/geojson/bangunan_mansab_2.geojson")
      .then(res => res.json())
      .then(data => {
        mapInstance = new maplibregl.Map({
          container: container,
          style: styleUrl,
          center: [112.77000, -7.28000],
          zoom: 15,
          pitch: 60,
          bearing: -20,
          antialias: true
      });

      mapInstanceRef.current = mapInstance;

      popupRef = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      mapInstance.on('load', () => {
        mapInstance.addSource("bangunan", {
          type: "geojson",
          data: data
        });

      fetch("/geojson/wilayah_mansab.geojson")
        .then(res=> res.json())
        .then(wilayahData => {
          mapInstance.addSource("batas-wilayah", {
            type: "geojson",
            data: wilayahData
          });
          mapInstance.addLayer({
            id: "batas-wilayah-line",
            type: "line",
            source: "batas-wilayah",
            paint: {
              "line-color": basemap === 'dataviz' ? "#ffaa00" : "#003366",
              "line-width": 2,
              "line-dasharray": [2, 4]
           }
          });
        });

        mapInstance.addLayer({
          id: '3d-buildings',
          source: "bangunan",
          type: 'fill-extrusion',
          paint: {
            "fill-extrusion-color": [
              "match",
              ["get", "kategori_energi"],
              "Sangat Tinggi", "#a50f15",
              "Tinggi", "#de2d26",
              "Sedang", "#fc9272",
              "Rendah", "#fcbba1",
              "Sangat Rendah", "#FFF2E0",
              "#ccc"
            ],
            "fill-extrusion-height" : ["get", "tinggi_bangunanmean"],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity" : 0.85
          }
        });

        mapInstance.on("mousemove", "3d-buildings", (e) => {
          mapInstance.getCanvas().style.cursor = "pointer";

          const feature = e.features[0];
          const coords = e.lngLat;
          const nama = feature.properties.name || "Tanpa Nama";
          const tinggi = feature.properties.tinggi_bangunanmean
          const tinggiText = Number.isFinite(tinggi) && tinggi > 0
            ? `Tinggi : ${tinggi.toFixed(1)} meter`
            : "Tinggi : Tidak Tersedia";

          popupRef
            .setLngLat(coords)
            .setHTML(`
              <strong>${nama}</strong><br/>
              ${tinggiText}
            `)
            .addTo(mapInstance);
        });

        mapInstance.on("mouseleave", "3d-buildings", () => {
          mapInstance.getCanvas().style.cursor = "";
          popupRef.remove();
        });

        mapInstance.on("click", "3d-buildings", (e) => {
          const feature = e.features[0];
          const coords = e.lngLat;
          setSelectedFeature(feature.properties)

          mapInstance.flyTo({
            center: coords,
            zoom: 17,
            pitch: 70,
            bearing: -30,
            speed: 1.2,
            curve: 1.5,
            easing: (t) => t
          });
        });
      });
    });
       
  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    };
  };  
}, [is3D, basemap, isLoading]);
  

  // Add Basemap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    if (basemap === "osm") {
      osm.addTo(map);
    } else if (basemap === "satellite") {
      satellite.addTo(map);
    } else if (basemap === "dataviz") {
      datavizDark.addTo(map)
    }
  }, [basemap]);


  // Filter Energy
  useEffect(() => {
    if (!buildingsLayerRef.current) return;
    buildingsLayerRef.current.eachLayer(layer => {
      const kategori = layer.feature.properties.kategori_energi;
      const visible = filterKategori.length === 0 || filterKategori.includes(kategori);
      layer.setStyle({
        opacity: visible ? 1 : 0,
        fillOpacity: visible ? 0.8 : 0
      });
    });
  }, [filterKategori]);

  // UseEffect 3D
  useEffect(() => {
    if (!is3D || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const kategoriFilter = filterKategori.length === 0
      ? ['!=',  'kategori_energi', '']
      : ['in',  'kategori_energi', ...filterKategori];

    try {
      map.setFilter('3d-buildings', kategoriFilter);
    } catch (err) {
      console.warn('Gagal set filter untuk mode 3D', err)
    }
  }, [filterKategori, is3D])

  useEffect(() => {
    if (!is3D || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    try {
      map.setPaintProperty(
        "batas-wilayah-line",
        "line-color",
        basemap === "dataviz" ? "#ffaa00" : "#003366"
      );
    } catch (err) {
      console.warn("Layer batas-wilayah belum ada")
    }
  }, [basemap, is3D])

  // Add Set Theme Mode
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  if (isLoading) {
    return (
      <LoadingScreen
        onEnter={handleEnter}
        showProgress={showProgress}
        progressValue={progress}
      />
    );
  }

  return (
  <>
    <div className="main-layout">
        <header className={`app-header ${theme === 'dark' ? 'dark-mode-header' : 'light-mode-header'}`}>
          <div className="header-title-main">
            <FontAwesomeIcon icon={faBolt} className="header-bolt-icon" /> 
            <div>
              <h2>Peta Potensi Energi Surya Kelurahan Manyar Sabrangan</h2>
              <p className="app-subtitle">Oleh: Juan Vincent Elfonda</p>
            </div>
          </div>
          <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </header>   
      <div id="map" className={`map-container ${is3D ? 'hidden' : ''} fade-in`}></div>
      <div id="maplibre3d" className={`maplibre3d-container ${is3D ? 'active' : ''}`}></div>

      {/* === VERTICAL NAVIGATION === */}
      <div className="vertical-nav full-height" style={{ top: theme === 'dark' ? '80px': '80px'}}>
        <button 
          onClick={() => setActivePanel('info')} 
          className={activePanel === 'info' ? 'active' : ''}
          title="Informasi"
        >
          📋
        </button>
        <button 
          onClick={() => setActivePanel('dashboard')} 
          className={activePanel === 'dashboard' ? 'active' : ''}
          title="Dashboard"
        >
          📊
        </button>
        <button 
        onClick={() => setActivePanel('settings')} 
        className={activePanel === 'settings' ? 'active' : ''}
        title="Pengaturan"
        >
          ⚙️
        </button>
        <button 
        onClick={() => mapRef.current.zoomIn()}
        title="Zoom In"
        >
          ➕
        </button>
        <button 
        onClick={() => mapRef.current.zoomOut()}
        title="Zoom Out"
        >
          ➖
        </button>
      </div>

      {/* === SIDEBAR PANEL === */}
      {activePanel && (
        <motion.div
          className="sidebar"
          style={{ right: 0, left: 'auto', zIndex: 1200 }}
          initial={{ x: 350 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button className="close-btn" onClick={() => setActivePanel(null)}>❌</button>

          {/* === PANEL: INFO === */}
          {activePanel === 'info' && (
            <>
              <div className="sidebar-header">
                <div className="header-title">
                  <span className="header-icon">⚡</span>
                  <h3>Potensi Energi Bangunan</h3>
                </div>
              </div>

              <div className="kategori-toggle">
                <label><strong>Filter Kategori Energi:</strong></label>
                {kategoriList.map(kat => (
                  <div key={kat}>
                    <label>
                      <input
                        type="checkbox"
                        value={kat}
                        checked={filterKategori.includes(kat)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFilterKategori(prev =>
                            checked ? [...prev, kat] : prev.filter(k => k !== kat)
                          );
                        }}
                      />
                      {kat}
                    </label>
                  </div>
                ))}
              </div>

              <div className="sidebar-content">
                {selectedFeature ? (
                  <div className="info-list">
                    <div className="info-item">
                      <span>🏢</span>
                      <div className="info-content">
                        <div className="info-label">Bangunan</div>
                        <div className="info-value">{selectedFeature.name || 'Tanpa Nama'}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <span>📐</span>
                      <div className="info-content">
                        <div className="info-label">Luas Bangunan</div>
                        <div className="info-value">{selectedFeature["luas_atap(m2)"]?.toLocaleString()} m²</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <span>⚡</span>
                      <div className="info-content">
                        <div className="info-label">Estimasi Energi</div>
                        <div className="info-value">{selectedFeature.estimasi_energi_kwh_tahun?.toLocaleString()} kWh/tahun</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <span>⭐</span>
                      <div className="info-content">
                        <div className="info-label">Kategori Energi</div>
                        <div className="info-value">{selectedFeature.kategori_energi || 'Tidak Diketahui'}</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <span>🌱</span>
                      <div className="info-content">
                        <div className="info-label">Reduksi Emisi CO₂</div>
                        <div className="info-value">{(selectedFeature.estimasi_energi_kwh_tahun * 0.7).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂/tahun</div>
                      </div>
                    </div>
                    <div className="info-item">
                      <span>💰</span>
                      <div className="info-content">
                        <div className="info-label">Biaya Listrik Dihemat</div>
                        <div className="info-value">Rp {(selectedFeature.estimasi_energi_kwh_tahun * 1444.7).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="info-placeholder">Klik bangunan untuk melihat detail.</p>
                )}
              </div>
            </>
          )}

          {/* === PANEL: DASHBOARD === */}
          {activePanel === 'dashboard' && (
            <div className="sidebar-content">
              <h4>📊 Dashboard Potensi</h4>
              <div className="dashboard-panel">

                <div className="card">
                  <h5>🏢 Jumlah Bangunan</h5>
                  <p>{jumlahBangunan.toLocaleString()}</p>
                </div>

                <div className="card">
                  <h5>⚡ Total Energi</h5>
                  <p>{totalEnergi.toLocaleString()} kWh</p>
                </div>

                <div className="card">
                  <h5>🌱 Total Emisi CO₂</h5>
                  <p>{totalEmisi.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg</p>
                </div>

                <div className="card">
                  <h5>💰 Total Hemat Biaya</h5>
                  <p>Rp {totalBiaya.toLocaleString()}</p>
                </div>

                <div className="card">
                  <h5>📈 Perbandingan Kategori Bangunan</h5>
                  <ul className="chart-list">
                    {["Sangat Tinggi", "Tinggi", "Sedang", "Rendah", "Sangat Rendah"].map((kategori) => {
                      const jumlah = statKategori[kategori] || 0;
                      const colors = {
                        "Sangat Tinggi": "#a50f15",
                        "Tinggi": "#de2d26",
                        "Sedang": "#fc9272",
                        "Rendah": "#fcbba1",
                        "Sangat Rendah": "#FFF2E0"
                      };
                      return (
                        <li key={kategori}>
                          <span>{kategori}</span>
                          <div
                            className="bar tooltip-bar"
                            data-tooltip={`${jumlah.toLocaleString()} bangunan`}
                            style={{ backgroundColor: colors[kategori], width: `${jumlah * 3}px` }}
                          >
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* === PANEL: SETTINGS === */}
          {activePanel === 'settings' && (
            <div className="sidebar-content">
              <div className="sidebar-select">
                <label>🗺️ Basemap:</label>
                <select onChange={(e) => setBasemap(e.target.value)} value={basemap}>
                  <option value="osm">OpenStreetMap</option>
                  <option value="satellite">Satellite</option>
                  <option value="dataviz">Dataviz Dark</option>
                </select>
              </div>

              <div className="sidebar-select">
                <label>🧱 Mode 3D:</label>
                <select onChange={(e) => setIs3D(e.target.value === 'true')} value={is3D}>
                  <option value="false">Nonaktif</option>
                  <option value="true">Aktif</option>
                </select>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* === LEGEND === */}
      <div className="map-legend">
        <h4>Legenda Kategori Energi</h4>
        <ul>
          <li><span style={{ background: '#a50f15' }}></span> Sangat Tinggi</li>
          <li><span style={{ background: '#de2d26' }}></span> Tinggi</li>
          <li><span style={{ background: '#fc9272' }}></span> Sedang</li>
          <li><span style={{ background: '#fcbba1' }}></span> Rendah</li>
          <li><span style={{ background: '#FFF2E0' }}></span> Sangat Rendah</li>
        </ul>
      </div>
    </div>

    {is3D && (
      <div className="mode-indicator">🧱 Mode 3D Aktif</div>
    )};
  </>
);
    
}

export default App;
