from flask import Flask, request, jsonify
from deepface import DeepFace
import os

app = Flask(__name__)

@app.route("/detect-mood", methods=["POST"])
def detect_mood():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files['image']
    image_path = os.path.join("temp.jpg")
    image.save(image_path)

    try:
        analysis = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)
        emotion = analysis[0]['dominant_emotion']
        return jsonify({"emotion": emotion})
    except Exception as e:
        print("❌ Error in /detect-mood route:", str(e)) 
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)


if __name__ == "__main__":
    app.run(port=5001, debug=True)
