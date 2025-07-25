import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Input } from "./ui/input";
import { Search, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

const GoogleMapsAutocomplete = forwardRef(
  (
    {
      onPlaceSelected,
      onUseCurrentLocation,
      placeholder = "Enter a location...",
      className,
      value,
      onChange,
      onBlur,
      options = {},
      isLocating = false,
      placeSelectedRef,
    },
    ref
  ) => {
    const inputRef = useRef(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const lastSelectedPlaceName = useRef(value || "");

    const pendingPlaceName = useRef("");
    const isSelectingPlace = useRef(false);
    const autocompleteRef = useRef(null);

    const apiKey = import.meta.env.VITE_Maps_API_KEY;

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      inputElement: inputRef.current,
      resetSelection: () => {
        setInputValue("");
        lastSelectedPlaceName.current = "";
        pendingPlaceName.current = "";
        if (placeSelectedRef) placeSelectedRef.current = false;
      },
    }));

    useEffect(() => {
      if (value !== inputValue) {
        setInputValue(value || "");
        lastSelectedPlaceName.current = value || "";
      }
    }, [value]);

    useEffect(() => {
      if (!apiKey) {
        console.error("Missing Google Maps API key.");
        return;
      }

      if (window.google?.maps?.places) {
        setScriptLoaded(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );
      if (existingScript) {
        existingScript.onload = () => setScriptLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () =>
        console.error("Failed to load Google Maps script.");
      document.head.appendChild(script);
    }, [apiKey]);

    useEffect(() => {
      if (
        scriptLoaded &&
        inputRef.current &&
        window.google?.maps?.places &&
        inputRef.current.offsetParent !== null // input must be visible
      ) {
        const input = inputRef.current;
        const ac = new window.google.maps.places.Autocomplete(input, {
          ...options,
          fields: ["name", "formatted_address", "geometry", "place_id"],
        });

        const handleKeyDown = (e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            pendingPlaceName.current = input.value;
            isSelectingPlace.current = true;
          }
        };

        const handleDocumentMouseDown = (e) => {
          const dropdown = document.querySelector(".pac-container");
          if (dropdown && dropdown.contains(e.target)) {
            pendingPlaceName.current = input.value;
            isSelectingPlace.current = true;
          }
        };

        input.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleDocumentMouseDown);

        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const displayText =
            isSelectingPlace.current && pendingPlaceName.current
              ? pendingPlaceName.current
              : place.name !== place.formatted_address
              ? place.name
              : place.formatted_address;

          setTimeout(() => {
            if (inputRef.current) inputRef.current.value = displayText;
            setInputValue(displayText);
            lastSelectedPlaceName.current = displayText;
            if (placeSelectedRef) placeSelectedRef.current = true;
            if (onPlaceSelected) {
              onPlaceSelected({
                ...place,
                displayName: displayText,
                originalName: place.name,
                formattedAddress: place.formatted_address,
              });
            }
          }, 0);

          isSelectingPlace.current = false;
        });

        autocompleteRef.current = ac;

        return () => {
          input.removeEventListener("keydown", handleKeyDown);
          document.removeEventListener("mousedown", handleDocumentMouseDown);
          if (autocompleteRef.current) {
            autocompleteRef.current.unbindAll();
            autocompleteRef.current = null;
          }
        };
      }
    }, [scriptLoaded, inputRef.current]);

    const handleLocalChange = (e) => {
      const val = e.target.value;
      setInputValue(val);
      if (onChange) onChange(e);
      if (placeSelectedRef) placeSelectedRef.current = false;
      isSelectingPlace.current = false;
    };

    const handleLocalBlur = (e) => {
      // Only clear if input changed and no place selected, and input is not empty
      const typedManually =
        placeSelectedRef &&
        !placeSelectedRef.current &&
        inputValue.trim() !== "" &&
        inputValue.trim() !== lastSelectedPlaceName.current.trim();

      if (typedManually) {
        setInputValue("");
        if (onPlaceSelected) {
          onPlaceSelected(null);
        }
        lastSelectedPlaceName.current = "";
      }

      if (onBlur) onBlur(e);
    };

    return (
      <div className="relative flex-grow flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-3 md:size-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className={`pl-9 pr-4 h-8 md:h-9 w-full ${className}`}
          value={inputValue}
          onChange={handleLocalChange}
          onBlur={handleLocalBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission / focus shift
            }
          }}
        />
        {onUseCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:bg-gray-100"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }
);

export default GoogleMapsAutocomplete;
