import React, { useContext } from "react";
import { userDataContext } from "../context/UserContext";

function Card({ image }) {
    // Access context values and setters for managing selected and uploaded images
    const {
        setBackendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
    } = useContext(userDataContext);

    // Handler function triggered when user clicks on a card
    const handleSelect = () => {
        setSelectedImage(image);   // Mark this image as selected
        setBackendImage(null);     // Clear any previously uploaded backend image
        setFrontendImage(null);    // Clear any previously uploaded frontend image
    };

    // Determine if this card is currently selected
    const isSelected = selectedImage === image;

    return (
        <div
            className={`w-[70px] h-[140px] lg:w-[150px] lg:h-[250px]
                bg-[#020220] border-2 border-[#0000ff66] rounded-2xl
                overflow-hidden cursor-pointer transition-all
                hover:shadow-2xl hover:shadow-blue-950 hover:border-4 hover:border-white
                ${isSelected ? "border-4 border-white shadow-2xl shadow-blue-950" : ""}`}
            onClick={handleSelect}  // Call handleSelect when user clicks the card
        >
            {/* Display the image in the card; object-cover ensures it fills the div */}
            <img
                src={image}
                className="h-full w-full object-cover"
                alt="assistant-option"
                draggable="false"   // Prevents dragging the image accidentally
            />
        </div>
    );
}

export default Card;
