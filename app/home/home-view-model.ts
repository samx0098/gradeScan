import { Observable } from "@nativescript/core";
import {
  takePicture,
  requestPermissions,
  CameraOptions,
} from "@nativescript/camera";
import { ImageSource, Http } from "@nativescript/core";
import {
  create,
  ImagePicker,
  ImagePickerMediaType,
} from "@nativescript/imagepicker";
// import { env } from '@/config';
export class HomeViewModel extends Observable {
  public capturedImage: ImageSource | null = null;
  public recognizedText: string | null = null;

  constructor() {
    super();
  }

  public captureImage() {
    requestPermissions()
      .then(() => {
        const options: CameraOptions = {
          width: 300,
          height: 300,
          keepAspectRatio: true,
          saveToGallery: true,
        };

        takePicture(options)
          .then((imageAsset) => {
            console.log("Image captured successfully.");

            ImageSource.fromAsset(imageAsset).then((imageSource) => {
              this.set("capturedImage", imageSource);
              // Here, you can proceed to apply OCR on imageSource
            });
          })
          .catch((err) => {
            console.log("Error capturing image: " + err.message);
          });
      })
      .catch(() => {
        console.log("Camera permission denied.");
      });
  }

  public selectImageFromGallery() {
    const options = {
      mode: "single", // Choose between "single" or "multiple"
      mediaType: ImagePickerMediaType.Image, // Optional: Restrict to images only
    };

    const imagePicker = create(options);

    imagePicker
      .authorize()
      .then((authorized) => {
        if (!authorized) {
          console.log("User denied gallery access.");
          return Promise.reject("Authorization failed.");
        }
        return imagePicker.present();
      })
      .then((selection) => {
        if (selection.length > 0) {
          const selectedAsset = selection[0];
          console.log("Selected image:", selectedAsset);

          // Convert the selected image asset to an ImageSource
          ImageSource.fromAsset(selectedAsset.asset)
            .then((imageSource) => {
              this.set("capturedImage", imageSource); // Properly set the ImageSource object
              console.log(
                "Image loaded and converted to ImageSource successfully."
              );
            })
            .catch((error) => {
              console.error(
                "Error converting selected image to ImageSource:",
                error
              );
            });
        } else {
          console.log("No image selected.");
        }
      })
      .catch((error) => {
        console.error("Error selecting image:", error);
      });
  }

  public performOCR() {
    if (!this.capturedImage) {
      console.log("No image captured.");
      return;
    }

    const base64Image = this.capturedImage.toBase64String("jpg");
    const requestPayload = {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: "TEXT_DETECTION" }],
        },
      ],
    };

    console.log("Sending OCR request...");

    Http.request({
      url: `https://vision.googleapis.com/v1/images:annotate?key=${process.env.CLOUD_VISION_API_KEY}`,
      method: "POST",
      content: JSON.stringify(requestPayload),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        const responseText = response.content.toString();
        console.log("Raw API Response:", responseText);

        const result = response.content.toJSON();
        console.log("Parsed API Response:", result);

        if (result.error) {
          console.error("API Error:", result.error.message);
          return;
        }

        if (result.responses && result.responses.length > 0) {
          const textAnnotations = result.responses[0].textAnnotations;
          if (textAnnotations && textAnnotations.length > 0) {
            const recognizedText = textAnnotations[0].description;
            console.log("Recognized Text:", recognizedText);
            // You can now send recognizedText to Google Sheets
            this.set("recognizedText", recognizedText);
          } else {
            console.log("No text found in image.");
          }
        } else {
          console.log("No responses found in API result.");
          this.set("recognizedText", "No responses found in API result.");
        }
      })
      .catch((error) => {
        console.error("Error during OCR:", error);
        this.set("recognizedText", "Error during OCR.");
      });
  }
}
