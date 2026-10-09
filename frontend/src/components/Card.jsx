import React, { useContext } from "react";
import { RiCheckLine } from "react-icons/ri";
import { userDataContext } from "../context/userDataContext";

// Selectable preset image for the assistant
function Card({ image, label }) {
    const {
        setBackendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
    } = useContext(userDataContext);

    const handleSelect = () => {
        setSelectedImage(image);   // Mark this image as selected
        setBackendImage(null);     // Clear any previously uploaded image
        setFrontendImage(null);
    };

    const isSelected = selectedImage === image;

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            aria-label={label}
            onClick={handleSelect}
            className={`group relative aspect-[3/5] w-full overflow-hidden rounded-2xl border-2 bg-surface-2 transition
                ${isSelected ? "border-accent ring-4 ring-accent-soft" : "border-transparent hover:border-line"}`}
        >
            <img
                src={image}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                alt=""
                loading="lazy"
                draggable="false"
            />
            {isSelected && (
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-fg shadow">
                    <RiCheckLine className="h-4 w-4" />
                </span>
            )}
        </button>
    );
}

export default Card;
