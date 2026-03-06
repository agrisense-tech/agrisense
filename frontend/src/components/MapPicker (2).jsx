// src/components/MapPicker.jsx
// ---------------------------------------------------------
// Interactive map using Leaflet.js (free, no API key needed).
// - Click anywhere on map → fills lat/lon in the form
// - Shows a marker at the selected location
// - Displays region name if detected
// ---------------------------------------------------------

import { useEffect, useRef } from "react"

export default function MapPicker({ lat, lon, onChange }) {
  const mapRef       = useRef(null)  // Leaflet map instance
  const markerRef    = useRef(null)  // Current marker
  const containerRef = useRef(null)  // DOM element

  useEffect(() => {
    // Dynamically load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link  = document.createElement("link")
      link.id     = "leaflet-css"
      link.rel    = "stylesheet"
      link.href   = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // Dynamically load Leaflet JS
    const initMap = () => {
      if (mapRef.current || !containerRef.current) return
      const L = window.L
      if (!L) return

      // Default center: India
      const defaultLat = lat || 20.5937
      const defaultLon = lon || 78.9629

      // Create map
      const map = L.map(containerRef.current, {
        center:    [defaultLat, defaultLon],
        zoom:      lat ? 10 : 5,
        zoomControl: true,
      })

      // Add OpenStreetMap tiles (free)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      // Custom green marker icon
      const greenIcon = L.divIcon({
        html: `<div style="
          background: #16a34a;
          width: 20px; height: 20px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize:   [20, 20],
        iconAnchor: [10, 20],
        className:  "",
      })

      // Add marker if coords exist
      if (lat && lon) {
        markerRef.current = L.marker([lat, lon], { icon: greenIcon })
          .addTo(map)
          .bindPopup(`📍 ${lat}, ${lon}`)
          .openPopup()
      }

      // Click handler → update coordinates
      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLon } = e.latlng
        const roundedLat = Math.round(clickLat * 10000) / 10000
        const roundedLon = Math.round(clickLon * 10000) / 10000

        // Move or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLon])
          markerRef.current.bindPopup(`📍 ${roundedLat}, ${roundedLon}`).openPopup()
        } else {
          markerRef.current = L.marker([roundedLat, roundedLon], { icon: greenIcon })
            .addTo(map)
            .bindPopup(`📍 ${roundedLat}, ${roundedLon}`)
            .openPopup()
        }

        // Call parent callback to update form fields
        onChange(roundedLat, roundedLon)
      })

      mapRef.current = map
    }

    // Load Leaflet script if not already loaded
    if (window.L) {
      initMap()
    } else {
      const script   = document.createElement("script")
      script.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.onload  = initMap
      document.head.appendChild(script)
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker when lat/lon change externally (e.g. demo fill)
  useEffect(() => {
    if (!mapRef.current || !window.L || !lat || !lon) return
    const L = window.L

    const greenIcon = L.divIcon({
      html: `<div style="
        background: #16a34a; width: 20px; height: 20px;
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [20, 20], iconAnchor: [10, 20], className: "",
    })

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon])
    } else {
      markerRef.current = L.marker([lat, lon], { icon: greenIcon }).addTo(mapRef.current)
    }

    mapRef.current.setView([lat, lon], 10)
  }, [lat, lon])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        🖱 <strong className="text-gray-400">Click anywhere on the map</strong> to set your field location
      </p>
      <div
        ref={containerRef}
        style={{ height: "280px", borderRadius: "10px", overflow: "hidden",
                 border: "1px solid #1f2937" }}
      />
      {lat && lon && (
        <p className="text-xs text-green-500 font-mono mt-2">
          ✓ Selected: {lat}, {lon}
        </p>
      )}
    </div>
  )
}
