/**
=========================================================
* KidsLink Teacher Dashboard - Gallery Modal Component
=========================================================
*/

import { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function GalleryModal({ 
  open, 
  onClose, 
  images, 
  currentIndex 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex || 0);

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleClose = () => {
    setCurrentImageIndex(0);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          backgroundColor: 'black'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #333',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <ArgonTypography variant="h5" fontWeight="bold" color="white">
          <i className="ni ni-image" style={{ marginRight: '8px' }} />
          ({currentImageIndex + 1}/{images.length})
        </ArgonTypography>
        <Button 
          onClick={handleClose}
          sx={{ 
            color: 'white',
            minWidth: 'auto',
            p: 1
          }}
        >
          <i className="ni ni-fat-remove" style={{ fontSize: '20px' }} />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 0,
        position: 'relative',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black'
      }}>
        {images.length > 0 && (
          <>
            {/* Main Image */}
            <img
              src={images[currentImageIndex]}
              alt={`Gallery image ${currentImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={handlePreviousImage}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    minWidth: 'auto',
                    p: 2,
                    borderRadius: '50%',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }
                  }}
                >
                  <i className="ni ni-bold-left" style={{ fontSize: '20px' }} />
                </Button>
                
                <Button
                  onClick={handleNextImage}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    minWidth: 'auto',
                    p: 2,
                    borderRadius: '50%',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)'
                    }
                  }}
                >
                  <i className="ni ni-bold-right" style={{ fontSize: '20px' }} />
                </Button>
              </>
            )}
            
            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <ArgonBox
                position="absolute"
                bottom={16}
                left="50%"
                transform="translateX(-50%)"
                display="flex"
                gap={1}
                p={1}
                bgcolor="rgba(0,0,0,0.7)"
                borderRadius={2}
              >
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: currentImageIndex === index ? '3px solid #667eea' : '3px solid transparent',
                      opacity: currentImageIndex === index ? 1 : 0.7,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </ArgonBox>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

GalleryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.array.isRequired,
  currentIndex: PropTypes.number
};

export default GalleryModal;
