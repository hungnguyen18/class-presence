"""
Serial Bridge — connects IoT device (via serial/COM port) to Supabase.

Reads attendance events from serial, calls edge functions for check-in/check-out.
Polls cp_device_commands for pending commands and sends them over serial.
"""

import json
import os
import sys
import threading
import time
from datetime import datetime, timezone

import serial
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
DEVICE_CODE = os.getenv("DEVICE_CODE", "")
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM4")
BAUD_RATE = int(os.getenv("BAUD_RATE", "9600"))

if not SUPABASE_URL or not SUPABASE_KEY or not DEVICE_CODE:
    print("ERROR: Missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY, DEVICE_CODE)")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Offline queue for when Supabase is unreachable
offline_queue: list[dict] = []


def call_checkin_ef(mssv: str) -> tuple[bool, str]:
    """Call the checkin edge function."""
    try:
        resp = supabase.functions.invoke(
            "checkin",
            invoke_options={"body": {"mssv": mssv, "device_code": DEVICE_CODE}},
        )
        if isinstance(resp, bytes):
            data = json.loads(resp)
        else:
            data = resp
        if data.get("success"):
            return True, f"{data.get('name', '?')} - {data.get('status', '?')}"
        return False, data.get("error", "UNKNOWN")
    except Exception as exc:
        return False, f"Error: {exc}"


def call_checkout_ef(mssv: str) -> tuple[bool, str]:
    """Call the checkout edge function."""
    try:
        resp = supabase.functions.invoke(
            "checkout",
            invoke_options={"body": {"mssv": mssv, "device_code": DEVICE_CODE}},
        )
        if isinstance(resp, bytes):
            data = json.loads(resp)
        else:
            data = resp
        if data.get("success"):
            return True, f"{data.get('name', '?')} checked out"
        return False, data.get("error", "UNKNOWN")
    except Exception as exc:
        return False, f"Error: {exc}"


def update_heartbeat():
    """Update device last_seen timestamp."""
    try:
        supabase.table("cp_devices").update({
            "last_seen": datetime.now(timezone.utc).isoformat(),
            "status": "ONLINE",
        }).eq("device_code", DEVICE_CODE).execute()
    except Exception:
        pass


def flush_offline_queue():
    """Try to send queued checkin events."""
    while offline_queue:
        event = offline_queue[0]
        success, result = call_checkin_ef(event["mssv"])
        if success:
            offline_queue.pop(0)
            print(f"  Flushed queued checkin for {event['mssv']}: {result}")
        else:
            break


def handle_checkin(parts: list[str], ser: serial.Serial):
    """CHECKIN:<mssv> — call EF and send result back to device."""
    if len(parts) < 2:
        print("  Invalid CHECKIN format")
        return

    mssv = parts[1]
    success, result = call_checkin_ef(mssv)

    if success:
        print(f"  Checkin OK: {result}")
        ser.write(f"RESULT:OK:{result}\n".encode())
    else:
        if "Error" in result:
            offline_queue.append({"mssv": mssv})
            print(f"  Queued checkin for {mssv} (offline)")
            ser.write(f"RESULT:FAIL:OFFLINE\n".encode())
        else:
            print(f"  Checkin FAILED: {result}")
            ser.write(f"RESULT:FAIL:{result}\n".encode())


def handle_checkout(parts: list[str]):
    """CHECKOUT:<mssv>"""
    if len(parts) < 2:
        print("  Invalid CHECKOUT format")
        return

    mssv = parts[1]
    success, result = call_checkout_ef(mssv)

    if success:
        print(f"  Checkout OK: {result}")
    else:
        print(f"  Checkout FAILED: {result}")


def process_serial_line(line: str, ser: serial.Serial):
    """Parse and handle a single serial line."""
    line = line.strip()
    if not line:
        return

    print(f"[RX] {line}")
    parts = line.split(":")

    command = parts[0].upper()
    if command == "CHECKIN":
        handle_checkin(parts, ser)
    elif command == "CHECKOUT":
        handle_checkout(parts)
    elif command == "HEARTBEAT":
        update_heartbeat()
    elif command == "ACK":
        print(f"  Device acknowledged: {':'.join(parts[1:])}")
    else:
        print(f"  Unknown command: {command}")


def poll_commands(ser: serial.Serial):
    """Background thread: poll for pending commands and send to device."""
    # Resolve device_id from device_code
    try:
        resp = (
            supabase.table("cp_devices")
            .select("id")
            .eq("device_code", DEVICE_CODE)
            .single()
            .execute()
        )
        device_id = resp.data["id"]
    except Exception:
        print("WARNING: Could not resolve device_id for command polling")
        return

    while True:
        try:
            resp = (
                supabase.table("cp_device_commands")
                .select("id,command,payload")
                .eq("device_id", device_id)
                .eq("status", "PENDING")
                .order("created_at")
                .limit(5)
                .execute()
            )
            commands = resp.data
        except Exception as exc:
            print(f"  Command poll error: {exc}")
            commands = []

        for cmd in commands:
            cmd_str = f"CMD:{cmd['command']}"
            if cmd.get("payload"):
                cmd_str += f":{json.dumps(cmd['payload'])}"
            cmd_str += "\n"

            print(f"[TX] {cmd_str.strip()}")
            ser.write(cmd_str.encode())

            # Mark as SENT
            try:
                supabase.table("cp_device_commands").update({
                    "status": "SENT",
                    "executed_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", cmd["id"]).execute()
            except Exception:
                pass

        time.sleep(3)


def main():
    print(f"Connecting to {SERIAL_PORT} at {BAUD_RATE} baud...")
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except serial.SerialException as exc:
        print(f"Failed to open serial port: {exc}")
        sys.exit(1)

    print(f"Connected. Device code: {DEVICE_CODE}")

    # Mark device as online
    update_heartbeat()

    # Start command polling in background
    cmd_thread = threading.Thread(target=poll_commands, args=(ser,), daemon=True)
    cmd_thread.start()

    # Main loop: read serial
    try:
        while True:
            if ser.in_waiting > 0:
                line = ser.readline().decode("utf-8", errors="replace")
                process_serial_line(line, ser)

            if offline_queue:
                flush_offline_queue()
    except KeyboardInterrupt:
        print("\nShutting down...")
        try:
            supabase.table("cp_devices").update({
                "status": "OFFLINE",
            }).eq("device_code", DEVICE_CODE).execute()
        except Exception:
            pass
        ser.close()


if __name__ == "__main__":
    main()
