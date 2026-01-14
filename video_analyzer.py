#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MKMN Video Analyzer - YOLOv8 Staff/Customer Detection
Refactored for CLI usage with Node.js integration
"""

import argparse
import json
import sys
import os

# Suppress TensorFlow/PyTorch warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import cv2
import numpy as np
from datetime import timedelta
from collections import defaultdict, deque

# Try to import YOLO - will fail gracefully if not installed
try:
    from ultralytics import YOLO
    import torch
    # Kaggle-safe torch load
    _original_load = torch.load
    def safe_load(*args, **kwargs):
        kwargs["weights_only"] = False
        return _original_load(*args, **kwargs)
    torch.load = safe_load
except ImportError as e:
    print(json.dumps({"error": f"Missing dependency: {e}. Run: pip install ultralytics opencv-python-headless numpy"}))
    sys.exit(1)

# ===============================
# CONFIGURATION
# ===============================
# Using YOLOv8 NANO for fast processing (6MB)
YOLO_MODEL = "yolov8n.pt"
CONF_THRESHOLD = 0.35
IOU_THRESHOLD = 0.45
IMG_SIZE = 640

# Staff zone polygon (default - can be overridden)
STAFF_ZONE = [
    (166, 152), (640, 461), (546, 478), (103, 478), (29, 191),
]

# Detection settings - Single scale for speed
ENABLE_MULTI_SCALE = False
DETECTION_SCALES = [1.0]
MIN_APPEARANCES = 2

# Tracking parameters
MAX_DISTANCE_CUSTOMER = 80
MAX_DISTANCE_STAFF = 150
MAX_TIME_GAP_CUSTOMER = 5.0
MAX_TIME_GAP_STAFF = 30.0

# Staff detection settings
BODY_COVERAGE_THRESHOLD = 0.75
STAFF_CONSISTENT_FRAMES = 3
PERMANENT_STAFF_CLASSIFICATION = True
STARTUP_GRACE_PERIOD_SECONDS = 0.3
PERSON_GRACE_PERIOD_SECONDS = 0.3

# Person validation settings
MIN_ASPECT_RATIO = 0.25
MAX_ASPECT_RATIO = 2.0
MIN_BOX_AREA = 800
MAX_BOX_AREA = 200000
MIN_HEIGHT = 30
MIN_WIDTH = 20

# Activity detection settings
ACTIVITY_WINDOW_FRAMES = 15
MOVEMENT_THRESHOLD = 3
ACTIVE_CONFIRMATION_FRAMES = 2
INACTIVE_CONFIRMATION_FRAMES = 8

# Colors (BGR)
COLOR_ACTIVE = (0, 255, 0)
COLOR_INACTIVE = (0, 165, 255)
COLOR_CUSTOMER = (255, 50, 0)
COLOR_STAFF_ZONE = (128, 128, 128)

# Group detection
GROUP_DISTANCE_PX = 80
GROUP_MAX_NEIGHBORS = 2
MIN_TIME_BEFORE_GROUP_SEC = 4.5
SPEED_THRESHOLD_PX = 6.0
GROUP_JOIN_FRAMES = 12
GROUP_LEAVE_FRAMES = 12
GROUP_MATCH_DIST_PX = 140
GROUP_MIN_SIZE = 2


# ===============================
# HELPERS
# ===============================
def point_in_polygon(point, polygon):
    x, y = point
    inside = False
    n = len(polygon)
    px1, py1 = polygon[0]
    for i in range(n + 1):
        px2, py2 = polygon[i % n]
        if y > min(py1, py2):
            if y <= max(py1, py2):
                if x <= max(px1, px2):
                    if py1 != py2:
                        xinters = (y - py1) * (px2 - px1) / (py2 - py1) + px1
                    if px1 == px2 or x <= xinters:
                        inside = not inside
        px1, py1 = px2, py2
    return inside


def is_valid_person_box(bbox, frame_width, frame_height):
    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    if width < MIN_WIDTH or height < MIN_HEIGHT:
        return False
    area = width * height
    if area < MIN_BOX_AREA or area > MAX_BOX_AREA:
        return False
    if height > 0:
        aspect_ratio = width / height
        if aspect_ratio < MIN_ASPECT_RATIO or aspect_ratio > MAX_ASPECT_RATIO:
            return False
    frame_area = frame_width * frame_height
    if area > frame_area * 0.5:
        return False
    return True


def calculate_body_coverage_in_zone(bbox, polygon, grid_size=10):
    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    points_inside = 0
    total_points = 0
    for i in range(grid_size):
        for j in range(grid_size):
            px = x1 + (width * i / (grid_size - 1))
            py = y1 + (height * j / (grid_size - 1))
            total_points += 1
            if point_in_polygon((px, py), polygon):
                points_inside += 1
    return points_inside / total_points if total_points > 0 else 0


def calculate_distance(p1, p2):
    return np.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)


def calculate_iou(box1, box2):
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    inter_x_min = max(x1_min, x2_min)
    inter_y_min = max(y1_min, y2_min)
    inter_x_max = min(x1_max, x2_max)
    inter_y_max = min(y1_max, y2_max)
    if inter_x_max < inter_x_min or inter_y_max < inter_y_min:
        return 0.0
    inter_area = (inter_x_max - inter_x_min) * (inter_y_max - inter_y_min)
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - inter_area
    return inter_area / union_area if union_area > 0 else 0


def format_time_short(sec):
    return str(timedelta(seconds=int(sec)))


# ===============================
# ACTIVITY TRACKER
# ===============================
class ActivityTracker:
    def __init__(self, window_size=ACTIVITY_WINDOW_FRAMES):
        self.position_history = deque(maxlen=window_size)
        self.current_state = "active"
        self.state_start_time = None
        self.state_durations = defaultdict(float)
        self.movement_scores = deque(maxlen=10)
        self.active_frame_count = 0
        self.inactive_frame_count = 0
        self.initialized = False

    def update(self, position, bbox, current_time):
        self.position_history.append(position)
        if len(self.position_history) < 2:
            return "active"
        movement = self._calculate_recent_movement()
        self.movement_scores.append(movement)
        if not self.initialized and len(self.position_history) >= 2:
            self.initialized = True
            self.current_state = "active" if movement > MOVEMENT_THRESHOLD else "inactive"
            self.state_start_time = current_time
            return self.current_state
        new_state = self._determine_state(movement)
        if new_state != self.current_state:
            if self.state_start_time is not None:
                duration = current_time - self.state_start_time
                self.state_durations[self.current_state] += duration
            self.current_state = new_state
            self.state_start_time = current_time
        return self.current_state

    def _calculate_recent_movement(self):
        if len(self.position_history) < 2:
            return 0
        positions = list(self.position_history)
        return calculate_distance(positions[-2], positions[-1])

    def _determine_state(self, movement):
        if movement > MOVEMENT_THRESHOLD:
            self.active_frame_count += 1
            self.inactive_frame_count = 0
            if self.active_frame_count >= ACTIVE_CONFIRMATION_FRAMES:
                return "active"
        else:
            self.inactive_frame_count += 1
            self.active_frame_count = 0
            if self.inactive_frame_count >= INACTIVE_CONFIRMATION_FRAMES:
                return "inactive"
        return self.current_state

    def get_activity_summary(self, total_time):
        if self.state_start_time is not None and total_time > self.state_start_time:
            self.state_durations[self.current_state] += (total_time - self.state_start_time)
            self.state_start_time = total_time
        active_time = self.state_durations.get('active', 0)
        inactive_time = self.state_durations.get('inactive', 0)
        return {
            'active': {
                'duration': active_time,
                'percentage': (active_time / total_time * 100) if total_time > 0 else 0,
            },
            'inactive': {
                'duration': inactive_time,
                'percentage': (inactive_time / total_time * 100) if total_time > 0 else 0,
            }
        }


def get_activity_color(state):
    return COLOR_ACTIVE if state == "active" else COLOR_INACTIVE


# ===============================
# DETECTION FUNCTIONS
# ===============================
def detect_multi_scale(model, frame, conf_threshold, scales):
    all_detections = []
    height, width = frame.shape[:2]
    for scale in scales:
        new_w = int(width * scale)
        new_h = int(height * scale)
        if new_w < 320 or new_h < 320:
            continue
        scaled_frame = cv2.resize(frame, (new_w, new_h))
        results = model(
            scaled_frame,
            classes=[0],
            conf=conf_threshold,
            iou=IOU_THRESHOLD,
            imgsz=IMG_SIZE,
            verbose=False,
            augment=True
        )
        if results[0].boxes is not None and len(results[0].boxes) > 0:
            boxes = results[0].boxes.xyxy.cpu().numpy() / scale
            confs = results[0].boxes.conf.cpu().numpy()
            for box, conf in zip(boxes, confs):
                all_detections.append({'box': box, 'conf': conf})
    return all_detections


def non_max_suppression_custom(detections, iou_threshold=0.5):
    if len(detections) == 0:
        return []
    boxes = np.array([d['box'] for d in detections])
    scores = np.array([d['conf'] for d in detections])
    x1, y1, x2, y2 = boxes[:,0], boxes[:,1], boxes[:,2], boxes[:,3]
    areas = (x2 - x1) * (y2 - y1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(i)
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-9)
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    return [detections[i] for i in keep]


def find_matching_person(current_box, current_position, current_time, people_data,
                         max_distance_customer, max_distance_staff,
                         max_time_gap_customer, max_time_gap_staff):
    best_match = None
    best_score = 0
    for pid, data in people_data.items():
        if data['last_seen'] is None:
            continue
        time_gap = current_time - data['last_seen']
        if data['is_staff'] or data['was_staff']:
            max_time = max_time_gap_staff
            max_dist = max_distance_staff
        else:
            max_time = max_time_gap_customer
            max_dist = max_distance_customer
        if time_gap > max_time:
            continue
        if data['last_position'] and data['last_box'] is not None:
            distance = calculate_distance(current_position, data['last_position'])
            if distance > max_dist:
                continue
            iou = calculate_iou(current_box, data['last_box'])
            distance_score = max(0, 1 - (distance / max_dist))
            combined_score = (iou * 0.7) + (distance_score * 0.3)
            if data['is_staff'] or data['was_staff']:
                combined_score *= 1.2
            if combined_score > best_score:
                best_score = combined_score
                best_match = pid
    threshold = 0.2 if best_match and (people_data[best_match]['is_staff'] or people_data[best_match]['was_staff']) else 0.3
    return best_match if best_score > threshold else None


# ===============================
# GROUP DETECTION
# ===============================
def build_groups_members_limited(centers_dict):
    ids = list(centers_dict.keys())
    if len(ids) == 0:
        return []
    adj = {pid: [] for pid in ids}
    for pid in ids:
        dists = []
        p = centers_dict[pid]
        for other in ids:
            if other == pid:
                continue
            dist = calculate_distance(p, centers_dict[other])
            if dist <= GROUP_DISTANCE_PX:
                dists.append((dist, other))
        dists.sort(key=lambda x: x[0])
        for _, other in dists[:GROUP_MAX_NEIGHBORS]:
            adj[pid].append(other)
            adj[other].append(pid)
    visited = set()
    groups = []
    for pid in ids:
        if pid in visited:
            continue
        stack = [pid]
        comp = set([pid])
        visited.add(pid)
        while stack:
            cur = stack.pop()
            for nb in adj[cur]:
                if nb not in visited:
                    visited.add(nb)
                    comp.add(nb)
                    stack.append(nb)
        if len(comp) >= GROUP_MIN_SIZE:
            groups.append(comp)
    return groups


def group_centroid(group_set, centers_dict):
    pts = np.array([centers_dict[pid] for pid in group_set], dtype=np.float32)
    c = pts.mean(axis=0)
    return (float(c[0]), float(c[1]))


def jaccard(a, b):
    a = set(a); b = set(b)
    inter = len(a & b)
    uni = len(a | b)
    return inter / uni if uni > 0 else 0.0


def match_groups_to_ids(current_groups, centers_dict, group_tracks, next_group_id):
    pid_to_gid = {}
    current_info = []
    for g in current_groups:
        c = group_centroid(g, centers_dict)
        current_info.append({'members': set(g), 'centroid': c})
    used_gids = set()
    for info in current_info:
        best_gid = None
        best_score = -1.0
        for gid, gt in group_tracks.items():
            if gid in used_gids:
                continue
            dist = calculate_distance(info['centroid'], gt['centroid'])
            if dist > GROUP_MATCH_DIST_PX:
                continue
            ov = jaccard(info['members'], gt['members'])
            score = (ov * 1.5) + (max(0.0, 1.0 - dist / GROUP_MATCH_DIST_PX) * 0.5)
            if score > best_score:
                best_score = score
                best_gid = gid
        if best_gid is None:
            best_gid = next_group_id
            next_group_id += 1
        used_gids.add(best_gid)
        group_tracks[best_gid] = {
            'members': set(info['members']),
            'centroid': info['centroid'],
            'last_seen': None
        }
        for pid in info['members']:
            pid_to_gid[pid] = best_gid
    return pid_to_gid, group_tracks, next_group_id


# ===============================
# MAIN PROCESSING
# ===============================
def process_video(video_path, output_video, staff_zone, max_duration=None, progress_callback=None):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    max_frames = int(fps * max_duration) if max_duration else total_frames

    model = YOLO(YOLO_MODEL)
    startup_grace_frames = int(fps * STARTUP_GRACE_PERIOD_SECONDS)
    
    group_tracks = {}
    next_group_id = 1

    people_data = defaultdict(lambda: {
        'first_seen': None,
        'last_seen': None,
        'appearances': 0,
        'last_position': None,
        'prev_position': None,
        'speed': 0.0,
        'last_box': None,
        'frames_in_zone': 0,
        'currently_in_zone': False,
        'is_staff': False,
        'was_staff': False,
        'ever_in_zone': False,
        'consecutive_high_coverage': 0,
        'consecutive_low_coverage': 0,
        'show_label': False,
        'grace_period_active': True,
        'classification_ready': False,
        'staff_confirmed_at': None,
        'activity_tracker': None,
        'current_activity': 'initializing',
        'group_id': None,
        'group_size': 1,
        'group_join_count': 0,
        'group_leave_count': 0,
        'group_frames_total': 0,
    })

    next_person_id = 1
    confirmed_staff = set()
    timeline_data = []

    # Use mp4v codec (MPEG-4) - more compatible than H.264
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(
        output_video,
        fourcc,
        fps,
        (width, height)
    )
    
    if not out.isOpened():
        raise ValueError(f"Could not create video writer for {output_video}")

    frame_id = 0
    last_time_now = 0.0
    last_timeline_sec = -1

    while True:
        ret, frame = cap.read()
        if not ret or frame_id >= max_frames:
            break

        frame_id += 1
        time_now = frame_id / fps
        last_time_now = time_now
        past_startup = frame_id > startup_grace_frames

        # Progress callback
        if progress_callback and frame_id % 30 == 0:
            progress_callback(frame_id, max_frames)

        # Draw staff zone
        pts = np.array(staff_zone, np.int32).reshape((-1,1,2))
        overlay = frame.copy()
        cv2.fillPoly(overlay, [pts], COLOR_STAFF_ZONE)
        cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)
        cv2.polylines(frame, [pts], True, COLOR_STAFF_ZONE, 2)

        # Detection - use fast single-scale by default
        detections = []
        if ENABLE_MULTI_SCALE:
            detections.extend(detect_multi_scale(model, frame, CONF_THRESHOLD, DETECTION_SCALES))
            detections = non_max_suppression_custom(detections, iou_threshold=0.4)
        else:
            # Fast single-scale detection
            results = model(
                frame,
                classes=[0],  # Only detect people
                conf=CONF_THRESHOLD,
                iou=IOU_THRESHOLD,
                imgsz=IMG_SIZE,
                verbose=False
            )
            if results[0].boxes is not None and len(results[0].boxes) > 0:
                boxes = results[0].boxes.xyxy.cpu().numpy()
                confs = results[0].boxes.conf.cpu().numpy()
                for box, conf in zip(boxes, confs):
                    detections.append({'box': box, 'conf': conf})

        current_frame_people = {}

        for det in detections:
            box = det['box']
            if not is_valid_person_box(box, width, height):
                continue

            x1, y1, x2, y2 = box
            center = ((x1+x2)/2, (y1+y2)/2)
            body_coverage = calculate_body_coverage_in_zone(box, staff_zone, grid_size=10)
            in_zone = body_coverage >= BODY_COVERAGE_THRESHOLD

            matched_id = find_matching_person(
                box, center, time_now, people_data,
                MAX_DISTANCE_CUSTOMER, MAX_DISTANCE_STAFF,
                MAX_TIME_GAP_CUSTOMER, MAX_TIME_GAP_STAFF
            )

            person_id = matched_id if matched_id else next_person_id
            if not matched_id:
                next_person_id += 1

            d = people_data[person_id]

            if d['activity_tracker'] is None:
                d['activity_tracker'] = ActivityTracker()

            if d['first_seen'] is not None:
                time_since_first_seen = time_now - d['first_seen']
                if time_since_first_seen >= PERSON_GRACE_PERIOD_SECONDS:
                    d['grace_period_active'] = False
                    d['classification_ready'] = True

            if in_zone:
                d['consecutive_high_coverage'] += 1
                d['consecutive_low_coverage'] = 0
            else:
                d['consecutive_high_coverage'] = 0
                d['consecutive_low_coverage'] += 1

            if (d['consecutive_high_coverage'] >= STAFF_CONSISTENT_FRAMES
                and not d['is_staff']
                and d['classification_ready']):
                d['is_staff'] = True
                d['was_staff'] = True
                d['show_label'] = True
                d['staff_confirmed_at'] = time_now
                confirmed_staff.add(person_id)

            if d['is_staff'] and PERMANENT_STAFF_CLASSIFICATION:
                pass
            elif d['was_staff'] and not d['is_staff'] and d['consecutive_high_coverage'] >= 3:
                d['is_staff'] = True
                confirmed_staff.add(person_id)

            if d['is_staff'] or d['was_staff']:
                activity_state = d['activity_tracker'].update(center, box, time_now)
                d['current_activity'] = activity_state

            if not d['is_staff'] and past_startup and d['classification_ready']:
                d['show_label'] = True

            if in_zone:
                d['frames_in_zone'] += 1
                d['currently_in_zone'] = True
                if not d['ever_in_zone']:
                    d['ever_in_zone'] = True
            else:
                d['currently_in_zone'] = False

            if d['prev_position'] is None:
                d['speed'] = 0.0
            else:
                d['speed'] = calculate_distance(center, d['prev_position'])
            d['prev_position'] = center

            d['appearances'] += 1
            if d['first_seen'] is None:
                d['first_seen'] = time_now
            d['last_seen'] = time_now
            d['last_position'] = center
            d['last_box'] = box

            current_frame_people[person_id] = (box, d['is_staff'], body_coverage,
                                               d['show_label'], d['grace_period_active'],
                                               d['current_activity'])

        # Group detection for customers
        customer_centers = {}
        for pid, (box, is_staff, coverage, show_label, in_grace, activity) in current_frame_people.items():
            if in_grace or is_staff:
                continue
            d = people_data[pid]
            seen_time = (time_now - d['first_seen']) if d['first_seen'] is not None else 0.0
            if not show_label:
                continue
            if seen_time < MIN_TIME_BEFORE_GROUP_SEC:
                continue
            if d.get('speed', 0.0) > SPEED_THRESHOLD_PX:
                continue
            x1, y1, x2, y2 = box
            cx, cy = (x1+x2)/2, (y1+y2)/2
            customer_centers[pid] = (cx, cy)

        current_groups = build_groups_members_limited(customer_centers)
        pid_to_gid, group_tracks, next_group_id = match_groups_to_ids(
            current_groups, customer_centers, group_tracks, next_group_id
        )

        for pid, (box, is_staff, coverage, show_label, in_grace, activity) in current_frame_people.items():
            if in_grace or is_staff:
                continue
            d = people_data[pid]
            if not show_label:
                continue
            in_group_now = pid in pid_to_gid
            if in_group_now:
                gid = pid_to_gid[pid]
                gsize = len(group_tracks[gid]['members'])
                d['group_join_count'] += 1
                d['group_leave_count'] = 0
                if d['group_join_count'] >= GROUP_JOIN_FRAMES:
                    d['group_id'] = gid
                    d['group_size'] = gsize
                    d['group_frames_total'] += 1
            else:
                d['group_leave_count'] += 1
                d['group_join_count'] = 0
                if d['group_leave_count'] >= GROUP_LEAVE_FRAMES:
                    d['group_id'] = None
                    d['group_size'] = 1

        # Draw people
        visible_count = 0
        active_staff = 0
        inactive_staff = 0
        current_customers = 0

        for pid, (box, is_staff, coverage, show_label, in_grace, activity) in current_frame_people.items():
            if in_grace or not show_label:
                continue
            visible_count += 1
            x1, y1, x2, y2 = map(int, box)
            d = people_data[pid]

            if is_staff:
                if activity == "active":
                    active_staff += 1
                else:
                    inactive_staff += 1
                activity_color = get_activity_color(activity)
                cv2.rectangle(frame, (x1, y1), (x2, y2), activity_color, 3)
                label = f"STAFF #{pid} | {activity.upper()}"
                cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, activity_color, 2)
            else:
                current_customers += 1
                dur = time_now - d['first_seen'] if d['first_seen'] is not None else 0
                if d.get('group_id') is not None:
                    group_txt = f"G{d['group_id']} ({d.get('group_size', 2)})"
                else:
                    group_txt = "Single"
                cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR_CUSTOMER, 2)
                cv2.putText(frame, f"Customer #{pid} | {group_txt} | {format_time_short(dur)}",
                            (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_CUSTOMER, 2)

        # Status overlay
        status_msg = f"Time: {format_time_short(time_now)} | Detected: {visible_count}"
        cv2.putText(frame, status_msg, (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

        if active_staff + inactive_staff > 0:
            activity_summary = f"Staff: Active:{active_staff} | Inactive:{inactive_staff}"
            cv2.putText(frame, activity_summary, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

        out.write(frame)

        # Timeline data (every second)
        current_sec = int(time_now)
        if current_sec > last_timeline_sec:
            last_timeline_sec = current_sec
            timeline_data.append({
                "time": format_time_short(current_sec),
                "staff": active_staff + inactive_staff,
                "customers": current_customers,
                "activeStaff": active_staff,
                "inactiveStaff": inactive_staff
            })

    cap.release()
    out.release()

    # Separate customers and staff
    customer_data = {}
    staff_data = {}

    for pid, d in people_data.items():
        if d['appearances'] >= MIN_APPEARANCES:
            if d['was_staff']:
                staff_data[pid] = d
            else:
                customer_data[pid] = d

    # Calculate activity summary
    total_active_time = 0
    total_inactive_time = 0
    for pid, d in staff_data.items():
        if d['activity_tracker']:
            summary = d['activity_tracker'].get_activity_summary(d['last_seen'] if d['last_seen'] else 0)
            total_active_time += summary['active']['duration']
            total_inactive_time += summary['inactive']['duration']

    total_activity_time = total_active_time + total_inactive_time
    active_percentage = (total_active_time / total_activity_time * 100) if total_activity_time > 0 else 0
    inactive_percentage = (total_inactive_time / total_activity_time * 100) if total_activity_time > 0 else 0

    # Build groups summary
    groups_summary = []
    group_counts = defaultdict(lambda: {'size': 0, 'members': []})
    for pid, d in customer_data.items():
        if d.get('group_id') is not None:
            gid = d['group_id']
            group_counts[gid]['members'].append(pid)
            group_counts[gid]['size'] = max(group_counts[gid]['size'], d.get('group_size', 1))

    for gid, info in group_counts.items():
        groups_summary.append({
            "groupId": gid,
            "size": info['size'],
            "members": info['members']
        })

    return {
        "staffCount": len(staff_data),
        "customerCount": len(customer_data),
        "totalPeople": len(staff_data) + len(customer_data),
        "duration": format_time_short(last_time_now),
        "activePercentage": round(active_percentage, 1),
        "inactivePercentage": round(inactive_percentage, 1),
        "timeline": timeline_data,
        "groups": groups_summary
    }


def main():
    parser = argparse.ArgumentParser(description="MKMN Video Analyzer - YOLOv8 Staff/Customer Detection")
    parser.add_argument("--input", required=True, help="Input video path")
    parser.add_argument("--output-video", required=True, help="Output annotated video path")
    parser.add_argument("--output-json", required=True, help="Output JSON results path")
    parser.add_argument("--max-duration", type=float, default=None, help="Max video duration in seconds")
    args = parser.parse_args()

    def progress_callback(current, total):
        progress = (current / total) * 100
        print(json.dumps({"progress": round(progress, 1), "frame": current, "total": total}), flush=True)

    try:
        print(json.dumps({"status": "starting", "message": "Loading YOLO model..."}), flush=True)
        
        results = process_video(
            args.input,
            args.output_video,
            STAFF_ZONE,
            args.max_duration,
            progress_callback
        )

        with open(args.output_json, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(json.dumps({"status": "complete", "results": results}), flush=True)

    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
