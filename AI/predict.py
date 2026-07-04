import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from timm import create_model
import os

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

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
num_classes = len(CLASSES)

def load_model(model_path="best_densenet_swin_model.pth"):
    print(f"Loading model from {model_path}...")
    model = HybridDenseNetSwin(num_classes)
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file '{model_path}' not found. Please complete training first.")
        
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

def predict_image(model, image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    try:
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_class_idx = torch.max(probabilities, 1)

        predicted_class_name = CLASSES[predicted_class_idx.item()]
        confidence_percentage = confidence.item() * 100

        print("\n--- Prediction Result ---")
        print(f"Image: {os.path.basename(image_path)}")
        print(f"Diagnosis: {predicted_class_name}")
        print(f"Confidence: {confidence_percentage:.2f}%")
        print("-------------------------\n")

        return predicted_class_name, confidence_percentage

    except Exception as e:
        print(f"Error reading or analyzing image: {e}")
        return None, None

if __name__ == "__main__":
    try:
        model = load_model("best_densenet_swin_model.pth")
        
        test_image_path = r"Dataset\polyps\0013b860-2da8-4ff4-a13f-b3f55444b025.jpg" 
        
        if os.path.exists(test_image_path):
            predict_image(model, test_image_path)
        else:
            img_path = input("Enter the path of the image you want to examine: ").strip(' \'"')
            if img_path:
                predict_image(model, img_path)
            else:
                print("You didn't enter a path! Please run the script again and paste the path.")
            
    except Exception as e:
        print(e)
