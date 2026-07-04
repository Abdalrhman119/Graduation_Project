import io
import os
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from timm import create_model
from fastapi import FastAPI, UploadFile, File, HTTPException
import uvicorn

# 1. Setup
CLASSES = [
    'dyed-lifted-polyps',
    'dyed-resection-margins',
    'esophagitis',
    'normal-cecum',
    'normal-pylorus',
    'normal-z-line',
    'polyps',
    'ulcerative-colitis'
]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = len(CLASSES)

class HybridDenseNetSwin(nn.Module):
    def __init__(self, num_classes):
        super(HybridDenseNetSwin, self).__init__()
        self.densenet = create_model('densenet201', pretrained=False, num_classes=num_classes)
        self.swin = create_model('swin_tiny_patch4_window7_224', pretrained=False, num_classes=num_classes)
        self.fc = nn.Sequential(
            nn.Linear(2 * num_classes, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )
    def forward(self, x):
        densenet_features = self.densenet(x)
        swin_features = self.swin(x)
        combined_features = torch.cat((densenet_features, swin_features), dim=1)
        return self.fc(combined_features)

# Load Model Once globally
print("Starting API Server and loading AI model...")
model_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(model_dir, "best_densenet_swin_model.pth")
if not os.path.exists(model_path):
    print("WARNING: Model file not found. Predictions will not work until training finishes.")
    model = None
else:
    model = HybridDenseNetSwin(num_classes)
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    print("Model loaded successfully!")

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

app = FastAPI(title="Medical Image Classifier API")

@app.get("/")
def home():
    return {"message": "AI Medical Image Classifier API is running. Send a POST request to /predict."}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train the model first.")
        
    try:
        # Read the image bytes from the request
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Preprocess the image
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Predict
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probabilities, 1)
            
        predicted_class_name = CLASSES[predicted_class_idx.item()]
        confidence_percentage = confidence.item() * 100
        
        # Return JSON Response
        return {
            "success": True,
            "filename": file.filename,
            "diagnosis": predicted_class_name,
            "confidence": round(confidence_percentage, 2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

    # http://localhost:8000/docs