"""
Attendance Simulator — generates fake check-in events via the checkin edge function.

No serial port or Proteus needed. Use for demo purposes.
Randomly picks students and calls the checkin EF every few seconds.
Also polls cp_device_commands and handles POWER_ON/POWER_OFF commands.
"""

import os
import random
import sys
import threading
import time
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Shared state
is_running = True
is_powered_on = True


def fetch_students() -> list[dict]:
    """Fetch all students."""
    try:
        resp = supabase.table("cp_students").select("id,mssv,full_name,class_id").execute()
        return resp.data
    except Exception as exc:
        print(f"Failed to fetch students: {exc}")
        return []


def fetch_devices() -> list[dict]:
    """Fetch all devices."""
    try:
        resp = supabase.table("cp_devices").select("id,device_code,room_id").execute()
        return resp.data
    except Exception as exc:
        print(f"Failed to fetch devices: {exc}")
        return []


def fetch_class_device_map(list_device: list[dict]) -> dict[str, str]:
    """Build class_id → device_code mapping via room_id."""
    try:
        resp = supabase.table("cp_classes").select("id,room_id").execute()
        list_class = resp.data
    except Exception:
        return {}

    room_to_device: dict[str, str] = {}
    for device in list_device:
        if device.get("room_id"):
            room_to_device[device["room_id"]] = device["device_code"]

    class_to_device: dict[str, str] = {}
    for cls in list_class:
        device_code = room_to_device.get(cls.get("room_id", ""))
        if device_code:
            class_to_device[cls["id"]] = device_code

    return class_to_device


def send_checkin(mssv: str, device_code: str) -> tuple[bool, str]:
    """Call the checkin edge function."""
    try:
        resp = supabase.functions.invoke(
            "checkin",
            invoke_options={"body": {"mssv": mssv, "device_code": device_code}},
        )
        if isinstance(resp, bytes):
            import json
            data = json.loads(resp)
        else:
            data = resp
        if data.get("success"):
            return True, data.get("status", "?")
        return False, data.get("error", "UNKNOWN")
    except Exception as exc:
        return False, str(exc)


def update_device_status(device_id: str, status: str):
    """Update device online status."""
    try:
        supabase.table("cp_devices").update({
            "status": status,
            "last_seen": datetime.now(timezone.utc).isoformat(),
        }).eq("id", device_id).execute()
    except Exception:
        pass


def mark_command_executed(command_id: str):
    """Mark a device command as EXECUTED."""
    try:
        supabase.table("cp_device_commands").update({
            "status": "EXECUTED",
            "executed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", command_id).execute()
    except Exception:
        pass


def poll_commands(list_device: list[dict]):
    """Background thread: poll PENDING commands and handle them."""
    global is_powered_on

    while is_running:
        for device in list_device:
            try:
                resp = (
                    supabase.table("cp_device_commands")
                    .select("id,command")
                    .eq("device_id", device["id"])
                    .eq("status", "PENDING")
                    .order("created_at")
                    .limit(5)
                    .execute()
                )
                commands = resp.data
            except Exception:
                continue

            for cmd in commands:
                command_name = cmd["command"]
                device_code = device["device_code"]

                if command_name == "POWER_OFF":
                    print(f"[CMD] {device_code}: POWER_OFF — pausing checkins")
                    is_powered_on = False
                    update_device_status(device["id"], "OFFLINE")
                    mark_command_executed(cmd["id"])

                elif command_name == "POWER_ON":
                    print(f"[CMD] {device_code}: POWER_ON — resuming checkins")
                    is_powered_on = True
                    update_device_status(device["id"], "ONLINE")
                    mark_command_executed(cmd["id"])

                elif command_name == "RESTART":
                    print(f"[CMD] {device_code}: RESTART — restarting...")
                    is_powered_on = False
                    update_device_status(device["id"], "OFFLINE")
                    mark_command_executed(cmd["id"])
                    time.sleep(2)
                    is_powered_on = True
                    update_device_status(device["id"], "ONLINE")
                    print(f"[CMD] {device_code}: Restart complete")

                else:
                    print(f"[CMD] {device_code}: {command_name} — acknowledged")
                    mark_command_executed(cmd["id"])

        time.sleep(3)


def main():
    global is_running

    print("Fetching students and devices...")
    list_student = fetch_students()
    list_device = fetch_devices()

    if not list_student:
        print("No students found. Did you seed the database?")
        sys.exit(1)

    if not list_device:
        print("No devices found. Did you seed the database?")
        sys.exit(1)

    class_device_map = fetch_class_device_map(list_device)

    print(f"Found {len(list_student)} students, {len(list_device)} devices")
    print(f"Class-device mappings: {len(class_device_map)}")

    # Mark all devices online
    for device in list_device:
        update_device_status(device["id"], "ONLINE")

    # Start command polling in background
    cmd_thread = threading.Thread(target=poll_commands, args=(list_device,), daemon=True)
    cmd_thread.start()

    print("Starting simulation (Ctrl+C to stop)...\n")

    try:
        while True:
            if not is_powered_on:
                time.sleep(1)
                continue

            student = random.choice(list_student)
            device_code = class_device_map.get(student["class_id"])

            if not device_code:
                continue

            success, result = send_checkin(student["mssv"], device_code)
            symbol = "OK" if success else "FAIL"
            print(
                f"[{symbol}] {student['mssv']} ({student['full_name']}) "
                f"-> {result}"
            )

            delay = random.uniform(2, 6)
            time.sleep(delay)

    except KeyboardInterrupt:
        print("\nStopping simulator...")
        is_running = False
        for device in list_device:
            update_device_status(device["id"], "OFFLINE")
        print("Devices marked offline. Done.")


if __name__ == "__main__":
    main()
