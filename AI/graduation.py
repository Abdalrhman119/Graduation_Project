import os

path = 'Dataset'

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision.datasets import ImageFolder
import numpy as np
from torchvision import transforms
from sklearn.model_selection import train_test_split

IMG_SIZE = 224
BATCH_SIZE = 16

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Device:", DEVICE)

#Data Augmentation
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

dataset = ImageFolder(path, transform=transform)
num_classes = len(dataset.classes)

indices = list(range(len(dataset)))
train_idx, test_idx = train_test_split(indices, test_size=0.3, random_state=42)
val_idx, test_idx = train_test_split(test_idx, test_size=0.66, random_state=42)

train_dataset = Subset(dataset, train_idx)
val_dataset = Subset(dataset, val_idx)
test_dataset = Subset(dataset, test_idx)

# Data Loaders
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

import matplotlib.pyplot as plt
import random

# Function to show one image from each class
def show_one_image_from_each_class(dataset, num_classes=8):
    class_to_idx = dataset.class_to_idx  # Mapping of class name to index
    idx_to_class = {v: k for k, v in class_to_idx.items()}  # Inverse mapping: index to class name
    # Prepare to plot images
    fig, axes = plt.subplots(2, 4, figsize=(15, 10))  # 2 rows, 4 columns
    axes = axes.flatten()# Flatten to easily index the axes
    for i in range(num_classes):
        # Get all indices for the current class
        class_idx = i
        class_images = [idx for idx, label in enumerate(dataset.targets) if label == class_idx]

        # Randomly pick one image from this class
        random_image_idx = random.choice(class_images)
        image, label = dataset[random_image_idx]

        # Plot the image
        ax = axes[i]
        ax.imshow(image.permute(1, 2, 0).cpu())  # Convert from CxHxW to HxWxC for plt.imshow
        ax.axis('off')
        ax.set_title(f'Class: {idx_to_class[class_idx]}')

    plt.tight_layout()
    plt.show()

# Show one image from each class (8 classes in your dataset)
show_one_image_from_each_class(dataset, num_classes=8)

#Hybrid Model: DenseNet201 + Swin Transformer
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision.datasets import ImageFolder
import torchvision.transforms as transforms
from sklearn.model_selection import train_test_split
from tqdm import tqdm
from timm import create_model
import numpy as np
from sklearn.metrics import matthews_corrcoef
import matplotlib.pyplot as plt # Import matplotlib

# Replace with your dataset path
IMG_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 20

LR = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Data Augmentation
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load Dataset
path = 'Dataset' # Define path here
dataset = ImageFolder(path, transform=transform)
num_classes = len(dataset.classes)

# Dataset Split
indices = list(range(len(dataset)))
train_idx, test_idx = train_test_split(indices, test_size=0.3, random_state=42)
val_idx, test_idx = train_test_split(test_idx, test_size=0.66, random_state=42)
train_dataset = Subset(dataset, train_idx)
val_dataset = Subset(dataset, val_idx)
test_dataset = Subset(dataset, test_idx)

# Data Loaders
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

# Define Hybrid Model: DenseNet201 + Swin Transformer
class HybridDenseNetSwin(nn.Module):
    def __init__(self, num_classes):
        super(HybridDenseNetSwin, self).__init__()
        self.densenet = create_model('densenet201', pretrained=True, num_classes=num_classes)
        self.swin = create_model('swin_tiny_patch4_window7_224', pretrained=True, num_classes=num_classes)
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

# Initialize Model
DenseNetSwin = HybridDenseNetSwin(num_classes)
DenseNetSwin.to(DEVICE)

# Loss Function (Class-Balanced Loss)
class ClassBalancedLoss(nn.Module):
    def __init__(self, beta, num_classes):
        super(ClassBalancedLoss, self).__init__()
        self.beta = beta
        self.num_classes = num_classes

    def forward(self, logits, labels):
        class_counts = np.bincount(labels.cpu().numpy(), minlength=self.num_classes)
        effective_num = 1.0 - np.power(self.beta, class_counts)
        weights = (1.0 - self.beta) / (effective_num + 1e-8)
        weights = weights / np.sum(weights)  # Normalize weights
        weights = torch.tensor(weights, dtype=torch.float32).to(logits.device)
        loss = nn.CrossEntropyLoss(weight=weights)(logits, labels)
        return loss

loss_fn = ClassBalancedLoss(beta=0.999, num_classes=num_classes)
optimizer = optim.AdamW(DenseNetSwin.parameters(), lr=LR)

# Training Function
def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for images, labels in tqdm(loader, desc="Training"):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return total_loss / len(loader), 100.0 * correct / total

