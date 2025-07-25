import { APIProvider, Map } from "@vis.gl/react-google-maps";
import React from "react";
import "./googleMap.css"; // Import the CSS file for styling

const GMapComponent = () => {
  const apiKey = import.meta.env.VITE_Maps_API_KEY; // Store the API key in a variable

  return (
    <APIProvider
      apiKey={apiKey}
      onLoad={() =>
        console.log(`Google Maps API has loaded with key: ${apiKey}`)
      }
    >
      <div style={{ height: "100vh", width: "100vw" }}>
        <Map
          defaultZoom={13}
          defaultCenter={{ lat: -33.860664, lng: 151.208138 }}
          onCameraChanged={(ev) =>
            console.log(
              "camera changed:",
              ev.detail.center,
              "zoom:",
              ev.detail.zoom
            )
          }
        />
      </div>
    </APIProvider>
  );
};

export default GMapComponent;
