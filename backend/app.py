from __future__ import annotations

import os
import tempfile
from typing import Any, Dict, List, Set

from flask import Flask, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO
import cv2  # type: ignore
import numpy as np


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "yolov8n.pt")


def create_app() -> Flask:
    app = Flask(__name__)

    # Enable CORS for all domains on all routes
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Load YOLO model once at startup
    if not os.path.exists(MODEL_PATH):
        # Provide a clear error message if the model is missing
        raise FileNotFoundError(
            f"YOLO model not found at '{MODEL_PATH}'. "
            "Please download 'yolov8n.pt' from Ultralytics and place it in the 'backend/models' directory."
        )

    app.config["yolo_model"] = YOLO(MODEL_PATH)

    # Basic COCO-style class name mapping for nicer frontend labels
    app.config["class_names"] = {
        0: "Person",
        1: "Bicycle",
        2: "Car",
        3: "Motorcycle",
        5: "Bus",
        7: "Truck",
    }

    @app.route("/health", methods=["GET"])
    def health() -> Any:
        return jsonify({"status": "ok"}), 200

    @app.route("/upload-video", methods=["POST"])
    def upload_video() -> Any:
        """
        Accept a video file, run YOLOv8 inference over its frames,
        and return aggregated detection data.
        """
        if "video" not in request.files:
            return jsonify({"error": "No video file provided under form field 'video'."}), 400

        video_file = request.files["video"]
        if video_file.filename == "":
            return jsonify({"error": "Empty filename."}), 400

        # Save to a temporary file so OpenCV can read it
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(video_file.filename)[1]) as tmp:
            tmp_path = tmp.name
            video_file.save(tmp_path)

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            os.unlink(tmp_path)
            return jsonify({"error": "Could not open uploaded video."}), 400

        model: YOLO = app.config["yolo_model"]
        class_names: Dict[int, str] = app.config.get("class_names", {})

        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0.0)
        if fps <= 1.0:
            # Fallback FPS if metadata is missing
            fps = 25.0

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        video_duration = float(total_frames / fps) if total_frames > 0 else 0.0

        all_boxes: List[Dict[str, Any]] = []
        accident_confidences: List[float] = []
        accident_timestamps: List[float] = []
        objects_involved: Set[str] = set()

        frame_idx = 0
        # Process first N frames to keep latency reasonable
        max_frames = 120

        try:
            while frame_idx < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                # Convert BGR (OpenCV) to RGB (YOLO expects RGB)
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                results = model(frame_rgb, verbose=False)

                for r in results:
                    if r.boxes is None:
                        continue
                    for box in r.boxes:
                        xyxy = box.xyxy[0].tolist()
                        x1, y1, x2, y2 = [float(v) for v in xyxy]
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])

                        timestamp = float(frame_idx / fps)

                        box_dict = {
                            "frame": frame_idx,
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                            "confidence": conf,
                            "class_id": cls_id,
                            "timestamp": round(timestamp, 3),
                        }
                        all_boxes.append(box_dict)

                        # For demo purposes, treat specific classes as "accident related"
                        # You can customize this based on your dataset/classes.
                        if cls_id in (0, 1, 2, 3):
                            accident_confidences.append(conf)
                            accident_timestamps.append(timestamp)

                        label = class_names.get(cls_id)
                        if label:
                            objects_involved.add(label)

                frame_idx += 1
        finally:
            cap.release()
            os.unlink(tmp_path)

        accident = bool(accident_confidences)
        confidence = float(max(accident_confidences)) if accident_confidences else 0.0

        first_accident_time = min(accident_timestamps) if accident_timestamps else None

        severity: str
        if not accident:
            severity = "None"
        elif confidence >= 0.85:
            severity = "High"
        elif confidence >= 0.6:
            severity = "Medium"
        else:
            severity = "Low"

        accident_type = "Vehicle Collision" if accident else "None"

        response = {
            "accident": accident,
            "confidence": round(confidence, 4),
            "boxes": all_boxes,
            "video_duration": round(video_duration, 3),
            "accident_time": round(first_accident_time, 3) if first_accident_time is not None else None,
            "accident_type": accident_type,
            "objects_involved": sorted(objects_involved),
            "severity": severity,
            "timeline_markers": sorted(set(round(t, 3) for t in accident_timestamps)),
        }
        return jsonify(response), 200

    @app.route("/stream-detect", methods=["POST"])
    def stream_detect() -> Any:
        """
        Handle live frame detection.
        Expects either:
        - multipart/form-data with 'frame' image file, or
        - raw image bytes.
        Returns detection results for a single frame.
        """
        data_bytes: bytes | None = None

        if "frame" in request.files:
            data_bytes = request.files["frame"].read()
        elif request.data:
            data_bytes = request.data

        if not data_bytes:
            return jsonify({"error": "No frame data provided."}), 400

        # Decode image from bytes
        np_arr = np.frombuffer(data_bytes, np.uint8)
        frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            return jsonify({"error": "Unable to decode frame image."}), 400

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        model: YOLO = app.config["yolo_model"]
        results = model(frame_rgb, verbose=False)

        boxes: List[Dict[str, Any]] = []
        accident_confidences: List[float] = []

        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                xyxy = box.xyxy[0].tolist()
                x1, y1, x2, y2 = [float(v) for v in xyxy]
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])

                boxes.append(
                    {
                        "x1": x1,
                        "y1": y1,
                        "x2": x2,
                        "y2": y2,
                        "confidence": conf,
                        "class_id": cls_id,
                    }
                )

                if cls_id in (0, 1, 2, 3):
                    accident_confidences.append(conf)

        accident = bool(accident_confidences)
        confidence = float(max(accident_confidences)) if accident_confidences else 0.0

        return (
            jsonify(
                {
                    "accident": accident,
                    "confidence": round(confidence, 4),
                    "boxes": boxes,
                }
            ),
            200,
        )

    return app


if __name__ == "__main__":
    app = create_app()
    # Bind to 0.0.0.0 so frontend can reach it in Docker/remote setups
    app.run(host="0.0.0.0", port=5000, debug=True)