# Validation Function
def validate_epoch(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0, 0, 0
    preds_list, labels_list = [], []
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Validation"):
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            _, preds = torch.max(outputs, 1)
            preds_list.extend(preds.cpu().numpy())
            labels_list.extend(labels.cpu().numpy())
            correct += (preds == labels).sum().item()
            total += labels.size(0)
    mcc = matthews_corrcoef(labels_list, preds_list)
    return total_loss / len(loader), 100.0 * correct / total, mcc

# Initialize history dictionary
history = {'train_acc': [], 'val_acc': [], 'train_loss': [], 'val_loss': [], 'val_mcc': []}

# Training Loop
best_mcc = 0
for epoch in range(EPOCHS):
    print(f"Epoch {epoch + 1}/{EPOCHS}")
    train_loss, train_acc = train_epoch(DenseNetSwin, train_loader, optimizer, loss_fn, DEVICE)
    val_loss, val_acc, val_mcc = validate_epoch(DenseNetSwin, val_loader, loss_fn, DEVICE)
    print(f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}%")
    print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%, Val MCC: {val_mcc:.4f}")

    # Populate history dictionary
    history['train_loss'].append(train_loss)
    history['train_acc'].append(train_acc)
    history['val_loss'].append(val_loss)
    history['val_acc'].append(val_acc)
    history['val_mcc'].append(val_mcc)

    # Save the best model
    if val_mcc > best_mcc:
        best_mcc = val_mcc
        torch.save(DenseNetSwin.state_dict(), "best_densenet_swin_model.pth")
        print(f"Best model saved with MCC: {val_mcc:.4f}")

# Test the Model
DenseNetSwin.load_state_dict(torch.load("best_densenet_swin_model.pth"))
test_loss, test_acc, test_mcc = validate_epoch(DenseNetSwin, test_loader, loss_fn, DEVICE)
print(f"Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.2f}%, Test MCC: {test_mcc:.4f}")

# Plotting
plt.figure(figsize=(10, 6))
plt.plot(history["train_acc"], label="Training Accuracy", color='blue')
plt.plot(history["val_acc"], label="Validation Accuracy", color='orange')
plt.title("Train vs Validation Accuracy over Epochs")
plt.xlabel("Epochs")
plt.ylabel("Accuracy (%)")
plt.legend()
plt.grid(True)
plt.show()

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision.datasets import ImageFolder
import torchvision.transforms as transforms
from sklearn.model_selection import train_test_split
from tqdm import tqdm
from timm import create_model
import numpy as np
from sklearn.metrics import matthews_corrcoef
import matplotlib.pyplot as plt
 # Replace with your dataset path
IMG_SIZE = 224
BATCH_SIZE = 16
EPOCHS = 25
LR = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# Data Augmentation
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load Dataset
DATASET_PATH = 'Dataset'
dataset = ImageFolder(DATASET_PATH, transform=transform)
num_classes = len(dataset.classes)
# Dataset Split
indices = list(range(len(dataset)))
train_idx, test_idx = train_test_split(indices, test_size=0.3, random_state=42)
val_idx, test_idx = train_test_split(test_idx, test_size=0.66, random_state=42)

train_dataset = Subset(dataset, train_idx)
val_dataset = Subset(dataset, val_idx)
test_dataset = Subset(dataset, test_idx)
# Data Loaders
train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)

# Define Hybrid Model: Swin Transformer + ResNet50
class HybridSwinResNet(nn.Module):
    def __init__(self, num_classes):
        super(HybridSwinResNet, self).__init__()
        self.resnet = create_model('resnet50', pretrained=True, num_classes=num_classes)
        self.swin = create_model('swin_tiny_patch4_window7_224', pretrained=True, num_classes=num_classes)
        self.fc = nn.Sequential(
            nn.Linear(2 * num_classes, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        resnet_features = self.resnet(x)
        swin_features = self.swin(x)
        combined_features = torch.cat((resnet_features, swin_features), dim=1)
        return self.fc(combined_features)
# Initialize Model
SwinResNet = HybridSwinResNet(num_classes)
SwinResNet.to(DEVICE)

# Loss Function (Class-Balanced Loss)
class ClassBalancedLoss(nn.Module):
    def __init__(self, beta, num_classes):
        super(ClassBalancedLoss, self).__init__()
        self.beta = beta
        self.num_classes = num_classes


    def forward(self, logits, labels):
        class_counts = np.bincount(labels.cpu().numpy(), minlength=self.num_classes)
        effective_num = 1.0 - np.power(self.beta, class_counts)
        weights = (1.0 - self.beta) / (effective_num + 1e-8)
        weights = weights / np.sum(weights)  # Normalize weights
        weights = torch.tensor(weights, dtype=torch.float32).to(logits.device)
        loss = nn.CrossEntropyLoss(weight=weights)(logits, labels)
        return loss

loss_fn = ClassBalancedLoss(beta=0.999, num_classes=num_classes)
optimizer = optim.AdamW(SwinResNet.parameters(), lr=LR)


# Training Function
def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for images, labels in tqdm(loader, desc="Training"):
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
    return total_loss / len(loader), 100.0 * correct / total